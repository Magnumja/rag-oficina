import { useEffect, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight } from 'lucide-react'
import { CountUp } from '@/components/unlumen-ui/count-up'
import { GlowingBadge } from '@/components/unlumen-ui/glowing-badge'
import { TextReveal } from '@/components/unlumen-ui/text-reveal'
import { ThemeSwitch } from '@/components/unlumen-ui/theme-switch'
import { CadeiaCC, Cartao, Fecho, Numero, Pilula, Rotulo, Titulo, botaoSecundarioCls } from '@/components/slide'
import { detectar, type Etapa, type Status } from '@/lib/api'
import { COR, ETAPAS, type Cor } from '@/lib/conteudo'
import { cn } from '@/lib/utils'
import { BotaoDemonstracao, Comparar, EtapaTela, Pesquisa, type Tela } from '@/telas'
import { ProjetoArea, type TelaProjeto } from '@/telasProjeto'

const NAV: { id: Tela; label: string }[] = [
  { id: 'inicio', label: 'Início' },
  { id: 'etapa1', label: 'Etapa 1' },
  { id: 'etapa2', label: 'Etapa 2' },
  { id: 'etapa3', label: 'Etapa 3' },
  { id: 'comparar', label: 'Comparar' },
  { id: 'pesquisa', label: 'Pesquisa' },
  { id: 'projeto-lista', label: 'Projeto' },
]

const TELAS_PROJETO = new Set<Tela>([
  'projeto-lista',
  'projeto-prompt',
  'projeto-conhecimento',
  'projeto-conversar',
  'projeto-comparar',
  'projeto-exportar',
])

const EQUIPE = [
  'Bianca Sabka de Queiroz',
  'Magnum Johanson de Abreu',
  'Roberto Pereira de Freitas Neto',
  'Eduardo Guimarães',
  'Murilo Locatelli',
]

export default function App() {
  const [tela, setTela] = useState<Tela>('inicio')
  const [status, setStatus] = useState<Status | null>(null)

  useEffect(() => {
    detectar().then(setStatus)
  }, [])

  function irPara(t: Tela) {
    setTela(t)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="relative flex min-h-dvh flex-col">
      <div className="bg-giz pointer-events-none absolute inset-x-0 top-0 h-[560px]" aria-hidden />
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
          <button onClick={() => irPara('inicio')} className="flex shrink-0 items-center gap-2" aria-label="Início">
            <Logo />
            <span className="hidden font-titulo text-sm font-extrabold uppercase tracking-tight lg:inline">
              Oficina <span className="text-azul">RAG</span>
            </span>
          </button>
          <nav className="-mx-1 flex flex-1 items-center gap-0.5 overflow-x-auto px-1">
            {NAV.map((n) => {
              const etapa = n.id.startsWith('etapa') ? (Number(n.id.slice(-1)) as Etapa) : null
              const ativo = n.id === 'projeto-lista' ? TELAS_PROJETO.has(tela) : tela === n.id
              return (
                <button
                  key={n.id}
                  onClick={() => irPara(n.id)}
                  className={cn(
                    'relative shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                    ativo ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {ativo && (
                    <motion.span
                      layoutId="nav-pill"
                      className={cn('absolute inset-0 rounded-lg border-[1.5px] bg-card', etapa ? COR[ETAPAS[etapa].cor].borda : 'border-amarelo')}
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.45 }}
                    />
                  )}
                  <span className="relative">{n.label}</span>
                </button>
              )
            })}
          </nav>
          <div className="hidden md:block">
            {status?.modo === 'demo' && (
              <GlowingBadge variant="warning" dot pulse title="Sem servidor: a busca e as respostas são simuladas no navegador">
                Demonstração
              </GlowingBadge>
            )}
            {status?.modo === 'servidor' && (
              <GlowingBadge variant={status.llm ? 'success' : 'warning'} dot pulse>
                {status.llm ? 'IA online' : 'Servidor sem chave'}
              </GlowingBadge>
            )}
          </div>
          <ThemeSwitch />
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-6xl flex-1 px-4 pb-20 pt-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={tela}
            initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
            transition={{ duration: 0.25 }}
          >
            {tela === 'inicio' ? (
              <Inicio irPara={irPara} />
            ) : tela === 'comparar' ? (
              <Comparar />
            ) : tela === 'pesquisa' ? (
              <Pesquisa />
            ) : TELAS_PROJETO.has(tela) ? (
              <ProjetoArea tela={tela as TelaProjeto} irPara={irPara} />
            ) : (
              <EtapaTela key={tela} etapa={Number(tela.slice(-1)) as Etapa} irPara={irPara} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-xs text-muted-foreground">
          <span>{EQUIPE.join(' · ')}</span>
          <CadeiaCC compacta />
        </div>
      </footer>
    </div>
  )
}

/* ---------------- Início: a apresentação em uma página ---------------- */

function Secao({ n, legenda, children }: { n: string; legenda: string; children: ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5 }}
      className="border-t-[1.5px] border-dashed pt-12"
    >
      {children}
      <p className="mt-8 font-mono text-[11px] text-muted-foreground">
        {n} · {legenda}
      </p>
    </motion.section>
  )
}

function Inicio({ irPara }: { irPara: (t: Tela) => void }) {
  return (
    <div className="space-y-16">
      {/* Slides 1 e 2 */}
      <section className="grid gap-10 lg:grid-cols-[1.35fr_1fr] lg:items-end">
        <div>
          <Rotulo className="text-muted-foreground">Pergunta para a turma</Rotulo>
          <h1 className="mt-4 font-titulo text-4xl font-black uppercase leading-[1.02] tracking-tight sm:text-6xl">
            <TextReveal as="span" text="A IA responde com segurança." className="block leading-[1.02]" />
          </h1>
          <TextReveal
            as="p"
            text="Mas e se estiver errada?"
            className="mt-2 font-mao text-5xl font-bold leading-none text-rosa sm:text-7xl"
          />
          <div className="mt-6 flex flex-wrap gap-2">
            <Pilula cor="azul">Parece certo</Pilula>
            <Pilula cor="amarelo">Soa convincente</Pilula>
            <Pilula cor="rosa">Pode estar errado</Pilula>
          </div>
        </div>
        <Cartao className="space-y-4">
          <div>
            <p className="font-titulo text-2xl font-black uppercase leading-none">Inclusão digital</p>
            <p className="mt-1 font-titulo text-lg font-extrabold uppercase text-azul">através do RAG agêntico</p>
            <p className="mt-2 text-sm text-muted-foreground">Inclusão Digital e Profissão em Ciência da Computação</p>
          </div>
          <p className="text-sm text-pretty">
            Nesta plataforma, o estudante faz a <b>mesma pergunta</b> à IA em três cenários e compara as respostas.
          </p>
          <div className="flex flex-wrap items-start gap-3">
            <button onClick={() => irPara('etapa1')} className={botaoSecundarioCls}>
              Começar pela etapa 1 <ArrowRight className="size-4" />
            </button>
            <BotaoDemonstracao aoTerminar={() => irPara('comparar')} />
          </div>
        </Cartao>
      </section>

      {/* Slide 3 */}
      <Secao n="02" legenda="Problematização">
        <Titulo forte="Uso sem" mao="mediação" cor="rosa" />
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Estatistica valor={70} cor="azul" texto="dos estudantes de Ensino Médio já usam IA Generativa em pesquisas escolares" />
          <Estatistica
            valor={32}
            cor="laranja"
            texto="receberam algum tipo de orientação ou mediação escolar para usá-las de forma correta e segura"
          />
        </div>
        <Fecho className="mt-6">abismo entre o uso prático e o domínio crítico</Fecho>
      </Secao>

      {/* Slide 4 */}
      <Secao n="04" legenda="LLM: modelo de linguagem de grande escala">
        <Titulo forte="Como uma LLM" mao="funciona" cor="azul" />
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr]">
          {(
            [
              ['Treino', 'Lê quantidades enormes de texto', 'azul'],
              ['Padrões', 'Aprende como as palavras se combinam', 'amarelo'],
              ['Pergunta', 'Recebe o seu texto como ponto de partida', 'rosa'],
              ['Resposta', 'Escreve palavra por palavra, escolhendo a mais provável', 'verde'],
            ] as [string, string, Cor][]
          ).flatMap(([t, d, c], i) => [
            <Cartao key={t} cor={c} className="p-4">
              <Numero n={i + 1} cor={c} />
              <p className="mt-1 font-bold">{t}</p>
              <p className="mt-1 text-sm text-muted-foreground">{d}</p>
            </Cartao>,
            i < 3 && <ArrowRight key={`s${i}`} className="hidden size-5 self-center text-muted-foreground lg:block" />,
          ])}
        </div>
        <Cartao cor="amarelo" tracejado className="mt-4">
          <Rotulo className="text-amarelo">A ideia central</Rotulo>
          <p className="mt-2 text-pretty">
            Uma LLM gera texto <b className="text-amarelo">plausível</b>. No modo livre, ela trabalha só com a memória do
            treino e não consulta uma base de fatos para conferir o que escreve.
          </p>
        </Cartao>
      </Secao>

      {/* Slide 7 */}
      <Secao n="07" legenda="RAG: Retrieval-Augmented Generation (geração aumentada por recuperação)">
        <Titulo forte="A solução:" mao="RAG" cor="verde" />
        <div className="mt-6 space-y-3">
          <Cartao tracejado className="p-4">
            <Rotulo className="text-muted-foreground">Modo livre (sem RAG)</Rotulo>
            <Linha passos={['Pergunta', 'Modelo responde de memória (o que aprendeu no treino)']} fim={['Pode errar', 'rosa']} />
          </Cartao>
          <Cartao cor="verde" className="p-4">
            <Rotulo className="text-verde">Com RAG</Rotulo>
            <Linha passos={['Pergunta', 'Busca trechos nos documentos escolhidos']} destaque={1} fim={['Responde com base neles', null]} />
          </Cartao>
        </div>
        <Fecho className="mt-6">antes de responder, a IA consulta; os dados passam a ser controlados</Fecho>
      </Secao>

      {/* Slide 10 */}
      <Secao n="10" legenda="Etapas 1 e 2 na primeira tarde; etapa 3 na segunda">
        <Titulo forte="Três etapas," mao="duas tardes" cor="amarelo" />
        <div className="mt-6 grid items-stretch gap-4 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
          {([1, 2, 3] as Etapa[]).flatMap((e) => {
            const info = ETAPAS[e]
            return [
              <motion.button
                key={e}
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                onClick={() => irPara(`etapa${e}` as Tela)}
                className={cn('group flex flex-col rounded-xl border-[1.5px] bg-card p-5 text-left', COR[info.cor].borda)}
              >
                <Pilula cor={info.cor} className="self-start">
                  {info.tarde.toUpperCase()}
                </Pilula>
                <p className="mt-3 font-bold">
                  {info.forte} {info.mao}
                </p>
                {e === 1 && <p className="mt-1 font-mono text-xs text-amarelo">“O que deu de aula ontem?”</p>}
                <p className="mt-2 flex-1 text-sm text-muted-foreground">{info.descricao}</p>
                <p className={cn('mt-3 text-sm font-semibold', COR[info.cor].texto)}>{info.resultado}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold">
                  Abrir etapa <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </motion.button>,
              e < 3 && <ArrowRight key={`s${e}`} className="hidden size-5 self-center text-muted-foreground md:block" />,
            ]
          })}
        </div>
        <Fecho className="mt-6">mesma pergunta, três cenários: o aluno compara e conclui</Fecho>
      </Secao>

      {/* Slide 12 */}
      <Secao n="12" legenda="RAG como módulo de backend da plataforma">
        <Titulo forte="Por dentro" mao="da plataforma" cor="rosa" />
        <div className="mt-6 flex flex-wrap gap-2">
          <Etiqueta cor="azul">RAG como módulo de backend da própria plataforma</Etiqueta>
          <Etiqueta cor="amarelo">Python (FastAPI)</Etiqueta>
          <Etiqueta cor="verde">Banco vetorial simples: Chroma ou FAISS</Etiqueta>
          <Etiqueta cor="laranja">React + unlumen UI</Etiqueta>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {(
            [
              ['O aluno gera o JSON na plataforma, ou cola o que o GPT devolveu.', 'azul'],
              ['A plataforma envia o JSON ao backend, que divide em trechos, gera os embeddings e guarda numa coleção própria daquele aluno.', 'amarelo'],
              ['Cada pergunta busca os trechos relevantes e chama uma API de LLM (Claude, OpenAI ou Gemini) com esse contexto.', 'rosa'],
              ['A resposta volta para a tela e é salva no banco junto com a pergunta, a etapa e o aluno.', 'verde'],
            ] as [string, Cor][]
          ).map(([t, c], i) => (
            <Cartao key={i} cor={c} className="flex gap-3 p-4">
              <Numero n={i + 1} cor={c} />
              <p className="text-sm">{t}</p>
            </Cartao>
          ))}
        </div>
        <p className="mt-4 text-sm font-semibold text-amarelo">
          A tela de comparação só cruza as respostas salvas das três etapas para a mesma pergunta.
        </p>
      </Secao>

      {/* Slide 15 */}
      <Secao n="15" legenda="Do problema ao impacto: o caminho de quem faz Ciência da Computação">
        <Titulo forte="Quem entende a IA" mao="constrói uma IA melhor" cor="amarelo" quebra />
        <p className="mt-4 max-w-3xl text-muted-foreground">
          A alucinação é um problema de Computação, e tem solução. Cada etapa do fluxo é trabalho de quem faz Ciência da
          Computação:
        </p>
        <div className="mt-6">
          <CadeiaCC />
        </div>
        <Cartao cor="amarelo" className="mt-6">
          <p className="font-bold">Você não precisa ser só quem usa a IA. Pode ser quem reescreve o código para ela acertar.</p>
        </Cartao>
        <div className="mt-6">
          <button onClick={() => irPara('etapa1')} className={botaoSecundarioCls}>
            Começar a oficina <ArrowRight className="size-4" />
          </button>
        </div>
      </Secao>
    </div>
  )
}

function Estatistica({ valor, cor, texto }: { valor: number; cor: Cor; texto: string }) {
  return (
    <Cartao cor={cor} className="p-6">
      <p className={cn('font-titulo text-6xl font-black tabular-nums sm:text-7xl', COR[cor].texto)}>
        <CountUp to={valor} />%
      </p>
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        className={cn('mt-3 h-1.5 origin-left rounded-full', COR[cor].fundo)}
        style={{ width: `${valor}%` }}
      />
      <p className="mt-4 text-sm text-muted-foreground">{texto}</p>
    </Cartao>
  )
}

function Linha({ passos, destaque, fim }: { passos: string[]; destaque?: number; fim: [string, Cor | null] }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
      {passos.map((p, i) => (
        <span key={p} className="flex items-center gap-2">
          <span
            className={cn(
              'rounded-md border-[1.5px] px-2.5 py-1',
              destaque === i && 'border-azul bg-azul font-semibold text-background',
            )}
          >
            {p}
          </span>
          <ArrowRight className="size-4 text-muted-foreground" />
        </span>
      ))}
      {fim[1] ? <Pilula cor={fim[1]}>{fim[0]}</Pilula> : <span className="rounded-md border-[1.5px] px-2.5 py-1">{fim[0]}</span>}
    </div>
  )
}

function Etiqueta({ cor, children }: { cor: Cor; children: ReactNode }) {
  return (
    <span className={cn('rounded-md border-[1.5px] px-3 py-1.5 text-xs font-semibold', COR[cor].borda)}>{children}</span>
  )
}

function Logo() {
  return (
    <span className="flex size-8 items-center justify-center rounded-lg border-[1.5px] border-amarelo bg-card font-mono text-sm font-bold text-amarelo">
      {'{}'}
    </span>
  )
}
