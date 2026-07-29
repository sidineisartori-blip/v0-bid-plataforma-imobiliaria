'use client'

import { useEffect } from 'react'

export function PrintTrigger() {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 600)
    return () => clearTimeout(t)
  }, [])
  return null
}

export function PrintButton() {
  return (
    <div className="no-print" style={{
      position: 'fixed', bottom: 24, right: 24, display: 'flex', gap: 10, zIndex: 100,
    }}>
      <button
        onClick={() => window.print()}
        style={{
          background: '#C9A84C', color: '#0E0E0F', border: 'none', borderRadius: 4,
          padding: '11px 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
        }}
      >
        🖨 Imprimir / Salvar PDF
      </button>
      <button
        onClick={() => window.close()}
        style={{
          background: '#2a2a2c', color: '#9B9690', border: '1px solid #3a3a3c', borderRadius: 4,
          padding: '11px 16px', fontSize: 13, cursor: 'pointer',
        }}
      >
        Fechar
      </button>
    </div>
  )
}
