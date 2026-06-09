'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  const router = useRouter()

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '60vh', flexDirection: 'column', gap: 16, padding: '0 24px',
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 2,
        backgroundColor: 'rgba(224,92,92,0.08)',
        border: '1px solid rgba(224,92,92,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22, color: '#E05C5C',
      }}>!</div>
      <h2 style={{
        fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 600,
        color: '#F0EDE6', margin: 0, textAlign: 'center',
      }}>
        Erro ao carregar esta página
      </h2>
      <p style={{ fontSize: 13, color: '#9B9690', margin: 0, textAlign: 'center', maxWidth: 320, lineHeight: 1.6 }}>
        {error.message || 'Ocorreu um erro inesperado. Tente novamente.'}
      </p>
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={reset}
          style={{
            backgroundColor: '#C9A84C', color: '#0E0E0F',
            border: 'none', borderRadius: 2, padding: '9px 20px',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          Tentar novamente
        </button>
        <button
          onClick={() => router.push('/dashboard')}
          style={{
            backgroundColor: 'transparent', color: '#F0EDE6',
            border: '1px solid #2E2E30', borderRadius: 2, padding: '9px 20px',
            fontSize: 13, cursor: 'pointer',
          }}
        >
          Voltar ao início
        </button>
      </div>
    </div>
  )
}
