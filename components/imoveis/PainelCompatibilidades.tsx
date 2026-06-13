'use client'

import React, { useEffect, useState, useCallback } from 'react'
import type { Imovel } from '@/types/bid'
import { formatCurrency } from '@/lib/format'

interface SolicitacaoCompat {
  id: string
  cliente_nome: string | null
  tipo_negocio: string | null
  tipo_imovel: string | null
  cidade: string | null
  bairro_desejado: string | null
  quartos: number | null
  valor_min: number | null
  valor_max: number | null
  score: number
  jaTemMatch: boolean
}

interface PainelCompatibilidadesProps {
  imovel: Imovel
  corretorId: string
  onClose: () => void
  onMatchCriado?: () => void
}

function scoreColor(score: number): string {
  if (score >= 90) return '#5CB88A'
  if (score >= 80) return '#C9A84C'
  return '#9B9690'
}

export default function PainelCompatibilidades({ imovel, corretorId, onClose, onMatchCriado }: PainelCompatibilidadesProps) {
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [compativeis, setCompativeis] = useState<SolicitacaoCompat[]>([])
  const [gerandoId, setGerandoId] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    try {
      const res = await fetch(`/api/matching/preview?imovelId=${imovel.id}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Erro ao carregar compatibilidades')
      setCompativeis(data.compativeis || [])
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar compatibilidades')
    } finally {
      setCarregando(false)
    }
  }, [imovel.id])

  useEffect(() => {
    carregar()
  }, [carregar])

  // Fecha com tecla ESC
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  async function gerarMatch(solicitacaoId: string) {
    setGerandoId(solicitacaoId)
    try {
      const res = await fetch('/api/matching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imovelId: imovel.id, solicitacaoId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Erro ao gerar match')
      // Marca como já tendo match na lista local
      setCompativeis((prev) =>
        prev.map((s) => (s.id === solicitacaoId ? { ...s, jaTemMatch: true } : s))
      )
      onMatchCriado?.()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao gerar match')
    } finally {
      setGerandoId(null)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Compatibilidades de ${imovel.titulo}`}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      {/* Overlay */}
      <button
        aria-label="Fechar painel"
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.55)',
          border: 'none',
          cursor: 'pointer',
        }}
      />

      {/* Drawer */}
      <aside
        style={{
          position: 'relative',
          width: 'min(460px, 100%)',
          height: '100%',
          backgroundColor: '#0E0E0F',
          borderLeft: '1px solid rgba(201,168,76,0.15)',
          boxShadow: '-8px 0 24px rgba(0,0,0,0.4)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #232324',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 11, letterSpacing: '0.08em', color: '#9B9690', textTransform: 'uppercase' }}>
              Compatibilidades
            </p>
            <p style={{ fontSize: 17, fontWeight: 600, color: '#F0EDE6', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {imovel.titulo}
            </p>
            <p style={{ fontSize: 13, color: '#9B9690', marginTop: 2 }}>
              {[imovel.bairro, imovel.cidade].filter(Boolean).join(' · ')}
              {' · '}
              <span style={{ color: '#C9A84C' }}>{formatCurrency(imovel.valor)}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            style={{
              background: 'none',
              border: '1px solid #232324',
              borderRadius: 2,
              color: '#9B9690',
              cursor: 'pointer',
              fontSize: 16,
              padding: '4px 10px',
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>

        {/* Conteúdo */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {carregando && (
            <p style={{ fontSize: 14, color: '#9B9690', textAlign: 'center', padding: '40px 0' }}>
              Buscando solicitações compatíveis…
            </p>
          )}

          {erro && !carregando && (
            <div
              style={{
                backgroundColor: 'rgba(224,92,92,0.08)',
                border: '1px solid rgba(224,92,92,0.3)',
                borderRadius: 2,
                padding: '12px 16px',
                fontSize: 13,
                color: '#E05C5C',
              }}
            >
              {erro}
            </div>
          )}

          {!carregando && !erro && compativeis.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <p style={{ fontSize: 15, color: '#9B9690' }}>Nenhuma compatibilidade ≥ 70%.</p>
              <p style={{ fontSize: 13, color: '#2E2E30', marginTop: 8 }}>
                Quando houver solicitações compatíveis na mesma cidade, elas aparecerão aqui.
              </p>
            </div>
          )}

          {!carregando && !erro && compativeis.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {compativeis.map((sol) => (
                <div
                  key={sol.id}
                  style={{
                    backgroundColor: '#181819',
                    border: '1px solid rgba(201,168,76,0.12)',
                    borderRadius: 2,
                    padding: 16,
                    display: 'flex',
                    gap: 14,
                    alignItems: 'flex-start',
                  }}
                >
                  {/* Score */}
                  <div style={{ width: 48, flexShrink: 0, textAlign: 'center' }}>
                    <p style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 700, lineHeight: 1, color: scoreColor(sol.score) }}>
                      {sol.score}%
                    </p>
                  </div>

                  {/* Info da solicitação */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 500, color: '#F0EDE6' }}>
                      {sol.cliente_nome || 'Cliente sem nome'}
                    </p>
                    <p style={{ fontSize: 12, color: '#9B9690', marginTop: 2 }}>
                      {[sol.tipo_negocio, sol.tipo_imovel].filter(Boolean).join(' · ') || '—'}
                    </p>
                    <p style={{ fontSize: 12, color: '#9B9690', marginTop: 2 }}>
                      {[sol.bairro_desejado, sol.cidade].filter(Boolean).join(' · ')}
                      {sol.quartos ? ` · ${sol.quartos}Q` : ''}
                    </p>
                    {(sol.valor_min || sol.valor_max) && (
                      <p style={{ fontSize: 12, color: '#C9A84C', marginTop: 4 }}>
                        {sol.valor_min ? formatCurrency(sol.valor_min) : '—'}
                        {' até '}
                        {sol.valor_max ? formatCurrency(sol.valor_max) : '—'}
                      </p>
                    )}

                    {/* Ação */}
                    <div style={{ marginTop: 10 }}>
                      {sol.jaTemMatch ? (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: '#5CB88A',
                            backgroundColor: 'rgba(92,184,138,0.1)',
                            border: '1px solid rgba(92,184,138,0.3)',
                            borderRadius: 2,
                            padding: '4px 10px',
                          }}
                        >
                          Match criado
                        </span>
                      ) : (
                        <button
                          onClick={() => gerarMatch(sol.id)}
                          disabled={gerandoId === sol.id}
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: '#0E0E0F',
                            backgroundColor: '#C9A84C',
                            border: 'none',
                            borderRadius: 2,
                            padding: '6px 14px',
                            cursor: gerandoId === sol.id ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {gerandoId === sol.id ? 'Gerando…' : 'Gerar match'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}
