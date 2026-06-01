'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { formatDate } from '@/lib/format'

type Aba = 'dashboard' | 'corretores' | 'denuncias' | 'financeiro'

interface CorretorAdmin {
  id: string
  full_name: string
  creci: string | null
  creci_status: string
  plano: string
  nota_media: number
  created_at: string
}

interface Denuncia {
  id: string
  denunciante_id: string
  denunciado_id: string
  motivo: string
  status: string
  created_at: string
  denunciante?: { full_name: string } | null
  denunciado?: { full_name: string } | null
}

interface Metricas {
  corretoresAtivos: number
  corretoresPendentes: number
  denunciasAbertas: number
  negociosFechados: number
  matchesHoje: number
}

const FINANCEIRO_PLANOS = [
  { plano: 'Free', assinantes: 636, receita: 0, pct: null },
  { plano: 'Pro', assinantes: 340, receita: 32980, pct: 35 },
  { plano: 'Premium', assinantes: 180, receita: 43200, pct: 46 },
  { plano: 'Enterprise', assinantes: 24, receita: 17280, pct: 19 },
]

const MRR_TOTAL = 93460

function badgeStatus(status: string): { label: string; bg: string; color: string } {
  if (status === 'ativo')     return { label: 'Ativo',     bg: 'rgba(92,184,138,0.12)',  color: '#5CB88A' }
  if (status === 'pendente')  return { label: 'Pendente',  bg: 'rgba(201,168,76,0.12)',  color: '#C9A84C' }
  if (status === 'suspenso')  return { label: 'Suspenso',  bg: 'rgba(224,92,92,0.12)',   color: '#E05C5C' }
  if (status === 'bloqueado') return { label: 'Bloqueado', bg: 'rgba(224,92,92,0.12)',   color: '#E05C5C' }
  return { label: status, bg: '#232324', color: '#9B9690' }
}

function badgePlano(plano: string): { bg: string; color: string } {
  if (plano === 'premium')  return { bg: 'rgba(201,168,76,0.12)',  color: '#C9A84C' }
  if (plano === 'pro')      return { bg: 'rgba(92,155,224,0.12)',  color: '#5C9BE0' }
  return { bg: 'rgba(155,150,144,0.1)', color: '#9B9690' }
}

export default function AdminClient({
  adminId,
  corretores,
  denuncias,
  metricas,
}: {
  adminId: string
  corretores: CorretorAdmin[]
  denuncias: Denuncia[]
  metricas: Metricas
}) {
  const supabase = createClient()
  const router = useRouter()
  const [aba, setAba] = useState<Aba>('dashboard')
  const [atualizando, setAtualizando] = useState<string | null>(null)

  const btnAba = (id: Aba): React.CSSProperties => ({
    background: 'none',
    border: 'none',
    borderBottom: aba === id ? '2px solid #C9A84C' : '2px solid transparent',
    color: aba === id ? '#C9A84C' : '#9B9690',
    fontSize: '13px',
    fontWeight: aba === id ? 600 : 400,
    padding: '10px 16px',
    cursor: 'pointer',
    transition: 'color 0.15s',
    whiteSpace: 'nowrap' as const,
  })

  async function atualizarStatus(corretorId: string, novoStatus: string) {
    setAtualizando(corretorId)
    await supabase.from('corretores').update({ creci_status: novoStatus }).eq('id', corretorId)
    await supabase.from('audit_log').insert({
      action: `corretor_${novoStatus}`,
      entity_type: 'corretor',
      entity_id: corretorId,
      performed_by: adminId,
      details: { data: new Date().toISOString() },
    })
    setAtualizando(null)
    router.refresh()
  }

  async function acaoDenuncia(id: string, acao: string, denunciadoId: string) {
    if (!confirm(`Confirma: ${acao} este corretor?`)) return
    setAtualizando(id)
    await supabase.from('denuncias').update({ status: 'resolvida' }).eq('id', id)
    if (acao === 'advertir') {
      await supabase.from('audit_log').insert({ action: 'corretor_advertido', entity_type: 'corretor', entity_id: denunciadoId, performed_by: adminId, details: {} })
    } else if (acao === 'suspender') {
      await supabase.from('corretores').update({ creci_status: 'suspenso' }).eq('id', denunciadoId)
    } else if (acao === 'bloquear') {
      await supabase.from('corretores').update({ creci_status: 'bloqueado', is_active: false }).eq('id', denunciadoId)
    }
    setAtualizando(null)
    router.refresh()
  }

  const btnAcao = (bg: string, color: string): React.CSSProperties => ({
    backgroundColor: 'transparent',
    border: `1px solid ${color}60`,
    color,
    borderRadius: '2px',
    padding: '4px 10px',
    fontSize: '11px',
    fontWeight: 500,
    cursor: 'pointer',
  })

  const metricaBox = (valor: string | number, label: string, destaque?: string): React.ReactNode => (
    <div style={{ backgroundColor: '#181819', border: '1px solid rgba(201,168,76,0.1)', borderRadius: '2px', padding: '18px 20px' }}>
      <p style={{ fontSize: '10px', color: '#9B9690', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 8px' }}>{label}</p>
      <p style={{ fontFamily: 'var(--font-serif, serif)', fontSize: '26px', fontWeight: 700, color: destaque || '#F0EDE6', margin: 0 }}>{valor}</p>
    </div>
  )

  return (
    <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Titulo */}
      <div>
        <h1 style={{ fontFamily: 'var(--font-serif, serif)', fontSize: '22px', fontWeight: 700, color: '#F0EDE6', margin: '0 0 4px' }}>
          Painel Administrativo
        </h1>
        <p style={{ fontSize: '13px', color: '#9B9690', margin: 0 }}>Gestao da plataforma BID.</p>
      </div>

      {/* Abas */}
      <div style={{ borderBottom: '1px solid #232324', display: 'flex', gap: '0' }}>
        {(['dashboard', 'corretores', 'denuncias', 'financeiro'] as Aba[]).map((id) => (
          <button key={id} style={btnAba(id)} onClick={() => setAba(id)}>
            {id.charAt(0).toUpperCase() + id.slice(1)}
            {id === 'denuncias' && metricas.denunciasAbertas > 0 && (
              <span style={{ marginLeft: '6px', backgroundColor: '#E05C5C', color: '#fff', borderRadius: '9999px', padding: '1px 6px', fontSize: '10px', fontWeight: 700 }}>
                {metricas.denunciasAbertas}
              </span>
            )}
            {id === 'corretores' && metricas.corretoresPendentes > 0 && (
              <span style={{ marginLeft: '6px', backgroundColor: '#C9A84C', color: '#0E0E0F', borderRadius: '9999px', padding: '1px 6px', fontSize: '10px', fontWeight: 700 }}>
                {metricas.corretoresPendentes}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ABA: Dashboard */}
      {aba === 'dashboard' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {metricaBox(metricas.corretoresAtivos, 'Corretores Ativos')}
          {metricaBox(metricas.corretoresPendentes, 'Pendentes', metricas.corretoresPendentes > 0 ? '#C9A84C' : undefined)}
          {metricaBox(metricas.denunciasAbertas, 'Denuncias Abertas', metricas.denunciasAbertas > 0 ? '#E05C5C' : undefined)}
          {metricaBox(`R$ ${MRR_TOTAL.toLocaleString('pt-BR')}`, 'MRR', '#C9A84C')}
          {metricaBox(metricas.negociosFechados, 'Negocios Fechados')}
          {metricaBox(metricas.matchesHoje, 'Matches Hoje')}
        </div>
      )}

      {/* ABA: Corretores */}
      {aba === 'corretores' && (
        <div style={{ backgroundColor: '#181819', border: '1px solid rgba(201,168,76,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
          {/* Cabecalho */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 100px 80px 60px 120px 160px', gap: '0', padding: '10px 16px', borderBottom: '1px solid #232324', backgroundColor: '#232324' }}>
            {['Nome', 'CRECI', 'Status', 'Plano', 'Nota', 'Cadastro', 'Acoes'].map((h) => (
              <span key={h} style={{ fontSize: '10px', color: '#9B9690', letterSpacing: '0.07em', textTransform: 'uppercase' }}>{h}</span>
            ))}
          </div>
          {corretores.map((cor, i) => {
            const st = badgeStatus(cor.creci_status)
            const pl = badgePlano(cor.plano)
            return (
              <div
                key={cor.id}
                style={{ display: 'grid', gridTemplateColumns: '1fr 120px 100px 80px 60px 120px 160px', gap: '0', padding: '12px 16px', borderBottom: i < corretores.length - 1 ? '1px solid #232324' : 'none', alignItems: 'center' }}
              >
                <span style={{ fontSize: '13px', color: '#F0EDE6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cor.full_name}</span>
                <span style={{ fontSize: '12px', color: '#9B9690' }}>{cor.creci || '—'}</span>
                <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '2px', backgroundColor: st.bg, color: st.color, display: 'inline-block' }}>{st.label}</span>
                <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '2px', backgroundColor: pl.bg, color: pl.color, display: 'inline-block', textTransform: 'capitalize' }}>{cor.plano || 'free'}</span>
                <span style={{ fontSize: '12px', color: cor.nota_media > 0 ? '#C9A84C' : '#9B9690' }}>
                  {cor.nota_media > 0 ? `★ ${cor.nota_media.toFixed(1)}` : '—'}
                </span>
                <span style={{ fontSize: '11px', color: '#9B9690' }}>{formatDate(cor.created_at)}</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {cor.creci_status === 'pendente' && (
                    <button disabled={atualizando === cor.id} onClick={() => atualizarStatus(cor.id, 'ativo')} style={btnAcao('#5CB88A', '#5CB88A')}>
                      Aprovar
                    </button>
                  )}
                  {cor.creci_status === 'ativo' && (
                    <button disabled={atualizando === cor.id} onClick={() => atualizarStatus(cor.id, 'suspenso')} style={btnAcao('#E05C5C', '#E05C5C')}>
                      Suspender
                    </button>
                  )}
                  {cor.creci_status === 'suspenso' && (
                    <>
                      <button disabled={atualizando === cor.id} onClick={() => atualizarStatus(cor.id, 'ativo')} style={btnAcao('#5C9BE0', '#5C9BE0')}>Reativar</button>
                      <button disabled={atualizando === cor.id} onClick={() => atualizarStatus(cor.id, 'bloqueado')} style={btnAcao('#E05C5C', '#E05C5C')}>Bloquear</button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ABA: Denuncias */}
      {aba === 'denuncias' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {denuncias.length === 0 ? (
            <div style={{ backgroundColor: '#181819', border: '1px solid rgba(201,168,76,0.1)', borderRadius: '2px', padding: '32px', textAlign: 'center' }}>
              <p style={{ fontSize: '13px', color: '#9B9690', margin: 0 }}>Nenhuma denuncia aberta.</p>
            </div>
          ) : (
            denuncias.map((d) => {
              const st = badgeStatus(d.status)
              return (
                <div key={d.id} style={{ backgroundColor: '#181819', border: '1px solid rgba(201,168,76,0.1)', borderRadius: '2px', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '13px', color: '#F0EDE6', margin: '0 0 4px' }}>
                      <span style={{ color: '#9B9690' }}>{d.denunciante?.full_name || 'Corretor'}</span>
                      {' denunciou '}
                      <span style={{ color: '#C9A84C' }}>{d.denunciado?.full_name || 'Corretor'}</span>
                    </p>
                    <p style={{ fontSize: '12px', color: '#9B9690', margin: 0 }}>
                      {d.motivo} · {formatDate(d.created_at)}
                    </p>
                  </div>
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '2px', backgroundColor: st.bg, color: st.color, flexShrink: 0 }}>{st.label}</span>
                  <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                    <button onClick={() => acaoDenuncia(d.id, 'arquivar', d.denunciado_id)} style={btnAcao('#9B9690', '#9B9690')}>Arquivar</button>
                    <button onClick={() => acaoDenuncia(d.id, 'advertir', d.denunciado_id)} style={btnAcao('#C9A84C', '#C9A84C')}>Advertir</button>
                    <button onClick={() => acaoDenuncia(d.id, 'suspender', d.denunciado_id)} style={btnAcao('#5C9BE0', '#5C9BE0')}>Suspender</button>
                    <button onClick={() => acaoDenuncia(d.id, 'bloquear', d.denunciado_id)} style={btnAcao('#E05C5C', '#E05C5C')}>Bloquear</button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* ABA: Financeiro */}
      {aba === 'financeiro' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {metricaBox(`R$ ${MRR_TOTAL.toLocaleString('pt-BR')}`, 'MRR Total', '#C9A84C')}
            {metricaBox(544, 'Assinantes Pagos')}
            {metricaBox('4,2%', 'Churn Rate')}
          </div>

          <div style={{ backgroundColor: '#181819', border: '1px solid rgba(201,168,76,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 160px 80px', padding: '10px 16px', borderBottom: '1px solid #232324', backgroundColor: '#232324' }}>
              {['Plano', 'Assinantes', 'Receita/mes', '% MRR'].map((h) => (
                <span key={h} style={{ fontSize: '10px', color: '#9B9690', letterSpacing: '0.07em', textTransform: 'uppercase' }}>{h}</span>
              ))}
            </div>
            {FINANCEIRO_PLANOS.map((p, i) => (
              <div key={p.plano} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 160px 80px', padding: '12px 16px', borderBottom: i < FINANCEIRO_PLANOS.length - 1 ? '1px solid #232324' : 'none', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#F0EDE6', fontWeight: 500 }}>{p.plano}</span>
                <span style={{ fontSize: '13px', color: '#9B9690' }}>{p.assinantes.toLocaleString('pt-BR')}</span>
                <span style={{ fontSize: '13px', color: p.receita > 0 ? '#C9A84C' : '#9B9690' }}>
                  {p.receita > 0 ? `R$ ${p.receita.toLocaleString('pt-BR')}` : 'R$ 0'}
                </span>
                <span style={{ fontSize: '13px', color: '#9B9690' }}>{p.pct ? `${p.pct}%` : '—'}</span>
              </div>
            ))}
          </div>

          <p style={{ fontSize: '11px', color: '#2E2E30', margin: 0 }}>
            * Dados estaticos. Integracao com gateway de pagamento em breve.
          </p>
        </div>
      )}
    </div>
  )
}
