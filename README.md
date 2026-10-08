# Oficina RAG

Plataforma da oficina "Inclusão Digital e Profissão em Ciência da Computação através do RAG Agêntico".
O aluno faz a mesma pergunta em três etapas e compara as respostas:

| Etapa | O que acontece |
|---|---|
| 1 · IA sem RAG | A LLM responde só com a memória do treino |
| 2 · RAG com dados errados | O aluno cola um JSON falso (gerado pelo GPT) e pergunta de novo |
| 3 · RAG com dados corretos | O aluno monta o JSON real e pergunta de novo |

A tela **Comparar** cruza as respostas salvas das três etapas para a mesma pergunta.
O **Painel do professor** mostra todas as respostas e exporta CSV para a pesquisa.

## Rodar

```bash
./iniciar.sh
```

Abre em http://localhost:5173. Na primeira vez ele cria o ambiente Python e instala as dependências.
Na primeira pergunta com RAG, o Chroma baixa o modelo de embeddings (~80 MB) para `~/.cache/chroma`.

Sem chave, o site roda em **modo demonstração**: tudo funciona, mas no lugar da resposta da IA
aparecem os trechos encontrados. Para usar a IA de verdade, coloque a chave em `backend/.env`:

```
ANTHROPIC_API_KEY=sk-ant-...
```

e reinicie. A chave fica só no servidor, nunca vai para o navegador.

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
- `backend/main.py`: FastAPI.
  1. `POST /api/alunos/{id}/documentos` recebe o JSON, transforma cada objeto em um trecho de texto e
     guarda no Chroma, numa coleção própria `aluno{id}_etapa{n}`. Reenviar substitui os dados.
  2. `POST /api/alunos/{id}/perguntar` busca os `TOP_K` trechos mais próximos (etapas 2 e 3) e chama
     a LLM com eles. Na etapa 1 a chamada vai sem contexto.
  3. A resposta é salva no SQLite (`backend/data/oficina.db`) com pergunta, etapa, aluno e os trechos usados.
- Qualquer formato de JSON funciona; o modelo sugerido está em `frontend/src/lib/conteudo.ts`.

## LGPD

O aluno entra só com apelido e turma e precisa marcar o consentimento. Não há outros dados pessoais.
Para zerar tudo, apague `backend/data/`.
