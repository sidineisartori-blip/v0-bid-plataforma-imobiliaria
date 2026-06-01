'use client'

import React from 'react'
import Link from 'next/link'
import type { Corretor, Imovel, Solicitacao, Match, Negociacao } from '@/types/bid'
import { formatCurrency, STATUS_LABELS, STATUS_COLORS, KANBAN_COLUNAS, getImovelEmoji } from '@/lib/format'

interface DashboardClientProps {
  corretor: Corretor | null
  imoveis: Imovel[]
  solicitacoes: Solicitacao[]
  matches: Match[]
  negociacoes: Negociacao[]
}

function MetricCard({
  label,
  value,
  accent,
}: {
  label: string
  value: number | string
  accent?: string
}) {
  return (
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
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: accent || '#C9A84C',
          marginBottom: '10px',
          fontWeight: 600,
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '36px',
          fontWeight: 700,
          color: '#F0EDE6',
          lineHeight: 1,
        }}
      >
        {value}
      </p>
    </div>
  )
}

export default function DashboardClient({
  corretor,
  imoveis,
  solicitacoes,
  matches,
  negociacoes,
}: DashboardClientProps) {
  const imoveisAtivos = imoveis.filter((i) => i.status === 'ativo').length
  const matchesExternos = matches.filter((m) => m.tipo === 'externo')
  const matchesInternos = matches.filter((m) => m.tipo === 'interno')

  const negociacoesPorColuna = KANBAN_COLUNAS.reduce<Record<string, Negociacao[]>>(
    (acc, col) => {
      acc[col] = negociacoes.filter((n) => n.coluna === col)
      return acc
    },
    {}
  )

  return (
    <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Alertas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {matchesExternos.length > 0 && (
          <div
            style={{
              backgroundColor: 'rgba(201,168,76,0.08)',
              border: '1px solid rgba(201,168,76,0.25)',
              borderRadius: '2px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <p style={{ fontSize: '15px', color: '#C9A84C' }}>
              Voce tem {matchesExternos.length} interessado(s) em imoveis compativeis.
            </p>
            <Link
              href="/matches"
              style={{
                fontSize: '14px',
                color: '#C9A84C',
                border: '1px solid rgba(201,168,76,0.4)',
                borderRadius: '2px',
                padding: '6px 16px',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              Ver Matches
            </Link>
          </div>
        )}

        {matchesInternos.length > 0 && (
          <div
            style={{
              backgroundColor: 'rgba(92,155,224,0.08)',
              border: '1px solid rgba(92,155,224,0.25)',
              borderRadius: '2px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <p style={{ fontSize: '15px', color: '#5C9BE0' }}>
              Voce tem {matchesInternos.length} compatibilidade(s) interna(s) na sua carteira.
            </p>
            <Link
              href="/matches"
              style={{
                fontSize: '14px',
                color: '#5C9BE0',
                border: '1px solid rgba(92,155,224,0.4)',
                borderRadius: '2px',
                padding: '6px 16px',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              Ver
            </Link>
          </div>
        )}

        <div
          style={{
            backgroundColor: 'rgba(224,92,92,0.08)',
            border: '1px solid rgba(224,92,92,0.25)',
            borderRadius: '2px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <p style={{ fontSize: '15px', color: '#E05C5C' }}>
            Parceria vence em 7 dias sem avanco no kanban.
          </p>
          <Link
            href="/crm"
            style={{
              fontSize: '14px',
              color: '#E05C5C',
              border: '1px solid rgba(224,92,92,0.4)',
              borderRadius: '2px',
              padding: '6px 16px',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            Ver CRM
          </Link>
        </div>
      </div>

      {/* Metricas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <MetricCard label="Imoveis Ativos" value={imoveisAtivos} />
        <MetricCard label="Matches Pendentes" value={matches.length} />
        <MetricCard label="Negociacoes" value={negociacoes.length} accent="#9B9690" />
        <MetricCard label="Solicitacoes Ativas" value={solicitacoes.length} accent="#9B9690" />
      </div>

      {/* CRM Kanban Mini */}
      <div
        style={{
          backgroundColor: '#181819',
          border: '1px solid rgba(201,168,76,0.1)',
          borderRadius: '2px',
          padding: '24px 28px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <p
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '18px',
              fontWeight: 600,
              color: '#F0EDE6',
            }}
          >
            CRM Kanban
          </p>
          <Link
            href="/crm"
            style={{ fontSize: '14px', color: '#C9A84C', textDecoration: 'none' }}
          >
            Ver completo &rarr;
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px', overflowX: 'auto' }}>
          {KANBAN_COLUNAS.map((coluna) => {
            const cards = negociacoesPorColuna[coluna] || []
            return (
              <div key={coluna}>
                <p
                  style={{
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: '#9B9690',
                    marginBottom: '10px',
                    fontWeight: 600,
                  }}
                >
                  {coluna}
                  <span
                    style={{
                      marginLeft: '8px',
                      backgroundColor: '#232324',
                      borderRadius: '9999px',
                      padding: '2px 8px',
                      fontSize: '11px',
                      color: '#F0EDE6',
                    }}
                  >
                    {cards.length}
                  </span>
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minHeight: '48px' }}>
                  {cards.slice(0, 3).map((neg) => (
                    <div
                      key={neg.id}
                      style={{
                        backgroundColor: '#232324',
                        borderLeft: '2px solid #C9A84C',
                        borderRadius: '1px',
                        padding: '8px 10px',
                        fontSize: '12px',
                        color: '#9B9690',
                      }}
                    >
                      #{neg.parceria_id.slice(0, 6)}
                    </div>
                  ))}
                  {cards.length === 0 && (
                    <div
                      style={{
                        border: '1px dashed #232324',
                        borderRadius: '2px',
                        height: '40px',
                      }}
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Grid 2 colunas: Matches + Imoveis */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Top Matches */}
        <div
          style={{
            backgroundColor: '#181819',
            border: '1px solid rgba(201,168,76,0.1)',
            borderRadius: '2px',
            padding: '24px 28px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: 600, color: '#F0EDE6' }}>
              Top Matches
            </p>
            <Link href="/matches" style={{ fontSize: '14px', color: '#C9A84C', textDecoration: 'none' }}>
              Ver todos &rarr;
            </Link>
          </div>

          {matches.length === 0 ? (
            <p style={{ fontSize: '15px', color: '#9B9690', textAlign: 'center', padding: '32px 0' }}>
              Nenhum match pendente
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {matches.slice(0, 4).map((match) => (
                <div
                  key={match.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '14px 16px',
                    backgroundColor: '#232324',
                    borderRadius: '2px',
                  }}
                >
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(201,168,76,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: 700,
                      color: '#C9A84C',
                      flexShrink: 0,
                    }}
                  >
                    {match.score}%
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '15px', color: '#F0EDE6', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {match.imovel?.titulo || match.imovel_id.slice(0, 12)}
                    </p>
                    <p style={{ fontSize: '13px', color: '#9B9690' }}>
                      {match.solicitacao?.cliente_nome || '—'} · {match.imovel?.cidade || ''}
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: '12px',
                      padding: '4px 10px',
                      borderRadius: '2px',
                      backgroundColor: match.tipo === 'interno' ? 'rgba(92,155,224,0.15)' : 'rgba(201,168,76,0.15)',
                      color: match.tipo === 'interno' ? '#5C9BE0' : '#C9A84C',
                      flexShrink: 0,
                    }}
                  >
                    {match.tipo}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Imoveis */}
        <div
          style={{
            backgroundColor: '#181819',
            border: '1px solid rgba(201,168,76,0.1)',
            borderRadius: '2px',
            padding: '24px 28px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: 600, color: '#F0EDE6' }}>
              Meus Imoveis
            </p>
            <Link href="/imoveis" style={{ fontSize: '14px', color: '#C9A84C', textDecoration: 'none' }}>
              Ver todos &rarr;
            </Link>
          </div>

          {imoveis.length === 0 ? (
            <p style={{ fontSize: '15px', color: '#9B9690', textAlign: 'center', padding: '32px 0' }}>
              Nenhum imovel cadastrado
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {imoveis.slice(0, 4).map((imovel) => {
                const sc = STATUS_COLORS[imovel.status]
                return (
                  <div
                    key={imovel.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '14px 16px',
                      backgroundColor: '#232324',
                      borderRadius: '2px',
                    }}
                  >
                    <span style={{ fontSize: '24px', flexShrink: 0 }}>{getImovelEmoji(imovel.tipo_imovel)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <p style={{ fontSize: '15px', color: '#F0EDE6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {imovel.titulo}
                        </p>
                        {imovel.lancamento && (
                          <span
                            style={{
                              fontSize: '10px',
                              padding: '2px 6px',
                              borderRadius: '2px',
                              backgroundColor: 'rgba(201,168,76,0.15)',
                              color: '#C9A84C',
                              flexShrink: 0,
                            }}
                          >
                            LANCAMENTO
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '13px', color: '#9B9690' }}>
                        {imovel.bairro ? `${imovel.bairro} · ` : ''}{formatCurrency(imovel.valor)}
                      </p>
                    </div>
                    <span
                      style={{
                        fontSize: '12px',
                        padding: '4px 10px',
                        borderRadius: '2px',
                        backgroundColor: sc.bg,
                        color: sc.text,
                        flexShrink: 0,
                      }}
                    >
                      {STATUS_LABELS[imovel.status]}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
