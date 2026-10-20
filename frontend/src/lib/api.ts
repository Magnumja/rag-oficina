import { demo } from './demo'

export type Etapa = 1 | 2 | 3

export interface Trecho {
  texto: string
  distancia: number
}

export interface Resposta {
  id: number
  aluno_id: number
  apelido?: string
  turma?: string | null
  etapa: Etapa
  pergunta: string
  resposta: string
  trechos: Trecho[]
  criado_em?: string
}

export interface GrupoComparacao {
  pergunta: string
  etapas: Partial<Record<'1' | '2' | '3', Resposta>>
}

export interface Status {
  modo: 'servidor' | 'demo'
  llm: boolean
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  if (!res.ok) {
    let msg = `Erro ${res.status}`
    try {
      const body = await res.json()
      if (typeof body.detail === 'string') msg = body.detail
      else if (Array.isArray(body.detail)) msg = body.detail.map((d: { msg: string }) => d.msg).join('; ')
    } catch {
      /* resposta sem JSON */
    }
    throw new Error(msg)
  }
  return res.json()
}

const CHAVE_ALUNO = 'oficina-rag:aluno-id'
let status: Promise<Status> | null = null
let alunoId: Promise<number> | null = null

/** Usa o backend se ele responder; senão, cai para a simulação no navegador (ex.: Vercel). */
export function detectar(): Promise<Status> {
  status ??= (async () => {
    if (import.meta.env.VITE_MODO === 'demo') return { modo: 'demo', llm: false } as Status
    try {
      const s = await req<{ ok: boolean; llm_configurada: boolean }>('/saude')
      return { modo: s.ok ? 'servidor' : 'demo', llm: s.llm_configurada } as Status
    } catch {
      return { modo: 'demo', llm: false } as Status
    }
  })()
  return status
}

/** Sem login: o navegador recebe um aluno anônimo na primeira visita. */
function aluno(): Promise<number> {
  alunoId ??= (async () => {
    try {
      const salvo = Number(localStorage.getItem(CHAVE_ALUNO))
      if (salvo && (await fetch(`/api/alunos/${salvo}`)).ok) return salvo
    } catch {
      /* segue e cria outro */
    }
    const a = await req<{ id: number }>('/alunos', {
      method: 'POST',
      body: JSON.stringify({ apelido: 'visitante', turma: null, consentimento: true }),
    })
    try {
      localStorage.setItem(CHAVE_ALUNO, String(a.id))
    } catch {
      /* ignora */
    }
    return a.id
  })()
  return alunoId
}

const servidor = async () => (await detectar()).modo === 'servidor'

export const api = {
  async trechos(): Promise<Record<string, number>> {
    if (!(await servidor())) return demo.trechos()
    return (await req<{ trechos: Record<string, number> }>(`/alunos/${await aluno()}`)).trechos
  },
  /** Envia o documento (PDF ou TXT) da etapa 2 ou 3. No modo demonstração, lê o texto do
   * arquivo no navegador e simula a indexação (sem extração de página real). */
  async enviarArquivo(etapa: Etapa, arquivo: File) {
    if (!(await servidor())) return demo.enviarJson(etapa, await arquivo.text())
    const form = new FormData()
    form.set('etapa', String(etapa))
    form.set('arquivo', arquivo)
    const res = await fetch(`/api/alunos/${await aluno()}/documentos`, { method: 'POST', body: form })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(typeof body.detail === 'string' ? body.detail : `Erro ${res.status}`)
    }
    return res.json() as Promise<{ trechos: number; exemplos: string[] }>
  },
  async perguntar(etapa: Etapa, pergunta: string) {
    if (!(await servidor())) return demo.perguntar(etapa, pergunta)
    return req<Resposta>(`/alunos/${await aluno()}/perguntar`, {
      method: 'POST',
      body: JSON.stringify({ etapa, pergunta }),
    })
  },
  async respostas(): Promise<Resposta[]> {
    if (!(await servidor())) return demo.respostas()
    return req<Resposta[]>(`/alunos/${await aluno()}/respostas`)
  },
  async comparacao(): Promise<GrupoComparacao[]> {
    if (!(await servidor())) return demo.comparacao()
    return req<GrupoComparacao[]>(`/alunos/${await aluno()}/comparacao`)
  },
  async todasRespostas(): Promise<Resposta[]> {
    if (!(await servidor())) return demo.respostas()
    return req<Resposta[]>('/professor/respostas')
  },
  /** Começa de novo: no servidor cria um aluno novo; na simulação apaga tudo. */
  async recomecar() {
    if (!(await servidor())) return demo.limpar()
    try {
      localStorage.removeItem(CHAVE_ALUNO)
    } catch {
      /* ignora */
    }
    alunoId = null
    await aluno()
  },
}
