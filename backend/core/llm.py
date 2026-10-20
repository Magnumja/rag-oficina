"""Adaptador plugável de modelo de chat: Ollama ou Anthropic atrás da mesma interface,
mais um modo de demonstração (sem chave/sem Ollama local) que nunca derruba o fluxo.
"""
from __future__ import annotations

import os
import time
from dataclasses import dataclass


@dataclass
class ChatResult:
    answer: str
    tokens_in: int
    tokens_out: int
    time_seconds: float


class ChatAdapter:
    def chat(self, system: str, question: str) -> ChatResult:
        raise NotImplementedError


class OllamaAdapter(ChatAdapter):
    def __init__(self, model: str):
        self.model = model

    def chat(self, system: str, question: str) -> ChatResult:
        import ollama

        inicio = time.monotonic()
        resp = ollama.chat(
            model=self.model,
            messages=[{"role": "system", "content": system}, {"role": "user", "content": question}],
            stream=False,
        )
        duracao = resp.get("total_duration")
        return ChatResult(
            answer=resp["message"]["content"],
            tokens_in=resp.get("prompt_eval_count", 0) or 0,
            tokens_out=resp.get("eval_count", 0) or 0,
            time_seconds=(duracao / 1e9) if duracao else time.monotonic() - inicio,
        )


class AnthropicAdapter(ChatAdapter):
    def __init__(self, model: str):
        self.model = model

    def chat(self, system: str, question: str) -> ChatResult:
        import anthropic

        inicio = time.monotonic()
        client = anthropic.Anthropic()
        msg = client.messages.create(
            model=self.model,
            max_tokens=600,
            system=system,
            messages=[{"role": "user", "content": question}],
        )
        return ChatResult(
            answer="".join(b.text for b in msg.content if b.type == "text"),
            tokens_in=msg.usage.input_tokens,
            tokens_out=msg.usage.output_tokens,
            time_seconds=time.monotonic() - inicio,
        )


class DemoAdapter(ChatAdapter):
    """Permite testar o fluxo inteiro sem chave Anthropic e sem Ollama local."""

    def chat(self, system: str, question: str) -> ChatResult:
        inicio = time.monotonic()
        aviso = "[modo demonstração: configure ANTHROPIC_API_KEY ou rode o Ollama local]\n"
        marcador = "Trechos da base de conhecimento:\n"
        if marcador in system:
            resposta = aviso + "Encontrei estes dados:\n" + system.split(marcador, 1)[1][:600]
        else:
            resposta = aviso + "Não sei a resposta. Você pode me contar mais?"
        return ChatResult(answer=resposta, tokens_in=0, tokens_out=0, time_seconds=time.monotonic() - inicio)


def build_adapter(provider: str, model: str) -> ChatAdapter:
    if provider == "demo":
        return DemoAdapter()
    if provider == "ollama":
        return OllamaAdapter(model)
    if provider == "anthropic":
        if not os.getenv("ANTHROPIC_API_KEY"):
            return DemoAdapter()
        return AnthropicAdapter(model)
    raise ValueError(f"Provedor de modelo desconhecido: {provider}")
