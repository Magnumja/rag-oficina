<!-- SEED: estabelecido com o usuário antes da implementação; rodar /impeccable
     document em modo scan depois que a UI do fluxo "Projeto" existir, para
     capturar os tokens e componentes reais a partir do código. -->

---
name: "Educagente — Pantanal"
description: "Identidade visual do fluxo 'Projeto' (Prompt/Conhecimento/Conversar/Comparar/Exportar) — biblioteca/fichário de pesquisa, nunca a página de apresentação à banca."
colors:
  primaria: "#173328"
  texto: "#14211B"
  fundo: "#F4EFE4"
  conhecimento: "#E8B931"
  prompt: "#3E7C82"
  acao_futura: "#B5643C"
  alerta: "#C8402F"
typography:
  humana: "Fraunces"
  maquina: "IBM Plex Mono"
rounded: "sm (bordas retas ou levemente arredondadas, nunca pill em componentes de conteúdo)"
spacing: "escala conservadora 4/8/12/16/24/32px, grade discreta visível"
---

## Overview

Metáfora central: RAG é consultar um acervo — biblioteca/fichário de um pesquisador
de campo, não um assistente mágico. O tom é "caderno de campo de pesquisador":
papel, tinta, fichas catalográficas, régua graduada. Nunca ilustração turística ou
onça clipart.

**Escopo explícito**: este sistema cobre só as telas do fluxo "Projeto" (Prompt,
Conhecimento, Conversar, Comparar, Exportar) dentro de
`/home/robertoneto/development/faculdade/6_sem/dac/educagente/frontend`. A página
"Início" (`App.tsx`'s `Inicio()`) e o fluxo de 3 etapas da "Oficina RAG"
(`telas.tsx`) são material de apresentação à banca e protótipo anterior — usam seu
próprio sistema visual (paleta azul/amarelo/rosa/verde, componentes `unlumen-ui`
como `GlowingBadge`/`ShimmeringText`) e **não devem ser migrados ou re-skinnados**
para este sistema.

## Colors

| Token | Hex | Papel |
|---|---|---|
| `--cor-primaria` | `#173328` (verde-mata) | Marca, cabeçalho, texto de ênfase |
| `--cor-texto` | `#14211B` (tinta) | Corpo de texto |
| `--cor-fundo` | `#F4EFE4` (papel cru) | Fundo de página e cartões |
| `--cor-conhecimento` | `#E8B931` (amarelo-ipê) | Camada de conhecimento/RAG — trechos, fichas, grifos |
| `--cor-prompt` | `#3E7C82` (água de corixo) | Camada de prompt/instrução |
| `--cor-acao-futura` | `#B5643C` (barro) | Ações futuras/avançadas, nunca ação primária |
| `--cor-alerta` | `#C8402F` (vermelho-tuiuiú) | Só alerta/erro — **nunca** usado para marcar a coluna "modelo puro" na tela Comparar |

Regra: cada camada (modelo/prompt/RAG) tem uma cor fixa e consistente em toda a UI;
cor nunca é o único sinal de significado (sempre acompanhada de ícone/texto).

## Typography

- **Fraunces** (serifa suave, não-itálica) — títulos, corpo, rótulos de campo. É a
  "fonte humana": o que a pessoa escreve e lê.
- **IBM Plex Mono** — tudo que é "da máquina": trechos citados nas fichas
  catalográficas, prompt final montado, JSON de configuração exportado, tokens/tempo
  de resposta.
- Tamanho base generoso (pensado para texto legível via projetor que desbota cor).

## Layout

Grade discreta e visível (linhas finas de 1px, nunca invisíveis), bastante espaço em
branco (papel cru), uma ação principal por tela. Conteúdo em coluna única na maior
parte das telas; a tela Comparar é a exceção deliberada (3 colunas lado a lado).

## Elevation & Depth

Sombras quase nulas — no máximo uma borda de 1-1.5px, nunca sombra difusa/grande.
Nenhuma elevação tipo glassmorphism ou blur de fundo.

## Shapes

Bordas retas ou levemente arredondadas (raio pequeno e consistente). Nunca formas
"pill" em componentes de conteúdo (cartões, fichas); pílulas/badges, se existirem,
são pequenas e de uso raro (ex. status de documento).

## Components

- **Ficha catalográfica** — representa um trecho usado numa resposta: cabeçalho
  pequeno "documento · página" (monoespaçado), corpo do trecho em `IBM Plex Mono`
  com a parte efetivamente citada grifada em `--cor-conhecimento` (fundo claro da
  cor, não texto colorido sobre fundo escuro).
- **Régua de similaridade** — barra graduada (marcações visíveis, tipo régua, não
  barra de progresso lisa) indicando a similaridade do trecho; o limiar configurado
  é visível na régua.
- **Aviso** — ícone + texto curto, nunca cor isolada; usado para "nada relevante
  encontrado", erros de upload, avisos de LGPD.
- **Campo de prompt** — rótulo (Fraunces, peso médio) + textarea (IBM Plex Mono,
  já que o conteúdo digitado vira literalmente parte do prompt enviado ao modelo).

## Do's and Don'ts

**Fazer:**
- Mostrar sempre documento+página+similaridade quando uma resposta usa RAG.
- Grifar com `--cor-conhecimento` só o trecho citado, nunca o cartão inteiro.
- Manter as 3 colunas do Comparar visualmente equivalentes em peso (nenhuma "ganha"
  destaque), diferenciando só pelo conteúdo.

**Não fazer:**
- Gradiente roxo/azul.
- Glassmorphism ou qualquer blur de fundo.
- Cartões dentro de cartões.
- Sombras difusas/grandes.
- Ícones de brilho/estrela (ex. padrão `GlowingBadge`/`ShimmeringText` da página
  Início — exclusivos daquele sistema, não deste).
- Emojis decorativos.
- Eyebrow chips.
- Usar `--cor-alerta` (vermelho) para destacar a coluna "modelo puro" no Comparar —
  essa coluna é neutra, não um erro.
