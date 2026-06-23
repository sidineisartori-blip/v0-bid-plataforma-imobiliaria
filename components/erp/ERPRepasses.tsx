'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatarMes, mesAnterior, mesSeguinte, mesAtual, fmtBRLFull } from '@/lib/vencimento'
import ModalConfirm from '@/components/ui/ModalConfirm'

export interface Repasse {
  id: string
  contrato_id: string
  corretor_id: string
  competencia: string
  valor_aluguel: number
  taxa_administracao: number
  despesas_proprietario: number
  valor_liquido: number
  status: 'pendente' | 'realizado' | 'cancelado'
  data_repasse: string | null
  pix_chave: string | null
  banco: string | null
  agencia: string | null
  conta: string | null
  observacao: string | null
  created_at: string
  contrato?: {
    cliente_nome: string
    imovel?: { titulo: string; cidade: string } | null
    prop_nome?: string | null
    prop_whatsapp?: string | null
  } | null
}

interface Props {
  repasses: Repasse[]
  corretorId: string
  mesInicial: string
}

const STATUS_MAP = {
  pendente:  { label: 'Pendente',  cor: '#C9A84C', bg: 'rgba(201,168,76,0.12)' },
  realizado: { label: 'Realizado', cor: '#5CB88A', bg: 'rgba(92,184,138,0.12)' },
  cancelado: { label: 'Cancelado', cor: '#E05C5C', bg: 'rgba(224,92,92,0.12)'  },
}

export default function ERPRepasses({ repasses, corretorId, mesInicial }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [mes, setMes] = useState(mesInicial)
  const [realizandoId, setRealizandoId] = useState<string | null>(null)
  const [confirmarRealizar, setConfirmarRealizar] = useState<string | null>(null)
  const [detalheId, setDetalheId] = useState<string | null>(null)

  const filtrados = useMemo(
    () => repasses.filter((r: Repasse) => r.competencia.startsWith(mes)),
    [repasses, mes]
  )

  const kpis = useMemo(() => {
    const pendentes  = filtrados.filter((r: Repasse) => r.status === 'pendente')
    const realizados = filtrados.filter((r: Repasse) => r.status === 'realizado')
    return {
      totalPendente:  pendentes.reduce((s: number, r: Repasse) => s + r.valor_liquido, 0),
      qtdPendente:    pendentes.length,
      totalRealizado: realizados.reduce((s: number, r: Repasse) => s + r.valor_liquido, 0),
      qtdRealizado:   realizados.length,
      totalTaxa:      filtrados.reduce((s: number, r: Repasse) => s + r.taxa_administracao, 0),
    }
  }, [filtrados])

  async function executarRealizar(id: string) {
    setRealizandoId(id)
    await supabase
      .from('repasses')
      .update({ status: 'realizado', data_repasse: new Date().toISOString().split('T')[0] })
      .eq('id', id)
      .eq('corretor_id', corretorId)
    setRealizandoId(null)
    setConfirmarRealizar(null)
    router.refresh()
  }

  return (
    <div>
      {confirmarRealizar && (
        <ModalConfirm
          titulo="Confirmar realização do repasse?"
          descricao="Esta ação registrará o repasse como realizado com a data de hoje."
          tipo="aviso"
          labelConfirmar="Confirmar repasse"
          onConfirmar={() => executarRealizar(confirmarRealizar)}
          onCancelar={() => setConfirmarRealizar(null)}
          carregando={realizandoId === confirmarRealizar}
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
          { label: 'A repassar',      val: fmtBRLFull(kpis.totalPendente),  sub: `${kpis.qtdPendente} proprietários`,  cor: '#C9A84C' },
          { label: 'Repassado',       val: fmtBRLFull(kpis.totalRealizado), sub: `${kpis.qtdRealizado} realizados`,    cor: '#5CB88A' },
          { label: 'Taxa de adm.',    val: fmtBRLFull(kpis.totalTaxa),      sub: 'receita da imobiliária',              cor: '#9B9690' },
        ].map((k) => (
          <div key={k.label} style={{ background: '#181819', border: '1px solid rgba(201,168,76,0.1)', borderRadius: 2, padding: '14px 18px' }}>
            <p style={{ fontSize: 11, color: '#9B9690', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k.label}</p>
            <p style={{ fontSize: 20, fontWeight: 700, color: k.cor, marginBottom: 2 }}>{k.val}</p>
            <p style={{ fontSize: 12, color: '#9B9690' }}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Lista */}
      {filtrados.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#9B9690', fontSize: 14 }}>
          Nenhum repasse em {formatarMes(mes)}.
        </div>
      ) : (
        <div style={{ background: '#181819', border: '1px solid rgba(201,168,76,0.1)', borderRadius: 2 }}>
          <div style={{ padding: '8px 18px', borderBottom: '1px solid #232324', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: '#9B9690' }}>{filtrados.length} repasses</span>
            <span style={{ fontSize: 11, color: '#9B9690' }}>
              Total líquido: <span style={{ color: '#C9A84C', fontWeight: 600 }}>{fmtBRLFull(filtrados.reduce((s: number, r: Repasse) => s + r.valor_liquido, 0))}</span>
            </span>
          </div>
          {filtrados.map((r: Repasse, i: number) => {
            const sm = STATUS_MAP[r.status as keyof typeof STATUS_MAP] ?? { label: r.status || '—', cor: '#9B9690', bg: 'rgba(155,150,144,0.12)' }
            const isDetalhe = detalheId === r.id
            return (
              <div key={r.id} style={{ borderBottom: i < filtrados.length - 1 ? '1px solid #232324' : 'none' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, padding: '13px 18px', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 3, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#F0EDE6' }}>
                        {r.contrato?.prop_nome || r.contrato?.cliente_nome || '—'}
                      </span>
                      <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 2, background: sm.bg, color: sm.cor, fontWeight: 600 }}>{sm.label}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      {r.contrato?.imovel && (
                        <span style={{ fontSize: 12, color: '#9B9690' }}>{r.contrato.imovel.titulo}</span>
                      )}
                      {/* Demonstrativo inline */}
                      <span style={{ fontSize: 12, color: '#9B9690' }}>
                        Aluguel: <span style={{ color: '#F0EDE6' }}>{fmtBRLFull(r.valor_aluguel)}</span>
                        {' − '}Taxa: <span style={{ color: '#C9A84C' }}>{fmtBRLFull(r.taxa_administracao)}</span>
                        {r.despesas_proprietario > 0 && <> {' − '}Desp.: <span style={{ color: '#E05C5C' }}>{fmtBRLFull(r.despesas_proprietario)}</span></>}
                        {' = '}<span style={{ color: '#5CB88A', fontWeight: 600 }}>{fmtBRLFull(r.valor_liquido)}</span>
                      </span>
                    </div>
                    {(r.pix_chave || r.banco) && (
                      <div style={{ marginTop: 4, fontSize: 12, color: '#9B9690' }}>
                        {r.pix_chave ? `Pix: ${r.pix_chave}` : `Banco ${r.banco} · Ag ${r.agencia} · Cc ${r.conta}`}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button
                      onClick={() => setDetalheId(isDetalhe ? null : r.id)}
                      style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 2, padding: '6px 12px', fontSize: 12, color: '#C9A84C', cursor: 'pointer' }}
                    >
                      {isDetalhe ? 'Fechar' : 'Demonstrativo'}
                    </button>
                    {r.status === 'pendente' && (
                      <button
                        onClick={() => setConfirmarRealizar(r.id)}
                        disabled={realizandoId === r.id}
                        style={{ background: 'rgba(92,184,138,0.1)', border: '1px solid rgba(92,184,138,0.25)', borderRadius: 2, padding: '6px 14px', fontSize: 12, color: '#5CB88A', cursor: 'pointer', whiteSpace: 'nowrap' }}
                      >
                        {realizandoId === r.id ? '...' : 'Realizar'}
                      </button>
                    )}
                  </div>
                </div>
                {/* Demonstrativo expandido */}
                {isDetalhe && (
                  <div style={{ margin: '0 18px 14px', background: '#0F0F10', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 2, padding: '14px 18px' }}>
                    <p style={{ fontSize: 12, color: '#C9A84C', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, fontWeight: 600 }}>Demonstrativo de Repasse</p>
                    <table style={{ width: '100%', fontSize: 13 }}>
                      <tbody>
                        {[
                          { label: 'Aluguel bruto', val: r.valor_aluguel, cor: '#F0EDE6' },
                          { label: `Taxa de administração`, val: -r.taxa_administracao, cor: '#C9A84C' },
                          { label: 'Despesas do proprietário', val: -r.despesas_proprietario, cor: '#E05C5C' },
                        ].map((row) => (
                          <tr key={row.label}>
                            <td style={{ padding: '3px 0', color: '#9B9690' }}>{row.label}</td>
                            <td style={{ textAlign: 'right', padding: '3px 0', color: row.cor, fontWeight: 600 }}>
                              {row.val < 0 ? `− ${fmtBRLFull(Math.abs(row.val))}` : fmtBRLFull(row.val)}
                            </td>
                          </tr>
                        ))}
                        <tr style={{ borderTop: '1px solid rgba(201,168,76,0.15)' }}>
                          <td style={{ padding: '6px 0 3px', color: '#F0EDE6', fontWeight: 600 }}>Valor líquido ao proprietário</td>
                          <td style={{ textAlign: 'right', padding: '6px 0 3px', color: '#5CB88A', fontSize: 15, fontWeight: 700 }}>{fmtBRLFull(r.valor_liquido)}</td>
                        </tr>
                      </tbody>
                    </table>
                    {r.data_repasse && (
                      <p style={{ fontSize: 12, color: '#5CB88A', marginTop: 8 }}>
                        Realizado em {new Date(r.data_repasse + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
