'use client'


import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { traduzirErroAuth } from '@/lib/auth-errors'

export default function RecuperarSenhaPage() {
  const supabase = createClient()
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro]       = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErro('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/nova-senha`,
    })
    if (error) {
      setErro(traduzirErroAuth(error.message))
    } else {
      setEnviado(true)
    }
    setLoading(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    backgroundColor: '#232324',
    border: '1px solid #2E2E30',
    borderRadius: '2px',
    color: '#F0EDE6',
    fontSize: '14px',
    outline: 'none',
    fontFamily: 'DM Sans, sans-serif',
  }

  const btnStyle: React.CSSProperties = {
    width: '100%',
    padding: '11px',
    backgroundColor: '#C9A84C',
    color: '#0E0E0F',
    border: 'none',
    borderRadius: '2px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.7 : 1,
    fontFamily: 'DM Sans, sans-serif',
    letterSpacing: '0.05em',
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
      {/* Grid lines */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.03,
        backgroundImage: `linear-gradient(rgba(201,168,76,1) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,1) 1px, transparent 1px)`,
        backgroundSize: '50px 50px',
      }} />
      {/* Radial glow */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 600px 400px at 50% 40%, rgba(201,168,76,0.08) 0%, transparent 70%)',
      }} />

      <div style={{ position: 'relative', width: '100%', maxWidth: '400px', padding: '0 24px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '48px', fontWeight: 700, color: '#C9A84C', margin: 0, lineHeight: 1 }}>
            BID
          </h1>
          <p style={{ fontSize: '10px', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#9B9690', marginTop: '8px' }}>
            Plataforma Imobiliária
          </p>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(201,168,76,0.15)' }} />
          <div style={{ width: '60px', height: '1px', backgroundColor: '#C9A84C' }} />
          <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(201,168,76,0.15)' }} />
        </div>

        {/* Card */}
        <div style={{
          backgroundColor: '#181819',
          border: '1px solid rgba(201,168,76,0.2)',
          borderRadius: '2px',
          padding: '40px',
        }}>
          {!enviado ? (
            <>
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px', fontWeight: 400, color: '#F0EDE6', margin: '0 0 8px' }}>
                Recuperar Senha
              </h2>
              <p style={{ fontSize: '13px', color: '#9B9690', marginBottom: '28px', lineHeight: 1.6 }}>
                Informe seu e-mail e enviaremos um link de recuperação.
              </p>

              {erro && (
                <div style={{
                  backgroundColor: 'rgba(224,92,92,0.1)',
                  border: '1px solid rgba(224,92,92,0.3)',
                  borderRadius: '2px',
                  padding: '10px 14px',
                  marginBottom: '20px',
                  fontSize: '13px',
                  color: '#E05C5C',
                }}>
                  {erro}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9B9690', marginBottom: '8px' }}>
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                    style={inputStyle}
                  />
                </div>

                <button type="submit" disabled={loading} style={btnStyle}>
                  {loading ? 'Enviando...' : 'Enviar Link'}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #232324' }}>
                <Link href="/login" style={{ fontSize: '12px', color: '#C9A84C', textDecoration: 'none' }}>
                  Voltar para o login
                </Link>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div style={{ fontSize: '48px', lineHeight: 1 }}>✉</div>
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px', fontWeight: 400, color: '#C9A84C', margin: 0 }}>
                E-mail enviado!
              </h2>
              <p style={{ fontSize: '13px', color: '#9B9690', lineHeight: 1.6, maxWidth: '280px' }}>
                Enviamos um link de recuperação para <strong style={{ color: '#F0EDE6' }}>{email}</strong>. Verifique sua caixa de entrada e spam.
              </p>
              <Link
                href="/login"
                style={{
                  marginTop: '8px',
                  display: 'inline-block',
                  padding: '10px 28px',
                  backgroundColor: '#C9A84C',
                  color: '#0E0E0F',
                  borderRadius: '2px',
                  fontSize: '13px',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Voltar para o login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
