<!-- SEED: paleta/layout/elevação ainda são o seed original, estabelecido antes da
     implementação. Typography, Shapes e Components FORAM revisados depois que a UI
     do fluxo "Projeto" já existia e rodava no navegador — não são mais seed, são a
     decisão em vigor (ver Overview). Rodar /impeccable document em modo scan
     captura o resto a partir do código quando o fluxo estiver mais maduro. -->

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
  humana: "Baloo 2"
  maquina: "IBM Plex Mono"
rounded: "duplo — sm (conteúdo: cartões, fichas) + lg/pill (controles de seleção: botões de provedor, abas) — ver Shapes"
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

- **Baloo 2** (arredondada, traços grossos e amigáveis, suporte a português) —
  títulos, corpo, rótulos de campo. É a "fonte humana": o que a pessoa escreve e
  lê. Substitui a Fraunces do seed original — o usuário achou a serifa séria
  demais pro público (adolescentes de Ensino Médio); Baloo 2 é suave e animada
  sem cair em fonte de app infantil.
- **IBM Plex Mono** — tudo que é "da máquina": trechos citados nas fichas
  catalográficas, prompt final montado, JSON de configuração exportado, tokens/tempo
  de resposta. Mantida — não fez parte da crítica do usuário, e o contraste
  arredondada/monoespaçada reforça a distinção humano×máquina.
- Tamanho base generoso (pensado para texto legível via projetor que desbota cor).

## Layout

Grade discreta e visível (linhas finas de 1px, nunca invisíveis), bastante espaço em
branco (papel cru), uma ação principal por tela. Conteúdo em coluna única na maior
parte das telas; a tela Comparar é a exceção deliberada (3 colunas lado a lado).

## Elevation & Depth

Sombras quase nulas — no máximo uma borda de 1-1.5px, nunca sombra difusa/grande.
Nenhuma elevação tipo glassmorphism ou blur de fundo.

## Shapes

Raio duplo, com papel diferente para cada família:

- **Conteúdo** (cartões, fichas catalográficas) — raio pequeno e consistente
  (`--pantanal-raio`), bordas retas ou levemente arredondadas. Nunca pill.
- **Controles de seleção** (botões de provedor de IA, abas de navegação do
  Projeto) — raio bem maior (`--pantanal-raio-selecao`, próximo de pill),
  justamente pra parecerem controles vivos e tocáveis, não fichas de arquivo.
  Essa é a correção do seed original, que proibia pill em qualquer componente —
  a régua agora é "controle ≠ conteúdo": o que se lê fica contido, o que se
  toca pode ser mais solto e animado.

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
- **Campo de prompt** — rótulo (Baloo 2, peso médio) + textarea (IBM Plex Mono,
  já que o conteúdo digitado vira literalmente parte do prompt enviado ao modelo).
- **Botão de seleção** — cartão com raio grande (`--pantanal-raio-selecao`),
  ícone + rótulo, cor-tema da opção; reage ao toque (leve rotação/elevação) e
  ganha um selo de check animado quando ativo. Usado no seletor de provedor de
  IA e, como pill com destaque deslizante (`layoutId`), nas abas de navegação
  do Projeto. É o componente "animado" que resolve a crítica de "área de
  seleção genérica" do seed original.

## Do's and Don'ts

**Fazer:**
- Mostrar sempre documento+página+similaridade quando uma resposta usa RAG.
- Grifar com `--cor-conhecimento` só o trecho citado, nunca o cartão inteiro.
- Manter as 3 colunas do Comparar visualmente equivalentes em peso (nenhuma "ganha"
  destaque), diferenciando só pelo conteúdo.
- Animar só controles de seleção/navegação (motion já é dependência do projeto),
  nunca o texto de resposta da IA ou os dados da ficha catalográfica.

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
