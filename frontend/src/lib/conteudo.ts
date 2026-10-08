import type { Etapa } from './api'

export type Cor = 'azul' | 'amarelo' | 'rosa' | 'verde' | 'laranja'

/** Classes literais para o Tailwind encontrar. */
export const COR: Record<Cor, { texto: string; borda: string; fundo: string; suave: string }> = {
  azul: { texto: 'text-azul', borda: 'border-azul', fundo: 'bg-azul', suave: 'bg-azul/12' },
  amarelo: { texto: 'text-amarelo', borda: 'border-amarelo', fundo: 'bg-amarelo', suave: 'bg-amarelo/12' },
  rosa: { texto: 'text-rosa', borda: 'border-rosa', fundo: 'bg-rosa', suave: 'bg-rosa/12' },
  verde: { texto: 'text-verde', borda: 'border-verde', fundo: 'bg-verde', suave: 'bg-verde/12' },
  laranja: { texto: 'text-laranja', borda: 'border-laranja', fundo: 'bg-laranja', suave: 'bg-laranja/12' },
}

export const ETAPAS: Record<
  Etapa,
  {
    forte: string
    mao: string
    curto: string
    tarde: string
    cor: Cor
    descricao: string
    resultado: string
    observar: string
  }
> = {
  1: {
    forte: 'Etapa 1: IA',
    mao: 'sem RAG',
    curto: 'Modo livre',
    tarde: 'Tarde 1',
    cor: 'azul',
    descricao:
      'A IA responde só com a memória do treino. Ela não conhece a sua turma: pode dizer que não sabe, perguntar de volta ou inventar.',
    resultado: 'Não sei, pergunta de volta, ou inventa.',
    observar: 'A IA admitiu que não sabe, ou inventou uma resposta com toda a segurança?',
  },
  2: {
    forte: 'Etapa 2: RAG com',
    mao: 'dados errados',
    curto: 'Dados falsos',
    tarde: 'Tarde 1',
    cor: 'rosa',
    descricao:
      'Dados falsos (fake): peça ao GPT um JSON inventado, jogue no RAG e faça as mesmas perguntas. A IA consulta esses dados antes de responder.',
    resultado: 'Respostas erradas, ditas com segurança.',
    observar: 'A IA percebeu que os dados eram falsos? Ela cita os trechos com a mesma confiança.',
  },
  3: {
    forte: 'Etapa 3: IA com',
    mao: 'dados corretos',
    curto: 'Dados corretos',
    tarde: 'Tarde 2',
    cor: 'verde',
    descricao:
      'Gere os dados corretos da aula, alimente o RAG e repita as perguntas. Depois compare as três etapas e tire as suas conclusões.',
    resultado: 'Respostas com base nos dados reais.',
    observar: 'A resposta agora bate com o que aconteceu? O que mudou: o modelo ou os dados?',
  },
}

export const PERGUNTAS_SUGERIDAS = [
  'O que deu de aula ontem?',
  'Qual é a tarefa de casa?',
  'Quando é a próxima prova e o que vai cair?',
  'Quem deu a aula de matemática?',
]

export const MODELO_JSON = `{
  "turma": "2º ano B",
  "data": "06/10/2026",
  "aulas": [
    {
      "disciplina": "Matemática",
      "professor": "",
      "conteudo": "",
      "tarefa_de_casa": ""
    }
  ],
  "avisos": [""],
  "proxima_prova": {
    "disciplina": "",
    "data": "",
    "conteudo": ""
  }
}`

/** Exemplos prontos para a apresentação. */
export const EXEMPLO_JSON: Record<2 | 3, string> = {
  2: JSON.stringify(
    {
      turma: '2º ano B',
      data: '06/10/2026',
      aulas: [
        {
          disciplina: 'Matemática',
          professor: 'Prof. Ricardo Tavares',
          conteudo: 'Teorema de Fermat aplicado a frações',
          tarefa_de_casa: 'Resolver os exercícios 1 a 40 da página 312',
        },
        {
          disciplina: 'História',
          professor: 'Profa. Marina Lopes',
          conteudo: 'A chegada de Napoleão ao Brasil em 1822',
          tarefa_de_casa: 'Resumo de 5 páginas sobre a Batalha de Itararé',
        },
      ],
      avisos: ['A escola não terá aula na sexta por causa do eclipse'],
      proxima_prova: { disciplina: 'Química', data: '31/09/2026', conteudo: 'Tabela periódica completa de cor' },
    },
    null,
    2,
  ),
  3: JSON.stringify(
    {
      turma: '2º ano B',
      data: '06/10/2026',
      aulas: [
        {
          disciplina: 'Matemática',
          professor: 'Profa. Helena',
          conteudo: 'Funções do 2º grau: vértice e raízes',
          tarefa_de_casa: 'Lista 4, exercícios 1 a 10',
        },
        {
          disciplina: 'História',
          professor: 'Prof. Carlos',
          conteudo: 'Revolução Industrial',
          tarefa_de_casa: 'Ler o capítulo 7 do livro',
        },
      ],
      avisos: ['A oficina de RAG continua amanhã no laboratório de informática'],
      proxima_prova: { disciplina: 'Matemática', data: '20/10/2026', conteudo: 'Funções do 2º grau' },
    },
    null,
    2,
  ),
}

export const PROMPT_GPT: Record<2 | 3, string> = {
  2: `Crie um JSON com informações INVENTADAS sobre "a aula de ontem" de uma turma do Ensino Médio.
Os dados devem parecer reais, mas ser falsos: disciplinas, professores, conteúdos, tarefas, avisos e a próxima prova.
Use exatamente esta estrutura e responda só com o JSON, sem explicações:

${MODELO_JSON}`,
  3: `Transforme as minhas anotações da aula de ontem em JSON.
Use apenas o que estiver nas anotações; se faltar alguma informação, deixe o campo vazio.
Use exatamente esta estrutura e responda só com o JSON, sem explicações:

${MODELO_JSON}

Minhas anotações:
[cole aqui o que aconteceu na aula]`,
}
