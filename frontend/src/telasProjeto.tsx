/**
 * Telas do modelo "Projeto": o aluno cria até 3 projetos, configura um prompt de 5
 * campos, sobe seus documentos, conversa com o agente completo e compara lado a
 * lado puro vs. +prompt vs. +prompt+RAG. Usa a identidade visual "Pantanal"
 * (ver DESIGN.md) — isolada da Início e das Etapas da Oficina RAG: nenhum import
 * de `components/slide.tsx` ou `lib/conteudo.ts` aqui.
 */
import { useEffect, useState } from 'react'
import { Check, ChevronDown, Download, FolderPlus, KeyRound, Send, Settings2, Trash2, Upload } from 'lucide-react'
import {
  apiProjeto,
  LIMITE_PROJETOS,
  type ComparacaoProjeto,
  type ModoResposta,
  type Projeto,
  type RespostaProjeto,
} from '@/lib/apiProjeto'
import { esquecerChave, obterChave, salvarChave, temChave, type ProvedorIA } from '@/lib/chavesIA'
import { Aviso, BotaoPrimario, CampoPrompt, Cartao, FichaCatalografica } from '@/components/pantanal'
import { cn } from '@/lib/utils'
import '@/pantanal.css'

export type TelaProjeto =
  | 'projeto-lista'
  | 'projeto-prompt'
  | 'projeto-conhecimento'
  | 'projeto-conversar'
  | 'projeto-comparar'
  | 'projeto-exportar'

const CHAVE_PROJETO_ATUAL = 'educagente:projeto-atual-id'

const SUBNAV: { id: TelaProjeto; label: string }[] = [
  { id: 'projeto-prompt', label: 'Prompt' },
  { id: 'projeto-conhecimento', label: 'Conhecimento' },
  { id: 'projeto-conversar', label: 'Conversar' },
  { id: 'projeto-comparar', label: 'Comparar' },
  { id: 'projeto-exportar', label: 'Exportar' },
]

const CAMADAS: { id: ModoResposta; titulo: string; descricao: string }[] = [
  { id: 'puro', titulo: 'Modelo puro', descricao: 'sem prompt, sem documentos' },
  { id: 'prompt', titulo: '+ Prompt', descricao: 'com a persona/instrução, ainda sem documentos' },
  { id: 'prompt_rag', titulo: '+ Prompt + RAG', descricao: 'com a persona/instrução e os documentos do projeto' },
]

export function ProjetoArea({ tela, irPara }: { tela: TelaProjeto; irPara: (t: TelaProjeto) => void }) {
  const [projetos, setProjetos] = useState<Projeto[] | null>(null)
  const [projetoAtual, setProjetoAtual] = useState<Projeto | null>(null)
  const [erro, setErro] = useState('')
  const [minhaIAAberta, setMinhaIAAberta] = useState(false)

  const carregarLista = () => apiProjeto.listarProjetos().then(setProjetos).catch((e) => setErro(e.message))

  useEffect(() => {
    carregarLista()
  }, [])

  function selecionar(p: Projeto) {
    setProjetoAtual(p)
    try {
      localStorage.setItem(CHAVE_PROJETO_ATUAL, String(p.id))
    } catch {
      /* ignora */
    }
  }

  async function recarregarAtual(id: number) {
    const p = await apiProjeto.verProjeto(id)
    setProjetoAtual(p)
  }

  useEffect(() => {
    if (projetoAtual || tela === 'projeto-lista' || !projetos) return
    const salvo = Number(localStorage.getItem(CHAVE_PROJETO_ATUAL))
    const achado = projetos.find((p) => p.id === salvo)
    if (achado) recarregarAtual(achado.id).catch(() => {})
  }, [tela, projetos, projetoAtual])

  return (
    <div className="pantanal -mx-4 min-h-[70vh] px-4 py-8 sm:-mx-[max(0px,calc((100vw-72rem)/2))] sm:px-[max(16px,calc((100vw-72rem)/2))]">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-maquina text-[11px] uppercase tracking-[0.14em] text-[var(--cor-primaria)]/60">Projeto</p>
          <h1 className="mt-1 text-2xl font-semibold text-[var(--cor-primaria)] sm:text-3xl">
            {projetoAtual ? projetoAtual.nome : 'Seus projetos'}
          </h1>
        </div>
        <nav className="flex flex-wrap items-center gap-1.5">
          {projetoAtual && (
            <>
              <button
                onClick={() => {
                  setProjetoAtual(null)
                  irPara('projeto-lista')
                }}
                className="rounded-[var(--pantanal-raio)] px-2.5 py-1.5 text-xs text-[var(--cor-primaria)]/60 underline-offset-4 hover:underline"
              >
                ← trocar projeto
              </button>
              {SUBNAV.map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    setMinhaIAAberta(false)
                    irPara(n.id)
                  }}
                  className={cn(
                    'rounded-[var(--pantanal-raio)] px-3 py-1.5 text-sm font-medium transition-colors',
                    !minhaIAAberta && tela === n.id
                      ? 'bg-[var(--cor-primaria)] text-[var(--cor-fundo)]'
                      : 'text-[var(--cor-primaria)]/70 hover:bg-[var(--cor-primaria)]/8',
                  )}
                >
                  {n.label}
                </button>
              ))}
            </>
          )}
          <button
            onClick={() => setMinhaIAAberta((a) => !a)}
            className={cn(
              'flex items-center gap-1.5 rounded-[var(--pantanal-raio)] px-3 py-1.5 text-sm font-medium transition-colors',
              minhaIAAberta
                ? 'bg-[var(--cor-primaria)] text-[var(--cor-fundo)]'
                : 'text-[var(--cor-primaria)]/70 hover:bg-[var(--cor-primaria)]/8',
            )}
          >
            <KeyRound className="size-3.5" /> Minha IA
          </button>
        </nav>
      </header>

      {erro && <Aviso tom="erro">{erro}</Aviso>}

      {minhaIAAberta ? (
        <PainelMinhaIA />
      ) : tela === 'projeto-lista' || !projetoAtual ? (
        <ListaProjetos
          projetos={projetos}
          onCriado={(p) => {
            carregarLista()
            selecionar(p)
            irPara('projeto-prompt')
          }}
          onAbrir={(p) => {
            selecionar(p)
            irPara('projeto-prompt')
          }}
        />
      ) : tela === 'projeto-prompt' ? (
        <TelaPrompt projeto={projetoAtual} onAtualizado={setProjetoAtual} />
      ) : tela === 'projeto-conhecimento' ? (
        <TelaConhecimento projeto={projetoAtual} onAtualizado={setProjetoAtual} />
      ) : tela === 'projeto-conversar' ? (
        <TelaConversar projeto={projetoAtual} />
      ) : tela === 'projeto-comparar' ? (
        <TelaComparar projeto={projetoAtual} />
      ) : (
        <TelaExportar projeto={projetoAtual} />
      )}
    </div>
  )
}

/* ---------------- Lista de projetos ---------------- */

function ListaProjetos({
  projetos,
  onCriado,
  onAbrir,
}: {
  projetos: Projeto[] | null
  onCriado: (p: Projeto) => void
  onAbrir: (p: Projeto) => void
}) {
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [provedor, setProvedor] = useState<ProvedorIA>('ollama')
  const [criando, setCriando] = useState(false)
  const [erro, setErro] = useState('')

  const noLimite = (projetos?.length ?? 0) >= LIMITE_PROJETOS
  const chaveFalta = provedor !== 'ollama' && !temChave(provedor)

  async function criar() {
    if (!nome.trim()) return
    setCriando(true)
    setErro('')
    try {
      const p = await apiProjeto.criarProjeto(nome.trim(), provedor, descricao.trim())
      setNome('')
      setDescricao('')
      onCriado(p)
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setCriando(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projetos === null ? (
          <p className="text-sm text-[var(--cor-primaria)]/60">Carregando…</p>
        ) : (
          projetos.map((p) => (
            <button key={p.id} onClick={() => onAbrir(p)} className="text-left">
              <Cartao className="h-full transition-colors hover:border-[var(--cor-primaria)]/60">
                <p className="font-semibold text-[var(--cor-primaria)]">{p.nome}</p>
                {p.descricao && <p className="mt-1 text-sm text-[var(--cor-texto)]/70">{p.descricao}</p>}
                <p className="font-maquina mt-3 text-[11px] text-[var(--cor-primaria)]/50">
                  {p.model_provider}/{p.model_name} · {p.documentos?.length ?? 0} documento(s)
                </p>
              </Cartao>
            </button>
          ))
        )}
      </div>

      {noLimite ? (
        <Aviso tom="erro">
          Limite de {LIMITE_PROJETOS} projetos atingido. Abra um dos projetos existentes ou peça ajuda para apagar um.
        </Aviso>
      ) : (
        <Cartao className="max-w-xl">
          <div className="flex items-center gap-2 text-[var(--cor-primaria)]">
            <FolderPlus className="size-4" />
            <p className="font-semibold">Novo projeto</p>
          </div>
          <div className="mt-3 space-y-3">
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome do projeto"
              maxLength={80}
              className="w-full rounded-[var(--pantanal-raio)] border-[length:var(--pantanal-borda)] border-[var(--cor-prompt)]/40 bg-white/60 px-3 py-2 text-sm outline-none focus:border-[var(--cor-prompt)]"
            />
            <input
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descrição (opcional)"
              maxLength={500}
              className="w-full rounded-[var(--pantanal-raio)] border-[length:var(--pantanal-borda)] border-[var(--cor-prompt)]/40 bg-white/60 px-3 py-2 text-sm outline-none focus:border-[var(--cor-prompt)]"
            />
            <div>
              <span className="text-xs font-semibold text-[var(--cor-primaria)]">Provedor de IA</span>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {(
                  [
                    ['ollama', 'Ollama (grátis, sem conta)'],
                    ['anthropic', 'Anthropic (minha chave)'],
                    ['openai', 'OpenAI (minha chave)'],
                  ] as [ProvedorIA, string][]
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setProvedor(id)}
                    className={cn(
                      'rounded-[var(--pantanal-raio)] border-[length:var(--pantanal-borda)] px-3 py-1.5 text-xs font-medium transition-colors',
                      provedor === id
                        ? 'border-[var(--cor-primaria)] bg-[var(--cor-primaria)] text-[var(--cor-fundo)]'
                        : 'border-[var(--cor-primaria)]/30 text-[var(--cor-primaria)]/70 hover:border-[var(--cor-primaria)]',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {chaveFalta && (
              <Aviso tom="erro">
                Você ainda não colocou sua chave {provedor === 'anthropic' ? 'da Anthropic' : 'da OpenAI'}. Abra "Minha
                IA" no topo da página pra colar e testar.
              </Aviso>
            )}
            <BotaoPrimario onClick={criar} disabled={!nome.trim() || criando || chaveFalta}>
              <FolderPlus className="size-4" /> {criando ? 'Criando…' : 'Criar projeto'}
            </BotaoPrimario>
            <p className="text-xs text-[var(--cor-texto)]/50">
              O provedor de IA fica fixo depois de criado — só o prompt, os documentos e a configuração de busca
              podem ser alterados depois.
            </p>
            {erro && <Aviso tom="erro">{erro}</Aviso>}
          </div>
        </Cartao>
      )}
    </div>
  )
}

/* ---------------- Prompt (5 campos) ---------------- */

function TelaPrompt({ projeto, onAtualizado }: { projeto: Projeto; onAtualizado: (p: Projeto) => void }) {
  const [campos, setCampos] = useState({
    prompt_persona: projeto.prompt_persona,
    prompt_context: projeto.prompt_context,
    prompt_instruction: projeto.prompt_instruction,
    prompt_restriction: projeto.prompt_restriction,
    prompt_output_format: projeto.prompt_output_format,
  })
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)

  async function salvar() {
    setSalvando(true)
    setSalvo(false)
    try {
      const p = await apiProjeto.atualizarProjeto(projeto.id, campos)
      onAtualizado(p)
      setSalvo(true)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-4">
      <CampoPrompt
        rotulo="Persona"
        dica="Quem é o assistente? (ex.: um tutor paciente de Ensino Médio)"
        valor={campos.prompt_persona}
        onChange={(v) => setCampos((c) => ({ ...c, prompt_persona: v }))}
      />
      <CampoPrompt
        rotulo="Contexto"
        dica="O que o assistente precisa saber sobre a situação"
        valor={campos.prompt_context}
        onChange={(v) => setCampos((c) => ({ ...c, prompt_context: v }))}
      />
      <CampoPrompt
        rotulo="Instrução"
        dica="O que ele deve fazer com a pergunta e os documentos"
        valor={campos.prompt_instruction}
        onChange={(v) => setCampos((c) => ({ ...c, prompt_instruction: v }))}
      />
      <CampoPrompt
        rotulo="Restrição"
        dica="O que ele não deve fazer (ex.: não inventar se não houver fonte)"
        valor={campos.prompt_restriction}
        onChange={(v) => setCampos((c) => ({ ...c, prompt_restriction: v }))}
      />
      <CampoPrompt
        rotulo="Formato de saída"
        dica="Como a resposta deve ser organizada"
        valor={campos.prompt_output_format}
        onChange={(v) => setCampos((c) => ({ ...c, prompt_output_format: v }))}
      />
      <div className="flex items-center gap-3">
        <BotaoPrimario onClick={salvar} disabled={salvando}>
          {salvando ? 'Salvando…' : 'Salvar prompt'}
        </BotaoPrimario>
        {salvo && <span className="text-sm text-[var(--cor-prompt)]">Salvo.</span>}
      </div>
    </div>
  )
}

/* ---------------- Conhecimento (upload + avançado) ---------------- */

function TelaConhecimento({ projeto, onAtualizado }: { projeto: Projeto; onAtualizado: (p: Projeto) => void }) {
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [aviso, setAviso] = useState<{ tom: 'ok' | 'erro'; msg: string } | null>(null)
  const [avancadoAberto, setAvancadoAberto] = useState(false)
  const [avancado, setAvancado] = useState({
    chunk_max_chars: projeto.chunk_max_chars,
    chunk_overlap_chars: projeto.chunk_overlap_chars,
    top_k: projeto.top_k,
    similarity_threshold: projeto.similarity_threshold,
  })

  async function enviar() {
    if (!arquivo) return
    setEnviando(true)
    setAviso(null)
    try {
      const doc = await apiProjeto.enviarDocumento(projeto.id, arquivo)
      const atualizado = await apiProjeto.verProjeto(projeto.id)
      onAtualizado(atualizado)
      setArquivo(null)
      setAviso({
        tom: doc.status === 'pronto' ? 'ok' : 'erro',
        msg:
          doc.status === 'pronto'
            ? `${doc.chunk_count} trechos indexados de ${doc.paginas} página(s).`
            : 'Não foi possível extrair texto deste arquivo.',
      })
    } catch (e) {
      setAviso({ tom: 'erro', msg: (e as Error).message })
    } finally {
      setEnviando(false)
    }
  }

  async function salvarAvancado() {
    const p = await apiProjeto.atualizarProjeto(projeto.id, avancado)
    onAtualizado(p)
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Cartao>
        <p className="font-semibold text-[var(--cor-primaria)]">Documentos da base de conhecimento</p>
        {projeto.documentos && projeto.documentos.length > 0 ? (
          <ul className="mt-3 space-y-1.5 text-sm">
            {projeto.documentos.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-2 font-maquina text-[12px]">
                <span className="truncate">{d.nome_arquivo}</span>
                <span className="text-[var(--cor-primaria)]/60">
                  {d.status === 'pronto' ? `${d.chunk_count} trechos` : 'sem texto extraído'}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-[var(--cor-texto)]/60">Nenhum documento enviado ainda.</p>
        )}

        <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-[var(--pantanal-raio)] border-[length:var(--pantanal-borda)] border-dashed border-[var(--cor-primaria)]/40 p-6 text-sm text-[var(--cor-primaria)]/70 hover:border-[var(--cor-primaria)]">
          <Upload className="size-4" />
          {arquivo ? arquivo.name : 'Escolher arquivo PDF ou TXT'}
          <input type="file" accept=".pdf,.txt" className="sr-only" onChange={(e) => setArquivo(e.target.files?.[0] ?? null)} />
        </label>
        <div className="mt-3 flex justify-end">
          <BotaoPrimario onClick={enviar} disabled={!arquivo || enviando}>
            <Upload className="size-4" /> {enviando ? 'Enviando…' : 'Enviar documento'}
          </BotaoPrimario>
        </div>
        {aviso && (
          <Aviso tom={aviso.tom} className="mt-3">
            {aviso.msg}
          </Aviso>
        )}
      </Cartao>

      <Cartao>
        <button onClick={() => setAvancadoAberto((a) => !a)} className="flex w-full items-center justify-between gap-2 text-left">
          <span className="flex items-center gap-2 font-semibold text-[var(--cor-primaria)]">
            <Settings2 className="size-4" /> Configuração avançada
          </span>
          <ChevronDown className={cn('size-4 text-[var(--cor-primaria)]/60 transition-transform', avancadoAberto && 'rotate-180')} />
        </button>
        {avancadoAberto && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <CampoNumero
              label="Tamanho do trecho (chars)"
              valor={avancado.chunk_max_chars}
              onChange={(v) => setAvancado((a) => ({ ...a, chunk_max_chars: v }))}
              min={100}
              max={4000}
            />
            <CampoNumero
              label="Sobreposição (chars)"
              valor={avancado.chunk_overlap_chars}
              onChange={(v) => setAvancado((a) => ({ ...a, chunk_overlap_chars: v }))}
              min={0}
              max={1000}
            />
            <CampoNumero
              label="Top-K trechos"
              valor={avancado.top_k}
              onChange={(v) => setAvancado((a) => ({ ...a, top_k: v }))}
              min={1}
              max={20}
            />
            <CampoNumero
              label="Limiar de similaridade"
              valor={avancado.similarity_threshold}
              onChange={(v) => setAvancado((a) => ({ ...a, similarity_threshold: v }))}
              min={0}
              max={1}
              step={0.05}
            />
            <div className="sm:col-span-2">
              <BotaoPrimario onClick={salvarAvancado}>Salvar configuração</BotaoPrimario>
            </div>
          </div>
        )}
      </Cartao>
    </div>
  )
}

function CampoNumero({
  label,
  valor,
  onChange,
  min,
  max,
  step = 1,
}: {
  label: string
  valor: number
  onChange: (v: number) => void
  min: number
  max: number
  step?: number
}) {
  return (
    <label className="block text-sm">
      <span className="text-[var(--cor-primaria)]">{label}</span>
      <input
        type="number"
        value={valor}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="font-maquina mt-1 w-full rounded-[var(--pantanal-raio)] border-[length:var(--pantanal-borda)] border-[var(--cor-prompt)]/40 bg-white/60 px-3 py-1.5 text-sm outline-none focus:border-[var(--cor-prompt)]"
      />
    </label>
  )
}

/* ---------------- Conversar ---------------- */

function TelaConversar({ projeto }: { projeto: Projeto }) {
  const [pergunta, setPergunta] = useState('')
  const [historico, setHistorico] = useState<{ pergunta: string; resposta: RespostaProjeto }[]>([])
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  async function enviar() {
    const texto = pergunta.trim()
    if (!texto || enviando) return
    setEnviando(true)
    setErro('')
    try {
      const resposta = await apiProjeto.perguntar(projeto.id, texto, projeto.model_provider as ProvedorIA)
      setHistorico((h) => [{ pergunta: texto, resposta }, ...h])
      setPergunta('')
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-4">
      <Cartao>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            enviar()
          }}
          className="flex items-end gap-2"
        >
          <textarea
            value={pergunta}
            onChange={(e) => setPergunta(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                enviar()
              }
            }}
            rows={2}
            maxLength={1000}
            placeholder="Pergunte algo sobre os documentos deste projeto"
            className="min-h-[52px] flex-1 resize-none rounded-[var(--pantanal-raio)] border-[length:var(--pantanal-borda)] border-[var(--cor-prompt)]/40 bg-white/60 px-3 py-2 text-sm outline-none focus:border-[var(--cor-prompt)]"
          />
          <BotaoPrimario type="submit" disabled={enviando || !pergunta.trim()}>
            <Send className="size-4" />
          </BotaoPrimario>
        </form>
      </Cartao>

      {erro && <Aviso tom="erro">{erro}</Aviso>}

      {historico.map((h, i) => (
        <Cartao key={i}>
          <p className="font-semibold text-[var(--cor-primaria)]">{h.pergunta}</p>
          <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">{h.resposta.resposta}</p>
          {h.resposta.nada_relevante && (
            <Aviso tom="erro" className="mt-3">
              Nada relevante encontrado nos documentos para esta pergunta.
            </Aviso>
          )}
          {h.resposta.trechos.length > 0 && (
            <div className="mt-3 space-y-2">
              {h.resposta.trechos.map((t, j) => (
                <FichaCatalografica key={j} indice={j + 1} documento={t.documento} pagina={t.pagina} similaridade={t.similaridade} texto={t.texto} />
              ))}
            </div>
          )}
        </Cartao>
      ))}
      {historico.length === 0 && (
        <p className="rounded-[var(--pantanal-raio)] border-[length:var(--pantanal-borda)] border-dashed border-[var(--cor-primaria)]/30 p-8 text-center text-sm text-[var(--cor-primaria)]/60">
          As respostas desta conversa aparecem aqui.
        </p>
      )}
    </div>
  )
}

/* ---------------- Comparar (3 camadas) ---------------- */

function TelaComparar({ projeto }: { projeto: Projeto }) {
  const [pergunta, setPergunta] = useState('')
  const [rodando, setRodando] = useState(false)
  const [erro, setErro] = useState('')
  const [atual, setAtual] = useState<{ pergunta: string; camadas: Record<ModoResposta, RespostaProjeto> } | null>(null)
  const [historico, setHistorico] = useState<ComparacaoProjeto[] | null>(null)

  useEffect(() => {
    apiProjeto
      .comparacoes(projeto.id)
      .then(setHistorico)
      .catch(() => setHistorico([]))
  }, [projeto.id])

  async function rodar() {
    const texto = pergunta.trim()
    if (!texto || rodando) return
    setRodando(true)
    setErro('')
    try {
      const r = await apiProjeto.comparar(projeto.id, texto, projeto.model_provider as ProvedorIA)
      setAtual(r)
      apiProjeto.comparacoes(projeto.id).then(setHistorico).catch(() => {})
      setPergunta('')
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setRodando(false)
    }
  }

  return (
    <div className="space-y-6">
      <Cartao className="max-w-3xl">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            rodar()
          }}
          className="flex items-end gap-2"
        >
          <textarea
            value={pergunta}
            onChange={(e) => setPergunta(e.target.value)}
            rows={2}
            maxLength={1000}
            placeholder="Faça a mesma pergunta nas três camadas"
            className="min-h-[52px] flex-1 resize-none rounded-[var(--pantanal-raio)] border-[length:var(--pantanal-borda)] border-[var(--cor-prompt)]/40 bg-white/60 px-3 py-2 text-sm outline-none focus:border-[var(--cor-prompt)]"
          />
          <BotaoPrimario type="submit" disabled={rodando || !pergunta.trim()}>
            {rodando ? 'Rodando…' : 'Comparar'}
          </BotaoPrimario>
        </form>
      </Cartao>

      {erro && <Aviso tom="erro">{erro}</Aviso>}

      {atual && (
        <div>
          <p className="font-maquina mb-3 text-xs text-[var(--cor-primaria)]/60">“{atual.pergunta}”</p>
          <div className="grid gap-4 md:grid-cols-3">
            {CAMADAS.map((c) => {
              const r = atual.camadas[c.id]
              return (
                <div key={c.id}>
                  <p className="font-semibold text-[var(--cor-primaria)]">{c.titulo}</p>
                  <p className="text-xs text-[var(--cor-texto)]/60">{c.descricao}</p>
                  <Cartao className="mt-2">
                    {r ? (
                      <>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{r.resposta}</p>
                        {r.trechos.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {r.trechos.map((t, j) => (
                              <FichaCatalografica
                                key={j}
                                indice={j + 1}
                                documento={t.documento}
                                pagina={t.pagina}
                                similaridade={t.similaridade}
                                texto={t.texto}
                              />
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-[var(--cor-texto)]/50">sem resultado</p>
                    )}
                  </Cartao>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {historico && historico.length > 0 && (
        <div>
          <p className="mb-2 font-semibold text-[var(--cor-primaria)]">Histórico de comparações</p>
          <ul className="space-y-1.5">
            {historico.map((g, i) => (
              <li key={i} className="font-maquina text-xs text-[var(--cor-primaria)]/70">
                “{g.pergunta}” · {Object.keys(g.camadas).length}/3 camadas
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/* ---------------- Exportar ---------------- */

function TelaExportar({ projeto }: { projeto: Projeto }) {
  const [exportando, setExportando] = useState(false)

  async function exportar() {
    setExportando(true)
    try {
      await apiProjeto.exportar(projeto.id, projeto.nome)
    } finally {
      setExportando(false)
    }
  }

  return (
    <Cartao className="max-w-xl">
      <p className="font-semibold text-[var(--cor-primaria)]">Exportar projeto</p>
      <p className="mt-2 text-sm text-[var(--cor-texto)]/70">
        Gera um .zip com a configuração do projeto, um exemplo do prompt final montado e os documentos originais
        enviados à base de conhecimento.
      </p>
      <div className="mt-4">
        <BotaoPrimario onClick={exportar} disabled={exportando}>
          <Download className="size-4" /> {exportando ? 'Gerando…' : 'Baixar .zip'}
        </BotaoPrimario>
      </div>
      <p className="mt-3 text-xs text-[var(--cor-primaria)]/50">
        config.json + prompt_final_exemplo.txt + documentos/ + README.md
      </p>
    </Cartao>
  )
}

/* ---------------- Minha IA (BYOK) ---------------- */

const CAMPOS_CHAVE: { id: 'anthropic' | 'openai'; label: string; ondeConseguir: string }[] = [
  { id: 'anthropic', label: 'Anthropic (Claude)', ondeConseguir: 'console.anthropic.com → API Keys' },
  { id: 'openai', label: 'OpenAI (GPT)', ondeConseguir: 'platform.openai.com → API keys' },
]

function PainelMinhaIA() {
  return (
    <div className="max-w-2xl space-y-6">
      <Aviso tom="ok">
        Sua chave fica só neste navegador — nunca é enviada para o nosso banco de dados nem aparece em nenhum log.
        Trate-a como uma senha: não a compartilhe.
      </Aviso>
      {CAMPOS_CHAVE.map((c) => (
        <CampoChave key={c.id} provider={c.id} label={c.label} ondeConseguir={c.ondeConseguir} />
      ))}
      <Cartao>
        <p className="font-semibold text-[var(--cor-primaria)]">Ollama</p>
        <p className="mt-1 text-sm text-[var(--cor-texto)]/70">
          Terceira opção, sem conta nem chave: usa o servidor Ollama compartilhado da turma. Mais lento e um modelo
          menor, mas funciona de graça pra qualquer aluno.
        </p>
      </Cartao>
    </div>
  )
}

function CampoChave({
  provider,
  label,
  ondeConseguir,
}: {
  provider: 'anthropic' | 'openai'
  label: string
  ondeConseguir: string
}) {
  const [valor, setValor] = useState(() => obterChave(provider) ?? '')
  const [testando, setTestando] = useState(false)
  const [resultado, setResultado] = useState<{ tom: 'ok' | 'erro'; msg: string } | null>(null)
  const salva = !!obterChave(provider)

  async function testarESalvar() {
    if (!valor.trim()) return
    setTestando(true)
    setResultado(null)
    try {
      const r = await apiProjeto.validarChave(provider, valor.trim())
      if (r.ok) {
        salvarChave(provider, valor.trim())
        setResultado({ tom: 'ok', msg: 'Chave válida e salva neste navegador.' })
      } else {
        setResultado({ tom: 'erro', msg: r.erro || 'Chave rejeitada pelo provedor.' })
      }
    } catch (e) {
      setResultado({ tom: 'erro', msg: (e as Error).message })
    } finally {
      setTestando(false)
    }
  }

  function esquecer() {
    esquecerChave(provider)
    setValor('')
    setResultado(null)
  }

  return (
    <Cartao>
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold text-[var(--cor-primaria)]">{label}</p>
        {salva && (
          <span className="flex items-center gap-1 text-xs text-[var(--cor-prompt)]">
            <Check className="size-3.5" /> salva
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-[var(--cor-texto)]/50">Pegue a sua em: {ondeConseguir}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          type="password"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder="Cole sua chave aqui"
          className="min-w-0 flex-1 rounded-[var(--pantanal-raio)] border-[length:var(--pantanal-borda)] border-[var(--cor-prompt)]/40 bg-white/60 px-3 py-2 font-maquina text-sm outline-none focus:border-[var(--cor-prompt)]"
        />
        <BotaoPrimario onClick={testarESalvar} disabled={!valor.trim() || testando}>
          {testando ? 'Testando…' : 'Testar e salvar'}
        </BotaoPrimario>
        {salva && (
          <button
            onClick={esquecer}
            className="flex items-center gap-1.5 rounded-[var(--pantanal-raio)] px-2.5 py-1.5 text-xs text-[var(--cor-alerta)] hover:bg-[var(--cor-alerta)]/10"
          >
            <Trash2 className="size-3.5" /> esquecer
          </button>
        )}
      </div>
      {resultado && (
        <Aviso tom={resultado.tom} className="mt-3">
          {resultado.msg}
        </Aviso>
      )}
    </Cartao>
  )
}
