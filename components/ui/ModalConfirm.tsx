'use client'

import React, { useEffect } from 'react'

interface ModalConfirmProps {
  titulo: string
  descricao?: string
  labelConfirmar?: string
  labelCancelar?: string
  tipo?: 'perigo' | 'aviso' | 'info'
  onConfirmar: () => void
  onCancelar: () => void
  carregando?: boolean
}

const CORES = {
  perigo: { borda: 'rgba(224,92,92,0.25)', cor: '#E05C5C', bg: 'rgba(224,92,92,0.08)' },
  aviso:  { borda: 'rgba(201,168,76,0.25)', cor: '#C9A84C', bg: 'rgba(201,168,76,0.08)' },
  info:   { borda: 'rgba(92,155,224,0.25)', cor: '#5C9BE0', bg: 'rgba(92,155,224,0.08)' },
}

export default function ModalConfirm({
  titulo,
  descricao,
  labelConfirmar = 'Confirmar',
  labelCancelar = 'Cancelar',
  tipo = 'perigo',
  onConfirmar,
  onCancelar,
  carregando = false,
}: ModalConfirmProps) {
  const c = CORES[tipo]

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancelar()
      if (e.key === 'Enter' && !carregando) onConfirmar()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onCancelar, onConfirmar, carregando])

  return (
    <div
      style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 2000, padding: 20,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancelar() }}
    >
      <div style={{
        backgroundColor: '#181819', border: `1px solid ${c.borda}`,
        borderRadius: 4, width: '100%', maxWidth: 420,
        boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
      }}>
        <div style={{ padding: '20px 24px 0', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            backgroundColor: c.bg, border: `1px solid ${c.borda}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: c.cor, fontSize: 18, flexShrink: 0,
          }}>
            {tipo === 'perigo' ? '!' : tipo === 'aviso' ? '⚠' : 'i'}
          </div>
          <div style={{ flex: 1, paddingTop: 4 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#F0EDE6', margin: '0 0 6px' }}>{titulo}</h3>
            {descricao && (
              <p style={{ fontSize: 13, color: '#9B9690', margin: 0, lineHeight: 1.5 }}>{descricao}</p>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', padding: '20px 24px' }}>
          <button
            onClick={onCancelar}
            disabled={carregando}
            style={{
              padding: '9px 20px', background: 'none',
              border: '1px solid #2E2E30', borderRadius: 2,
              color: '#9B9690', fontSize: 14, cursor: 'pointer',
            }}
          >
            {labelCancelar}
          </button>
          <button
            onClick={onConfirmar}
            disabled={carregando}
            style={{
              padding: '9px 20px', backgroundColor: c.cor, border: 'none',
              borderRadius: 2, color: tipo === 'aviso' ? '#0E0E0F' : '#fff',
              fontSize: 14, fontWeight: 600,
              cursor: carregando ? 'not-allowed' : 'pointer',
              opacity: carregando ? 0.7 : 1,
            }}
          >
            {carregando ? 'Aguarde...' : labelConfirmar}
          </button>
        </div>
      </div>
    </div>
  )
}
