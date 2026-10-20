/**
 * Primitivos visuais da identidade "Pantanal" (ver DESIGN.md), usados só pela aba
 * Projeto. Independentes de `components/slide.tsx`/`lib/conteudo.ts` — nenhum tipo
 * ou classe daqui entra na Início ou nas Etapas da Oficina RAG.
 */
import type { ReactNode } from 'react'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Cartao({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        'rounded-[var(--pantanal-raio)] border-[length:var(--pantanal-borda)] border-[var(--cor-primaria)]/25 bg-[color-mix(in_oklab,var(--cor-fundo),white_35%)] p-5',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function BotaoPrimario({ className, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        'inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-[var(--pantanal-raio)] bg-[var(--cor-primaria)] px-4 text-sm font-semibold text-[var(--cor-fundo)] transition-opacity hover:opacity-90 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40',
        className,
      )}
    >
      {children}
    </button>
  )
}

export const botaoSecundarioPantanalCls =
  'inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-[var(--pantanal-raio)] border-[length:var(--pantanal-borda)] border-[var(--cor-primaria)]/40 bg-transparent px-4 text-sm font-semibold text-[var(--cor-primaria)] transition-colors hover:bg-[var(--cor-primaria)]/8 disabled:pointer-events-none disabled:opacity-40'

/** Aviso com ícone — nunca só cor, nunca `--cor-alerta` fora de um erro real. */
export function Aviso({ tom, className, children }: { tom: 'ok' | 'erro'; className?: string; children: ReactNode }) {
  const Icone = tom === 'ok' ? CheckCircle2 : AlertTriangle
  const cor = tom === 'ok' ? 'var(--cor-prompt)' : 'var(--cor-alerta)'
  return (
    <div
      role={tom === 'erro' ? 'alert' : 'status'}
      className={cn('flex items-start gap-2.5 rounded-[var(--pantanal-raio)] border-[length:var(--pantanal-borda)] px-4 py-3 text-sm', className)}
      style={{ borderColor: cor, color: cor, background: `color-mix(in oklab, ${cor}, transparent 90%)` }}
    >
      <Icone className="mt-0.5 size-4 shrink-0" />
      <div className="text-[var(--cor-texto)]">{children}</div>
    </div>
  )
}

/** Ficha catalográfica: documento + página + trecho grifado — o componente de
 * citação do Projeto (nunca uma barra de "fonte" genérica). */
export function FichaCatalografica({
  documento,
  pagina,
  similaridade,
  texto,
  indice,
}: {
  documento: string
  pagina: number
  similaridade: number
  texto: string
  indice: number
}) {
  return (
    <div className="rounded-[var(--pantanal-raio)] border-[length:var(--pantanal-borda)] border-[var(--cor-conhecimento)]/50 bg-[var(--cor-conhecimento)]/10 p-3">
      <div className="font-maquina flex flex-wrap items-baseline justify-between gap-2 text-[11px] text-[var(--cor-primaria)]/70">
        <span>
          [{indice}] {documento} · p.{pagina}
        </span>
        <ReguaSimilaridade valor={similaridade} />
      </div>
      <p className="mt-2 text-sm leading-relaxed text-[var(--cor-texto)]">{texto}</p>
    </div>
  )
}

/** Régua graduada (não progress bar): cada traço é um degrau de 0.1 de similaridade. */
export function ReguaSimilaridade({ valor }: { valor: number }) {
  const passos = 10
  const preenchidos = Math.round(valor * passos)
  return (
    <span className="inline-flex items-center gap-1.5" title={`similaridade ${valor.toFixed(3)}`}>
      <span className="font-maquina">{valor.toFixed(2)}</span>
      <span className="flex items-end gap-px">
        {Array.from({ length: passos }, (_, i) => (
          <span
            key={i}
            className="w-[2.5px] rounded-[1px]"
            style={{
              height: 3 + i,
              background: i < preenchidos ? 'var(--cor-conhecimento)' : 'var(--cor-primaria)',
              opacity: i < preenchidos ? 1 : 0.15,
            }}
          />
        ))}
      </span>
    </span>
  )
}

/** Label + textarea para um dos 5 campos do prompt. */
export function CampoPrompt({
  rotulo,
  dica,
  valor,
  onChange,
  placeholder,
}: {
  rotulo: string
  dica: string
  valor: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-[var(--cor-primaria)]">{rotulo}</span>
      <span className="mt-0.5 block text-xs text-[var(--cor-texto)]/60">{dica}</span>
      <textarea
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        maxLength={2000}
        className="font-maquina mt-2 w-full resize-none rounded-[var(--pantanal-raio)] border-[length:var(--pantanal-borda)] border-[var(--cor-prompt)]/40 bg-white/60 p-3 text-sm text-[var(--cor-texto)] outline-none placeholder:text-[var(--cor-texto)]/35 focus:border-[var(--cor-prompt)]"
      />
    </label>
  )
}
