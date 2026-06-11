'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const STORAGE_KEY = 'bid_cookie_consent'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem(STORAGE_KEY)
    if (!consent) setVisible(true)
  }, [])

  function accept() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ accepted: true, date: new Date().toISOString() }))
    setVisible(false)
  }

  function decline() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ accepted: false, date: new Date().toISOString() }))
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
      background: '#181819', borderTop: '1px solid #2E2E30',
      padding: '16px 24px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 16, flexWrap: 'wrap',
    }}>
      <p style={{ fontSize: 13, color: '#9B9690', margin: 0, flex: 1, minWidth: 240 }}>
        Usamos cookies essenciais para autenticação e cookies de análise para melhorar o produto.
        Consulte nossa{' '}
        <Link href="/privacidade" style={{ color: '#C9A84C', textDecoration: 'underline' }}>
          Política de Privacidade
        </Link>.
      </p>
      <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
        <button
          onClick={decline}
          style={{
            background: 'none', border: '1px solid #2E2E30', borderRadius: 2,
            color: '#9B9690', fontSize: 12, padding: '7px 16px', cursor: 'pointer',
          }}
        >
          Apenas essenciais
        </button>
        <button
          onClick={accept}
          style={{
            background: '#C9A84C', border: 'none', borderRadius: 2,
            color: '#0E0E0F', fontSize: 12, fontWeight: 700, padding: '7px 16px', cursor: 'pointer',
          }}
        >
          Aceitar todos
        </button>
      </div>
    </div>
  )
}
