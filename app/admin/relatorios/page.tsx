'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'

const CORES = {
  ouro:    '#C9A84C',
  verde:   '#5CB88A',
  azul:    '#5C9BE0',
  roxo:    '#9B7FE0',
  coral:   '#E07C5C',
  cinza:   '#9B9690',
  fundo:   '#0E0E0F',
  card:    '#181819',
  borda:   '#232324',
}

const CORES_PLANO: Record<string, string> = {
  free:       CORES.cinza,
  pro:        CORES.azul,
  premium:    CORES.ouro,
  enterprise: CORES.verde,
}

interface DadosMaster {
  resumo: {
    totalCorretores: number
    corretoresAtivos: number
    totalImoveis: number
    totalSolicitacoes: number
    totalMatches: number
    matchesAceitos: number
    totalNegociacoes: number
    totalContratos: number
    mrrTotal: number
    scoreMedio: number
  }
  corretoresPorPlano: { plano: string; total: number }[]
  imoveisPorTipo: { tipo: string; total: number }[]
  imoveisPorCidade: { cidade: string; imoveis: number; solicitacoes: number }[]
  funil: { etapa: string; valor: number }[]
  evolucao: {
    corretores: { mes: string; total: number }[]
    imoveis:    { mes: string; total: number }[]
    matches:    { mes: string; total: number }[]
  }
}

type Aba = 'visao-geral' | 'imoveis' | 'matches' | 'financeiro'

function KpiCard({ label, valor, cor, sub }: { label: string; valor: string | number; cor?: string; sub?: string }) {
  return (
    <div style={{
      backgroundColor: CORES.card,
      border: `1px solid ${cor ? cor + '30' : CORES.borda}`,
      borderRadius: 4,
      padding: '24px 28px',
    }}>
      <p style={{ fontSize: 11, color: CORES.cinza, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 10px' }}>
        {label}
      </p>
      <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 36, fontWeight: 700, color: cor || '#F0EDE6', margin: 0 }}>
        {valor}
      </p>
      {sub && <p style={{ fontSize: 12, color: CORES.cinza, margin: '6px 0 0' }}>{sub}</p>}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontFamily: 'Playfair Display, serif',
      fontSize: 18,
      fontWeight: 600,
      color: '#F0EDE6',
      margin: '0 0 20px',
      paddingBottom: 12,
      borderBottom: `1px solid ${CORES.borda}`,
    }}>
      {children}
    </h2>
  )
}

function ChartCard({ title, children, height = 260 }: { title: string; children: React.ReactNode; height?: number }) {
  return (
    <div style={{
      backgroundColor: CORES.card,
      border: `1px solid ${CORES.borda}`,
      borderRadius: 4,
      padding: '24px 20px',
    }}>
      <p style={{ fontSize: 13, color: CORES.cinza, margin: '0 0 20px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
        {title}
      </p>
      <div style={{ height }}>{children}</div>
    </div>
  )
}

const tooltipStyle = {
  contentStyle: { backgroundColor: '#1E1E20', border: `1px solid ${CORES.borda}`, borderRadius: 4 },
  labelStyle: { color: '#F0EDE6', fontSize: 13 },
  itemStyle: { color: CORES.cinza, fontSize: 13 },
}

export default function AdminRelatoriosPage() {
  const router = useRouter()
  const [dados, setDados] = useState<DadosMaster | null>(null)
  const [loading, setLoading] = useState(true)
  const [aba, setAba] = useState<Aba>('visao-geral')

  useEffect(() => {
    fetch('/api/admin/me')
      .then(r => { if (!r.ok) router.push('/admin/login') })
      .catch(() => router.push('/admin/login'))

    fetch('/api/relatorios/master')
      .then(r => r.json())
      .then(d => { setDados(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const abas: { id: Aba; label: string }[] = [
    { id: 'visao-geral', label: 'Visão Geral' },
    { id: 'imoveis',     label: 'Imóveis & Demanda' },
    { id: 'matches',     label: 'Matching & Funil' },
    { id: 'financeiro',  label: 'Financeiro' },
  ]

  if (loading || !dados) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: CORES.fundo, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, border: `3px solid ${CORES.borda}`, borderTopColor: CORES.ouro, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  const r = dados.resumo

  // Mescla evolução em 1 array para o LineChart combinado
  const evolucaoCombinada = dados.evolucao.corretores.map((c, i) => ({
    mes: c.mes,
    corretores: c.total,
    imoveis: dados.evolucao.imoveis[i]?.total || 0,
    matches: dados.evolucao.matches[i]?.total || 0,
  }))

  return (
    <div style={{ minHeight: '100vh', backgroundColor: CORES.fundo }}>
      {/* Header */}
      <header style={{ backgroundColor: CORES.card, borderBottom: `1px solid ${CORES.borda}`, padding: '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <button onClick={() => router.push('/admin/painel')} style={{ background: 'none', border: 'none', color: CORES.cinza, fontSize: 20, cursor: 'pointer', padding: 0, lineHeight: 1 }}>
            ←
          </button>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 24, fontWeight: 700, color: CORES.ouro, margin: 0 }}>BID</h1>
          <span style={{ fontSize: 14, color: CORES.cinza }}>Relatórios · Painel Master</span>
        </div>
        <span style={{ fontSize: 12, color: CORES.cinza }}>
          Atualizado em {new Date().toLocaleString('pt-BR')}
        </span>
      </header>

      <div style={{ padding: '40px' }}>
        {/* Abas */}
        <div style={{ borderBottom: `1px solid ${CORES.borda}`, marginBottom: 36, display: 'flex', gap: 0 }}>
          {abas.map(({ id, label }) => (
            <button key={id} onClick={() => setAba(id)} style={{
              background: 'none', border: 'none',
              borderBottom: aba === id ? `2px solid ${CORES.ouro}` : '2px solid transparent',
              color: aba === id ? CORES.ouro : CORES.cinza,
              fontSize: 14, fontWeight: aba === id ? 600 : 400,
              padding: '10px 20px', cursor: 'pointer', transition: 'color 0.15s',
            }}>
              {label}
            </button>
          ))}
        </div>

        {/* ── VISÃO GERAL ── */}
        {aba === 'visao-geral' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              <KpiCard label="Total Corretores" valor={r.totalCorretores} sub={`${r.corretoresAtivos} ativos`} />
              <KpiCard label="Imóveis Cadastrados" valor={r.totalImoveis} cor={CORES.azul} />
              <KpiCard label="Solicitações" valor={r.totalSolicitacoes} cor={CORES.roxo} />
              <KpiCard label="MRR" valor={formatCurrency(r.mrrTotal)} cor={CORES.ouro} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              <KpiCard label="Total Matches" valor={r.totalMatches} />
              <KpiCard label="Matches Aceitos" valor={r.matchesAceitos} cor={CORES.verde} />
              <KpiCard label="Negociações" valor={r.totalNegociacoes} cor={CORES.azul} />
              <KpiCard label="Score Médio" valor={`${r.scoreMedio}%`} cor={CORES.ouro} sub="qualidade dos matches" />
            </div>

            {/* Evolução combinada */}
            <div>
              <SectionTitle>Evolução Mensal (últimos 6 meses)</SectionTitle>
              <ChartCard title="Corretores · Imóveis · Matches" height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={evolucaoCombinada}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CORES.borda} />
                    <XAxis dataKey="mes" tick={{ fill: CORES.cinza, fontSize: 12 }} />
                    <YAxis tick={{ fill: CORES.cinza, fontSize: 12 }} />
                    <Tooltip {...tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 12, color: CORES.cinza }} />
                    <Line type="monotone" dataKey="corretores" stroke={CORES.ouro} strokeWidth={2} dot={{ r: 4 }} name="Corretores" />
                    <Line type="monotone" dataKey="imoveis"    stroke={CORES.azul} strokeWidth={2} dot={{ r: 4 }} name="Imóveis" />
                    <Line type="monotone" dataKey="matches"    stroke={CORES.verde} strokeWidth={2} dot={{ r: 4 }} name="Matches" />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* Corretores por plano */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <ChartCard title="Corretores por Plano">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dados.corretoresPorPlano} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={CORES.borda} horizontal={false} />
                    <XAxis type="number" tick={{ fill: CORES.cinza, fontSize: 12 }} />
                    <YAxis dataKey="plano" type="category" tick={{ fill: CORES.cinza, fontSize: 12 }} width={80} />
                    <Tooltip {...tooltipStyle} />
                    <Bar dataKey="total" name="Corretores" radius={[0, 3, 3, 0]}>
                      {dados.corretoresPorPlano.map((entry) => (
                        <Cell key={entry.plano} fill={CORES_PLANO[entry.plano] || CORES.cinza} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Distribuição por Plano (%)">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={dados.corretoresPorPlano.filter(p => p.total > 0)} dataKey="total" nameKey="plano" cx="50%" cy="50%" outerRadius={90} label={({ plano, percent }: { plano?: string; percent?: number }) => `${plano ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                      {dados.corretoresPorPlano.map((entry) => (
                        <Cell key={entry.plano} fill={CORES_PLANO[entry.plano] || CORES.cinza} />
                      ))}
                    </Pie>
                    <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v} corretores`]} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </div>
        )}

        {/* ── IMÓVEIS & DEMANDA ── */}
        {aba === 'imoveis' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              <KpiCard label="Total Imóveis" valor={r.totalImoveis} cor={CORES.azul} />
              <KpiCard label="Total Solicitações" valor={r.totalSolicitacoes} cor={CORES.roxo} />
              <KpiCard label="Razão Oferta/Demanda" valor={r.totalSolicitacoes > 0 ? (r.totalImoveis / r.totalSolicitacoes).toFixed(2) : '—'} sub="imóveis por solicitação" />
            </div>

            <div>
              <SectionTitle>Imóveis por Tipo</SectionTitle>
              <ChartCard title="Distribuição por Tipo de Imóvel" height={280}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dados.imoveisPorTipo}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CORES.borda} />
                    <XAxis dataKey="tipo" tick={{ fill: CORES.cinza, fontSize: 12 }} />
                    <YAxis tick={{ fill: CORES.cinza, fontSize: 12 }} />
                    <Tooltip {...tooltipStyle} />
                    <Bar dataKey="total" name="Imóveis" fill={CORES.azul} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            <div>
              <SectionTitle>Oferta vs. Demanda por Cidade</SectionTitle>
              <ChartCard title="Imóveis e Solicitações por Cidade" height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dados.imoveisPorCidade}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CORES.borda} />
                    <XAxis dataKey="cidade" tick={{ fill: CORES.cinza, fontSize: 11 }} angle={-20} textAnchor="end" height={50} />
                    <YAxis tick={{ fill: CORES.cinza, fontSize: 12 }} />
                    <Tooltip {...tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 12, color: CORES.cinza }} />
                    <Bar dataKey="imoveis"     name="Imóveis"      fill={CORES.azul}   radius={[3, 3, 0, 0]} />
                    <Bar dataKey="solicitacoes" name="Solicitações" fill={CORES.roxo}   radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            <div>
              <SectionTitle>Evolução Mensal</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <ChartCard title="Novos Imóveis por Mês">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dados.evolucao.imoveis}>
                      <CartesianGrid strokeDasharray="3 3" stroke={CORES.borda} />
                      <XAxis dataKey="mes" tick={{ fill: CORES.cinza, fontSize: 12 }} />
                      <YAxis tick={{ fill: CORES.cinza, fontSize: 12 }} />
                      <Tooltip {...tooltipStyle} />
                      <Bar dataKey="total" name="Imóveis" fill={CORES.azul} radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
                <ChartCard title="Novos Corretores por Mês">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dados.evolucao.corretores}>
                      <CartesianGrid strokeDasharray="3 3" stroke={CORES.borda} />
                      <XAxis dataKey="mes" tick={{ fill: CORES.cinza, fontSize: 12 }} />
                      <YAxis tick={{ fill: CORES.cinza, fontSize: 12 }} />
                      <Tooltip {...tooltipStyle} />
                      <Line type="monotone" dataKey="total" stroke={CORES.ouro} strokeWidth={2} dot={{ r: 4 }} name="Corretores" />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
            </div>
          </div>
        )}

        {/* ── MATCHING & FUNIL ── */}
        {aba === 'matches' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              <KpiCard label="Total Matches" valor={r.totalMatches} />
              <KpiCard label="Aceitos" valor={r.matchesAceitos} cor={CORES.verde} sub={`${r.totalMatches > 0 ? Math.round(r.matchesAceitos / r.totalMatches * 100) : 0}% de conversão`} />
              <KpiCard label="Negociações" valor={r.totalNegociacoes} cor={CORES.azul} />
              <KpiCard label="Score Médio" valor={`${r.scoreMedio}%`} cor={CORES.ouro} />
            </div>

            <div>
              <SectionTitle>Funil de Conversão da Plataforma</SectionTitle>
              <div style={{ backgroundColor: CORES.card, border: `1px solid ${CORES.borda}`, borderRadius: 4, padding: 28 }}>
                {dados.funil.map((etapa, i) => {
                  const max = dados.funil[0]?.valor || 1
                  const pct = Math.round((etapa.valor / max) * 100)
                  const cores = [CORES.azul, CORES.roxo, CORES.ouro, CORES.verde, CORES.azul, CORES.verde]
                  return (
                    <div key={etapa.etapa} style={{ marginBottom: i < dados.funil.length - 1 ? 20 : 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 14, color: '#F0EDE6' }}>{etapa.etapa}</span>
                        <span style={{ fontSize: 14, color: cores[i], fontWeight: 600 }}>
                          {etapa.valor} <span style={{ color: CORES.cinza, fontWeight: 400 }}>({pct}%)</span>
                        </span>
                      </div>
                      <div style={{ height: 10, backgroundColor: CORES.borda, borderRadius: 5, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, backgroundColor: cores[i], borderRadius: 5, transition: 'width 0.5s ease' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div>
              <SectionTitle>Evolução dos Matches</SectionTitle>
              <ChartCard title="Novos Matches por Mês" height={280}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dados.evolucao.matches}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CORES.borda} />
                    <XAxis dataKey="mes" tick={{ fill: CORES.cinza, fontSize: 12 }} />
                    <YAxis tick={{ fill: CORES.cinza, fontSize: 12 }} />
                    <Tooltip {...tooltipStyle} />
                    <Bar dataKey="total" name="Matches" fill={CORES.verde} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </div>
        )}

        {/* ── FINANCEIRO ── */}
        {aba === 'financeiro' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              <KpiCard label="MRR Total" valor={formatCurrency(r.mrrTotal)} cor={CORES.ouro} />
              <KpiCard label="ARR Projetado" valor={formatCurrency(r.mrrTotal * 12)} cor={CORES.verde} />
              <KpiCard label="Contratos Ativos" valor={r.totalContratos} cor={CORES.azul} />
              <KpiCard label="Corretores Pagos" valor={r.corretoresAtivos} sub="plano pro ou superior" />
            </div>

            <div>
              <SectionTitle>Receita por Plano</SectionTitle>
              <div style={{ backgroundColor: CORES.card, border: `1px solid ${CORES.borda}`, borderRadius: 4, padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
                {[
                  { id: 'pro', nome: 'Pro', valor: 97 },
                  { id: 'premium', nome: 'Premium', valor: 240 },
                  { id: 'enterprise', nome: 'Enterprise', valor: 720 },
                ].map(plano => {
                  const assinantes = (dados.corretoresPorPlano.find(p => p.plano === plano.id)?.total || 0)
                  const receita = plano.valor * assinantes
                  const pct = r.mrrTotal > 0 ? (receita / r.mrrTotal) * 100 : 0
                  const cor = CORES_PLANO[plano.id]
                  return (
                    <div key={plano.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div>
                          <span style={{ fontSize: 15, color: '#F0EDE6' }}>{plano.nome}</span>
                          <span style={{ fontSize: 13, color: CORES.cinza, marginLeft: 12 }}>{assinantes} assinante{assinantes !== 1 ? 's' : ''} × {formatCurrency(plano.valor)}</span>
                        </div>
                        <span style={{ fontSize: 15, color: cor, fontWeight: 600 }}>
                          {formatCurrency(receita)} <span style={{ color: CORES.cinza, fontWeight: 400, fontSize: 13 }}>({pct.toFixed(1)}%)</span>
                        </span>
                      </div>
                      <div style={{ height: 10, backgroundColor: CORES.borda, borderRadius: 5, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, backgroundColor: cor, borderRadius: 5, transition: 'width 0.5s ease' }} />
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
