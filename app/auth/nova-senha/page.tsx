'use client'


import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { traduzirErroAuth } from '@/lib/auth-errors'

export default function NovaSenhaPage() {
  const router  = useRouter()
  const supabase = createClient()
  const [novaSenha, setNovaSenha]         = useState('')
  const [confirmar, setConfirmar]         = useState('')
  const [mostrar1, setMostrar1]           = useState(false)
  const [mostrar2, setMostrar2]           = useState(false)
  const [loading, setLoading]             = useState(false)
  const [erro, setErro]                   = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    if (novaSenha !== confirmar) {
      setErro('As senhas não conferem.')
      return
    }
    if (novaSenha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: novaSenha })
    if (error) {
      setErro(traduzirErroAuth(error.message))
      setLoading(false)
    } else {
      router.push('/login?senha=atualizada')
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 44px 10px 14px',
    backgroundColor: '#232324',
    border: '1px solid #2E2E30',
    borderRadius: '2px',
    color: '#F0EDE6',
    fontSize: '14px',
    outline: 'none',
    fontFamily: 'DM Sans, sans-serif',
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

      <div style={{ position: 'relative', width: '100%', maxWidth: '400px', padding: '0 24px' }}>
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
        }}>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px', fontWeight: 400, color: '#F0EDE6', margin: '0 0 8px' }}>
            Nova Senha
          </h2>
          <p style={{ fontSize: '13px', color: '#9B9690', marginBottom: '28px', lineHeight: 1.6 }}>
            Escolha uma nova senha segura para sua conta.
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
                Nova Senha
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={mostrar1 ? 'text' : 'password'}
                  value={novaSenha}
                  onChange={e => setNovaSenha(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={inputStyle}
                />
                <button
                  type="button"
                  onClick={() => setMostrar1(p => !p)}
                  aria-label={mostrar1 ? 'Ocultar senha' : 'Mostrar senha'}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9B9690', fontSize: '15px', lineHeight: 1, padding: 0 }}
                >
                  {mostrar1 ? '○' : '●'}
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9B9690', marginBottom: '8px' }}>
                Confirmar Senha
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={mostrar2 ? 'text' : 'password'}
                  value={confirmar}
                  onChange={e => setConfirmar(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={inputStyle}
                />
                <button
                  type="button"
                  onClick={() => setMostrar2(p => !p)}
                  aria-label={mostrar2 ? 'Ocultar senha' : 'Mostrar senha'}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9B9690', fontSize: '15px', lineHeight: 1, padding: 0 }}
                >
                  {mostrar2 ? '○' : '●'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
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
              }}
            >
              {loading ? 'Salvando...' : 'Salvar nova senha'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
