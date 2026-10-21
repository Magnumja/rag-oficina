"""Configuração compartilhada entre main.py (Oficina RAG) e projetos.py (Projeto)."""
from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

BASE = Path(__file__).parent
load_dotenv(BASE / ".env")

DATA = BASE / "data"
DATA.mkdir(exist_ok=True)
DB_PATH = DATA / "oficina.db"

MODEL_PROVIDER = os.getenv("MODEL_PROVIDER", "anthropic")
MODEL = os.getenv("LLM_MODEL", "llama3.2:1b" if MODEL_PROVIDER == "ollama" else "claude-haiku-5-5")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "bge-m3")
TOP_K = int(os.getenv("TOP_K", "4"))
SIMILARITY_THRESHOLD = float(os.getenv("SIMILARITY_THRESHOLD", "0.5"))
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
