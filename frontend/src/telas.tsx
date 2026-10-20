import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, Check, ChevronDown, Copy, Database, Download, FileJson, Play, RotateCcw, Send, Upload, Wand2 } from 'lucide-react'
import { CountUp } from '@/components/unlumen-ui/count-up'
import { ShimmerSkeleton } from '@/components/unlumen-ui/shimmer-skeleton'
import { ShimmeringText } from '@/components/unlumen-ui/shimmering-text'
import {
  Aviso,
  BotaoPrimario,
  botaoSecundarioCls,
  Cartao,
  Fecho,
  FluxoRag,
  Numero,
  Pilula,
  Rotulo,
  Titulo,
} from '@/components/slide'
import { api, type Etapa, type GrupoComparacao, type Resposta } from '@/lib/api'
import { COR, ETAPAS, EXEMPLO_JSON, PERGUNTAS_SUGERIDAS, PROMPT_GPT } from '@/lib/conteudo'
import { cn } from '@/lib/utils'

export type Tela = 'inicio' | 'etapa1' | 'etapa2' | 'etapa3' | 'comparar' | 'pesquisa'

/** Roda as três etapas com os exemplos prontos e a mesma pergunta. */
export async function rodarDemonstracao(progresso: (msg: string) => void) {
  const pergunta = PERGUNTAS_SUGERIDAS[0]
  progresso('Etapa 1: perguntando sem RAG…')
  await api.perguntar(1, pergunta)
  progresso('Etapa 2: enviando dados falsos ao RAG…')
  await api.enviarArquivo(2, new File([EXEMPLO_JSON[2]], 'exemplo-etapa2.txt', { type: 'text/plain' }))
  await api.perguntar(2, pergunta)
  progresso('Etapa 3: enviando dados corretos ao RAG…')
  await api.enviarArquivo(3, new File([EXEMPLO_JSON[3]], 'exemplo-etapa3.txt', { type: 'text/plain' }))
  await api.perguntar(3, pergunta)
}

export function BotaoDemonstracao({ aoTerminar, className }: { aoTerminar: () => void; className?: string }) {
  const [msg, setMsg] = useState('')
  const [erro, setErro] = useState('')
  return (
    <div className={className}>
      <BotaoPrimario
        disabled={!!msg}
        onClick={async () => {
          setErro('')
          try {
            await rodarDemonstracao(setMsg)
            aoTerminar()
          } catch (e) {
            setErro((e as Error).message)
          } finally {
            setMsg('')
          }
        }}
      >
        <Play className="size-4" /> Demonstração em 1 clique
      </BotaoPrimario>
      {msg && <ShimmeringText text={msg} className="mt-2 block text-sm" />}
      {erro && <p className="mt-2 text-sm text-rosa">{erro}</p>}
    </div>
  )
}

/* ---------------- Etapa ---------------- */

export function EtapaTela({ etapa, irPara }: { etapa: Etapa; irPara: (t: Tela) => void }) {
  const info = ETAPAS[etapa]
  const [historico, setHistorico] = useState<Resposta[]>([])
  const [trechos, setTrechos] = useState(0)
  const [pergunta, setPergunta] = useState('')
  const [fase, setFase] = useState(0)
  const [erro, setErro] = useState('')
  const timers = useRef<number[]>([])

  useEffect(() => {
    api
      .respostas()
      .then((rs) => setHistorico(rs.filter((r) => r.etapa === etapa).reverse()))
      .catch(() => {})
    if (etapa > 1)
      api
        .trechos()
        .then((t) => setTrechos(t[etapa] ?? 0))
        .catch(() => {})
    return () => timers.current.forEach(clearTimeout)
  }, [etapa])

  const pensando = fase > 0 && fase < 4

  async function perguntar(texto: string) {
    if (!texto.trim() || pensando) return
    setErro('')
    setFase(1)
    // anima o caminho da pergunta pelo fluxo enquanto espera a resposta
    timers.current = [
      window.setTimeout(() => setFase(etapa === 1 ? 3 : 2), 450),
      window.setTimeout(() => setFase(3), etapa === 1 ? 450 : 1100),
    ]
    try {
      const r = await api.perguntar(etapa, texto)
      timers.current.forEach(clearTimeout)
      setHistorico((h) => [r, ...h])
      setPergunta('')
      setFase(4)
    } catch (err) {
      timers.current.forEach(clearTimeout)
      setErro((err as Error).message)
      setFase(0)
    }
  }

  const bloqueado = etapa > 1 && trechos === 0

  return (
    <div className="space-y-8">
      <header className="max-w-3xl">
        <Pilula cor={info.cor}>{info.tarde.toUpperCase()}</Pilula>
        <Titulo as="h1" forte={info.forte} mao={info.mao} cor={info.cor} className="mt-3" />
        <p className="mt-3 text-muted-foreground text-pretty">{info.descricao}</p>
      </header>

      <Cartao className="space-y-3">
        <Rotulo className="text-muted-foreground">Por dentro: o caminho da pergunta</Rotulo>
        <FluxoRag etapa={etapa} fase={fase} trechos={trechos} />
        <Fecho cor={info.cor} className="text-xl">
          {etapa === 1
            ? 'modo livre: a IA responde de memória e pode errar'
            : 'antes de responder, a IA consulta; os dados passam a ser controlados'}
        </Fecho>
      </Cartao>

      <div className={cn('grid gap-6', etapa > 1 ? 'lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]' : 'lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]')}>
        {etapa > 1 && <PainelArquivo etapa={etapa as 2 | 3} trechos={trechos} onEnviado={setTrechos} />}

        <section className="min-w-0 space-y-4">
          <Cartao className={cn('p-4', bloqueado && 'opacity-60')}>
            <Rotulo className="text-muted-foreground">{etapa > 1 ? '3 · Faça a pergunta' : 'Faça a pergunta'}</Rotulo>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                perguntar(pergunta)
              }}
              className="mt-2 flex items-end gap-2"
            >
              <textarea
                value={pergunta}
                onChange={(e) => setPergunta(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    perguntar(pergunta)
                  }
                }}
                disabled={bloqueado}
                rows={2}
                maxLength={1000}
                aria-label="Pergunta"
                placeholder={bloqueado ? 'Envie o JSON primeiro para liberar as perguntas' : '“O que deu de aula ontem?”'}
                className="min-h-[52px] flex-1 resize-none rounded-lg bg-muted px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/40"
              />
              <BotaoPrimario type="submit" disabled={bloqueado || pensando || !pergunta.trim()} aria-label="Enviar">
                <Send className="size-4" />
              </BotaoPrimario>
            </form>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {PERGUNTAS_SUGERIDAS.map((p) => (
                <button
                  key={p}
                  disabled={bloqueado || pensando}
                  onClick={() => perguntar(p)}
                  className="rounded-md border-[1.5px] px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-amarelo hover:text-foreground disabled:pointer-events-none"
                >
                  {p}
                </button>
              ))}
            </div>
          </Cartao>

          {erro && <Aviso tom="erro">{erro}</Aviso>}

          <AnimatePresence initial={false}>
            {pensando && (
              <motion.div
                key="pensando"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <Cartao cor={info.cor} tracejado>
                  <ShimmeringText
                    text={
                      fase === 2 ? 'Buscando trechos no banco vetorial…' : etapa === 1 ? 'Respondendo de memória…' : 'Escrevendo com base nos trechos…'
                    }
                    className="text-sm"
                  />
                  <div className="mt-4 space-y-2">
                    <ShimmerSkeleton className="h-3 w-11/12" />
                    <ShimmerSkeleton className="h-3 w-9/12" />
                  </div>
                </Cartao>
              </motion.div>
            )}
          </AnimatePresence>
          {historico.map((r, i) => (
            <motion.div
              key={r.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <CartaoResposta r={r} abertoInicial={i === 0 && fase === 4} />
            </motion.div>
          ))}
          {historico.length === 0 && !pensando && (
            <p className="rounded-xl border-[1.5px] border-dashed p-8 text-center text-sm text-muted-foreground">
              As respostas desta etapa aparecem aqui e ficam guardadas para a comparação.
            </p>
          )}
        </section>

        {etapa === 1 && (
          <aside className="space-y-4">
            <Observar etapa={etapa} />
            <Cartao>
              <Rotulo className="text-amarelo">Quando a IA alucina</Rotulo>
              <p className="mt-2 text-sm text-muted-foreground">
                O modelo escreve o que <b className="text-foreground">soa provável</b>, não o que foi verificado. Sem
                conferir, o erro vira trabalho entregue.
              </p>
              <p className="mt-3 font-mao text-2xl font-bold text-amarelo">alucinação</p>
              <p className="text-xs text-muted-foreground">resposta falsa dita com segurança</p>
            </Cartao>
          </aside>
        )}
      </div>

      {etapa > 1 && <Observar etapa={etapa} />}

      {historico.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={() => irPara(etapa < 3 ? (`etapa${etapa + 1}` as Tela) : 'comparar')}
            className={botaoSecundarioCls}
          >
            {etapa < 3 ? `Ir para a etapa ${etapa + 1}` : 'Comparar as três etapas'} <ArrowRight className="size-4" />
          </button>
        </div>
      )}
    </div>
  )
}

function Observar({ etapa }: { etapa: Etapa }) {
  return (
    <Cartao cor="amarelo" tracejado>
      <Rotulo className="text-amarelo">O que observar</Rotulo>
      <p className="mt-2 text-[15px] font-medium text-pretty">{ETAPAS[etapa].observar}</p>
    </Cartao>
  )
}

function PainelArquivo({
  etapa,
  trechos,
  onEnviado,
}: {
  etapa: 2 | 3
  trechos: number
  onEnviado: (n: number) => void
}) {
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [estado, setEstado] = useState<{ tipo: 'ok' | 'erro'; msg: string; exemplos?: string[] } | null>(null)
  const [enviando, setEnviando] = useState(false)
  const cor = ETAPAS[etapa].cor

  async function enviar(alvo: File) {
    setEstado(null)
    setEnviando(true)
    try {
      const r = await api.enviarArquivo(etapa, alvo)
      onEnviado(r.trechos)
      setEstado({ tipo: 'ok', msg: `${r.trechos} trechos guardados no banco vetorial. Agora faça as perguntas.`, exemplos: r.exemplos })
    } catch (err) {
      setEstado({ tipo: 'erro', msg: (err as Error).message })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section className="min-w-0 space-y-4">
      <Cartao>
        <div className="flex items-center justify-between gap-3">
          <Rotulo className={COR[cor].texto}>
            1 · {etapa === 2 ? 'Peça os dados falsos ao GPT' : 'Peça ao GPT para organizar os dados'}
          </Rotulo>
          <BotaoCopiar texto={PROMPT_GPT[etapa]} />
        </div>
        <pre className="mt-3 max-h-36 overflow-auto rounded-lg bg-muted p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground">
          {PROMPT_GPT[etapa]}
        </pre>
      </Cartao>

      <Cartao>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Rotulo className={COR[cor].texto}>2 · Envie um PDF ou TXT ao RAG</Rotulo>
          <button
            onClick={() => enviar(new File([EXEMPLO_JSON[etapa]], `exemplo-etapa${etapa}.txt`, { type: 'text/plain' }))}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            <Wand2 className="size-3.5" /> usar exemplo {etapa === 2 ? 'falso' : 'correto'}
          </button>
        </div>
        <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-lg border-[1.5px] border-dashed bg-background p-6 text-sm text-muted-foreground hover:border-foreground/40">
          <Upload className="size-4" />
          {arquivo ? arquivo.name : 'Escolher arquivo PDF ou TXT'}
          <input
            type="file"
            accept=".pdf,.txt"
            className="sr-only"
            onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
          />
        </label>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Database className="size-3.5" />
            {trechos > 0 ? `${trechos} trechos na coleção desta etapa` : 'Coleção vazia'}
          </span>
          <BotaoPrimario onClick={() => arquivo && enviar(arquivo)} disabled={!arquivo || enviando}>
            <Upload className="size-4" />
            {enviando ? 'Extraindo texto…' : trechos > 0 ? 'Substituir dados' : 'Enviar ao RAG'}
          </BotaoPrimario>
        </div>
        {estado && (
          <Aviso tom={estado.tipo} className="mt-4">
            {estado.msg}
            {estado.exemplos && (
              <ul className="mt-2 space-y-1 font-mono text-[11px] text-muted-foreground">
                {estado.exemplos.map((ex, i) => (
                  <li key={i} className="truncate">
                    {ex}
                  </li>
                ))}
              </ul>
            )}
          </Aviso>
        )}
      </Cartao>
    </section>
  )
}

function CartaoResposta({ r, compacto, abertoInicial }: { r: Resposta; compacto?: boolean; abertoInicial?: boolean }) {
  const [aberto, setAberto] = useState(!!abertoInicial)
  const cor = ETAPAS[r.etapa].cor
  return (
    <article className={cn('h-full rounded-xl border-[1.5px] bg-card p-5', compacto ? COR[cor].borda : 'border-border')}>
      {!compacto && (
        <div className="flex gap-2">
          <Rotulo className="mt-0.5 shrink-0 text-muted-foreground">Aluno</Rotulo>
          <p className="text-sm font-semibold">{r.pergunta}</p>
        </div>
      )}
      <div className={cn(!compacto && 'mt-3 rounded-lg border-[1.5px] bg-muted/50 p-3')}>
        {!compacto && <Rotulo className={COR[cor].texto}>IA</Rotulo>}
        <p className={cn('text-sm leading-relaxed whitespace-pre-wrap text-pretty', !compacto && 'mt-1')}>{r.resposta}</p>
      </div>
      {r.trechos.length > 0 ? (
        <div className="mt-4 border-t pt-3">
          <button
            onClick={() => setAberto((a) => !a)}
            aria-expanded={aberto}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <FileJson className="size-3.5" />
            {r.trechos.length} trechos consultados
            <ChevronDown className={cn('size-3.5 transition-transform', aberto && 'rotate-180')} />
          </button>
          <AnimatePresence initial={false}>
            {aberto && (
              <motion.ol
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-1.5 overflow-hidden"
              >
                {r.trechos.map((t, i) => (
                  <li key={i} className="rounded-md bg-muted px-3 py-2 font-mono text-[11px] leading-relaxed first:mt-3">
                    <span className={COR[cor].texto}>[{i + 1}]</span> {t.texto}
                  </li>
                ))}
              </motion.ol>
            )}
          </AnimatePresence>
        </div>
      ) : (
        r.etapa === 1 && <p className="mt-4 border-t pt-3 text-xs text-muted-foreground">Nenhuma fonte: veio da memória do modelo.</p>
      )}
    </article>
  )
}

function BotaoCopiar({ texto }: { texto: string }) {
  const [copiado, setCopiado] = useState(false)
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(texto)
          setCopiado(true)
          setTimeout(() => setCopiado(false), 1600)
        } catch {
          /* sem permissão de área de transferência */
        }
      }}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-md border-[1.5px] px-2.5 py-1 text-xs transition-colors hover:bg-accent"
    >
      {copiado ? <Check className="size-3.5 text-verde" /> : <Copy className="size-3.5" />}
      {copiado ? 'Copiado' : 'Copiar prompt'}
    </button>
  )
}

/* ---------------- Comparar ---------------- */

export function Comparar() {
  const [grupos, setGrupos] = useState<GrupoComparacao[] | null>(null)
  const [sel, setSel] = useState(0)

  const carregar = () => {
    api.comparacao().then(setGrupos).catch(() => setGrupos([]))
  }
  useEffect(carregar, [])

  const g = grupos?.[sel]

  return (
    <div className="space-y-8">
      <header>
        <Titulo as="h1" forte="Mesma pergunta," mao="três cenários" cor="amarelo" />
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Qual resposta parece mais confiável? Qual está certa? O que mudou entre uma etapa e outra?
        </p>
      </header>

      {grupos === null ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <ShimmerSkeleton key={i} className="h-48" rounded="lg" />
          ))}
        </div>
      ) : grupos.length === 0 ? (
        <Cartao tracejado className="flex flex-col items-center gap-4 p-10 text-center">
          <p className="text-muted-foreground">
            Ainda não há respostas. Faça a mesma pergunta nas três etapas, ou rode a demonstração com os exemplos prontos.
          </p>
          <BotaoDemonstracao aoTerminar={carregar} />
        </Cartao>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {grupos.map((gr, i) => (
              <button
                key={i}
                onClick={() => setSel(i)}
                className={cn(
                  'flex max-w-full items-center gap-2 rounded-lg border-[1.5px] px-3 py-1.5 text-sm transition-colors',
                  i === sel ? 'border-amarelo bg-amarelo/12 font-semibold' : 'hover:bg-accent',
                )}
              >
                <span className="truncate">“{gr.pergunta}”</span>
                <span className="font-mono text-xs opacity-60">{Object.keys(gr.etapas).length}/3</span>
              </button>
            ))}
          </div>

          {g && (
            <div className="grid items-stretch gap-4 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
              {([1, 2, 3] as Etapa[]).map((e) => {
                const r = g.etapas[String(e) as '1' | '2' | '3']
                const info = ETAPAS[e]
                return [
                  <div key={e} className="flex min-w-0 flex-col gap-3">
                    <div>
                      <Pilula cor={info.cor}>{info.tarde.toUpperCase()}</Pilula>
                      <p className="mt-2 font-titulo text-sm font-extrabold uppercase">
                        {info.forte} <span className={cn('font-mao text-xl normal-case', COR[info.cor].texto)}>{info.mao}</span>
                      </p>
                    </div>
                    {r ? (
                      <CartaoResposta r={r} compacto />
                    ) : (
                      <p className="flex flex-1 items-center justify-center rounded-xl border-[1.5px] border-dashed p-6 text-center text-sm text-muted-foreground">
                        Sem resposta para esta pergunta na etapa {e}.
                      </p>
                    )}
                    <p className={cn('text-xs font-semibold', COR[info.cor].texto)}>{info.resultado}</p>
                  </div>,
                  e < 3 && (
                    <ArrowRight key={`seta${e}`} className="hidden size-5 self-center text-muted-foreground md:block" />
                  ),
                ]
              })}
            </div>
          )}

          <Fecho>mesma pergunta, três cenários: o aluno compara e conclui</Fecho>

          <div className="grid gap-4 md:grid-cols-[1.2fr_1fr]">
            <Cartao cor="amarelo" tracejado>
              <Rotulo className="text-amarelo">Para discutir</Rotulo>
              <ul className="mt-3 space-y-2 text-sm">
                <li>1. Na etapa 1, a IA admitiu que não sabia ou inventou?</li>
                <li>2. Na etapa 2, ela percebeu que os dados eram falsos?</li>
                <li>3. O que mudou na etapa 3? Quem controla a verdade: o modelo ou os dados?</li>
              </ul>
            </Cartao>
            <Cartao>
              <Rotulo className="text-muted-foreground">Em uma frase</Rotulo>
              <p className="mt-2 font-semibold text-pretty">
                No modo livre, a IA trabalha só com a memória e pode errar. Reformulando o código e o fluxo, o estudante a
                conduz ao acerto.
              </p>
            </Cartao>
          </div>

          <div className="flex justify-end">
            <button
              onClick={async () => {
                await api.recomecar()
                setSel(0)
                carregar()
              }}
              className={botaoSecundarioCls}
            >
              <RotateCcw className="size-4" /> Começar de novo
            </button>
          </div>
        </>
      )}
    </div>
  )
}

/* ---------------- Pesquisa (slide 13) ---------------- */

export function Pesquisa() {
  const [rs, setRs] = useState<Resposta[] | null>(null)

  useEffect(() => {
    api.todasRespostas().then(setRs).catch(() => setRs([]))
  }, [])

  const porEtapa = (e: Etapa) => rs?.filter((r) => r.etapa === e).length ?? 0
  const stats = [
    { label: 'Participantes', v: new Set(rs?.map((r) => r.aluno_id)).size, cor: 'amarelo' as const },
    { label: 'Etapa 1 · sem RAG', v: porEtapa(1), cor: 'azul' as const },
    { label: 'Etapa 2 · dados errados', v: porEtapa(2), cor: 'rosa' as const },
    { label: 'Etapa 3 · dados corretos', v: porEtapa(3), cor: 'verde' as const },
  ]

  function exportar() {
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const linhas = [
      ['id', 'aluno_id', 'etapa', 'pergunta', 'resposta', 'trechos', 'criado_em'],
      ...(rs ?? []).map((r) => [r.id, r.aluno_id, r.etapa, r.pergunta, r.resposta, r.trechos.map((t) => t.texto).join(' | '), r.criado_em]),
    ]
    const blob = new Blob(['﻿' + linhas.map((l) => l.map(esc).join(',')).join('\n')], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'respostas-oficina.csv'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Titulo as="h1" forte="O que isso gera" mao="para a banca" cor="verde" />
          <p className="mt-3 text-muted-foreground">
            Respostas registradas na plataforma: dados da pesquisa de campo, tratados conforme a LGPD.
          </p>
        </div>
        <button onClick={exportar} disabled={!rs?.length} className={cn(botaoSecundarioCls, 'disabled:opacity-40')}>
          <Download className="size-4" /> Exportar CSV
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <Cartao key={s.label} cor={s.cor}>
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className={cn('mt-2 font-titulo text-4xl font-extrabold tabular-nums', COR[s.cor].texto)}>
              {rs === null ? '–' : <CountUp to={s.v} />}
            </p>
          </Cartao>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border-[1.5px] bg-card">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b-[1.5px]">
            <tr>
              {['Etapa', 'Pergunta', 'Resposta'].map((h) => (
                <th key={h} className="px-4 py-3">
                  <Rotulo className="text-muted-foreground">{h}</Rotulo>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {rs?.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center text-muted-foreground">
                  Nenhuma resposta ainda.
                </td>
              </tr>
            )}
            {rs
              ?.slice()
              .reverse()
              .map((r) => (
                <tr key={r.id} className="align-top">
                  <td className="px-4 py-3">
                    <Numero n={r.etapa} cor={ETAPAS[r.etapa].cor} />
                  </td>
                  <td className="px-4 py-3 font-medium">{r.pergunta}</td>
                  <td className="max-w-md px-4 py-3 text-muted-foreground">
                    <span className="line-clamp-3 whitespace-pre-line">{r.resposta}</span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
