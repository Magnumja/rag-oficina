import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import {
  AppWindow,
  ArrowRight,
  Code2,
  Database,
  Lightbulb,
  MessageCircleQuestion,
  MessageSquareText,
  Sparkles,
  Users,
} from 'lucide-react'
import type { Etapa } from '@/lib/api'
import { COR, type Cor } from '@/lib/conteudo'
import { cn } from '@/lib/utils'

/** Título no estilo dos slides: caixa alta + destaque escrito à mão. */
export function Titulo({
  forte,
  mao,
  cor = 'amarelo',
  quebra,
  as: Tag = 'h2',
  className,
}: {
  forte: string
  mao?: string
  cor?: Cor
  quebra?: boolean
  as?: 'h1' | 'h2' | 'h3'
  className?: string
}) {
  return (
    <Tag className={cn('font-titulo text-3xl font-extrabold uppercase leading-[1.05] tracking-tight sm:text-4xl', className)}>
      {forte}
      {mao && (
        <>
          {quebra ? <br /> : ' '}
          <span className={cn('font-mao text-[1.3em] font-bold normal-case tracking-normal', COR[cor].texto)}>
            {mao}
          </span>
        </>
      )}
    </Tag>
  )
}

/** Frase manuscrita que fecha cada slide. */
export function Fecho({ children, cor = 'amarelo', className }: { children: ReactNode; cor?: Cor; className?: string }) {
  return <p className={cn('font-mao text-2xl font-bold leading-tight', COR[cor].texto, className)}>{children}</p>
}

export function Rotulo({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn('font-mono text-[11px] font-semibold uppercase tracking-[0.14em]', className)}>{children}</span>
  )
}

export function Cartao({
  cor,
  tracejado,
  className,
  children,
}: {
  cor?: Cor
  tracejado?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        'rounded-xl border-[1.5px] bg-card p-5',
        cor ? COR[cor].borda : 'border-border',
        tracejado && 'border-dashed',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function Pilula({ cor, children, className }: { cor: Cor; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold text-background',
        COR[cor].fundo,
        className,
      )}
    >
      {children}
    </span>
  )
}

export function Numero({ n, cor }: { n: number; cor: Cor }) {
  return <span className={cn('font-mao text-3xl font-bold leading-none', COR[cor].texto)}>{n}</span>
}

export function BotaoPrimario({ className, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        'inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-amarelo px-4 text-sm font-bold text-background transition-all hover:brightness-105 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40',
        className,
      )}
    >
      {children}
    </button>
  )
}

export const botaoSecundarioCls =
  'inline-flex items-center gap-2 rounded-lg border-[1.5px] bg-card px-4 py-2 text-sm font-semibold transition-colors hover:bg-accent'

export function Aviso({ tom, className, children }: { tom: 'ok' | 'erro'; className?: string; children: ReactNode }) {
  return (
    <div
      role={tom === 'erro' ? 'alert' : 'status'}
      className={cn(
        'rounded-lg border-[1.5px] px-4 py-3 text-sm',
        tom === 'ok' ? 'border-verde bg-verde/10' : 'border-rosa bg-rosa/10',
        className,
      )}
    >
      {children}
    </div>
  )
}

/* ---------- Diagrama do fluxo (slides 7 e 12) ---------- */

/** fase: 0 parado, 1 pergunta, 2 busca, 3 modelo, 4 resposta pronta */
export function FluxoRag({ etapa, fase, trechos }: { etapa: Etapa; fase: number; trechos?: number }) {
  const semRag = etapa === 1
  const cor: Cor = etapa === 1 ? 'azul' : etapa === 2 ? 'rosa' : 'verde'
  const nos = [
    { icone: MessageCircleQuestion, titulo: 'Pergunta', sub: 'o aluno escreve', desligado: false },
    semRag
      ? { icone: Database, titulo: 'Sem consulta', sub: 'nenhum dado é buscado', desligado: true }
      : {
          icone: Database,
          titulo: 'Busca trechos',
          sub: trechos ? `${trechos} trechos no banco vetorial` : 'no banco vetorial (Chroma)',
          desligado: false,
        },
    { icone: Sparkles, titulo: 'Modelo (LLM)', sub: semRag ? 'responde de memória' : 'responde com base neles', desligado: false },
    { icone: MessageSquareText, titulo: 'Resposta', sub: 'salva para comparar', desligado: false },
  ]

  return (
    <div className="grid grid-cols-2 gap-2 sm:flex sm:items-stretch sm:gap-0">
      {nos.map((n, i) => {
        const passo = i + 1
        const ativo = fase === passo
        const feito = fase > passo
        const Icone = n.icone
        return (
          <div key={n.titulo} className="flex items-stretch sm:flex-1">
            <motion.div
              animate={ativo && !n.desligado && fase < 4 ? { scale: [1, 1.04, 1] } : { scale: 1 }}
              transition={ativo && fase < 4 ? { repeat: Infinity, duration: 1.2 } : { duration: 0.2 }}
              className={cn(
                'relative flex-1 rounded-xl border-[1.5px] bg-card p-3 transition-colors duration-300',
                n.desligado
                  ? 'border-dashed text-muted-foreground'
                  : ativo || feito
                    ? cn(COR[cor].borda, ativo && COR[cor].suave)
                    : 'border-border',
              )}
            >
              <div className="flex items-center gap-2">
                <Icone
                  className={cn(
                    'size-4 shrink-0',
                    n.desligado ? '' : ativo || feito ? COR[cor].texto : 'text-muted-foreground',
                  )}
                />
                <span className={cn('text-sm font-bold', n.desligado && 'line-through decoration-rosa decoration-2')}>
                  {n.titulo}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{n.sub}</p>
            </motion.div>
            {i < nos.length - 1 && (
              <ArrowRight
                className={cn(
                  'mx-1.5 hidden size-4 shrink-0 self-center transition-colors sm:block',
                  feito ? COR[cor].texto : 'text-muted-foreground/50',
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ---------- Cadeia do rodapé dos slides (slide 15) ---------- */

const CADEIA: { icone: typeof Lightbulb; nome: string; cor: Cor; texto: string }[] = [
  { icone: Lightbulb, nome: 'Problema', cor: 'amarelo', texto: 'Identificar uma falha real, como a alucinação' },
  { icone: Database, nome: 'Dados', cor: 'azul', texto: 'Escolher e cuidar das fontes que a IA consulta' },
  { icone: Code2, nome: 'Algoritmo', cor: 'rosa', texto: 'Escrever e reformular o código que guia a IA' },
  { icone: AppWindow, nome: 'Interface', cor: 'laranja', texto: 'Criar a ferramenta que as pessoas usam' },
  { icone: Users, nome: 'Impacto', cor: 'verde', texto: 'Avaliar confiabilidade, privacidade e ética' },
]

export function CadeiaCC({ compacta }: { compacta?: boolean }) {
  if (compacta) {
    return (
      <div className="flex items-center gap-1" aria-label="Problema, Dados, Algoritmo, Interface, Impacto">
        {CADEIA.map((c, i) => (
          <span key={c.nome} className="flex items-center gap-1">
            <span className={cn('flex size-6 items-center justify-center rounded-full border-[1.5px]', COR[c.cor].borda)}>
              <c.icone className={cn('size-3', COR[c.cor].texto)} />
            </span>
            {i < CADEIA.length - 1 && <span className="text-xs text-muted-foreground">→</span>}
          </span>
        ))}
      </div>
    )
  }
  return (
    <ol className="grid gap-5 sm:grid-cols-5">
      {CADEIA.map((c) => (
        <li key={c.nome}>
          <c.icone className={cn('size-5', COR[c.cor].texto)} />
          <p className={cn('mt-2 font-titulo text-sm font-extrabold uppercase', COR[c.cor].texto)}>{c.nome}</p>
          <p className="mt-1 text-sm text-muted-foreground">{c.texto}</p>
        </li>
      ))}
    </ol>
  )
}
