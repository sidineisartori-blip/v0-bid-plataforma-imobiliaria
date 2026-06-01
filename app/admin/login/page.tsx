'use client'


import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrar] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setLoading(true)

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      })

      const data = await res.json()

      if (!res.ok || !data.ok) {
        setErro(data.error || 'Credenciais invalidas.')
        setLoading(false)
        return
      }

      // Salva sessao no localStorage
      localStorage.setItem('admin_session', JSON.stringify({
        id: data.admin.id,
        email: data.admin.email,
        role: data.admin.role,
        full_name: data.admin.full_name,
        expires: Date.now() + (24 * 60 * 60 * 1000), // 24 horas
      }))

      router.push('/admin/painel')
    } catch {
      setErro('Erro ao fazer login. Tente novamente.')
    }
    setLoading(false)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0E0E0F',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      {/* Grid background */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(201,168,76,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(201,168,76,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative', width: '100%', maxWidth: '440px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1
            style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '56px',
              fontWeight: 700,
              color: '#C9A84C',
              margin: 0,
              lineHeight: 1,
            }}
          >
            BID
          </h1>
          <p
            style={{
              fontSize: '13px',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: '#9B9690',
              marginTop: '12px',
            }}
          >
            Painel Administrativo
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            backgroundColor: '#181819',
            border: '1px solid rgba(201,168,76,0.2)',
            borderRadius: '2px',
            padding: '48px',
          }}
        >
          <h2
            style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '24px',
              fontWeight: 600,
              color: '#F0EDE6',
              margin: '0 0 8px',
              textAlign: 'center',
            }}
          >
            Acesso Master
          </h2>
          <p
            style={{
              fontSize: '15px',
              color: '#9B9690',
              margin: '0 0 32px',
              textAlign: 'center',
            }}
          >
            Controle total da plataforma
          </p>

          {erro && (
            <div
              style={{
                backgroundColor: 'rgba(224,92,92,0.1)',
                border: '1px solid rgba(224,92,92,0.3)',
                borderRadius: '2px',
                padding: '14px 16px',
                marginBottom: '24px',
                fontSize: '15px',
                color: '#E05C5C',
              }}
            >
              {erro}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#9B9690',
                  marginBottom: '10px',
                  fontWeight: 500,
                }}
              >
                E-mail Admin
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@bid.app.br"
                required
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  backgroundColor: '#232324',
                  border: '1px solid #2E2E30',
                  borderRadius: '2px',
                  color: '#F0EDE6',
                  fontSize: '16px',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#9B9690',
                  marginBottom: '10px',
                  fontWeight: 500,
                }}
              >
                Senha Master
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="********"
                  required
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    paddingRight: '48px',
                    backgroundColor: '#232324',
                    border: '1px solid #2E2E30',
                    borderRadius: '2px',
                    color: '#F0EDE6',
                    fontSize: '16px',
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setMostrar((p) => !p)}
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#9B9690',
                    fontSize: '18px',
                    lineHeight: 1,
                    padding: 0,
                  }}
                >
                  {mostrarSenha ? '○' : '●'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '14px',
                backgroundColor: '#C9A84C',
                color: '#0E0E0F',
                border: 'none',
                borderRadius: '2px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                letterSpacing: '0.05em',
              }}
            >
              {loading ? 'Entrando...' : 'Acessar Painel'}
            </button>
          </form>

          <p
            style={{
              fontSize: '13px',
              color: '#2E2E30',
              textAlign: 'center',
              marginTop: '32px',
            }}
          >
            Acesso restrito a administradores
          </p>
        </div>
      </div>
    </div>
  )
}
