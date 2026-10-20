# Educagente — Oficina RAG

Plataforma da oficina "Inclusão Digital e Profissão em Ciência da Computação através do RAG Agêntico"
(projeto de extensão da UCDB, Campo Grande/MS). "Educagente" é o nome do projeto; "Oficina RAG" é o
rótulo do fluxo fixo de 3 etapas dentro dela — a plataforma tem dois fluxos:

### Oficina RAG (fluxo fixo, 3 etapas)

O aluno faz a mesma pergunta em três etapas e compara as respostas:

| Etapa | O que acontece |
|---|---|
| 1 · IA sem RAG | A LLM responde só com a memória do treino |
| 2 · RAG com dados errados | O aluno envia um PDF/TXT falso (gerado pelo GPT) e pergunta de novo |
| 3 · RAG com dados corretos | O aluno monta o PDF/TXT real e pergunta de novo |

A tela **Comparar** cruza as respostas salvas das três etapas para a mesma pergunta.
O **Painel do professor** mostra todas as respostas e exporta CSV para a pesquisa.

### Projeto (fluxo livre, aba "Projeto")

Modelo mais geral, com identidade visual própria "Pantanal" (ver `DESIGN.md`): o aluno cria até
3 projetos, escreve um prompt de 5 campos (persona/contexto/instrução/restrição/formato de saída),
sobe seus próprios documentos e compara **modelo puro** vs. **+prompt** vs. **+prompt+RAG** lado a
lado. Cinco telas: Prompt → Conhecimento → Conversar → Comparar → Exportar (zip com config +
documentos + exemplo do prompt final).

Cada projeto escolhe um provedor de IA na criação (fica fixo depois):

- **Ollama** — grátis, sem conta, usa o servidor Ollama compartilhado da turma.
- **Anthropic** / **OpenAI** — BYOK (*bring your own key*): o aluno cola a própria chave na tela
  **"Minha IA"** (botão no topo da área Projeto). A chave fica só no `localStorage` do navegador,
  nunca é enviada ao nosso banco nem aparece em log — viaja só por requisição, direto pro provedor.
  Um botão "Testar e salvar" valida a chave antes de guardá-la, e um botão **"Como conseguir?"**
  abre o passo a passo de onde criar a chave em cada provedor.

Não existe "Entrar com Anthropic/OpenAI" por OAuth2 — nenhum dos dois provedores expõe um fluxo
público de terceiros que delegue uso/créditos da conta (a OpenAI tem "Sign in with ChatGPT", mas é
só identidade — `openid profile email`, nunca um token pra chamar a API). Colar a chave é o caminho
real disponível hoje.

## Rodar

```bash
./iniciar.sh
```

Abre em http://localhost:5173. Na primeira vez ele cria o ambiente Python e instala as dependências.
Na primeira pergunta com RAG, o modelo de embedding (`bge-m3`, via Ollama) é usado para indexar e buscar.

Sem Ollama local nem `ANTHROPIC_API_KEY`/`OPENAI_API_KEY`, o site roda em **modo demonstração**: tudo
funciona, mas no lugar da resposta da IA aparecem os trechos encontrados. Para usar a IA de verdade
na Oficina RAG (3 etapas), configure `backend/.env` (veja `backend/.env.example`):

```
MODEL_PROVIDER=anthropic   # ou "openai", ou "ollama"
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
```

e reinicie. Essa chave do `.env` fica só no servidor e é o fallback de demonstração/turma — no fluxo
"Projeto", cada aluno normalmente usa a própria chave, colada na tela "Minha IA" (ver acima), que
nunca passa pelo `.env` nem pelo banco.

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
   provedor de chat (`MODEL_PROVIDER=ollama`, `anthropic` + `ANTHROPIC_API_KEY`, ou `openai` +
   `OPENAI_API_KEY`) — isso é só o fallback de demonstração/turma da Oficina RAG; no Projeto, cada
   aluno normalmente usa a própria chave via "Minha IA".

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

- `frontend/`: React + Vite + Tailwind.
  - `src/App.tsx`: cabeçalho compartilhado (logo "Educagente", navegação) e a página Início. A barra
    tem 3 itens — Início, **Oficina RAG** (menu suspenso com Etapa 1-3, Comparar e Pesquisa) e
    Projeto — mas a paleta azul/amarelo/rosa/verde do cabeçalho é a mesma da Início (apresentação à
    banca) e não foi alterada de propósito, mesmo com a aba Projeto usando a paleta Pantanal.
  - Início + Etapas (Oficina RAG): componentes do [unlumen UI](https://ui.unlumen.com)
    (`src/components/unlumen-ui/`: ShimmeringText, GlowingBadge, ThemeSwitch, ShimmerSkeleton,
    CountUp, TextReveal) e `src/components/slide.tsx`, `src/telas.tsx`.
  - Projeto: identidade visual própria "Pantanal" (`src/pantanal.css`,
    `src/components/pantanal.tsx`, `src/telasProjeto.tsx`) — ver `DESIGN.md` para paleta, tipografia
    (Baloo 2 + IBM Plex Mono) e os componentes (ficha catalográfica, régua de similaridade, botão de
    seleção animado). Nunca compartilha estilo com a Início/Etapas.
- `backend/`: FastAPI, usando o núcleo em `backend/core/` (sem depender do FastAPI) — contrato
  central `core/engine.py::run(config, index, question, use_prompt, use_rag, api_key=None)`.
  - `backend/main.py`: endpoints da Oficina RAG (3 etapas fixas) + `/api/validar-chave` (testa uma
    chave Anthropic/OpenAI sem persistir).
  - `backend/projetos.py`: endpoints do modelo "Projeto" (criar/listar/atualizar projeto, upload de
    documento, perguntar, comparar as 3 camadas, exportar zip) — reaproveita o mesmo `core/`.
  - `backend/config.py` / `backend/db.py`: configuração e acesso ao SQLite compartilhados pelos dois.
  - `core/llm.py`: adaptador plugável de chat — `OllamaAdapter`, `AnthropicAdapter`, `OpenAIAdapter`,
    `DemoAdapter` — cada um aceita uma `api_key` opcional por chamada (BYOK) com fallback pro `.env`
    do servidor.
  - Fluxo de pergunta: `POST .../documentos` extrai texto por página (`core/ingestion.py`), corta em
    trechos (`core/chunking.py`) e indexa (`core/store.py`, JSONL + embedding `bge-m3` via Ollama,
    sempre local — não é afetado pela escolha de provedor de chat). `POST .../perguntar` busca os
    `TOP_K` trechos mais próximos (filtrados por `SIMILARITY_THRESHOLD`) e chama a LLM configurada.
    A resposta é salva no SQLite (`backend/data/oficina.db`) com pergunta, trechos usados e metadados.

## LGPD

O aluno entra só com apelido e turma e precisa marcar o consentimento. Não há outros dados pessoais.
Para zerar tudo, apague `backend/data/`. A chave de IA (BYOK) que o aluno cola em "Minha IA" nunca é
coletada pela plataforma — fica só no navegador dele.
