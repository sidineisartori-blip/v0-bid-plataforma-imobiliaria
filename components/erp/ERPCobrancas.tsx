'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { calcVencimento, formatarMes, mesAnterior, mesSeguinte, mesAtual, fmtBRLFull } from '@/lib/vencimento'
import { cn } from '@/lib/utils'
import ModalConfirm from '@/components/ui/ModalConfirm'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/cockpit/StatCard'
import { StatusBadge } from '@/components/cockpit/StatusBadge'

export interface Cobranca {
  id: string
  contrato_id: string
  corretor_id: string
  competencia: string      // YYYY-MM-DD (primeiro dia do mês)
  valor: number
  status: 'aberto' | 'pago' | 'atrasado' | 'isento'
  data_vencimento: string | null
  data_pagamento: string | null
  observacao: string | null
  created_at: string
  contrato?: {
    cliente_nome: string
    tipo: string
    valor_aluguel: number | null
    imovel?: { titulo: string; cidade: string } | null
  } | null
}

interface Props {
  cobrancas: Cobranca[]
  corretorId: string
  mesInicial: string
}

export default function ERPCobrancas({ cobrancas, corretorId, mesInicial }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [mes, setMes] = useState(mesInicial)
  const [liquidandoId, setLiquidandoId] = useState<string | null>(null)
  const [confirmarLiquidar, setConfirmarLiquidar] = useState<string | null>(null)

  const filtradas = useMemo(
    () => cobrancas.filter((c) => c.competencia.startsWith(mes)),
    [cobrancas, mes]
  )

  const kpis = useMemo(() => {
    const pagas    = filtradas.filter((c: Cobranca) => c.status === 'pago')
    const abertas  = filtradas.filter((c: Cobranca) => c.status === 'aberto')
    const atrasadas= filtradas.filter((c: Cobranca) => c.status === 'atrasado')
    return {
      totalPago:      pagas.reduce((s: number, c: Cobranca) => s + c.valor, 0),
      qtdPagas:       pagas.length,
      totalAReceber:  abertas.reduce((s: number, c: Cobranca) => s + c.valor, 0) + atrasadas.reduce((s: number, c: Cobranca) => s + c.valor, 0),
      qtdAReceber:    abertas.length + atrasadas.length,
      totalAtrasado:  atrasadas.reduce((s: number, c: Cobranca) => s + c.valor, 0),
      qtdAtrasadas:   atrasadas.length,
    }
  }, [filtradas])

  async function executarLiquidar(id: string) {
    setLiquidandoId(id)
    await supabase
      .from('contrato_parcelas')
      .update({ status: 'pago', data_pagamento: new Date().toISOString().split('T')[0] })
      .eq('id', id)
      .eq('corretor_id', corretorId)
    setLiquidandoId(null)
    setConfirmarLiquidar(null)
    router.refresh()
  }

  function plural(n: number) {
    return n === 1 ? '1 cobrança' : `${n} cobranças`
  }

  return (
    <div className="mt-5">
      {confirmarLiquidar && (
        <ModalConfirm
          titulo="Confirmar recebimento?"
          descricao="Esta ação marcará a cobrança como paga e registrará a data de pagamento de hoje."
          tipo="aviso"
          labelConfirmar="Confirmar recebimento"
          onConfirmar={() => executarLiquidar(confirmarLiquidar)}
          onCancelar={() => setConfirmarLiquidar(null)}
          carregando={liquidandoId === confirmarLiquidar}
        />
      )}

      {/* Navegação temporal */}
      <div className="mb-5 flex items-center gap-3">
        <Button variant="outline" size="icon-sm" aria-label="Mês anterior" onClick={() => setMes(mesAnterior(mes))}>
          <ChevronLeft />
        </Button>
        <span className="min-w-[130px] text-center text-[15px] font-semibold capitalize text-foreground">
          {formatarMes(mes)}
        </span>
        <Button variant="outline" size="icon-sm" aria-label="Mês seguinte" onClick={() => setMes(mesSeguinte(mes))}>
          <ChevronRight />
        </Button>
        {mes !== mesAtual() && (
          <Button variant="link" size="sm" onClick={() => setMes(mesAtual())}>
            Mês atual
          </Button>
        )}
      </div>

      {/* KPIs */}
      <div className="mb-5 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
        <StatCard rotulo="Recebido no mês" valor={fmtBRLFull(kpis.totalPago)}    apoio={plural(kpis.qtdPagas)}     tom="positivo" />
        <StatCard rotulo="A receber"       valor={fmtBRLFull(kpis.totalAReceber)} apoio={plural(kpis.qtdAReceber)}  tom="atencao" />
        <StatCard rotulo="Em atraso"       valor={fmtBRLFull(kpis.totalAtrasado)} apoio={plural(kpis.qtdAtrasadas)} tom={kpis.qtdAtrasadas > 0 ? 'critico' : 'neutro'} />
      </div>

      {filtradas.length === 0 ? (
        <div className="rounded-lg border border-border bg-card px-5 py-14 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhuma cobrança em <span className="capitalize">{formatarMes(mes)}</span>.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border bg-secondary px-4 py-2">
            <span className="text-xs text-muted-foreground">
              {plural(filtradas.length)} · {filtradas.filter((c: Cobranca) => c.contrato?.imovel).length} imóveis
            </span>
            <span className="text-xs text-muted-foreground">
              Total:{' '}
              <span className="font-semibold tabular-nums text-primary">
                {fmtBRLFull(filtradas.reduce((s: number, c: Cobranca) => s + c.valor, 0))}
              </span>
            </span>
          </div>

          {filtradas.map((c: Cobranca, i: number) => {
            const venc = calcVencimento(c.data_vencimento)
            const faixa =
              c.status === 'atrasado' ? 'border-l-destructive'
              : c.status === 'pago'   ? 'border-l-[var(--color-green)]'
              : 'border-l-transparent'

            return (
              <div
                key={c.id}
                className={cn(
                  'grid grid-cols-[1fr_auto] items-center gap-3 border-l-[3px] px-4 py-3',
                  i < filtradas.length - 1 && 'border-b border-b-border',
                  faixa,
                )}
              >
                <div className="min-w-0">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      {c.contrato?.cliente_nome || '—'}
                    </span>
                    <StatusBadge status={c.status} />
                    {c.status !== 'pago' && c.data_vencimento && (
                      <StatusBadge
                        label={venc.label}
                        tom={venc.status.startsWith('atrasado') ? 'critico' : 'atencao'}
                      />
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {c.contrato?.imovel && (
                      <span>{c.contrato.imovel.titulo} · {c.contrato.imovel.cidade}</span>
                    )}
                    <span className="font-semibold tabular-nums text-primary">{fmtBRLFull(c.valor)}</span>
                    {c.data_pagamento && (
                      <span className="tabular-nums text-[var(--color-green)]">
                        Pago em {new Date(c.data_pagamento + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                </div>

                {c.status !== 'pago' && c.status !== 'isento' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirmarLiquidar(c.id)}
                    disabled={liquidandoId === c.id}
                    className="whitespace-nowrap border-[var(--color-green)]/30 text-[var(--color-green)] hover:bg-[var(--color-green)]/10 hover:text-[var(--color-green)]"
                  >
                    {liquidandoId === c.id ? '…' : 'Liquidar'}
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
