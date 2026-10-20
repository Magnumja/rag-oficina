# Oficina RAG

Plataforma da oficina "Inclusão Digital e Profissão em Ciência da Computação através do RAG Agêntico".
O aluno faz a mesma pergunta em três etapas e compara as respostas:

| Etapa | O que acontece |
|---|---|
| 1 · IA sem RAG | A LLM responde só com a memória do treino |
| 2 · RAG com dados errados | O aluno envia um PDF/TXT falso (gerado pelo GPT) e pergunta de novo |
| 3 · RAG com dados corretos | O aluno monta o PDF/TXT real e pergunta de novo |

A tela **Comparar** cruza as respostas salvas das três etapas para a mesma pergunta.
O **Painel do professor** mostra todas as respostas e exporta CSV para a pesquisa.

## Rodar

```bash
./iniciar.sh
```

Abre em http://localhost:5173. Na primeira vez ele cria o ambiente Python e instala as dependências.
Na primeira pergunta com RAG, o modelo de embedding (`bge-m3`, via Ollama) é usado para indexar e buscar.

Sem Ollama local nem `ANTHROPIC_API_KEY`, o site roda em **modo demonstração**: tudo funciona, mas no
lugar da resposta da IA aparecem os trechos encontrados. Para usar a IA de verdade, configure
`backend/.env` (veja `backend/.env.example`):

```
MODEL_PROVIDER=anthropic   # ou "ollama"
ANTHROPIC_API_KEY=sk-ant-...
```

e reinicie. A chave fica só no servidor, nunca vai para o navegador.

### Rodar com Docker

A API roda em container; o Ollama fica no **host**, não containerizado. O frontend também roda
fora do container (ele não precisa de Docker).

1. **Suba o Ollama no host escutando em todas as interfaces** — por padrão o Ollama só aceita
   conexões de `127.0.0.1`, e o container não alcança isso. Se você já tem um `ollama serve` rodando
   assim, pare e suba de novo com a variável:
   ```bash
   pkill -f "ollama serve"
   OLLAMA_HOST=0.0.0.0:11434 ollama serve &
   ```
   Isso expõe a porta 11434 na sua rede local enquanto o processo ficar assim — depois de testar,
   volte ao normal com `pkill -f "ollama serve" && ollama serve &` (sem a variável).

2. **Garanta os modelos baixados** (uma vez):
   ```bash
   ollama pull bge-m3        # embedding, sempre necessário
   ollama pull llama3.2:1b   # só se for usar MODEL_PROVIDER=ollama no chat
   ```

3. **Configure `backend/.env`** (copie de `backend/.env.example` se ainda não existir) e escolha o
   provedor de chat (`MODEL_PROVIDER=ollama` ou `anthropic` + `ANTHROPIC_API_KEY`).

4. **Suba a API em container:**
   ```bash
   docker compose up --build -d
   ```
   Ela sobe em `http://localhost:8000` e acessa o Ollama do host via
   `http://host.docker.internal:11434` (já configurado no `docker-compose.yml`, inclusive o
   `extra_hosts` necessário no Linux). Confirme com:
   ```bash
   curl http://localhost:8000/api/saude
   ```

5. **Suba o frontend** (fora do Docker):
   ```bash
   cd frontend && npm install && npm run dev
   ```
   Abre em `http://localhost:5173` — o Vite já proxia `/api` para `localhost:8000`, então funciona
   igual estando a API em Docker ou rodando direto no host.

Para derrubar tudo: `docker compose down` (API) + `Ctrl+C` no terminal do `npm run dev` (frontend).

**Problema comum:** se o upload de documento (etapa 2/3) der erro 502/500 mencionando
`ConnectionError`/"Failed to connect to Ollama", é quase sempre o passo 1 — o Ollama do host não
está escutando em `0.0.0.0`. Confirme com `ss -tlnp | grep 11434`: se aparecer só `127.0.0.1:11434`
em vez de `*:11434` ou `0.0.0.0:11434`, repita o passo 1.

### Usar no laboratório

O Vite já escuta na rede. Rode no computador do professor e os alunos acessam
`http://IP-DO-PROFESSOR:5173`. As chamadas `/api` passam pelo Vite até o backend, então não é preciso
mexer em CORS.

### Publicar na Vercel (só para apresentar)

Na Vercel roda só o site. Sem o backend, ele entra sozinho em **modo demonstração**: a busca e as
respostas são simuladas no navegador, com os mesmos passos do RAG de verdade. Cada visitante vê só os seus dados.

1. Em vercel.com → **Add New → Project**, importe este repositório.
2. Em **Root Directory**, escolha `frontend`. O preset Vite é detectado sozinho.
3. Clique em **Deploy**.

O botão **Demonstração em 1 clique** roda as três etapas com os exemplos prontos e abre a comparação.

## Como funciona

- `frontend/`: React + Vite + Tailwind, com componentes do [unlumen UI](https://ui.unlumen.com)
  (`src/components/unlumen-ui/`: ShimmeringText, GlowingBadge, ThemeSwitch, ShimmerSkeleton, CountUp, TextReveal).
- `backend/main.py`: FastAPI, usando o núcleo em `backend/core/` (sem depender do FastAPI):
  1. `POST /api/alunos/{id}/documentos` recebe um PDF ou TXT, extrai o texto por página
     (`core/ingestion.py`), corta em trechos (`core/chunking.py`) e guarda no índice próprio da
     etapa (`core/store.py`, JSONL + embedding `bge-m3` via Ollama). Reenviar substitui os dados.
  2. `POST /api/alunos/{id}/perguntar` chama `core/engine.py::run()` — a função central do núcleo —
     que busca os `TOP_K` trechos mais próximos (etapas 2 e 3, filtrados por `SIMILARITY_THRESHOLD`)
     e chama a LLM configurada em `MODEL_PROVIDER` (`anthropic` ou `ollama`, via `core/llm.py`).
     Na etapa 1 a chamada vai sem contexto.
  3. A resposta é salva no SQLite (`backend/data/oficina.db`) com pergunta, etapa, aluno e os trechos usados.

## LGPD

O aluno entra só com apelido e turma e precisa marcar o consentimento. Não há outros dados pessoais.
Para zerar tudo, apague `backend/data/`.
