'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function ConfirmacaoContent() {
  const searchParams = useSearchParams()
  const email        = searchParams.get('email') || ''
  const supabase     = createClient()
  const [reenviado, setReenviado] = useState(false)
  const [loading, setLoading]     = useState(false)

  const handleReenviar = async () => {
    if (!email || loading) return
    setLoading(true)
    await supabase.auth.resend({ type: 'signup', email })
    setReenviado(true)
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0E0E0F',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.03,
        backgroundImage: `linear-gradient(rgba(201,168,76,1) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,1) 1px, transparent 1px)`,
        backgroundSize: '50px 50px',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 600px 400px at 50% 40%, rgba(201,168,76,0.08) 0%, transparent 70%)',
      }} />

      <div style={{ position: 'relative', width: '100%', maxWidth: '420px', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '48px', fontWeight: 700, color: '#C9A84C', margin: 0, lineHeight: 1 }}>
            BID
          </h1>
          <p style={{ fontSize: '10px', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#9B9690', marginTop: '8px' }}>
            Plataforma Imobiliária
          </p>
        </div>

        <div style={{
          backgroundColor: '#181819',
          border: '1px solid rgba(201,168,76,0.2)',
          borderRadius: '2px',
          padding: '40px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
        }}>
          <div style={{ fontSize: '48px', lineHeight: 1 }}>✉</div>

          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '24px', fontWeight: 400, color: '#C9A84C', margin: 0 }}>
            Verifique seu e-mail
          </h2>

          <p style={{ fontSize: '14px', color: '#F0EDE6', lineHeight: 1.6, margin: 0, maxWidth: '300px' }}>
            Enviamos um link de confirmação para{' '}
            <strong style={{ color: '#C9A84C' }}>{email}</strong>.
          </p>

          <p style={{ fontSize: '13px', color: '#9B9690', lineHeight: 1.6, margin: 0 }}>
            Clique no link para ativar sua conta e fazer login.
          </p>

          <div style={{
            backgroundColor: 'rgba(201,168,76,0.06)',
            border: '1px solid rgba(201,168,76,0.15)',
            borderRadius: '2px',
            padding: '10px 16px',
            fontSize: '12px',
            color: '#9B9690',
            width: '100%',
          }}>
            Nao recebeu? Verifique a pasta de spam.
          </div>

          <button
            onClick={handleReenviar}
            disabled={loading || reenviado}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: 'transparent',
              color: reenviado ? '#5CB88A' : '#C9A84C',
              border: `1px solid ${reenviado ? 'rgba(92,184,138,0.3)' : 'rgba(201,168,76,0.3)'}`,
              borderRadius: '2px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: loading || reenviado ? 'not-allowed' : 'pointer',
              fontFamily: 'DM Sans, sans-serif',
              transition: 'all 0.2s',
            }}
          >
            {reenviado ? 'E-mail reenviado!' : loading ? 'Reenviando...' : 'Reenviar e-mail'}
          </button>

          <Link
            href="/login"
            style={{ fontSize: '12px', color: '#C9A84C', textDecoration: 'none', marginTop: '4px' }}
          >
            Ja confirmei — Fazer login
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function ConfirmacaoPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', backgroundColor: '#0E0E0F' }} />}>
      <ConfirmacaoContent />
    </Suspense>
  )
}
