'use client'

import Link from 'next/link'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0E0E0F',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-sans, DM Sans, sans-serif)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 500px 300px at 50% 40%, rgba(224,92,92,0.04) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          maxWidth: '440px',
          padding: '0 24px',
        }}
      >
        {/* Icone */}
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '2px',
            backgroundColor: 'rgba(224,92,92,0.1)',
            border: '1px solid rgba(224,92,92,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
          }}
        >
          !
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-serif, Playfair Display, serif)',
            fontSize: '26px',
            fontWeight: 600,
            color: '#F0EDE6',
            margin: 0,
          }}
        >
          Algo deu errado
        </h1>

        {error.message && (
          <p
            style={{
              fontSize: '13px',
              color: '#9B9690',
              lineHeight: 1.6,
              margin: 0,
              fontFamily: 'var(--font-mono, monospace)',
              backgroundColor: '#181819',
              border: '1px solid #232324',
              borderRadius: '2px',
              padding: '10px 14px',
              width: '100%',
              textAlign: 'left',
              wordBreak: 'break-word',
            }}
          >
            {error.message}
          </p>
        )}

        <div
          style={{
            width: '40px',
            height: '1px',
            backgroundColor: 'rgba(201,168,76,0.3)',
            margin: '4px 0',
          }}
        />

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={reset}
            style={{
              backgroundColor: '#C9A84C',
              color: '#0E0E0F',
              border: 'none',
              borderRadius: '2px',
              padding: '10px 24px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Tentar novamente
          </button>
          <Link
            href="/dashboard"
            style={{
              backgroundColor: 'transparent',
              color: '#F0EDE6',
              border: '1px solid #2E2E30',
              borderRadius: '2px',
              padding: '10px 24px',
              fontSize: '13px',
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            Voltar ao inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
