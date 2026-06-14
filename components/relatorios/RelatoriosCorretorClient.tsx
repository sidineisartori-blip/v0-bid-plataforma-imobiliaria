'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'

const CORES = {
  ouro:  '#C9A84C',
  verde: '#5CB88A',
  azul:  '#5C9BE0',
  roxo:  '#9B7FE0',
  coral: '#E07C5C',
  cinza: '#9B9690',
  fundo: '#0E0E0F',
  card:  '#181819',
  borda: '#232324',
}

interface DadosCorretor {
  plano: string
  resumo: {
    totalImoveis: number
    imoveisAtivos: number
    totalSolicitacoes: number
    solsAtivas: number
    totalMatches: number
    matchesAceitos: number
    totalNegociacoes: number
    negsAtivas: number
    totalContratos: number
    totalLeads: number
    totalViews: number
    totalContatos: number
    valorMedioImovel: number
    scoreMedio: number
  }
  imoveisPorTipo: { tipo: string; venda: number; aluguel: number }[]
  solPorNegocio: { tipo: string; total: number }[]
  matches: { internos: number; externos: number; aceitos: number; pendentes: number }
  evolucao: {
    imoveis:      { mes: string; total: number }[]
    solicitacoes: { mes: string; total: number }[]
    matches:      { mes: string; total: number }[]
    leads:        { mes: string; total: number }[]
  }
  funil: { etapa: string; valor: number }[]
}

type Aba = 'visao-geral' | 'portfolio' | 'matches' | 'desempenho'

function KpiCard({ label, valor, cor, sub }: { label: string; valor: string | number; cor?: string; sub?: string }) {
  return (
    <div style={{ backgroundColor: CORES.card, border: `1px solid ${cor ? cor + '30' : CORES.borda}`, borderRadius: 4, padding: '20px 24px' }}>
      <p style={{ fontSize: 11, color: CORES.cinza, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 8px' }}>{label}</p>
      <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 30, fontWeight: 700, color: cor || '#F0EDE6', margin: 0 }}>{valor}</p>
      {sub && <p style={{ fontSize: 12, color: CORES.cinza, margin: '5px 0 0' }}>{sub}</p>}
    </div>
  )
}

function ChartCard({ title, children, height = 240 }: { title: string; children: React.ReactNode; height?: number }) {
  return (
    <div style={{ backgroundColor: CORES.card, border: `1px solid ${CORES.borda}`, borderRadius: 4, padding: '20px 16px' }}>
      <p style={{ fontSize: 12, color: CORES.cinza, margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{title}</p>
      <div style={{ height }}>{children}</div>
    </div>
  )
}

const tooltipStyle = {
  contentStyle: { backgroundColor: '#1E1E20', border: `1px solid ${CORES.borda}`, borderRadius: 4 },
  labelStyle: { color: '#F0EDE6', fontSize: 13 },
  itemStyle: { color: CORES.cinza, fontSize: 13 },
}

function PlanoBloqueio({ plano, onUpgrade }: { plano: string; onUpgrade: () => void }) {
  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 24,
      textAlign: 'center',
      padding: 40,
    }}>
      <div style={{
        width: 80, height: 80,
        borderRadius: '50%',
        backgroundColor: `${CORES.ouro}15`,
        border: `2px solid ${CORES.ouro}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 32,
      }}>
        📊
      </div>
      <div>
        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 26, color: '#F0EDE6', margin: '0 0 12px' }}>
          Relatórios Avançados
        </h2>
        <p style={{ fontSize: 15, color: CORES.cinza, maxWidth: 480, lineHeight: 1.6, margin: 0 }}>
          Tenha visibilidade total do seu portfólio com gráficos de desempenho, funil de conversão e análise de matches.
          Disponível no plano <strong style={{ color: CORES.azul }}>Pro</strong> ou superior.
        </p>
      </div>
      <div style={{
        backgroundColor: CORES.card,
        border: `1px solid ${CORES.borda}`,
        borderRadius: 4,
        padding: '20px 32px',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 24,
      }}>
        {[
          { icon: '📈', label: 'Evolução Mensal' },
          { icon: '🎯', label: 'Funil de Conversão' },
          { icon: '🏠', label: 'Análise do Portfólio' },
          { icon: '🤝', label: 'Score de Matches' },
          { icon: '👁️', label: 'Views & Contatos' },
          { icon: '⚡', label: 'Tendências' },
        ].map(f => (
          <div key={f.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{f.icon}</div>
            <p style={{ fontSize: 12, color: CORES.cinza, margin: 0 }}>{f.label}</p>
          </div>
        ))}
      </div>
      <div>
        <p style={{ fontSize: 13, color: CORES.cinza, marginBottom: 12 }}>
          Seu plano atual: <span style={{ color: '#F0EDE6', fontWeight: 600, textTransform: 'uppercase' }}>{plano}</span>
        </p>
        <button
          onClick={onUpgrade}
          style={{
            backgroundColor: CORES.azul,
            border: 'none',
            borderRadius: 4,
            color: '#0E0E0F',
            fontSize: 15,
            fontWeight: 700,
            padding: '14px 36px',
            cursor: 'pointer',
          }}
        >
          Fazer Upgrade para Pro
        </button>
      </div>
    </div>
  )
}

export default function RelatoriosCorretorClient({
  planoAtual,
  temAcesso,
}: {
  planoAtual: string
  temAcesso: boolean
}) {
  const router = useRouter()
  const [dados, setDados] = useState<DadosCorretor | null>(null)
  const [loading, setLoading] = useState(temAcesso)
  const [aba, setAba] = useState<Aba>('visao-geral')

  useEffect(() => {
    if (!temAcesso) return
    fetch('/api/relatorios/corretor')
      .then(r => r.json())
      .then(d => { setDados(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [temAcesso])

  if (!temAcesso) {
    return <PlanoBloqueio plano={planoAtual} onUpgrade={() => router.push('/plano')} />
  }

  if (loading || !dados) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ width: 36, height: 36, border: `3px solid ${CORES.borda}`, borderTopColor: CORES.ouro, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  const r = dados.resumo

  const abas: { id: Aba; label: string }[] = [
    { id: 'visao-geral',  label: 'Visão Geral' },
    { id: 'portfolio',    label: 'Portfólio' },
    { id: 'matches',      label: 'Matches' },
    { id: 'desempenho',   label: 'Desempenho' },
  ]

  // Combina evolução em 1 array
  const evolucaoCombinada = dados.evolucao.imoveis.map((item, i) => ({
    mes: item.mes,
    imoveis:      item.total,
    solicitacoes: dados.evolucao.solicitacoes[i]?.total || 0,
    matches:      dados.evolucao.matches[i]?.total || 0,
    leads:        dados.evolucao.leads[i]?.total || 0,
  }))

  const coresSecundarias = [CORES.azul, CORES.roxo, CORES.verde, CORES.coral, CORES.ouro, CORES.cinza]

  return (
    <div style={{ padding: '32px 40px' }}>
      {/* Cabeçalho */}
      <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, fontWeight: 700, color: '#F0EDE6', margin: '0 0 6px' }}>
            Relatórios
          </h1>
          <p style={{ fontSize: 14, color: CORES.cinza, margin: 0 }}>
            Análise completa do seu desempenho na plataforma
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontSize: 12,
            padding: '4px 12px',
            borderRadius: 2,
            backgroundColor: `${CORES.azul}20`,
            color: CORES.azul,
            textTransform: 'uppercase',
            fontWeight: 600,
            letterSpacing: '0.08em',
          }}>
            Plano {dados.plano}
          </span>
          <span style={{ fontSize: 12, color: CORES.cinza }}>
            {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Abas */}
      <div style={{ borderBottom: `1px solid ${CORES.borda}`, marginBottom: 32, display: 'flex' }}>
        {abas.map(({ id, label }) => (
          <button key={id} onClick={() => setAba(id)} style={{
            background: 'none', border: 'none',
            borderBottom: aba === id ? `2px solid ${CORES.ouro}` : '2px solid transparent',
            color: aba === id ? CORES.ouro : CORES.cinza,
            fontSize: 14, fontWeight: aba === id ? 600 : 400,
            padding: '10px 20px', cursor: 'pointer',
          }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── VISÃO GERAL ── */}
      {aba === 'visao-geral' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            <KpiCard label="Meus Imóveis" valor={r.totalImoveis} cor={CORES.azul} sub={`${r.imoveisAtivos} disponíveis`} />
            <KpiCard label="Solicitações" valor={r.totalSolicitacoes} cor={CORES.roxo} sub={`${r.solsAtivas} ativas`} />
            <KpiCard label="Matches" valor={r.totalMatches} cor={CORES.verde} sub={`${r.matchesAceitos} aceitos`} />
            <KpiCard label="Contratos" valor={r.totalContratos} cor={CORES.ouro} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            <KpiCard label="Leads Gerados" valor={r.totalLeads} />
            <KpiCard label="Visualizações" valor={r.totalViews} />
            <KpiCard label="Contatos Recebidos" valor={r.totalContatos} />
            <KpiCard label="Score Médio de Match" valor={`${r.scoreMedio}%`} cor={CORES.ouro} />
          </div>

          <div>
            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 16, color: '#F0EDE6', margin: '0 0 16px', paddingBottom: 10, borderBottom: `1px solid ${CORES.borda}` }}>
              Evolução Mensal (6 meses)
            </h3>
            <ChartCard title="Imóveis · Solicitações · Matches · Leads" height={280}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={evolucaoCombinada}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CORES.borda} />
                  <XAxis dataKey="mes" tick={{ fill: CORES.cinza, fontSize: 12 }} />
                  <YAxis tick={{ fill: CORES.cinza, fontSize: 12 }} />
                  <Tooltip {...tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12, color: CORES.cinza }} />
                  <Line type="monotone" dataKey="imoveis"      stroke={CORES.azul}  strokeWidth={2} dot={{ r: 3 }} name="Imóveis" />
                  <Line type="monotone" dataKey="solicitacoes" stroke={CORES.roxo}  strokeWidth={2} dot={{ r: 3 }} name="Solicitações" />
                  <Line type="monotone" dataKey="matches"      stroke={CORES.verde} strokeWidth={2} dot={{ r: 3 }} name="Matches" />
                  <Line type="monotone" dataKey="leads"        stroke={CORES.ouro}  strokeWidth={2} dot={{ r: 3 }} name="Leads" />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </div>
      )}

      {/* ── PORTFÓLIO ── */}
      {aba === 'portfolio' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            <KpiCard label="Total Imóveis" valor={r.totalImoveis} cor={CORES.azul} />
            <KpiCard label="Valor Médio" valor={formatCurrency(r.valorMedioImovel)} cor={CORES.ouro} />
            <KpiCard label="Visualizações" valor={r.totalViews} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <ChartCard title="Imóveis por Tipo (Venda vs. Aluguel)">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dados.imoveisPorTipo}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CORES.borda} />
                  <XAxis dataKey="tipo" tick={{ fill: CORES.cinza, fontSize: 11 }} />
                  <YAxis tick={{ fill: CORES.cinza, fontSize: 12 }} />
                  <Tooltip {...tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="venda"   name="Venda"   fill={CORES.azul}  radius={[3, 3, 0, 0]} />
                  <Bar dataKey="aluguel" name="Aluguel" fill={CORES.roxo}  radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Solicitações por Objetivo">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={dados.solPorNegocio.filter(s => s.total > 0)} dataKey="total" nameKey="tipo" cx="50%" cy="50%" outerRadius={90} label={({ tipo, percent }) => `${tipo} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    <Cell fill={CORES.azul} />
                    <Cell fill={CORES.roxo} />
                  </Pie>
                  <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v} solicitações`]} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

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
            <ChartCard title="Novos Leads por Mês">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dados.evolucao.leads}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CORES.borda} />
                  <XAxis dataKey="mes" tick={{ fill: CORES.cinza, fontSize: 12 }} />
                  <YAxis tick={{ fill: CORES.cinza, fontSize: 12 }} />
                  <Tooltip {...tooltipStyle} />
                  <Line type="monotone" dataKey="total" stroke={CORES.ouro} strokeWidth={2} dot={{ r: 4 }} name="Leads" />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </div>
      )}

      {/* ── MATCHES ── */}
      {aba === 'matches' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            <KpiCard label="Total Matches" valor={r.totalMatches} />
            <KpiCard label="Aceitos" valor={r.matchesAceitos} cor={CORES.verde} sub={`${r.totalMatches > 0 ? Math.round(r.matchesAceitos / r.totalMatches * 100) : 0}% de conversão`} />
            <KpiCard label="Score Médio" valor={`${r.scoreMedio}%`} cor={CORES.ouro} />
            <KpiCard label="Negociações" valor={r.totalNegociacoes} cor={CORES.azul} sub={`${r.negsAtivas} ativas`} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <ChartCard title="Matches Internos vs. Externos">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { nome: 'Internos', valor: dados.matches.internos },
                      { nome: 'Externos', valor: dados.matches.externos },
                    ].filter(d => d.valor > 0)}
                    dataKey="valor" nameKey="nome" cx="50%" cy="50%" outerRadius={90}
                    label={({ nome, percent }) => `${nome} ${(percent * 100).toFixed(0)}%`} labelLine={false}
                  >
                    <Cell fill={CORES.azul} />
                    <Cell fill={CORES.verde} />
                  </Pie>
                  <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v} matches`]} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Status dos Matches">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { status: 'Pendentes', total: dados.matches.pendentes, cor: CORES.cinza },
                    { status: 'Aceitos',   total: dados.matches.aceitos,   cor: CORES.verde },
                  ]}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={CORES.borda} horizontal={false} />
                  <XAxis type="number" tick={{ fill: CORES.cinza, fontSize: 12 }} />
                  <YAxis dataKey="status" type="category" tick={{ fill: CORES.cinza, fontSize: 13 }} width={80} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="total" name="Matches" radius={[0, 3, 3, 0]}>
                    <Cell fill={CORES.cinza} />
                    <Cell fill={CORES.verde} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <div>
            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 16, color: '#F0EDE6', margin: '0 0 16px', paddingBottom: 10, borderBottom: `1px solid ${CORES.borda}` }}>
              Funil de Conversão
            </h3>
            <div style={{ backgroundColor: CORES.card, border: `1px solid ${CORES.borda}`, borderRadius: 4, padding: 24 }}>
              {dados.funil.map((etapa, i) => {
                const max = dados.funil[0]?.valor || 1
                const pct = Math.round((etapa.valor / max) * 100)
                const cores = [CORES.azul, CORES.roxo, CORES.ouro, CORES.verde, CORES.azul, CORES.verde]
                return (
                  <div key={etapa.etapa} style={{ marginBottom: i < dados.funil.length - 1 ? 18 : 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 14, color: '#F0EDE6' }}>{etapa.etapa}</span>
                      <span style={{ fontSize: 14, color: cores[i], fontWeight: 600 }}>
                        {etapa.valor} <span style={{ color: CORES.cinza, fontWeight: 400 }}>({pct}%)</span>
                      </span>
                    </div>
                    <div style={{ height: 8, backgroundColor: CORES.borda, borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, backgroundColor: cores[i], borderRadius: 4, transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── DESEMPENHO ── */}
      {aba === 'desempenho' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            <KpiCard label="Visualizações Totais" valor={r.totalViews} cor={CORES.azul} />
            <KpiCard label="Contatos Recebidos" valor={r.totalContatos} cor={CORES.verde} />
            <KpiCard label="Taxa de Contato" valor={r.totalViews > 0 ? `${Math.round(r.totalContatos / r.totalViews * 100)}%` : '—'} cor={CORES.ouro} sub="contatos / visualizações" />
          </div>

          <div>
            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 16, color: '#F0EDE6', margin: '0 0 16px', paddingBottom: 10, borderBottom: `1px solid ${CORES.borda}` }}>
              Atividade Mensal
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <ChartCard title="Matches por Mês">
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
              <ChartCard title="Solicitações por Mês">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dados.evolucao.solicitacoes}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CORES.borda} />
                    <XAxis dataKey="mes" tick={{ fill: CORES.cinza, fontSize: 12 }} />
                    <YAxis tick={{ fill: CORES.cinza, fontSize: 12 }} />
                    <Tooltip {...tooltipStyle} />
                    <Line type="monotone" dataKey="total" stroke={CORES.roxo} strokeWidth={2} dot={{ r: 4 }} name="Solicitações" />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </div>

          {/* Scorecard resumo */}
          <div style={{ backgroundColor: CORES.card, border: `1px solid ${CORES.borda}`, borderRadius: 4, padding: 28 }}>
            <p style={{ fontSize: 13, color: CORES.cinza, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, margin: '0 0 20px' }}>Scorecard de Desempenho</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              {[
                { label: 'Taxa de Matches Aceitos', valor: r.totalMatches > 0 ? `${Math.round(r.matchesAceitos / r.totalMatches * 100)}%` : '—', meta: '> 30%', ok: r.totalMatches > 0 && r.matchesAceitos / r.totalMatches > 0.3 },
                { label: 'Conversão Lead → Match',   valor: r.totalLeads > 0 ? `${Math.round(r.totalMatches / r.totalLeads * 100)}%` : '—', meta: '> 20%', ok: r.totalLeads > 0 && r.totalMatches / r.totalLeads > 0.2 },
                { label: 'Score Médio de Match',      valor: `${r.scoreMedio}%`, meta: '> 75%', ok: r.scoreMedio > 75 },
                { label: 'Taxa de Contato',            valor: r.totalViews > 0 ? `${Math.round(r.totalContatos / r.totalViews * 100)}%` : '—', meta: '> 5%', ok: r.totalViews > 0 && r.totalContatos / r.totalViews > 0.05 },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', backgroundColor: '#1C1C1E', borderRadius: 4 }}>
                  <div>
                    <p style={{ fontSize: 13, color: '#F0EDE6', margin: '0 0 4px' }}>{item.label}</p>
                    <p style={{ fontSize: 12, color: CORES.cinza, margin: 0 }}>Meta: {item.meta}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 22, fontWeight: 700, color: item.ok ? CORES.verde : CORES.coral, margin: 0 }}>{item.valor}</p>
                    <p style={{ fontSize: 11, color: item.ok ? CORES.verde : CORES.coral, margin: '2px 0 0' }}>{item.ok ? '✓ Meta atingida' : '↗ Abaixo da meta'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
