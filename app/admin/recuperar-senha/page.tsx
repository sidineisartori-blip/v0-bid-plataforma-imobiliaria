'use client'

import { useState } from 'react'

export default function AdminRecuperarSenhaPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'erro'>('idle')
  const [msg, setMsg] = useState('')

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('/api/admin/recuperar-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (res.ok) {
        setStatus('ok')
        setMsg('Link de redefinição enviado. Verifique seu e-mail.')
      } else {
        setStatus('erro')
        setMsg(data.error || 'Erro ao enviar.')
      }
    } catch {
      setStatus('erro')
      setMsg('Falha na conexão.')
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0E0E0F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 400, backgroundColor: '#181819', border: '1px solid #232324', borderRadius: 4, padding: '48px 40px' }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, fontWeight: 700, color: '#C9A84C', textAlign: 'center', margin: '0 0 8px' }}>BID</h1>
        <p style={{ fontSize: 14, color: '#9B9690', textAlign: 'center', margin: '0 0 36px' }}>Recuperar acesso Master</p>

        {status === 'ok' ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>✉️</div>
            <p style={{ fontSize: 15, color: '#5CB88A' }}>{msg}</p>
            <a href="/admin/login" style={{ display: 'inline-block', marginTop: 24, fontSize: 14, color: '#C9A84C', textDecoration: 'none' }}>← Voltar ao login</a>
          </div>
        ) : (
          <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, color: '#9B9690', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>E-mail Master</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="seu@email.com"
                style={{ width: '100%', padding: '12px 14px', backgroundColor: '#0E0E0F', border: '1px solid #2E2E30', borderRadius: 2, color: '#F0EDE6', fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {status === 'erro' && (
              <p style={{ fontSize: 13, color: '#E05C5C', margin: 0 }}>{msg}</p>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              style={{ backgroundColor: '#C9A84C', border: 'none', borderRadius: 2, color: '#0E0E0F', fontSize: 15, fontWeight: 700, padding: '14px', cursor: status === 'loading' ? 'not-allowed' : 'pointer', opacity: status === 'loading' ? 0.7 : 1 }}
            >
              {status === 'loading' ? 'Enviando...' : 'Enviar link de acesso'}
            </button>

            <a href="/admin/login" style={{ fontSize: 13, color: '#9B9690', textAlign: 'center', textDecoration: 'none', marginTop: 4 }}>← Voltar ao login</a>
          </form>
        )}
      </div>
    </div>
  )
}
