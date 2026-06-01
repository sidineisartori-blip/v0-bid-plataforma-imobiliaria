'use client'

import React, { useState } from 'react'
import { formatDate } from '@/lib/format'
import ModalAvaliacao from './ModalAvaliacao'

interface Avaliacao {
  id: string
  nota_final: number
  comentario: string | null
  created_at: string
  avaliador?: { full_name: string } | null
}

interface CorretorRanking {
  id: string
  full_name: string
  nota_media: number
  total_avaliacoes: number
  deals_closed: number
  creci: string | null
}

interface Props {
  corretorId: string
  notaMedia: number
  totalAvaliacoes: number
  dealsClosed: number
  avaliacoesRecebidas: Avaliacao[]
  ranking: CorretorRanking[]
}

function getSelo(nota: number, negocios: number): { label: string; cor: string } {
  if (nota < 3.0 && negocios >= 5) return { label: 'Em Obs.', cor: '#E05C5C' }
  if (nota >= 4.5 && negocios >= 20) return { label: 'Platinum', cor: '#C9A84C' }
  if (nota >= 4.0 && negocios >= 10) return { label: 'Gold', cor: '#C9A84C' }
  if (nota >= 3.5 && negocios >= 5)  return { label: 'Silver', cor: '#5C9BE0' }
  return { label: 'Standard', cor: '#9B9690' }
}

function getProximoNivel(nota: number, negocios: number): { nivelAtual: string; metaNota: number | null; metaNegocios: number | null } {
  if (nota >= 4.5 && negocios >= 20) return { nivelAtual: 'Platinum', metaNota: null, metaNegocios: null }
  if (nota >= 4.0 && negocios >= 10) return { nivelAtual: 'Gold', metaNota: 4.5, metaNegocios: 20 }
  if (nota >= 3.5 && negocios >= 5)  return { nivelAtual: 'Silver', metaNota: 4.0, metaNegocios: 10 }
  return { nivelAtual: 'Standard', metaNota: 3.5, metaNegocios: 5 }
}

function Estrelas({ nota, tamanho = 14 }: { nota: number; tamanho?: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: '2px' }}>
      {[1,2,3,4,5].map((i) => (
        <span key={i} style={{ fontSize: `${tamanho}px`, color: i <= Math.round(nota) ? '#C9A84C' : '#2E2E30' }}>★</span>
      ))}
    </span>
  )
}

export default function AvaliacoesClient({
  corretorId, notaMedia, totalAvaliacoes, dealsClosed, avaliacoesRecebidas, ranking,
}: Props) {
  const [modalAberto, setModalAberto] = useState(false)

  const selo = getSelo(notaMedia, dealsClosed)
  const proximo = getProximoNivel(notaMedia, dealsClosed)

  const minhaPos = ranking.findIndex((r) => r.id === corretorId)

  const metricaStyle: React.CSSProperties = {
    backgroundColor: '#181819',
    border: '1px solid rgba(201,168,76,0.1)',
    borderRadius: '2px',
    padding: '20px',
    flex: 1,
  }

  return (
    <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Titulo */}
      <div>
        <h1 style={{ fontFamily: 'var(--font-serif, serif)', fontSize: '22px', fontWeight: 700, color: '#F0EDE6', margin: '0 0 4px' }}>
          Avaliacoes & Ranking
        </h1>
        <p style={{ fontSize: '13px', color: '#9B9690', margin: 0 }}>
          Sua reputacao na plataforma BID.
        </p>
      </div>

      {/* Metricas topo */}
      <div style={{ display: 'flex', gap: '12px' }}>
        {/* Nota media */}
        <div style={metricaStyle}>
          <p style={{ fontSize: '10px', color: '#9B9690', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 8px' }}>Nota Media</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{ fontFamily: 'var(--font-serif, serif)', fontSize: '28px', fontWeight: 700, color: '#C9A84C' }}>
              {notaMedia > 0 ? notaMedia.toFixed(1) : '—'}
            </span>
            {notaMedia > 0 && <Estrelas nota={notaMedia} tamanho={16} />}
          </div>
          <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '2px', border: `1px solid ${selo.cor}40`, color: selo.cor, backgroundColor: `${selo.cor}15`, fontWeight: 600, letterSpacing: '0.06em' }}>
            {selo.label}
          </span>
        </div>

        {/* Avaliacoes recebidas */}
        <div style={metricaStyle}>
          <p style={{ fontSize: '10px', color: '#9B9690', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 8px' }}>Avaliacoes Recebidas</p>
          <p style={{ fontFamily: 'var(--font-serif, serif)', fontSize: '28px', fontWeight: 700, color: '#F0EDE6', margin: '0 0 8px' }}>
            {totalAvaliacoes}
          </p>
          {proximo.metaNota && (
            <p style={{ fontSize: '11px', color: '#9B9690', margin: 0 }}>
              Meta: nota {proximo.metaNota} para {proximo.nivelAtual === 'Standard' ? 'Silver' : proximo.nivelAtual === 'Silver' ? 'Gold' : 'Platinum'}
            </p>
          )}
        </div>

        {/* Negocios fechados */}
        <div style={metricaStyle}>
          <p style={{ fontSize: '10px', color: '#9B9690', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 8px' }}>Negocios Fechados</p>
          <p style={{ fontFamily: 'var(--font-serif, serif)', fontSize: '28px', fontWeight: 700, color: '#F0EDE6', margin: '0 0 8px' }}>
            {dealsClosed}
          </p>
          {proximo.metaNegocios && proximo.metaNegocios > dealsClosed && (
            <div>
              <div style={{ height: '3px', backgroundColor: '#232324', borderRadius: '2px', marginBottom: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', backgroundColor: '#C9A84C', width: `${Math.min(100, (dealsClosed / proximo.metaNegocios) * 100)}%`, borderRadius: '2px' }} />
              </div>
              <p style={{ fontSize: '11px', color: '#9B9690', margin: 0 }}>
                {dealsClosed}/{proximo.metaNegocios} para proximo nivel
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Grid 2 colunas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* AVALIACOES RECEBIDAS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: '11px', color: '#9B9690', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
              Avaliacoes Recebidas
            </p>
            <button
              onClick={() => setModalAberto(true)}
              style={{ backgroundColor: '#C9A84C', color: '#0E0E0F', border: 'none', borderRadius: '2px', padding: '6px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
            >
              + Avaliar Parceiro
            </button>
          </div>

          <div style={{ backgroundColor: '#181819', border: '1px solid rgba(201,168,76,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
            {avaliacoesRecebidas.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center' }}>
                <p style={{ fontSize: '13px', color: '#9B9690', margin: '0 0 6px' }}>Nenhuma avaliacao ainda.</p>
                <p style={{ fontSize: '12px', color: '#2E2E30', margin: 0 }}>Complete negociacoes para receber avaliacoes.</p>
              </div>
            ) : (
              avaliacoesRecebidas.map((av, i) => (
                <div
                  key={av.id}
                  style={{
                    padding: '14px 16px',
                    borderBottom: i < avaliacoesRecebidas.length - 1 ? '1px solid #232324' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', color: '#F0EDE6', fontWeight: 500 }}>
                      Corretor verificado
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Estrelas nota={av.nota_final} tamanho={12} />
                      <span style={{ fontSize: '11px', color: '#9B9690' }}>{formatDate(av.created_at)}</span>
                    </div>
                  </div>
                  {av.comentario && (
                    <p style={{ fontSize: '12px', color: '#9B9690', margin: 0, lineHeight: 1.5 }}>
                      {av.comentario}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* RANKING */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p style={{ fontSize: '11px', color: '#9B9690', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
            Ranking da Plataforma
          </p>

          <div style={{ backgroundColor: '#181819', border: '1px solid rgba(201,168,76,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
            {ranking.map((cor, i) => {
              const eEu = cor.id === corretorId
              const seloRank = getSelo(cor.nota_media, cor.deals_closed)
              const posColor = i === 0 ? '#C9A84C' : i < 3 ? '#E8C96A' : '#9B9690'

              return (
                <div
                  key={cor.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    borderBottom: i < ranking.length - 1 ? '1px solid #232324' : 'none',
                    backgroundColor: eEu ? 'rgba(201,168,76,0.05)' : 'transparent',
                    borderLeft: eEu ? '2px solid #C9A84C' : '2px solid transparent',
                  }}
                >
                  <span style={{ fontSize: '13px', fontWeight: 700, color: posColor, width: '20px', textAlign: 'center', flexShrink: 0 }}>
                    {i + 1}
                  </span>

                  {/* Avatar iniciais */}
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#232324', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#C9A84C', flexShrink: 0, fontFamily: 'var(--font-serif, serif)' }}>
                    {cor.full_name.charAt(0)}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '13px', color: eEu ? '#C9A84C' : '#F0EDE6', fontWeight: eEu ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {cor.full_name}
                        {eEu && <span style={{ fontSize: '10px', color: '#9B9690', marginLeft: '4px' }}>(voce)</span>}
                      </span>
                    </div>
                    <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '2px', border: `1px solid ${seloRank.cor}30`, color: seloRank.cor, backgroundColor: `${seloRank.cor}10` }}>
                      {seloRank.label}
                    </span>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: '13px', color: '#C9A84C', margin: '0 0 2px', fontWeight: 600 }}>
                      ★ {cor.nota_media > 0 ? cor.nota_media.toFixed(1) : '—'}
                    </p>
                    <p style={{ fontSize: '11px', color: '#9B9690', margin: 0 }}>
                      {cor.deals_closed} neg.
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {minhaPos >= 10 && (
            <p style={{ fontSize: '12px', color: '#9B9690', textAlign: 'center' }}>
              Sua posicao atual: #{minhaPos + 1}
            </p>
          )}
        </div>
      </div>

      {modalAberto && (
        <ModalAvaliacao
          corretorId={corretorId}
          avaliadoId=""
          avaliadoNome=""
          onClose={() => setModalAberto(false)}
        />
      )}
    </div>
  )
}
