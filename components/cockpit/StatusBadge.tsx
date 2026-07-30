import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const statusBadge = cva(
  'inline-flex w-fit shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium',
  {
    variants: {
      tom: {
        neutro:   'bg-secondary text-muted-foreground',
        positivo: 'bg-[color-mix(in_srgb,var(--color-green)_14%,transparent)] text-[var(--color-green)]',
        atencao:  'bg-[color-mix(in_srgb,var(--color-gold)_16%,transparent)] text-[var(--color-gold)]',
        critico:  'bg-[color-mix(in_srgb,var(--color-red)_13%,transparent)] text-[var(--color-red)]',
        info:     'bg-[color-mix(in_srgb,var(--color-blue)_13%,transparent)] text-[var(--color-blue)]',
      },
    },
    defaultVariants: { tom: 'neutro' },
  },
)

export type TomStatus = NonNullable<VariantProps<typeof statusBadge>['tom']>

/**
 * Vocabulário de status do BID num lugar só.
 * Antes cada tela repetia seu próprio mapa de cor e rótulo — o mesmo
 * "atrasado" aparecia em três vermelhos diferentes conforme o arquivo.
 */
const STATUS: Record<string, { label: string; tom: TomStatus }> = {
  // Contratos
  rascunho:               { label: 'Rascunho',            tom: 'neutro'   },
  aguardando_assinatura:  { label: 'Aguardando assinatura', tom: 'atencao' },
  ativo:                  { label: 'Ativo',               tom: 'positivo' },
  encerrado:              { label: 'Encerrado',           tom: 'neutro'   },
  cancelado:              { label: 'Cancelado',           tom: 'critico'  },

  // Parcelas e cobranças
  aberto:                 { label: 'Em aberto',           tom: 'atencao'  },
  pago:                   { label: 'Pago',                tom: 'positivo' },
  atrasado:               { label: 'Atrasado',            tom: 'critico'  },
  isento:                 { label: 'Isento',              tom: 'neutro'   },

  // Repasses
  pendente:               { label: 'Pendente',            tom: 'atencao'  },
  realizado:              { label: 'Realizado',           tom: 'positivo' },

  // Chamados
  aprovado_corretor:      { label: 'Aprovado pelo corretor',     tom: 'info' },
  aprovado_proprietario:  { label: 'Aprovado pelo proprietário', tom: 'info' },
  em_execucao:            { label: 'Em execução',         tom: 'info'     },
  concluido:              { label: 'Concluído',           tom: 'positivo' },
  recusado:               { label: 'Recusado',            tom: 'critico'  },

  // Vistorias
  em_preenchimento:       { label: 'Em preenchimento',    tom: 'atencao'  },
  finalizada:             { label: 'Finalizada',          tom: 'positivo' },
}

export function StatusBadge({
  status,
  label,
  tom,
  className,
}: {
  status?: string
  /** Sobrescreve o rótulo do mapa. */
  label?: string
  /** Sobrescreve o tom do mapa. */
  tom?: TomStatus
  className?: string
}) {
  const conhecido = status ? STATUS[status] : undefined
  const textoFinal = label ?? conhecido?.label ?? status ?? '—'
  const tomFinal = tom ?? conhecido?.tom ?? 'neutro'

  return (
    <span data-slot="status-badge" className={cn(statusBadge({ tom: tomFinal }), className)}>
      {textoFinal}
    </span>
  )
}

export { STATUS as STATUS_MAP }
