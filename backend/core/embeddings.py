"""Adaptador de embedding multilíngue — fixo na plataforma, sempre via Ollama (`bge-m3`).

Não é pluggável como o modelo de chat: a Anthropic não expõe API de embedding, e os
documentos reais das oficinas são em português, daí o modelo multilíngue fixo.
"""
from __future__ import annotations


def embed(textos: list[str], model: str = "bge-m3") -> list[list[float]]:
    import ollama

    return [ollama.embed(model=model, input=texto)["embeddings"][0] for texto in textos]
