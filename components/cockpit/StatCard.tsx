import * as React from 'react'
import { cn } from '@/lib/utils'

type Tom = 'neutro' | 'positivo' | 'atencao' | 'critico'

const COR_VALOR: Record<Tom, string> = {
  neutro:   'text-foreground',
  positivo: 'text-[var(--color-green)]',
  atencao:  'text-[var(--color-gold)]',
  critico:  'text-[var(--color-red)]',
}

/**
 * Indicador numérico do topo das telas.
 * Numeral tabular para os valores alinharem quando ficam lado a lado.
 */
export function StatCard({
  rotulo,
  valor,
  apoio,
  tom = 'neutro',
  icone,
  className,
}: {
  rotulo: string
  valor: React.ReactNode
  apoio?: string
  tom?: Tom
  icone?: React.ReactNode
  className?: string
}) {
  return (
    <div
      data-slot="stat-card"
      className={cn(
        'rounded-lg border border-border bg-card p-4 transition-colors',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {rotulo}
        </p>
        {icone && <span className="shrink-0 text-muted-foreground">{icone}</span>}
      </div>
      <p
        className={cn(
          'mt-2 text-2xl font-semibold tabular-nums tracking-tight',
          COR_VALOR[tom],
        )}
      >
        {valor}
      </p>
      {apoio && <p className="mt-1 text-xs text-muted-foreground">{apoio}</p>}
    </div>
  )
}
