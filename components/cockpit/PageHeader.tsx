import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Cabeçalho padrão das telas do cockpit.
 * Mantém título, descrição e ações no mesmo eixo em todas as páginas —
 * é o que faz ERP, CRM e Relatórios parecerem o mesmo produto.
 */
export function PageHeader({
  titulo,
  descricao,
  acoes,
  className,
}: {
  titulo: string
  descricao?: string
  acoes?: React.ReactNode
  className?: string
}) {
  return (
    <div
      data-slot="page-header"
      className={cn(
        'flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5',
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
          {titulo}
        </h1>
        {descricao && (
          <p className="max-w-prose text-sm text-muted-foreground text-pretty">
            {descricao}
          </p>
        )}
      </div>
      {acoes && <div className="flex shrink-0 flex-wrap items-center gap-2">{acoes}</div>}
    </div>
  )
}
