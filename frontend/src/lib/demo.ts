/**
 * Modo demonstração: simula o backend dentro do navegador, para a apresentação
 * funcionar sem servidor (ex.: na Vercel). A busca é por palavras em comum, não por
 * embeddings, e as respostas são montadas a partir dos trechos encontrados.
 */
import type { Etapa, GrupoComparacao, Resposta, Trecho } from './api'

interface Estado {
  docs: Record<string, string[]>
  respostas: Resposta[]
  proximoId: number
}

const CHAVE = 'oficina-rag:demo'
let memoria: Estado = { docs: {}, respostas: [], proximoId: 1 }

function ler(): Estado {
  try {
    const raw = localStorage.getItem(CHAVE)
    if (raw) memoria = JSON.parse(raw)
  } catch {
    /* sem storage: fica na memória */
  }
  return memoria
}

function salvar(e: Estado) {
  memoria = e
  try {
    localStorage.setItem(CHAVE, JSON.stringify(e))
  } catch {
    /* ignora */
  }
}

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Mesma regra do backend: cada objeto do JSON vira um trecho de texto. */
export function jsonParaTrechos(dado: unknown, caminho = ''): string[] {
  if (Array.isArray(dado)) {
    return dado.flatMap((item, i) => jsonParaTrechos(item, caminho ? `${caminho} #${i + 1}` : `#${i + 1}`))
  }
  if (dado && typeof dado === 'object') {
    const entradas = Object.entries(dado as Record<string, unknown>)
    const simples = entradas.filter(([, v]) => v === null || typeof v !== 'object')
    const compostos = entradas.filter(([, v]) => v !== null && typeof v === 'object')
    const trechos: string[] = []
    if (simples.length) {
      trechos.push((caminho ? `[${caminho}] ` : '') + simples.map(([k, v]) => `${k}: ${v}`).join('; '))
    }
    for (const [k, v] of compostos) trechos.push(...jsonParaTrechos(v, caminho ? `${caminho} > ${k}` : k))
    return trechos
  }
  return [caminho ? `${caminho}: ${dado}` : String(dado)]
}

const PARADAS = new Set(
  'que qual quais quem quando como onde para por com sem uma uns umas dos das nos nas esta este isso essa esse foi vai tem ter era sao ser deu ontem aula'.split(
    ' ',
  ),
)

function palavras(t: string) {
  return t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((p) => p.length > 2 && !PARADAS.has(p))
    .map((p) => p.slice(0, 6)) // radical simples: "tarefas" e "tarefa" batem
}

function buscar(trechos: string[], pergunta: string, k = 4) {
  const q = new Set(palavras(pergunta))
  return trechos
    .map((texto, i) => {
      const t = new Set(palavras(texto))
      const pontos = [...q].filter((p) => t.has(p)).length
      return { texto, pontos, i, distancia: Number((1 - pontos / Math.max(q.size, 1)).toFixed(3)) }
    })
    .sort((a, b) => b.pontos - a.pontos || a.i - b.i)
    .slice(0, k)
}

function legivel(trecho: string) {
  return trecho
    .replace(/^\[[^\]]*\]\s*/, '')
    .split('; ')
    .map((par) => {
      const [k, ...v] = par.split(': ')
      return v.length ? `${k.replace(/_/g, ' ')}: ${v.join(': ')}` : par
    })
    .join(' · ')
}

function respostaLivre(pergunta: string) {
  const p = palavras(pergunta).join(' ')
  if (p.includes('tarefa'))
    return 'Provavelmente a tarefa é uma lista de exercícios do capítulo que vocês estão estudando, para entregar na próxima aula.'
  if (p.includes('prova'))
    return 'Normalmente as provas acontecem no fim do bimestre. A próxima deve ser daqui a umas duas semanas e costuma cobrar todo o conteúdo visto desde a última avaliação.'
  if (p.includes('profes') || p.includes('matema'))
    return 'A aula de matemática foi dada pelo professor titular da turma, que costuma trabalhar funções e equações nesta época do ano.'
  return 'Não tenho acesso às aulas da sua turma, então não sei o que foi dado ontem. Você pode me contar? Se quiser, posso sugerir conteúdos comuns do Ensino Médio nesta época do ano.'
}

function respostaRag(achados: ReturnType<typeof buscar>) {
  const relevantes = achados.filter((a) => a.pontos > 0).slice(0, 2)
  if (!relevantes.length) {
    return (
      'Pelos dados consultados, ontem a turma teve:\n' +
      achados
        .slice(0, 2)
        .map((a, i) => `• ${legivel(a.texto)} [${i + 1}]`)
        .join('\n')
    )
  }
  return (
    'Segundo os dados consultados:\n' +
    relevantes.map((a) => `• ${legivel(a.texto)} [${achados.indexOf(a) + 1}]`).join('\n')
  )
}

export const demo = {
  async enviarJson(etapa: Etapa, jsonTexto: string) {
    let dado: unknown
    try {
      dado = JSON.parse(jsonTexto)
    } catch (e) {
      throw new Error(`JSON inválido: ${(e as Error).message}`)
    }
    const trechos = jsonParaTrechos(dado).filter((t) => t.trim())
    if (!trechos.length) throw new Error('O JSON não tem nenhum texto para indexar.')
    await esperar(500)
    const e = ler()
    salvar({ ...e, docs: { ...e.docs, [etapa]: trechos } })
    return { trechos: trechos.length, exemplos: trechos.slice(0, 3) }
  },

  trechos(): Record<string, number> {
    const e = ler()
    return { 2: e.docs[2]?.length ?? 0, 3: e.docs[3]?.length ?? 0 }
  },

  async perguntar(etapa: Etapa, pergunta: string): Promise<Resposta> {
    let resposta: string
    let trechos: Trecho[] = []
    if (etapa === 1) {
      await esperar(1400)
      resposta = respostaLivre(pergunta)
    } else {
      const docs = ler().docs[etapa]
      if (!docs?.length) throw new Error(`Envie o JSON da etapa ${etapa} antes de perguntar.`)
      const achados = buscar(docs, pergunta)
      trechos = achados.map(({ texto, distancia }) => ({ texto, distancia }))
      await esperar(1600)
      resposta = respostaRag(achados)
    }
    const e = ler()
    const r: Resposta = {
      id: e.proximoId,
      aluno_id: 0,
      apelido: 'visitante',
      turma: null,
      etapa,
      pergunta: pergunta.trim(),
      resposta,
      trechos,
      criado_em: new Date().toISOString(),
    }
    salvar({ ...e, respostas: [...e.respostas, r], proximoId: r.id + 1 })
    return r
  },

  respostas(): Resposta[] {
    return ler().respostas
  },

  comparacao(): GrupoComparacao[] {
    const grupos = new Map<string, GrupoComparacao>()
    for (const r of ler().respostas) {
      const chave = r.pergunta.toLowerCase().split(/\s+/).join(' ').replace(/[?!. ]+$/, '')
      const g = grupos.get(chave) ?? { pergunta: r.pergunta, etapas: {} }
      g.etapas[String(r.etapa) as '1' | '2' | '3'] = r
      grupos.set(chave, g)
    }
    return [...grupos.values()].sort((a, b) => Object.keys(b.etapas).length - Object.keys(a.etapas).length)
  },

  limpar() {
    salvar({ docs: {}, respostas: [], proximoId: 1 })
  },
}
