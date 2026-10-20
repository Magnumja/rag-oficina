"""Acesso ao SQLite compartilhado entre a Oficina RAG (alunos/respostas) e o Projeto
(projetos/projeto_documentos/projeto_respostas).
"""
from __future__ import annotations

import sqlite3
from contextlib import closing
from datetime import datetime, timezone

from fastapi import HTTPException

from config import DB_PATH


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
        CREATE TABLE IF NOT EXISTS projetos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            aluno_id INTEGER NOT NULL REFERENCES alunos(id),
            nome TEXT NOT NULL,
            descricao TEXT,
            cenario_id TEXT,
            model_provider TEXT NOT NULL,
            model_name TEXT NOT NULL,
            embedding_model TEXT NOT NULL,
            prompt_persona TEXT NOT NULL DEFAULT '',
            prompt_context TEXT NOT NULL DEFAULT '',
            prompt_instruction TEXT NOT NULL DEFAULT '',
            prompt_restriction TEXT NOT NULL DEFAULT '',
            prompt_output_format TEXT NOT NULL DEFAULT '',
            chunk_max_chars INTEGER NOT NULL DEFAULT 600,
            chunk_overlap_chars INTEGER NOT NULL DEFAULT 80,
            top_k INTEGER NOT NULL DEFAULT 4,
            similarity_threshold REAL NOT NULL DEFAULT 0.5,
            criado_em TEXT NOT NULL,
            atualizado_em TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS projeto_documentos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            projeto_id INTEGER NOT NULL REFERENCES projetos(id),
            nome_arquivo TEXT NOT NULL,
            paginas INTEGER NOT NULL,
            chunk_count INTEGER NOT NULL,
            status TEXT NOT NULL,
            criado_em TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS projeto_respostas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            projeto_id INTEGER NOT NULL REFERENCES projetos(id),
            pergunta TEXT NOT NULL,
            modo TEXT NOT NULL,
            resposta TEXT NOT NULL,
            trechos_json TEXT NOT NULL,
            tempo_segundos REAL NOT NULL,
            tokens_in INTEGER NOT NULL,
            tokens_out INTEGER NOT NULL,
            nada_relevante INTEGER NOT NULL,
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
