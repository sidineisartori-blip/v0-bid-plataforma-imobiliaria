'use client'

import * as React from 'react'
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export type Coluna<T> = {
  chave: string
  cabecalho: string
  celula: (linha: T) => React.ReactNode
  /** Fornecer para tornar a coluna ordenável. */
  ordenarPor?: (linha: T) => string | number | null | undefined
  /** Alinha à direita e liga numeral tabular — use em dinheiro e contagem. */
  numerico?: boolean
  larguraClasse?: string
}

type Direcao = 'asc' | 'desc'

/**
 * Tabela padrão do cockpit.
 *
 * Ordenação client-side, cabeçalho fixo na rolagem, numeral tabular nas
 * colunas numéricas e estado vazio embutido — as quatro coisas que cada
 * tela vinha reimplementando à mão.
 */
export function DataTable<T>({
  dados,
  colunas,
  chaveLinha,
  aoClicarLinha,
  vazio,
  ordemInicial,
  className,
}: {
  dados: T[]
  colunas: Coluna<T>[]
  chaveLinha: (linha: T) => string
  aoClicarLinha?: (linha: T) => void
  vazio?: React.ReactNode
  ordemInicial?: { chave: string; direcao: Direcao }
  className?: string
}) {
  const [ordem, setOrdem] = React.useState<{ chave: string; direcao: Direcao } | null>(
    ordemInicial ?? null,
  )

  const ordenados = React.useMemo(() => {
    if (!ordem) return dados
    const coluna = colunas.find((c) => c.chave === ordem.chave)
    if (!coluna?.ordenarPor) return dados

    const fator = ordem.direcao === 'asc' ? 1 : -1
    return [...dados].sort((a, b) => {
      const va = coluna.ordenarPor!(a)
      const vb = coluna.ordenarPor!(b)
      // Nulos sempre ao fim, independente da direção.
      if (va == null && vb == null) return 0
      if (va == null) return 1
      if (vb == null) return -1
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * fator
      return String(va).localeCompare(String(vb), 'pt-BR') * fator
    })
  }, [dados, colunas, ordem])

  function alternar(chave: string) {
    setOrdem((atual) =>
      atual?.chave === chave
        ? { chave, direcao: atual.direcao === 'asc' ? 'desc' : 'asc' }
        : { chave, direcao: 'asc' },
    )
  }

  if (dados.length === 0 && vazio) {
    return (
      <div className={cn('rounded-lg border border-border bg-card', className)}>
        {vazio}
      </div>
    )
  }

  return (
    <div className={cn('overflow-x-auto rounded-lg border border-border bg-card', className)}>
      <table className="w-full border-collapse text-sm">
        <thead className="sticky top-0 z-10 bg-secondary">
          <tr>
            {colunas.map((c) => {
              const ativo = ordem?.chave === c.chave
              const ordenavel = Boolean(c.ordenarPor)
              return (
                <th
                  key={c.chave}
                  scope="col"
                  aria-sort={ativo ? (ordem!.direcao === 'asc' ? 'ascending' : 'descending') : undefined}
                  className={cn(
                    'border-b border-border px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground',
                    c.numerico ? 'text-right' : 'text-left',
                    c.larguraClasse,
                  )}
                >
                  {ordenavel ? (
                    <button
                      type="button"
                      onClick={() => alternar(c.chave)}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded transition-colors hover:text-foreground',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                        ativo && 'text-foreground',
                        c.numerico && 'flex-row-reverse',
                      )}
                    >
                      {c.cabecalho}
                      {ativo ? (
                        ordem!.direcao === 'asc'
                          ? <ArrowUp className="size-3" />
                          : <ArrowDown className="size-3" />
                      ) : (
                        <ChevronsUpDown className="size-3 opacity-40" />
                      )}
                    </button>
                  ) : (
                    c.cabecalho
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {ordenados.map((linha) => (
            <tr
              key={chaveLinha(linha)}
              onClick={aoClicarLinha ? () => aoClicarLinha(linha) : undefined}
              className={cn(
                'border-b border-border/60 last:border-b-0',
                aoClicarLinha && 'cursor-pointer transition-colors hover:bg-accent',
              )}
            >
              {colunas.map((c) => (
                <td
                  key={c.chave}
                  className={cn(
                    'px-4 py-3 align-middle text-foreground',
                    c.numerico && 'text-right tabular-nums',
                  )}
                >
                  {c.celula(linha)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Estado vazio para passar em `vazio`. */
export function TabelaVazia({
  titulo,
  descricao,
  acao,
}: {
  titulo: string
  descricao?: string
  acao?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
      <p className="text-sm font-medium text-foreground">{titulo}</p>
      {descricao && (
        <p className="max-w-sm text-sm text-muted-foreground text-pretty">{descricao}</p>
      )}
      {acao && <div className="mt-2">{acao}</div>}
    </div>
  )
}
