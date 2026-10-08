"""Backend da oficina RAG: recebe o JSON do aluno, indexa no Chroma e responde perguntas.

Etapa 1 = LLM sem contexto. Etapa 2 = RAG com dados errados. Etapa 3 = RAG com dados corretos.
"""

import csv
import io
import json
import os
import sqlite3
from contextlib import closing
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import chromadb
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

BASE = Path(__file__).parent
load_dotenv(BASE / ".env")

DATA = BASE / "data"
DATA.mkdir(exist_ok=True)
DB_PATH = DATA / "oficina.db"
MODEL = os.getenv("LLM_MODEL", "claude-haiku-5-5")
TOP_K = int(os.getenv("TOP_K", "4"))

chroma = chromadb.PersistentClient(path=str(DATA / "chroma"))

SYSTEM_LIVRE = (
    "Você é um assistente conversando com estudantes do Ensino Médio. Responda em português, "
    "de forma curta e direta."
)
SYSTEM_RAG = (
    "Você é um assistente conversando com estudantes do Ensino Médio. Responda em português, "
    "de forma curta e direta, usando SOMENTE as informações dos trechos abaixo. "
    "Cite o número do trecho entre colchetes, por exemplo [1]. "
    "Se os trechos não tiverem a resposta, diga que não encontrou nos dados.\n\nTrechos:\n{contexto}"
)


# ---------- banco relacional (alunos e respostas) ----------

def db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


with closing(db()) as conn:
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS alunos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            apelido TEXT NOT NULL,
            turma TEXT,
            consentimento INTEGER NOT NULL,
            criado_em TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS respostas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            aluno_id INTEGER NOT NULL REFERENCES alunos(id),
            etapa INTEGER NOT NULL,
            pergunta TEXT NOT NULL,
            resposta TEXT NOT NULL,
            trechos TEXT NOT NULL,
            criado_em TEXT NOT NULL
        );
        """
    )
    conn.commit()


def agora() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def get_aluno(aluno_id: int) -> sqlite3.Row:
    with closing(db()) as conn:
        row = conn.execute("SELECT * FROM alunos WHERE id = ?", (aluno_id,)).fetchone()
    if not row:
        raise HTTPException(404, "Aluno não encontrado")
    return row


# ---------- RAG ----------

def nome_colecao(aluno_id: int, etapa: int) -> str:
    return f"aluno{aluno_id}_etapa{etapa}"


def json_para_trechos(dado: Any, caminho: str = "") -> list[str]:
    """Achata qualquer JSON em trechos de texto legíveis.

    Cada objeto vira um trecho com seus valores simples. Assim funciona com o formato
    sugerido e também com o que o GPT inventar.
    """
    if isinstance(dado, dict):
        simples = {k: v for k, v in dado.items() if not isinstance(v, (dict, list))}
        compostos = {k: v for k, v in dado.items() if isinstance(v, (dict, list))}
        trechos = []
        if simples:
            linhas = [f"{k}: {v}" for k, v in simples.items()]
            trechos.append((f"[{caminho}] " if caminho else "") + "; ".join(linhas))
        for k, v in compostos.items():
            trechos += json_para_trechos(v, f"{caminho} > {k}" if caminho else k)
        return trechos
    if isinstance(dado, list):
        trechos = []
        for i, item in enumerate(dado, 1):
            trechos += json_para_trechos(item, f"{caminho} #{i}" if caminho else f"#{i}")
        return trechos
    return [f"{caminho}: {dado}" if caminho else str(dado)]


def dividir(texto: str, tamanho: int = 600) -> list[str]:
    """Quebra trechos longos em pedaços de até `tamanho` caracteres, respeitando palavras."""
    if len(texto) <= tamanho:
        return [texto]
    partes, atual = [], ""
    for palavra in texto.split():
        if atual and len(atual) + len(palavra) + 1 > tamanho:
            partes.append(atual)
            atual = palavra
        else:
            atual = f"{atual} {palavra}".strip()
    if atual:
        partes.append(atual)
    return partes


def chamar_llm(system: str, pergunta: str) -> str:
    if not os.getenv("ANTHROPIC_API_KEY"):
        # Modo demonstração: permite testar o fluxo inteiro sem chave e sem custo.
        aviso = "[modo demonstração: configure ANTHROPIC_API_KEY em backend/.env]\n"
        if "Trechos:\n" in system:
            return aviso + "Encontrei estes dados:\n" + system.split("Trechos:\n", 1)[1][:600]
        return aviso + "Não sei o que deu de aula ontem. Você pode me contar?"

    import anthropic

    client = anthropic.Anthropic()
    msg = client.messages.create(
        model=MODEL,
        max_tokens=600,
        system=system,
        messages=[{"role": "user", "content": pergunta}],
    )
    return "".join(b.text for b in msg.content if b.type == "text")


# ---------- API ----------

app = FastAPI(title="Oficina RAG")
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


class NovoAluno(BaseModel):
    apelido: str = Field(min_length=1, max_length=40)
    turma: str | None = Field(default=None, max_length=40)
    consentimento: bool


class Documento(BaseModel):
    etapa: int = Field(ge=2, le=3)
    json_texto: str = Field(min_length=2, max_length=200_000)


class Pergunta(BaseModel):
    etapa: int = Field(ge=1, le=3)
    pergunta: str = Field(min_length=1, max_length=1000)


@app.get("/api/saude")
def saude():
    return {"ok": True, "modelo": MODEL, "llm_configurada": bool(os.getenv("ANTHROPIC_API_KEY"))}


@app.post("/api/alunos")
def criar_aluno(body: NovoAluno):
    if not body.consentimento:
        raise HTTPException(400, "É preciso aceitar o termo de consentimento.")
    apelido = body.apelido.strip()
    turma = (body.turma or "").strip() or None
    with closing(db()) as conn:
        cur = conn.execute(
            "INSERT INTO alunos (apelido, turma, consentimento, criado_em) VALUES (?, ?, 1, ?)",
            (apelido, turma, agora()),
        )
        conn.commit()
    return {"id": cur.lastrowid, "apelido": apelido, "turma": turma}


def contar_trechos(aluno_id: int, etapa: int) -> int:
    try:
        return chroma.get_collection(nome_colecao(aluno_id, etapa)).count()
    except Exception:
        return 0


@app.get("/api/alunos/{aluno_id}")
def ver_aluno(aluno_id: int):
    aluno = dict(get_aluno(aluno_id))
    aluno["trechos"] = {etapa: contar_trechos(aluno_id, etapa) for etapa in (2, 3)}
    return aluno


@app.post("/api/alunos/{aluno_id}/documentos")
def enviar_documento(aluno_id: int, body: Documento):
    get_aluno(aluno_id)
    try:
        dado = json.loads(body.json_texto)
    except json.JSONDecodeError as e:
        raise HTTPException(400, f"JSON inválido na linha {e.lineno}, coluna {e.colno}: {e.msg}")

    trechos = [p for t in json_para_trechos(dado) for p in dividir(t) if p.strip()]
    if not trechos:
        raise HTTPException(400, "O JSON não tem nenhum texto para indexar.")

    nome = nome_colecao(aluno_id, body.etapa)
    try:
        chroma.delete_collection(nome)  # reenviar substitui os dados da etapa
    except Exception:
        pass
    col = chroma.create_collection(nome)
    col.add(ids=[str(i) for i in range(len(trechos))], documents=trechos)
    return {"trechos": len(trechos), "exemplos": trechos[:3]}


@app.post("/api/alunos/{aluno_id}/perguntar")
def perguntar(aluno_id: int, body: Pergunta):
    get_aluno(aluno_id)
    trechos: list[dict] = []

    if body.etapa == 1:
        system = SYSTEM_LIVRE
    else:
        if contar_trechos(aluno_id, body.etapa) == 0:
            raise HTTPException(400, f"Envie o JSON da etapa {body.etapa} antes de perguntar.")
        col = chroma.get_collection(nome_colecao(aluno_id, body.etapa))
        res = col.query(query_texts=[body.pergunta], n_results=min(TOP_K, col.count()))
        for doc, dist in zip(res["documents"][0], res["distances"][0]):
            trechos.append({"texto": doc, "distancia": round(float(dist), 3)})
        contexto = "\n".join(f"[{i}] {t['texto']}" for i, t in enumerate(trechos, 1))
        system = SYSTEM_RAG.format(contexto=contexto)

    try:
        resposta = chamar_llm(system, body.pergunta)
    except Exception as e:
        raise HTTPException(502, f"Falha ao chamar a LLM: {e}")

    pergunta = body.pergunta.strip()
    with closing(db()) as conn:
        cur = conn.execute(
            "INSERT INTO respostas (aluno_id, etapa, pergunta, resposta, trechos, criado_em) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (aluno_id, body.etapa, pergunta, resposta, json.dumps(trechos, ensure_ascii=False), agora()),
        )
        conn.commit()
    return {"id": cur.lastrowid, "etapa": body.etapa, "pergunta": pergunta, "resposta": resposta, "trechos": trechos}


def linhas_respostas(where: str = "", params: tuple = ()) -> list[dict]:
    with closing(db()) as conn:
        rows = conn.execute(
            "SELECT r.*, a.apelido, a.turma FROM respostas r JOIN alunos a ON a.id = r.aluno_id "
            f"{where} ORDER BY r.id",
            params,
        ).fetchall()
    return [{**dict(r), "trechos": json.loads(r["trechos"])} for r in rows]


@app.get("/api/alunos/{aluno_id}/respostas")
def respostas_do_aluno(aluno_id: int):
    get_aluno(aluno_id)
    return linhas_respostas("WHERE r.aluno_id = ?", (aluno_id,))


@app.get("/api/alunos/{aluno_id}/comparacao")
def comparacao(aluno_id: int):
    """Agrupa as respostas pela mesma pergunta (ignorando maiúsculas, espaços e pontuação final)."""
    grupos: dict[str, dict] = {}
    for r in respostas_do_aluno(aluno_id):
        chave = " ".join(r["pergunta"].lower().split()).rstrip("?!. ")
        g = grupos.setdefault(chave, {"pergunta": r["pergunta"], "etapas": {}})
        g["etapas"][r["etapa"]] = r  # a mais recente de cada etapa vence
    return sorted(grupos.values(), key=lambda g: -len(g["etapas"]))


@app.get("/api/professor/respostas")
def todas_respostas():
    return linhas_respostas()


@app.get("/api/professor/export.csv")
def exportar_csv():
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["id", "aluno_id", "apelido", "turma", "etapa", "pergunta", "resposta", "trechos", "criado_em"])
    for r in linhas_respostas():
        w.writerow([r["id"], r["aluno_id"], r["apelido"], r["turma"], r["etapa"], r["pergunta"],
                    r["resposta"], " | ".join(t["texto"] for t in r["trechos"]), r["criado_em"]])
    return StreamingResponse(
        iter(["﻿" + buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=respostas-oficina.csv"},
    )
