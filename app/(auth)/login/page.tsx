'use client'


import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { traduzirErroAuth } from '@/lib/auth-errors'

function LoginForm() {
  const router   = useRouter()
  const supabase = createClient()
  const searchParams     = useSearchParams()
  const cadastroSucesso  = searchParams.get('cadastro') === 'sucesso'
  const senhaAtualizada  = searchParams.get('senha') === 'atualizada'

  const [email, setEmail]         = useState('')
  const [senha, setSenha]         = useState('')
  const [mostrarSenha, setMostrar] = useState(false)
  const [loading, setLoading]     = useState(false)
  const [erro, setErro]           = useState('')
  const [montado, setMontado]     = useState(false)
  const [hoverBotao, setHoverBotao] = useState(false)

  useEffect(() => { setMontado(true) }, [])

  const aplicarFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = '#C9A84C'
  }
  const removerFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = '#2E2E30'
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    setLoading(true)
    try {
      const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password: senha })
      if (error) {
        setErro(traduzirErroAuth(error.message))
        setLoading(false)
      } else {
        // Garantia de onboarding: verifica se a row em corretores existe.
        // Cobre usuários que se cadastraram antes do fix do trigger.
        const userId = signInData?.user?.id
        const userMeta = signInData?.user?.user_metadata
        if (userId && userMeta?.creci) {
          // Tem dados de corretor no metadata — tentar criar perfil se não existir
          fetch('/api/auth/onboarding', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: userId,
              full_name: userMeta.full_name || email,
              email,
              phone: userMeta.phone || null,
              creci: userMeta.creci,
              estado_creci: userMeta.estado_creci || 'SP',
              tipo: userMeta.tipo || 'PF',
              nome_imobiliaria: userMeta.nome_imobiliaria || null,
              cidade: userMeta.cidade || '',
              slug: userMeta.slug || userId,
            }),
          }).catch(() => {
            // Silencioso — não bloquear o login
          })
        }
        const redirect = searchParams.get('redirect')
        router.push(redirect && redirect.startsWith('/') ? redirect : '/dashboard')
      }
    } catch {
      setErro('Falha de conexão. Verifique sua internet e tente novamente.')
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    backgroundColor: '#232324',
    border: '1px solid #2E2E30',
    borderRadius: '2px',
    color: '#F0EDE6',
    fontSize: '16px',
    outline: 'none',
    fontFamily: 'DM Sans, sans-serif',
    transition: 'border-color 0.15s',
  }

  const bannerGreen: React.CSSProperties = {
    backgroundColor: 'rgba(92,184,138,0.1)',
    border: '1px solid rgba(92,184,138,0.25)',
    borderRadius: '2px',
    padding: '14px 16px',
    marginBottom: '20px',
    fontSize: '15px',
    color: '#c8f5dc',
    lineHeight: 1.5,
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
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '56px', fontWeight: 700, color: '#C9A84C', margin: 0, lineHeight: 1 }}>
            BID
          </h1>
          <p style={{ fontSize: '13px', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#9B9690', marginTop: '12px' }}>
            Plataforma Imobiliaria
          </p>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(201,168,76,0.15)' }} />
          <div style={{ width: '80px', height: '1px', backgroundColor: '#C9A84C' }} />
          <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(201,168,76,0.15)' }} />
        </div>

        {/* Card */}
        <div style={{
          backgroundColor: '#181819',
          border: '1px solid rgba(201,168,76,0.2)',
          borderRadius: '2px',
          padding: '48px',
          opacity: montado ? 1 : 0,
          transform: montado ? 'translateY(0)' : 'translateY(8px)',
          transition: 'opacity 0.3s ease, transform 0.3s ease',
        }}>
          {/* Banners de sucesso */}
          {cadastroSucesso && (
            <div style={bannerGreen}>
              Conta criada com sucesso! Confirme seu e-mail para entrar.
            </div>
          )}
          {senhaAtualizada && (
            <div style={bannerGreen}>
              Senha atualizada com sucesso! Faca login com a nova senha.
            </div>
          )}

          {/* Erro */}
          {erro && (
            <div style={{
              backgroundColor: 'rgba(224,92,92,0.1)',
              border: '1px solid rgba(224,92,92,0.3)',
              borderRadius: '2px',
              padding: '14px 16px',
              marginBottom: '24px',
              fontSize: '15px',
              color: '#E05C5C',
            }}>
              {erro}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* E-mail */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9B9690', marginBottom: '10px', fontWeight: 500 }}>
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={aplicarFocus}
                onBlur={removerFocus}
                placeholder="seu@email.com"
                required
                style={inputStyle}
              />
            </div>

            {/* Senha com toggle */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9B9690', marginBottom: '10px', fontWeight: 500 }}>
                Senha
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  onFocus={aplicarFocus}
                  onBlur={removerFocus}
                  placeholder="********"
                  required
                  style={{ ...inputStyle, paddingRight: '48px' }}
                />
                <button
                  type="button"
                  onClick={() => setMostrar(p => !p)}
                  aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9B9690', fontSize: '18px', lineHeight: 1, padding: 0 }}
                >
                  {mostrarSenha ? '○' : '●'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              onMouseEnter={() => setHoverBotao(true)}
              onMouseLeave={() => setHoverBotao(false)}
              style={{
                padding: '14px',
                backgroundColor: hoverBotao && !loading ? '#B8942F' : '#C9A84C',
                color: '#0E0E0F',
                border: 'none',
                borderRadius: '2px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                fontFamily: 'DM Sans, sans-serif',
                letterSpacing: '0.05em',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'background-color 0.15s',
              }}
            >
              {loading && (
                <svg width="18" height="18" viewBox="0 0 24 24" style={{ animation: 'bid-spin 0.7s linear infinite' }}>
                  <circle cx="12" cy="12" r="9" fill="none" stroke="#0E0E0F" strokeOpacity="0.25" strokeWidth="3" />
                  <path d="M12 3a9 9 0 0 1 9 9" fill="none" stroke="#0E0E0F" strokeWidth="3" strokeLinecap="round" />
                </svg>
              )}
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
            <style>{'@keyframes bid-spin { to { transform: rotate(360deg) } }'}</style>
          </form>

          <div style={{ marginTop: '32px', paddingTop: '32px', borderTop: '1px solid #232324', display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center' }}>
            <Link href="/recuperar-senha" style={{ fontSize: '15px', color: '#C9A84C', textDecoration: 'none' }}>
              Esqueci minha senha
            </Link>
            <p style={{ fontSize: '15px', color: '#9B9690', margin: 0 }}>
              Nao tem conta?{' '}
              <Link href="/cadastro" style={{ color: '#C9A84C', textDecoration: 'none', fontWeight: 500 }}>
                Cadastre-se
              </Link>
            </p>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Link href="/admin/login" style={{ fontSize: '12px', color: '#5a5a5c', textDecoration: 'none', letterSpacing: '0.05em' }}>
            Acesso administrativo
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
