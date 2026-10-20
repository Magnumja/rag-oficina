"""Índice vetorial próprio por projeto/etapa: persistência em JSONL, busca por cosseno.

Substitui o Chroma (decisão registrada em memória em 2026-10-19) para guardar
documento+página por trecho e aplicar o limiar de similaridade explicitamente — abaixo do
limiar, a busca nunca retorna trechos fracos.
"""
from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from pathlib import Path

from sklearn.metrics.pairwise import cosine_similarity

from .embeddings import embed
from .schema import UsedChunk


@dataclass
class ChunkRecord:
    doc_id: str
    documento: str
    pagina: int
    texto: str
    vetor: list[float]


class ProjectIndex:
    def __init__(self, path: Path, embedding_model: str = "bge-m3"):
        self.path = path
        self.embedding_model = embedding_model
        self._registros: list[ChunkRecord] = []
        self._carregado = False

    def load(self) -> None:
        self._registros = []
        if self.path.exists():
            for linha in self.path.read_text(encoding="utf-8").splitlines():
                if linha.strip():
                    self._registros.append(ChunkRecord(**json.loads(linha)))
        self._carregado = True

    def save(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with self.path.open("w", encoding="utf-8") as f:
            for registro in self._registros:
                f.write(json.dumps(asdict(registro), ensure_ascii=False) + "\n")

    def _garantir_carregado(self) -> None:
        if not self._carregado:
            self.load()

    def count(self) -> int:
        self._garantir_carregado()
        return len(self._registros)

    def add_document_chunks(self, doc_id: str, documento: str, paginas_trechos: list[tuple[int, str]]) -> int:
        self._garantir_carregado()
        self.remove_document(doc_id)
        textos = [texto for _, texto in paginas_trechos]
        if not textos:
            self.save()
            return 0
        vetores = embed(textos, model=self.embedding_model)
        for (pagina, texto), vetor in zip(paginas_trechos, vetores):
            self._registros.append(
                ChunkRecord(doc_id=doc_id, documento=documento, pagina=pagina, texto=texto, vetor=vetor)
            )
        self.save()
        return len(textos)

    def remove_document(self, doc_id: str) -> None:
        self._garantir_carregado()
        self._registros = [r for r in self._registros if r.doc_id != doc_id]

    def search(self, pergunta: str, top_k: int, similarity_threshold: float) -> list[UsedChunk]:
        self._garantir_carregado()
        if not self._registros:
            return []
        [vetor_pergunta] = embed([pergunta], model=self.embedding_model)
        vetores = [r.vetor for r in self._registros]
        similaridades = cosine_similarity([vetor_pergunta], vetores)[0]
        pares = sorted(zip(self._registros, similaridades), key=lambda p: -p[1])
        resultado: list[UsedChunk] = []
        for registro, sim in pares[:top_k]:
            if sim < similarity_threshold:
                continue
            resultado.append(
                UsedChunk(documento=registro.documento, pagina=registro.pagina, similaridade=round(float(sim), 3), texto=registro.texto)
            )
        return resultado
