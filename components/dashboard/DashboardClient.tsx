'use client'

import React, { useMemo } from 'react'
import Link from 'next/link'
import type { Corretor, Imovel, Solicitacao, Match, Negociacao } from '@/types/bid'
import { formatCurrency, STATUS_LABELS, STATUS_COLORS, KANBAN_COLUNAS, getImovelEmoji } from '@/lib/format'
import { calcReajuste, calcVencimento } from '@/lib/vencimento'

interface ContratoResumido {
  id: string
  tipo: string
  status: string
  data_inicio: string | null
  data_fim: string | null
  indice_reajuste: string | null
  cliente_nome: string
  valor_aluguel: number | null
}

interface DashboardClientProps {
  corretor: Corretor | null
  imoveis: Imovel[]
  solicitacoes: Solicitacao[]
  matches: Match[]
  negociacoes: Negociacao[]
  contratos: ContratoResumido[]
  cobrancasAtrasadas: { id: string; valor: number; competencia: string }[]
  repassesPendentes: { id: string; valor_liquido: number }[]
}

function AlertaBanner({
  cor, bg, border, href, texto, cta,
}: {
  key?: React.Key; cor: string; bg: string; border: string; href: string; texto: React.ReactNode; cta: string
}) {
  return (
    <div style={{ backgroundColor: bg, border: `1px solid ${border}`, borderRadius: '2px', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <p style={{ fontSize: '14px', color: cor }}>{texto}</p>
      <Link href={href} style={{ fontSize: '13px', color: cor, border: `1px solid ${border}`, borderRadius: '2px', padding: '6px 14px', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>{cta}</Link>
    </div>
  )
}

function MetricCard({ label, value, accent, sub, icon }: { label: string; value: number | string; accent?: string; sub?: string; icon?: string }) {
  return (
    <div style={{ backgroundColor: '#181819', border: '1px solid rgba(201,168,76,0.1)', borderRadius: '2px', padding: '20px 24px' }}>
      {icon && <p style={{ fontSize: 20, marginBottom: 8, lineHeight: 1 }}>{icon}</p>}
      <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', color: accent || '#C9A84C', marginBottom: '8px', fontWeight: 600 }}>{label}</p>
      <p style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', fontWeight: 700, color: '#F0EDE6', lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: '#9B9690', marginTop: 6 }}>{sub}</p>}
    </div>
  )
}

export default function DashboardClient({
  corretor, imoveis, solicitacoes, matches, negociacoes,
  contratos, cobrancasAtrasadas, repassesPendentes,
}: DashboardClientProps) {
  const imoveisAtivos    = imoveis.filter((i) => i.status === 'ativo').length
  const matchesExternos  = matches.filter((m) => m.tipo === 'externo')
  const matchesInternos  = matches.filter((m) => m.tipo === 'interno')

  const negociacoesPorColuna = KANBAN_COLUNAS.reduce<Record<string, Negociacao[]>>(
    (acc, col) => { acc[col] = negociacoes.filter((n) => n.coluna === col); return acc }, {}
  )

  // Alertas de ERP
  const contratosAReajustar = useMemo(
    () => contratos.filter((c) => c.tipo === 'locacao' && c.status === 'ativo' && calcReajuste(c.data_inicio, c.indice_reajuste).precisaReajuste),
    [contratos]
  )
  const contratosVencendo = useMemo(
    () => contratos.filter((c) => {
      if (c.tipo !== 'locacao' || !c.data_fim) return false
      const v = calcVencimento(c.data_fim)
      return v.status === 'vence_hoje' || v.status === 'vence_amanha' || v.status === 'vence_em_breve'
    }),
    [contratos]
  )

  const totalCobrancasAtrasadas = cobrancasAtrasadas.reduce((s, c) => s + c.valor, 0)
  const totalRepassesPendentes  = repassesPendentes.reduce((s, r) => s + r.valor_liquido, 0)

  // KPIs ERP
  const contratosAtivos = contratos.filter((c) => c.status === 'ativo')
  const receitaMes = contratosAtivos.filter(c => c.tipo === 'locacao').reduce((s, c) => s + (c.valor_aluguel || 0), 0)

  return (
    <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── Saudação ── */}
      {corretor?.full_name && (
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 700, color: '#F0EDE6', marginBottom: 2 }}>
            Olá, {corretor.full_name.split(' ')[0]}
          </h1>
          <p style={{ fontSize: 13, color: '#9B9690' }}>
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
      )}

      {/* ── Alertas ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

        {/* Cobranças atrasadas */}
        {cobrancasAtrasadas.length > 0 && (
          <AlertaBanner
            cor="#E05C5C" bg="rgba(224,92,92,0.08)" border="rgba(224,92,92,0.25)"
            href="/erp" cta="Ver cobranças"
            texto={<><strong>{cobrancasAtrasadas.length}</strong> cobrança(s) em atraso — {formatCurrency(totalCobrancasAtrasadas)} a receber.</>}
          />
        )}

        {/* Repasses pendentes */}
        {repassesPendentes.length > 0 && (
          <AlertaBanner
            cor="#C9A84C" bg="rgba(201,168,76,0.08)" border="rgba(201,168,76,0.25)"
            href="/erp" cta="Ver repasses"
            texto={<><strong>{repassesPendentes.length}</strong> repasse(s) pendente(s) — {formatCurrency(totalRepassesPendentes)} a transferir.</>}
          />
        )}

        {/* Contratos a reajustar */}
        {contratosAReajustar.length > 0 && (
          <AlertaBanner
            cor="#E05C5C" bg="rgba(224,92,92,0.06)" border="rgba(224,92,92,0.2)"
            href="/erp" cta="Ver contratos"
            texto={<><strong>{contratosAReajustar.length}</strong> contrato(s) com reajuste nos próximos 30 dias ({contratosAReajustar.map((c: ContratoResumido) => c.indice_reajuste || 'IGPM').filter((v: string, i: number, a: string[]) => a.indexOf(v) === i).join(', ')}).</>}
          />
        )}

        {/* Contratos vencendo */}
        {contratosVencendo.length > 0 && (
          <AlertaBanner
            cor="#C9A84C" bg="rgba(201,168,76,0.06)" border="rgba(201,168,76,0.2)"
            href="/erp" cta="Ver contratos"
            texto={<><strong>{contratosVencendo.length}</strong> contrato(s) de locação vencendo em breve.</>}
          />
        )}

        {/* Matches externos */}
        {matchesExternos.length > 0 && (
          <AlertaBanner
            cor="#C9A84C" bg="rgba(201,168,76,0.06)" border="rgba(201,168,76,0.2)"
            href="/matches" cta="Ver matches"
            texto={<>Você tem <strong>{matchesExternos.length}</strong> interessado(s) em imóveis compatíveis.</>}
          />
        )}

        {/* Matches internos */}
        {matchesInternos.length > 0 && (
          <AlertaBanner
            cor="#5C9BE0" bg="rgba(92,155,224,0.06)" border="rgba(92,155,224,0.2)"
            href="/matches" cta="Ver"
            texto={<>Você tem <strong>{matchesInternos.length}</strong> compatibilidade(s) interna(s) na sua carteira.</>}
          />
        )}

        {/* Negociações paradas */}
        {negociacoes
          .filter((n) => Math.floor((Date.now() - new Date(n.updated_at).getTime()) / 86400000) >= 15 && n.coluna !== 'Concluído')
          .map((neg) => {
            const dias = Math.floor((Date.now() - new Date(neg.updated_at).getTime()) / 86400000)
            const titulo = (neg as any).parceria?.match?.imovel?.titulo || `Negociação #${neg.parceria_id.slice(0, 6)}`
            return (
              <AlertaBanner key={neg.id}
                cor="#E05C5C" bg="rgba(224,92,92,0.06)" border="rgba(224,92,92,0.2)"
                href="/crm" cta="Ver Card"
                texto={<><strong>{titulo} — {neg.coluna}</strong> sem atualização há {dias} dias.</>}
              />
            )
          })}
      </div>

      {/* ── KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: '14px' }}>
        <MetricCard icon="🏠" label="Imóveis Ativos"      value={imoveisAtivos} />
        <MetricCard icon="◎" label="Matches Pendentes"    value={matches.length} />
        <MetricCard icon="🤝" label="Negociações"          value={negociacoes.length} accent="#9B9690" />
        <MetricCard icon="📋" label="Solicitações Ativas"  value={solicitacoes.length} accent="#9B9690" />
        <MetricCard icon="📄" label="Contratos Ativos"     value={contratosAtivos.length} accent="#5CB88A" />
        <MetricCard icon="💰" label="Receita Mês"          value={formatCurrency(receitaMes)} accent="#5CB88A" sub="locações ativas" />
      </div>

      {/* ── CRM Kanban Mini ── */}
      <div style={{ backgroundColor: '#181819', border: '1px solid rgba(201,168,76,0.1)', borderRadius: '2px', padding: '24px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: 600, color: '#F0EDE6' }}>CRM Kanban</p>
          <Link href="/crm" style={{ fontSize: '14px', color: '#C9A84C', textDecoration: 'none' }}>Ver completo →</Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: '12px', overflowX: 'auto' }}>
          {KANBAN_COLUNAS.map((coluna) => {
            const cards = negociacoesPorColuna[coluna] || []
            return (
              <div key={coluna}>
                <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9B9690', marginBottom: '10px', fontWeight: 600 }}>
                  {coluna}
                  <span style={{ marginLeft: '8px', backgroundColor: '#232324', borderRadius: '9999px', padding: '2px 8px', fontSize: '11px', color: '#F0EDE6' }}>{cards.length}</span>
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minHeight: '48px' }}>
                  {cards.slice(0, 3).map((neg) => (
                    <div key={neg.id} style={{ backgroundColor: '#232324', borderLeft: '2px solid #C9A84C', borderRadius: '1px', padding: '8px 10px', fontSize: '12px', color: '#9B9690' }}>
                      #{neg.parceria_id.slice(0, 6)}
                    </div>
                  ))}
                  {cards.length === 0 && <div style={{ border: '1px dashed #232324', borderRadius: '2px', height: '40px' }} />}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Grid 2 colunas ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* Top Matches */}
        <div style={{ backgroundColor: '#181819', border: '1px solid rgba(201,168,76,0.1)', borderRadius: '2px', padding: '24px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: 600, color: '#F0EDE6' }}>Top Matches</p>
            <Link href="/matches" style={{ fontSize: '14px', color: '#C9A84C', textDecoration: 'none' }}>Ver todos →</Link>
          </div>
          {matches.length === 0 ? (
            <p style={{ fontSize: '14px', color: '#9B9690', textAlign: 'center', padding: '28px 0' }}>Nenhum match pendente</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {matches.slice(0, 4).map((match) => (
                <div key={match.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', backgroundColor: '#232324', borderRadius: '2px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(201,168,76,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: '#C9A84C', flexShrink: 0 }}>
                    {match.score}%
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '14px', color: '#F0EDE6', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {match.imovel?.titulo || match.imovel_id.slice(0, 12)}
                    </p>
                    <p style={{ fontSize: '12px', color: '#9B9690' }}>{match.solicitacao?.cliente_nome || '—'} · {match.imovel?.cidade || ''}</p>
                  </div>
                  <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '2px', backgroundColor: match.tipo === 'interno' ? 'rgba(92,155,224,0.15)' : 'rgba(201,168,76,0.15)', color: match.tipo === 'interno' ? '#5C9BE0' : '#C9A84C', flexShrink: 0 }}>
                    {match.tipo}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Meus Imóveis */}
        <div style={{ backgroundColor: '#181819', border: '1px solid rgba(201,168,76,0.1)', borderRadius: '2px', padding: '24px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: 600, color: '#F0EDE6' }}>Meus Imóveis</p>
            <Link href="/imoveis" style={{ fontSize: '14px', color: '#C9A84C', textDecoration: 'none' }}>Ver todos →</Link>
          </div>
          {imoveis.length === 0 ? (
            <p style={{ fontSize: '14px', color: '#9B9690', textAlign: 'center', padding: '28px 0' }}>Nenhum imóvel cadastrado</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {imoveis.slice(0, 4).map((imovel) => {
                const sc = STATUS_COLORS[imovel.status]
                return (
                  <div key={imovel.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', backgroundColor: '#232324', borderRadius: '2px' }}>
                    <span style={{ fontSize: '22px', flexShrink: 0 }}>{getImovelEmoji(imovel.tipo_imovel)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                        <p style={{ fontSize: '14px', color: '#F0EDE6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{imovel.titulo}</p>
                        {imovel.lancamento && <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '2px', backgroundColor: 'rgba(201,168,76,0.15)', color: '#C9A84C', flexShrink: 0 }}>LANÇAMENTO</span>}
                      </div>
                      <p style={{ fontSize: '12px', color: '#9B9690' }}>{imovel.bairro ? `${imovel.bairro} · ` : ''}{formatCurrency(imovel.valor)}</p>
                    </div>
                    <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '2px', backgroundColor: sc.bg, color: sc.text, flexShrink: 0 }}>{STATUS_LABELS[imovel.status]}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Contratos Ativos (mini-lista) ── */}
      {contratosAtivos.length > 0 && (
        <div style={{ backgroundColor: '#181819', border: '1px solid rgba(201,168,76,0.1)', borderRadius: '2px', padding: '24px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: 600, color: '#F0EDE6' }}>Contratos Ativos</p>
            <Link href="/erp" style={{ fontSize: '14px', color: '#C9A84C', textDecoration: 'none' }}>Ver ERP →</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {contratosAtivos.slice(0, 5).map((c) => {
              const reajuste = calcReajuste(c.data_inicio, c.indice_reajuste)
              const vencFim  = calcVencimento(c.data_fim)
              return (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', backgroundColor: '#232324', borderRadius: '2px', borderLeft: reajuste.precisaReajuste ? '2px solid #E05C5C' : '2px solid transparent' }}>
                  <span style={{ fontSize: '11px', padding: '2px 7px', borderRadius: 2, background: c.tipo === 'locacao' ? 'rgba(96,165,250,0.12)' : 'rgba(201,168,76,0.12)', color: c.tipo === 'locacao' ? '#60a5fa' : '#C9A84C', fontWeight: 600, flexShrink: 0 }}>
                    {c.tipo === 'locacao' ? 'Locação' : 'Venda'}
                  </span>
                  <p style={{ flex: 1, fontSize: 13, color: '#F0EDE6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.cliente_nome}</p>
                  {reajuste.precisaReajuste && (
                    <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 2, background: 'rgba(224,92,92,0.12)', color: '#E05C5C', fontWeight: 600, flexShrink: 0 }}>{reajuste.label}</span>
                  )}
                  {!reajuste.precisaReajuste && vencFim.status !== 'ok' && vencFim.status !== 'sem_data' && vencFim.status !== 'a_vencer' && (
                    <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 2, background: vencFim.bgCor, color: vencFim.cor, fontWeight: 600, flexShrink: 0 }}>{vencFim.label}</span>
                  )}
                  {c.valor_aluguel && <span style={{ fontSize: 12, color: '#9B9690', flexShrink: 0 }}>{formatCurrency(c.valor_aluguel)}/mês</span>}
                </div>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}
