'use client'


import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminSetupPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    setup_key: '',
  })
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState<{ success?: boolean; message?: string; error?: string } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setResultado(null)

    try {
      const res = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (res.ok) {
        setResultado({ success: true, message: data.message })
        setTimeout(() => router.push('/admin/login'), 2000)
      } else {
        setResultado({ error: data.error })
      }
    } catch {
      setResultado({ error: 'Erro ao criar admin. Tente novamente.' })
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

      <div style={{ position: 'relative', width: '100%', maxWidth: '480px' }}>
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
            Configuracao Inicial
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
            Criar Admin Master
          </h2>
          <p
            style={{
              fontSize: '15px',
              color: '#9B9690',
              margin: '0 0 24px',
              textAlign: 'center',
            }}
          >
            Configure o primeiro administrador da plataforma
          </p>

          {/* Aviso de seguranca */}
          <div
            style={{
              backgroundColor: 'rgba(232,201,106,0.08)',
              border: '1px solid rgba(201,168,76,0.3)',
              borderRadius: '2px',
              padding: '14px 16px',
              marginBottom: '24px',
              fontSize: '13px',
              color: '#E8C96A',
              lineHeight: 1.5,
            }}
          >
            <strong>Atencao:</strong> Esta pagina so pode ser usada uma vez para criar o admin inicial. 
            Apos o primeiro uso, remova a variavel ADMIN_SETUP_KEY do ambiente para desabilitar esta rota.
          </div>

          {resultado?.error && (
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
              {resultado.error}
            </div>
          )}

          {resultado?.success && (
            <div
              style={{
                backgroundColor: 'rgba(92,184,138,0.1)',
                border: '1px solid rgba(92,184,138,0.3)',
                borderRadius: '2px',
                padding: '14px 16px',
                marginBottom: '24px',
                fontSize: '15px',
                color: '#5CB88A',
              }}
            >
              {resultado.message} Redirecionando...
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
                Nome Completo
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Administrador Master"
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
                E-mail Admin
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Crie uma senha forte"
                required
                minLength={8}
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
                Chave de Setup
              </label>
              <input
                type="text"
                value={formData.setup_key}
                onChange={(e) => setFormData({ ...formData, setup_key: e.target.value })}
                placeholder="BID_SETUP_2024"
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
              <p style={{ fontSize: '12px', color: '#9B9690', marginTop: '8px' }}>
                Defina a variavel de ambiente ADMIN_SETUP_KEY no servidor.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '8px',
                padding: '16px',
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
              {loading ? 'Criando...' : 'Criar Admin Master'}
            </button>
          </form>

          <div
            style={{
              marginTop: '32px',
              paddingTop: '24px',
              borderTop: '1px solid #232324',
            }}
          >
            <p style={{ fontSize: '13px', color: '#9B9690', textAlign: 'center', margin: 0 }}>
              Ja tem uma conta?{' '}
              <a href="/admin/login" style={{ color: '#C9A84C', textDecoration: 'none' }}>
                Fazer Login
              </a>
            </p>
          </div>
        </div>

        <p
          style={{
            fontSize: '12px',
            color: '#E05C5C',
            textAlign: 'center',
            marginTop: '24px',
            backgroundColor: 'rgba(224,92,92,0.08)',
            padding: '12px 16px',
            borderRadius: '2px',
          }}
        >
          Remova ADMIN_SETUP_KEY das variaveis de ambiente apos criar o admin.
        </p>
      </div>
    </div>
  )
}
