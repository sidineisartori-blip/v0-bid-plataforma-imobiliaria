'use client'

import { useState, useMemo } from 'react'
import { formatarMes, mesAnterior, mesSeguinte, mesAtual, fmtBRLFull } from '@/lib/vencimento'

export interface MovimentacaoExtrato {
  id: string
  data: string
  tipo: 'entrada' | 'saida'
  descricao: string
  valor: number
  origem: 'cobranca' | 'repasse' | 'despesa' | 'outro'
  referencia?: string
}

interface Props {
  movimentacoes: MovimentacaoExtrato[]
  saldoAnterior: number
  mesInicial: string
}

export default function ERPExtrato({ movimentacoes, saldoAnterior, mesInicial }: Props) {
  const [mes, setMes] = useState(mesInicial)

  const filtradas = useMemo(
    () => movimentacoes
      .filter((m) => m.data.startsWith(mes))
      .sort((a, b) => a.data.localeCompare(b.data)),
    [movimentacoes, mes]
  )

  // Calcular saldo corrente linha a linha
  const linhas = useMemo(() => {
    let saldo = saldoAnterior
    return filtradas.map((m: MovimentacaoExtrato) => {
      saldo += m.tipo === 'entrada' ? m.valor : -m.valor
      return { ...m, saldoCorrente: saldo }
    })
  }, [filtradas, saldoAnterior])

  type LinhaExtrato = MovimentacaoExtrato & { saldoCorrente: number }

  // Agrupar por data
  const porData = useMemo(() => {
    const grupos: Record<string, LinhaExtrato[]> = {}
    for (const l of linhas) {
      if (!grupos[l.data]) grupos[l.data] = []
      grupos[l.data].push(l)
    }
    return grupos
  }, [linhas])

  const totalEntradas = filtradas.filter((m: MovimentacaoExtrato) => m.tipo === 'entrada').reduce((s: number, m: MovimentacaoExtrato) => s + m.valor, 0)
  const totalSaidas   = filtradas.filter((m: MovimentacaoExtrato) => m.tipo === 'saida').reduce((s: number, m: MovimentacaoExtrato) => s + m.valor, 0)
  const saldoFinal    = saldoAnterior + totalEntradas - totalSaidas

  function formatData(iso: string) {
    return new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  }

  const ORIGEM_ICON: Record<string, string> = {
    cobranca: '↙', repasse: '↗', despesa: '↗', outro: '•'
  }

  return (
    <div>
      {/* Navegação */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => setMes(mesAnterior(mes))} style={{ background: '#232324', border: '1px solid #2E2E30', borderRadius: 2, padding: '6px 14px', fontSize: 13, color: '#9B9690', cursor: 'pointer' }}>← Anterior</button>
        <span style={{ fontSize: 15, fontWeight: 600, color: '#F0EDE6', minWidth: 100, textAlign: 'center' }}>{formatarMes(mes)}</span>
        <button onClick={() => setMes(mesSeguinte(mes))} style={{ background: '#232324', border: '1px solid #2E2E30', borderRadius: 2, padding: '6px 14px', fontSize: 13, color: '#9B9690', cursor: 'pointer' }}>Seguinte →</button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Saldo anterior',  val: fmtBRLFull(saldoAnterior), cor: '#9B9690' },
          { label: 'Entradas',        val: fmtBRLFull(totalEntradas), cor: '#5CB88A' },
          { label: 'Saídas',          val: fmtBRLFull(totalSaidas),   cor: '#E05C5C' },
          { label: 'Saldo final',     val: fmtBRLFull(saldoFinal),    cor: saldoFinal >= 0 ? '#5CB88A' : '#E05C5C' },
        ].map((k) => (
          <div key={k.label} style={{ background: '#181819', border: '1px solid rgba(201,168,76,0.1)', borderRadius: 2, padding: '12px 16px' }}>
            <p style={{ fontSize: 11, color: '#9B9690', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k.label}</p>
            <p style={{ fontSize: 17, fontWeight: 700, color: k.cor }}>{k.val}</p>
          </div>
        ))}
      </div>

      {/* Extrato */}
      {linhas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#9B9690', fontSize: 14 }}>
          Sem movimentações em {formatarMes(mes)}.
        </div>
      ) : (
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ background: '#181819', border: '1px solid rgba(201,168,76,0.1)', borderRadius: 2, minWidth: 520 }}>
          {/* Saldo anterior */}
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr auto auto', gap: 12, padding: '10px 18px', borderBottom: '1px solid #232324', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#9B9690' }}>Saldo ant.</span>
            <span style={{ fontSize: 12, color: '#9B9690' }}>Saldo do período anterior</span>
            <span></span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#9B9690', textAlign: 'right', minWidth: 110 }}>{fmtBRLFull(saldoAnterior)}</span>
          </div>

          {(Object.entries(porData) as Array<[string, LinhaExtrato[]]>).map(([data, movs]) => (
            <div key={data}>
              {/* Separador de data */}
              <div style={{ padding: '6px 18px', background: '#0F0F10', borderBottom: '1px solid #1A1A1B' }}>
                <span style={{ fontSize: 11, color: '#9B9690', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{formatData(data)}</span>
                {movs.length > 1 && (
                  <span style={{ fontSize: 11, color: '#9B9690', marginLeft: 8 }}>
                    {movs.length} movimentações
                  </span>
                )}
              </div>
              {movs.map((m, i) => (
                <div
                  key={m.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '24px 1fr auto auto',
                    gap: 12,
                    padding: '10px 18px',
                    borderBottom: '1px solid #1A1A1B',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: 14, color: m.tipo === 'entrada' ? '#5CB88A' : '#E05C5C', fontWeight: 700 }}>
                    {ORIGEM_ICON[m.origem]}
                  </span>
                  <span style={{ fontSize: 13, color: '#F0EDE6' }}>{m.descricao}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: m.tipo === 'entrada' ? '#5CB88A' : '#E05C5C', textAlign: 'right', minWidth: 110 }}>
                    {m.tipo === 'entrada' ? '+' : '−'} {fmtBRLFull(m.valor)}
                  </span>
                  <span style={{ fontSize: 12, color: '#9B9690', textAlign: 'right', minWidth: 110 }}>
                    {fmtBRLFull(m.saldoCorrente)}
                  </span>
                </div>
              ))}
            </div>
          ))}

          {/* Saldo final */}
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr auto auto', gap: 12, padding: '12px 18px', borderTop: '1px solid rgba(201,168,76,0.15)', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#C9A84C', fontWeight: 600, textTransform: 'uppercase' }}>Saldo final</span>
            <span></span>
            <span></span>
            <span style={{ fontSize: 15, fontWeight: 700, color: saldoFinal >= 0 ? '#5CB88A' : '#E05C5C', textAlign: 'right', minWidth: 110 }}>{fmtBRLFull(saldoFinal)}</span>
          </div>
        </div>
        </div>
      )}
    </div>
  )
}
