'use client'

export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'

type Aba = 'dashboard' | 'corretores' | 'planos' | 'financeiro'

interface Corretor {
  id: string
  full_name: string
  email: string
  creci: string | null
  creci_status: string
  plano: string
  nota_media: number
  created_at: string
  phone: string | null
}

interface Assinatura {
  id: string
  corretor_id: string
  plano: string
  status: string
  valor_mensal: number
  periodo_inicio: string
  periodo_fim: string | null
  corretor?: { full_name: string; email: string } | null
}

interface AdminSession {
  id: string
  email: string
  role: string
  full_name: string
  expires: number
}

const PLANOS = [
  { id: 'free', nome: 'Free', valor: 0, cor: '#9B9690', limiteImoveis: 5, limiteSolicitacoes: 10 },
  { id: 'pro', nome: 'Pro', valor: 97, cor: '#5C9BE0', limiteImoveis: 30, limiteSolicitacoes: 50 },
  { id: 'premium', nome: 'Premium', valor: 240, cor: '#C9A84C', limiteImoveis: -1, limiteSolicitacoes: -1 },
  { id: 'enterprise', nome: 'Enterprise', valor: 720, cor: '#5CB88A', limiteImoveis: -1, limiteSolicitacoes: -1 },
]

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR')
}

export default function AdminPainelPage() {
  const router = useRouter()
  const supabase = createClient()
  const [session, setSession] = useState<AdminSession | null>(null)
  const [aba, setAba] = useState<Aba>('dashboard')
  const [corretores, setCorretores] = useState<Corretor[]>([])
  const [assinaturas, setAssinaturas] = useState<Assinatura[]>([])
  const [loading, setLoading] = useState(true)
  const [atualizando, setAtualizando] = useState<string | null>(null)
  const [busca, setBusca] = useState('')
  const [filtroPlano, setFiltroPlano] = useState<string>('todos')

  // Metricas
  const [metricas, setMetricas] = useState({
    totalCorretores: 0,
    corretoresAtivos: 0,
    assinaturasPagas: 0,
    mrrTotal: 0,
  })

  useEffect(() => {
    // Verifica sessao admin
    const stored = localStorage.getItem('admin_session')
    if (!stored) {
      router.push('/admin/login')
      return
    }

    const parsed = JSON.parse(stored) as AdminSession
    if (parsed.expires < Date.now()) {
      localStorage.removeItem('admin_session')
      router.push('/admin/login')
      return
    }

    setSession(parsed)
    carregarDados()
  }, [])

  async function carregarDados() {
    setLoading(true)

    const [
      { data: corretoresData, count: totalCorretores },
      { data: assinaturasData },
      { count: corretoresAtivos },
    ] = await Promise.all([
      supabase
        .from('corretores')
        .select('id, full_name, email, creci, creci_status, plano, nota_media, created_at, phone', { count: 'exact' })
        .order('created_at', { ascending: false }),
      supabase
        .from('assinaturas')
        .select('*, corretor:corretores(full_name, email)')
        .order('created_at', { ascending: false }),
      supabase
        .from('corretores')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true),
    ])

    setCorretores((corretoresData as Corretor[]) || [])
    setAssinaturas((assinaturasData as Assinatura[]) || [])

    // Calcula metricas
    const assinaturasPagas = (assinaturasData || []).filter(
      (a: any) => a.status === 'ativa' && a.plano !== 'free'
    ).length
    const mrrTotal = (assinaturasData || [])
      .filter((a: any) => a.status === 'ativa')
      .reduce((acc: number, a: any) => acc + (a.valor_mensal || 0), 0)

    setMetricas({
      totalCorretores: totalCorretores || 0,
      corretoresAtivos: corretoresAtivos || 0,
      assinaturasPagas,
      mrrTotal,
    })

    setLoading(false)
  }

  async function alterarPlano(corretorId: string, novoPlano: string) {
    setAtualizando(corretorId)

    const planoInfo = PLANOS.find((p) => p.id === novoPlano)
    if (!planoInfo) return

    // Atualiza o plano do corretor
    await supabase
      .from('corretores')
      .update({
        plano: novoPlano,
        plano_ativo_desde: new Date().toISOString(),
      })
      .eq('id', corretorId)

    // Cria ou atualiza assinatura
    const { data: assinaturaExistente } = await supabase
      .from('assinaturas')
      .select('id')
      .eq('corretor_id', corretorId)
      .eq('status', 'ativa')
      .single()

    if (assinaturaExistente) {
      await supabase
        .from('assinaturas')
        .update({
          plano: novoPlano,
          valor_mensal: planoInfo.valor,
          updated_at: new Date().toISOString(),
        })
        .eq('id', assinaturaExistente.id)
    } else {
      await supabase.from('assinaturas').insert({
        corretor_id: corretorId,
        plano: novoPlano,
        status: 'ativa',
        valor_mensal: planoInfo.valor,
        periodo_inicio: new Date().toISOString(),
      })
    }

    // Log de auditoria
    await supabase.from('audit_log').insert({
      action: 'plano_alterado',
      entity_type: 'corretor',
      entity_id: corretorId,
      performed_by: session?.id,
      details: { plano_novo: novoPlano, alterado_por: session?.email },
    })

    await carregarDados()
    setAtualizando(null)
  }

  async function cancelarAssinatura(assinaturaId: string, corretorId: string) {
    if (!confirm('Confirma o cancelamento desta assinatura?')) return

    setAtualizando(assinaturaId)

    await supabase
      .from('assinaturas')
      .update({
        status: 'cancelada',
        cancelado_em: new Date().toISOString(),
      })
      .eq('id', assinaturaId)

    await supabase
      .from('corretores')
      .update({ plano: 'free' })
      .eq('id', corretorId)

    await supabase.from('audit_log').insert({
      action: 'assinatura_cancelada',
      entity_type: 'assinatura',
      entity_id: assinaturaId,
      performed_by: session?.id,
      details: { corretor_id: corretorId },
    })

    await carregarDados()
    setAtualizando(null)
  }

  function logout() {
    localStorage.removeItem('admin_session')
    router.push('/admin/login')
  }

  // Filtros
  const corretoresFiltrados = corretores.filter((c) => {
    const matchBusca =
      busca === '' ||
      c.full_name.toLowerCase().includes(busca.toLowerCase()) ||
      c.email?.toLowerCase().includes(busca.toLowerCase()) ||
      c.creci?.toLowerCase().includes(busca.toLowerCase())
    const matchPlano = filtroPlano === 'todos' || c.plano === filtroPlano
    return matchBusca && matchPlano
  })

  const btnAba = (id: Aba): React.CSSProperties => ({
    background: 'none',
    border: 'none',
    borderBottom: aba === id ? '2px solid #C9A84C' : '2px solid transparent',
    color: aba === id ? '#C9A84C' : '#9B9690',
    fontSize: '15px',
    fontWeight: aba === id ? 600 : 400,
    padding: '12px 20px',
    cursor: 'pointer',
    transition: 'color 0.15s',
  })

  const metricaBox = (valor: string | number, label: string, destaque?: string) => (
    <div
      style={{
        backgroundColor: '#181819',
        border: '1px solid rgba(201,168,76,0.1)',
        borderRadius: '2px',
        padding: '24px 28px',
      }}
    >
      <p
        style={{
          fontSize: '12px',
          color: '#9B9690',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          margin: '0 0 10px',
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontFamily: 'var(--font-serif, serif)',
          fontSize: '36px',
          fontWeight: 700,
          color: destaque || '#F0EDE6',
          margin: 0,
        }}
      >
        {valor}
      </p>
    </div>
  )

  if (loading || !session) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#0E0E0F',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '3px solid #232324',
            borderTopColor: '#C9A84C',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0E0E0F' }}>
      {/* Header */}
      <header
        style={{
          backgroundColor: '#181819',
          borderBottom: '1px solid #232324',
          padding: '16px 40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <h1
            style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '28px',
              fontWeight: 700,
              color: '#C9A84C',
              margin: 0,
            }}
          >
            BID
          </h1>
          <span style={{ fontSize: '14px', color: '#9B9690' }}>Painel Master</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{ fontSize: '14px', color: '#F0EDE6' }}>{session.full_name}</span>
          <button
            onClick={logout}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid #E05C5C40',
              color: '#E05C5C',
              borderRadius: '2px',
              padding: '8px 16px',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Sair
          </button>
        </div>
      </header>

      <div style={{ padding: '40px' }}>
        {/* Abas */}
        <div style={{ borderBottom: '1px solid #232324', marginBottom: '32px', display: 'flex' }}>
          {(['dashboard', 'corretores', 'planos', 'financeiro'] as Aba[]).map((id) => (
            <button key={id} style={btnAba(id)} onClick={() => setAba(id)}>
              {id === 'dashboard' && 'Dashboard'}
              {id === 'corretores' && 'Corretores'}
              {id === 'planos' && 'Gerenciar Planos'}
              {id === 'financeiro' && 'Financeiro'}
            </button>
          ))}
        </div>

        {/* Dashboard */}
        {aba === 'dashboard' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
            {metricaBox(metricas.totalCorretores, 'Total Corretores')}
            {metricaBox(metricas.corretoresAtivos, 'Corretores Ativos')}
            {metricaBox(metricas.assinaturasPagas, 'Assinantes Pagos', '#5CB88A')}
            {metricaBox(formatCurrency(metricas.mrrTotal), 'MRR Total', '#C9A84C')}
          </div>
        )}

        {/* Corretores */}
        {aba === 'corretores' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Filtros */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Buscar por nome, email ou CRECI..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                style={{
                  flex: 1,
                  maxWidth: '400px',
                  padding: '12px 16px',
                  backgroundColor: '#181819',
                  border: '1px solid #232324',
                  borderRadius: '2px',
                  color: '#F0EDE6',
                  fontSize: '15px',
                  outline: 'none',
                }}
              />
              <select
                value={filtroPlano}
                onChange={(e) => setFiltroPlano(e.target.value)}
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#181819',
                  border: '1px solid #232324',
                  borderRadius: '2px',
                  color: '#F0EDE6',
                  fontSize: '15px',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="todos">Todos os planos</option>
                {PLANOS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
              <span style={{ fontSize: '14px', color: '#9B9690' }}>
                {corretoresFiltrados.length} corretor(es)
              </span>
            </div>

            {/* Tabela */}
            <div
              style={{
                backgroundColor: '#181819',
                border: '1px solid rgba(201,168,76,0.1)',
                borderRadius: '2px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 180px 120px 100px 80px 180px',
                  gap: '0',
                  padding: '14px 20px',
                  borderBottom: '1px solid #232324',
                  backgroundColor: '#232324',
                }}
              >
                {['Nome', 'E-mail', 'CRECI', 'Status', 'Plano', 'Acoes'].map((h) => (
                  <span
                    key={h}
                    style={{
                      fontSize: '12px',
                      color: '#9B9690',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                    }}
                  >
                    {h}
                  </span>
                ))}
              </div>

              {corretoresFiltrados.slice(0, 50).map((cor, i) => {
                const planoInfo = PLANOS.find((p) => p.id === cor.plano) || PLANOS[0]
                return (
                  <div
                    key={cor.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 180px 120px 100px 80px 180px',
                      gap: '0',
                      padding: '16px 20px',
                      borderBottom: i < corretoresFiltrados.length - 1 ? '1px solid #232324' : 'none',
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '15px',
                        color: '#F0EDE6',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {cor.full_name}
                    </span>
                    <span
                      style={{
                        fontSize: '14px',
                        color: '#9B9690',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {cor.email || '—'}
                    </span>
                    <span style={{ fontSize: '14px', color: '#9B9690' }}>{cor.creci || '—'}</span>
                    <span
                      style={{
                        fontSize: '12px',
                        padding: '4px 10px',
                        borderRadius: '2px',
                        backgroundColor:
                          cor.creci_status === 'ativo'
                            ? 'rgba(92,184,138,0.12)'
                            : cor.creci_status === 'pendente'
                            ? 'rgba(201,168,76,0.12)'
                            : 'rgba(224,92,92,0.12)',
                        color:
                          cor.creci_status === 'ativo'
                            ? '#5CB88A'
                            : cor.creci_status === 'pendente'
                            ? '#C9A84C'
                            : '#E05C5C',
                        display: 'inline-block',
                        textTransform: 'capitalize',
                      }}
                    >
                      {cor.creci_status}
                    </span>
                    <span
                      style={{
                        fontSize: '12px',
                        padding: '4px 10px',
                        borderRadius: '2px',
                        backgroundColor: `${planoInfo.cor}20`,
                        color: planoInfo.cor,
                        display: 'inline-block',
                        textTransform: 'capitalize',
                      }}
                    >
                      {planoInfo.nome}
                    </span>
                    <select
                      value={cor.plano || 'free'}
                      onChange={(e) => alterarPlano(cor.id, e.target.value)}
                      disabled={atualizando === cor.id}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: '#232324',
                        border: '1px solid #2E2E30',
                        borderRadius: '2px',
                        color: '#F0EDE6',
                        fontSize: '14px',
                        cursor: atualizando === cor.id ? 'not-allowed' : 'pointer',
                        opacity: atualizando === cor.id ? 0.6 : 1,
                      }}
                    >
                      {PLANOS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nome} {p.valor > 0 ? `(R$ ${p.valor}/mes)` : '(Gratis)'}
                        </option>
                      ))}
                    </select>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Gerenciar Planos */}
        {aba === 'planos' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '20px',
              }}
            >
              {PLANOS.map((plano) => {
                const assinantes = corretores.filter((c) => c.plano === plano.id).length
                return (
                  <div
                    key={plano.id}
                    style={{
                      backgroundColor: '#181819',
                      border: `1px solid ${plano.cor}40`,
                      borderRadius: '2px',
                      padding: '28px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '16px',
                      }}
                    >
                      <h3
                        style={{
                          fontFamily: 'var(--font-serif, serif)',
                          fontSize: '22px',
                          fontWeight: 600,
                          color: plano.cor,
                          margin: 0,
                        }}
                      >
                        {plano.nome}
                      </h3>
                      <span
                        style={{
                          fontSize: '13px',
                          padding: '4px 12px',
                          borderRadius: '2px',
                          backgroundColor: `${plano.cor}20`,
                          color: plano.cor,
                        }}
                      >
                        {assinantes} assinante{assinantes !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <p
                      style={{
                        fontSize: '28px',
                        fontWeight: 700,
                        color: '#F0EDE6',
                        margin: '0 0 20px',
                      }}
                    >
                      {plano.valor > 0 ? `R$ ${plano.valor}` : 'Gratis'}
                      {plano.valor > 0 && (
                        <span style={{ fontSize: '14px', color: '#9B9690', fontWeight: 400 }}>
                          /mes
                        </span>
                      )}
                    </p>

                    <div style={{ fontSize: '14px', color: '#9B9690', lineHeight: 1.8 }}>
                      <p style={{ margin: 0 }}>
                        Imoveis: {plano.limiteImoveis === -1 ? 'Ilimitados' : plano.limiteImoveis}
                      </p>
                      <p style={{ margin: 0 }}>
                        Solicitacoes:{' '}
                        {plano.limiteSolicitacoes === -1 ? 'Ilimitadas' : plano.limiteSolicitacoes}
                      </p>
                    </div>

                    <p
                      style={{
                        fontSize: '13px',
                        color: '#9B9690',
                        marginTop: '20px',
                        paddingTop: '20px',
                        borderTop: '1px solid #232324',
                      }}
                    >
                      Receita:{' '}
                      <span style={{ color: plano.cor, fontWeight: 600 }}>
                        {formatCurrency(plano.valor * assinantes)}
                      </span>
                      /mes
                    </p>
                  </div>
                )
              })}
            </div>

            {/* Assinaturas ativas */}
            <div>
              <h3
                style={{
                  fontFamily: 'var(--font-serif, serif)',
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#F0EDE6',
                  margin: '0 0 16px',
                }}
              >
                Assinaturas Ativas
              </h3>

              <div
                style={{
                  backgroundColor: '#181819',
                  border: '1px solid rgba(201,168,76,0.1)',
                  borderRadius: '2px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 100px 100px 120px 100px',
                    gap: '0',
                    padding: '14px 20px',
                    borderBottom: '1px solid #232324',
                    backgroundColor: '#232324',
                  }}
                >
                  {['Corretor', 'Plano', 'Valor', 'Inicio', 'Acoes'].map((h) => (
                    <span
                      key={h}
                      style={{
                        fontSize: '12px',
                        color: '#9B9690',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        fontWeight: 600,
                      }}
                    >
                      {h}
                    </span>
                  ))}
                </div>

                {assinaturas
                  .filter((a) => a.status === 'ativa')
                  .slice(0, 20)
                  .map((ass, i, arr) => {
                    const planoInfo = PLANOS.find((p) => p.id === ass.plano) || PLANOS[0]
                    return (
                      <div
                        key={ass.id}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 100px 100px 120px 100px',
                          gap: '0',
                          padding: '16px 20px',
                          borderBottom: i < arr.length - 1 ? '1px solid #232324' : 'none',
                          alignItems: 'center',
                        }}
                      >
                        <span style={{ fontSize: '15px', color: '#F0EDE6' }}>
                          {ass.corretor?.full_name || '—'}
                        </span>
                        <span
                          style={{
                            fontSize: '12px',
                            padding: '4px 10px',
                            borderRadius: '2px',
                            backgroundColor: `${planoInfo.cor}20`,
                            color: planoInfo.cor,
                            display: 'inline-block',
                          }}
                        >
                          {planoInfo.nome}
                        </span>
                        <span style={{ fontSize: '14px', color: '#C9A84C' }}>
                          {formatCurrency(ass.valor_mensal)}
                        </span>
                        <span style={{ fontSize: '13px', color: '#9B9690' }}>
                          {formatDate(ass.periodo_inicio)}
                        </span>
                        <button
                          onClick={() => cancelarAssinatura(ass.id, ass.corretor_id)}
                          disabled={atualizando === ass.id}
                          style={{
                            backgroundColor: 'transparent',
                            border: '1px solid #E05C5C40',
                            color: '#E05C5C',
                            borderRadius: '2px',
                            padding: '6px 12px',
                            fontSize: '13px',
                            cursor: atualizando === ass.id ? 'not-allowed' : 'pointer',
                            opacity: atualizando === ass.id ? 0.6 : 1,
                          }}
                        >
                          Cancelar
                        </button>
                      </div>
                    )
                  })}

                {assinaturas.filter((a) => a.status === 'ativa').length === 0 && (
                  <div style={{ padding: '40px', textAlign: 'center' }}>
                    <p style={{ fontSize: '15px', color: '#9B9690' }}>Nenhuma assinatura ativa.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Financeiro */}
        {aba === 'financeiro' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
              {metricaBox(formatCurrency(metricas.mrrTotal), 'MRR Total', '#C9A84C')}
              {metricaBox(metricas.assinaturasPagas, 'Assinantes Pagos', '#5CB88A')}
              {metricaBox(
                formatCurrency(metricas.assinaturasPagas > 0 ? metricas.mrrTotal / metricas.assinaturasPagas : 0),
                'Ticket Medio'
              )}
              {metricaBox(formatCurrency(metricas.mrrTotal * 12), 'ARR Projetado', '#5C9BE0')}
            </div>

            <div
              style={{
                backgroundColor: '#181819',
                border: '1px solid rgba(201,168,76,0.1)',
                borderRadius: '2px',
                padding: '28px',
              }}
            >
              <h3
                style={{
                  fontFamily: 'var(--font-serif, serif)',
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#F0EDE6',
                  margin: '0 0 20px',
                }}
              >
                Receita por Plano
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {PLANOS.filter((p) => p.valor > 0).map((plano) => {
                  const assinantes = corretores.filter((c) => c.plano === plano.id).length
                  const receita = plano.valor * assinantes
                  const pct = metricas.mrrTotal > 0 ? (receita / metricas.mrrTotal) * 100 : 0

                  return (
                    <div key={plano.id}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '8px',
                        }}
                      >
                        <span style={{ fontSize: '15px', color: '#F0EDE6' }}>{plano.nome}</span>
                        <span style={{ fontSize: '15px', color: plano.cor, fontWeight: 600 }}>
                          {formatCurrency(receita)} ({pct.toFixed(1)}%)
                        </span>
                      </div>
                      <div
                        style={{
                          height: '8px',
                          backgroundColor: '#232324',
                          borderRadius: '4px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${pct}%`,
                            backgroundColor: plano.cor,
                            borderRadius: '4px',
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
