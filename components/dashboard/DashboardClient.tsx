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
        padding: '20px 24px',
      }}
    >
      <p
        style={{
          fontSize: '9px',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: accent || '#C9A84C',
          marginBottom: '8px',
          fontWeight: 600,
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '28px',
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
    <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Alertas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {matchesExternos.length > 0 && (
          <div
            style={{
              backgroundColor: 'rgba(201,168,76,0.08)',
              border: '1px solid rgba(201,168,76,0.25)',
              borderRadius: '2px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <p style={{ fontSize: '13px', color: '#C9A84C' }}>
              Voce tem {matchesExternos.length} interessado(s) em imoveis compativeis.
            </p>
            <Link
              href="/matches"
              style={{
                fontSize: '12px',
                color: '#C9A84C',
                border: '1px solid rgba(201,168,76,0.4)',
                borderRadius: '2px',
                padding: '4px 12px',
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
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <p style={{ fontSize: '13px', color: '#5C9BE0' }}>
              Voce tem {matchesInternos.length} compatibilidade(s) interna(s) na sua carteira.
            </p>
            <Link
              href="/matches"
              style={{
                fontSize: '12px',
                color: '#5C9BE0',
                border: '1px solid rgba(92,155,224,0.4)',
                borderRadius: '2px',
                padding: '4px 12px',
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
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <p style={{ fontSize: '13px', color: '#E05C5C' }}>
            Parceria vence em 7 dias sem avanco no kanban.
          </p>
          <Link
            href="/crm"
            style={{
              fontSize: '12px',
              color: '#E05C5C',
              border: '1px solid rgba(224,92,92,0.4)',
              borderRadius: '2px',
              padding: '4px 12px',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            Ver CRM
          </Link>
        </div>
      </div>

      {/* Métricas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
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
          padding: '20px 24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <p
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '15px',
              fontWeight: 600,
              color: '#F0EDE6',
            }}
          >
            CRM Kanban
          </p>
          <Link
            href="/crm"
            style={{ fontSize: '12px', color: '#C9A84C', textDecoration: 'none' }}
          >
            Ver completo &rarr;
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px', overflowX: 'auto' }}>
          {KANBAN_COLUNAS.map((coluna) => {
            const cards = negociacoesPorColuna[coluna] || []
            return (
              <div key={coluna}>
                <p
                  style={{
                    fontSize: '9px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: '#9B9690',
                    marginBottom: '8px',
                    fontWeight: 600,
                  }}
                >
                  {coluna}
                  <span
                    style={{
                      marginLeft: '6px',
                      backgroundColor: '#232324',
                      borderRadius: '9999px',
                      padding: '1px 6px',
                      fontSize: '9px',
                      color: '#F0EDE6',
                    }}
                  >
                    {cards.length}
                  </span>
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minHeight: '40px' }}>
                  {cards.slice(0, 3).map((neg) => (
                    <div
                      key={neg.id}
                      style={{
                        backgroundColor: '#232324',
                        borderLeft: '2px solid #C9A84C',
                        borderRadius: '1px',
                        padding: '6px 8px',
                        fontSize: '10px',
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
                        height: '32px',
                      }}
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Grid 2 colunas: Matches + Imóveis */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Top Matches */}
        <div
          style={{
            backgroundColor: '#181819',
            border: '1px solid rgba(201,168,76,0.1)',
            borderRadius: '2px',
            padding: '20px 24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: '15px', fontWeight: 600, color: '#F0EDE6' }}>
              Top Matches
            </p>
            <Link href="/matches" style={{ fontSize: '12px', color: '#C9A84C', textDecoration: 'none' }}>
              Ver todos &rarr;
            </Link>
          </div>

          {matches.length === 0 ? (
            <p style={{ fontSize: '13px', color: '#9B9690', textAlign: 'center', padding: '24px 0' }}>
              Nenhum match pendente
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {matches.slice(0, 4).map((match) => (
                <div
                  key={match.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    backgroundColor: '#232324',
                    borderRadius: '2px',
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(201,168,76,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#C9A84C',
                      flexShrink: 0,
                    }}
                  >
                    {match.score}%
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '12px', color: '#F0EDE6', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {match.imovel?.titulo || match.imovel_id.slice(0, 12)}
                    </p>
                    <p style={{ fontSize: '11px', color: '#9B9690' }}>
                      {match.solicitacao?.cliente_nome || '—'} · {match.imovel?.cidade || ''}
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: '10px',
                      padding: '2px 8px',
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

        {/* Top Imóveis */}
        <div
          style={{
            backgroundColor: '#181819',
            border: '1px solid rgba(201,168,76,0.1)',
            borderRadius: '2px',
            padding: '20px 24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: '15px', fontWeight: 600, color: '#F0EDE6' }}>
              Meus Imoveis
            </p>
            <Link href="/imoveis" style={{ fontSize: '12px', color: '#C9A84C', textDecoration: 'none' }}>
              Ver todos &rarr;
            </Link>
          </div>

          {imoveis.length === 0 ? (
            <p style={{ fontSize: '13px', color: '#9B9690', textAlign: 'center', padding: '24px 0' }}>
              Nenhum imovel cadastrado
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {imoveis.slice(0, 4).map((imovel) => {
                const sc = STATUS_COLORS[imovel.status]
                return (
                  <div
                    key={imovel.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 12px',
                      backgroundColor: '#232324',
                      borderRadius: '2px',
                    }}
                  >
                    <span style={{ fontSize: '20px', flexShrink: 0 }}>{getImovelEmoji(imovel.tipo_imovel)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                        <p style={{ fontSize: '12px', color: '#F0EDE6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {imovel.titulo}
                        </p>
                        {imovel.lancamento && (
                          <span
                            style={{
                              fontSize: '9px',
                              padding: '1px 5px',
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
                      <p style={{ fontSize: '11px', color: '#9B9690' }}>
                        {imovel.bairro ? `${imovel.bairro} · ` : ''}{formatCurrency(imovel.valor)}
                      </p>
                    </div>
                    <span
                      style={{
                        fontSize: '10px',
                        padding: '2px 8px',
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
