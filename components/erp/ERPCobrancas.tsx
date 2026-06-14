'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { calcVencimento, formatarMes, mesAnterior, mesSeguinte, mesAtual, fmtBRLFull } from '@/lib/vencimento'
import ModalConfirm from '@/components/ui/ModalConfirm'

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

const STATUS_MAP = {
  aberto:   { label: 'Em aberto',  cor: '#C9A84C', bg: 'rgba(201,168,76,0.12)' },
  pago:     { label: 'Pago',       cor: '#5CB88A', bg: 'rgba(92,184,138,0.12)' },
  atrasado: { label: 'Atrasado',   cor: '#E05C5C', bg: 'rgba(224,92,92,0.12)'  },
  isento:   { label: 'Isento',     cor: '#9B9690', bg: 'rgba(155,150,144,0.12)'},
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

  const S = { color: 'var(--color-text, #F0EDE6)' } as React.CSSProperties

  return (
    <div style={{ ...S }}>
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => setMes(mesAnterior(mes))} style={{ background: '#232324', border: '1px solid #2E2E30', borderRadius: 2, padding: '6px 14px', fontSize: 13, color: '#9B9690', cursor: 'pointer' }}>← Anterior</button>
        <span style={{ fontSize: 15, fontWeight: 600, color: '#F0EDE6', minWidth: 100, textAlign: 'center' }}>{formatarMes(mes)}</span>
        <button onClick={() => setMes(mesSeguinte(mes))} style={{ background: '#232324', border: '1px solid #2E2E30', borderRadius: 2, padding: '6px 14px', fontSize: 13, color: '#9B9690', cursor: 'pointer' }}>Seguinte →</button>
        {mes !== mesAtual() && (
          <button onClick={() => setMes(mesAtual())} style={{ background: 'none', border: 'none', fontSize: 12, color: '#C9A84C', cursor: 'pointer' }}>Mês atual</button>
        )}
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Recebido no mês', val: fmtBRLFull(kpis.totalPago),     sub: `${kpis.qtdPagas} cobranças`,     cor: '#5CB88A' },
          { label: 'A receber',       val: fmtBRLFull(kpis.totalAReceber),  sub: `${kpis.qtdAReceber} cobranças`,  cor: '#C9A84C' },
          { label: 'Em atraso',       val: fmtBRLFull(kpis.totalAtrasado),  sub: `${kpis.qtdAtrasadas} cobranças`, cor: '#E05C5C' },
        ].map((k) => (
          <div key={k.label} style={{ background: '#181819', border: '1px solid rgba(201,168,76,0.1)', borderRadius: 2, padding: '14px 18px' }}>
            <p style={{ fontSize: 11, color: '#9B9690', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k.label}</p>
            <p style={{ fontSize: 20, fontWeight: 700, color: k.cor, marginBottom: 2 }}>{k.val}</p>
            <p style={{ fontSize: 12, color: '#9B9690' }}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Lista */}
      {filtradas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#9B9690', fontSize: 14 }}>
          Nenhuma cobrança em {formatarMes(mes)}.
        </div>
      ) : (
        <div style={{ background: '#181819', border: '1px solid rgba(201,168,76,0.1)', borderRadius: 2 }}>
          {/* Footer totalizador */}
          <div style={{ padding: '8px 18px', borderBottom: '1px solid #232324', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: '#9B9690' }}>
              {filtradas.length} cobranças · {filtradas.filter((c: Cobranca) => c.contrato?.imovel).length} imóveis
            </span>
            <span style={{ fontSize: 11, color: '#9B9690' }}>
              Total: <span style={{ color: '#C9A84C', fontWeight: 600 }}>{fmtBRLFull(filtradas.reduce((s: number, c: Cobranca) => s + c.valor, 0))}</span>
            </span>
          </div>
          {filtradas.map((c: Cobranca, i: number) => {
            const sm = STATUS_MAP[c.status as keyof typeof STATUS_MAP]
            const venc = calcVencimento(c.data_vencimento)
            return (
              <div
                key={c.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: 12,
                  padding: '13px 18px',
                  borderBottom: i < filtradas.length - 1 ? '1px solid #232324' : 'none',
                  borderLeft: c.status === 'atrasado' ? '3px solid #E05C5C' : c.status === 'pago' ? '3px solid #5CB88A' : '3px solid transparent',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 3, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#F0EDE6' }}>
                      {c.contrato?.cliente_nome || '—'}
                    </span>
                    <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 2, background: sm.bg, color: sm.cor, fontWeight: 600 }}>
                      {sm.label}
                    </span>
                    {c.status !== 'pago' && c.data_vencimento && (
                      <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 2, background: venc.bgCor, color: venc.cor, fontWeight: 600 }}>
                        {venc.label}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {c.contrato?.imovel && (
                      <span style={{ fontSize: 12, color: '#9B9690' }}>{c.contrato.imovel.titulo} · {c.contrato.imovel.cidade}</span>
                    )}
                    <span style={{ fontSize: 12, color: '#C9A84C', fontWeight: 600 }}>{fmtBRLFull(c.valor)}</span>
                    {c.data_pagamento && (
                      <span style={{ fontSize: 12, color: '#5CB88A' }}>Pago em {new Date(c.data_pagamento + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                    )}
                  </div>
                </div>
                {c.status !== 'pago' && c.status !== 'isento' && (
                  <button
                    onClick={() => setConfirmarLiquidar(c.id)}
                    disabled={liquidandoId === c.id}
                    style={{ background: 'rgba(92,184,138,0.1)', border: '1px solid rgba(92,184,138,0.25)', borderRadius: 2, padding: '6px 14px', fontSize: 12, color: '#5CB88A', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    {liquidandoId === c.id ? '...' : 'Liquidar'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
