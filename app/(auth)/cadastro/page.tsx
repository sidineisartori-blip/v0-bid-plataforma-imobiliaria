'use client'


import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { traduzirErroAuth } from '@/lib/auth-errors'

const ESTADOS_BR = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
]

function formatarWhatsApp(valor: string): string {
  const nums = valor.replace(/\D/g, '').slice(0, 11)
  if (nums.length <= 2)  return `(${nums}`
  if (nums.length <= 7)  return `(${nums.slice(0,2)}) ${nums.slice(2)}`
  if (nums.length <= 11) return `(${nums.slice(0,2)}) ${nums.slice(2,7)}-${nums.slice(7)}`
  return valor
}

export default function CadastroPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [step, setStep]     = useState(1)
  const [loading, setLoading] = useState(false)
  const [erro, setErro]     = useState('')

  // Etapa 1
  const [nome, setNome]                   = useState('')
  const [email, setEmail]                 = useState('')
  const [whatsapp, setWhatsapp]           = useState('')
  const [senha, setSenha]                 = useState('')
  const [confirmarSenha, setConfirmar]    = useState('')
  const [mostrarSenha, setMostrarSenha]   = useState(false)
  const [mostrarConf, setMostrarConf]     = useState(false)

  // Etapa 2
  const [creci, setCreci]               = useState('')
  const [estadoCreci, setEstadoCreci]   = useState('')
  const [tipo, setTipo]                 = useState<'PF' | 'PJ'>('PF')
  const [nomeImobiliaria, setNomeImob]  = useState('')
  const [cidade, setCidade]             = useState('')
  const [aceitouTermos, setAceitou]     = useState(false)

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
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '13px',
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    color: '#9B9690',
    marginBottom: '10px',
    fontWeight: 500,
  }

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    if (!nome || !email || !whatsapp || !senha || !confirmarSenha) {
      setErro('Preencha todos os campos.')
      return
    }
    if (senha !== confirmarSenha) {
      setErro('As senhas nao conferem.')
      return
    }
    if (senha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    setErro('')
    setStep(2)
  }

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    if (!creci || !estadoCreci || !cidade) {
      setErro('Preencha todos os dados profissionais.')
      return
    }
    if (!aceitouTermos) {
      setErro('Voce precisa aceitar os Termos de Uso para continuar.')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: {
          full_name: nome,
          phone: whatsapp,
          creci,
          estado_creci: estadoCreci,
          tipo,
          nome_imobiliaria: nomeImobiliaria,
          cidade,
          slug: nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s-]/g,'').replace(/\s+/g,'-').replace(/-+/g,'-').trim() + '-' + Date.now().toString(36),
        },
      },
    })
    if (error) {
      setErro(traduzirErroAuth(error.message))
      setLoading(false)
    } else {
      router.push(`/cadastro/confirmacao?email=${encodeURIComponent(email)}`)
    }
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
      padding: '40px 0',
    }}>
      {/* Grid lines */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.03,
        backgroundImage: `linear-gradient(rgba(201,168,76,1) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,1) 1px, transparent 1px)`,
        backgroundSize: '50px 50px',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 600px 500px at 50% 40%, rgba(201,168,76,0.08) 0%, transparent 70%)',
      }} />

      <div style={{ position: 'relative', width: '100%', maxWidth: '520px', padding: '0 24px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '56px', fontWeight: 700, color: '#C9A84C', margin: 0, lineHeight: 1 }}>
            BID
          </h1>
          <p style={{ fontSize: '13px', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#9B9690', marginTop: '12px' }}>
            Plataforma Imobiliaria
          </p>
        </div>

        {/* Barra de progresso visual (FIX 5) */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#C9A84C' }}>
              Etapa {step} de 2
            </span>
            <span style={{ fontSize: '13px', color: '#9B9690' }}>
              {step === 1 ? 'Dados Pessoais' : 'Dados Profissionais'}
            </span>
          </div>
          <div style={{ backgroundColor: '#232324', borderRadius: '2px', height: '4px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              backgroundColor: '#C9A84C',
              borderRadius: '2px',
              width: step === 1 ? '50%' : '100%',
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>

        {/* Card */}
        <div style={{
          backgroundColor: '#181819',
          border: '1px solid rgba(201,168,76,0.2)',
          borderRadius: '2px',
          padding: '44px',
        }}>
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

          <form
            onSubmit={step === 1 ? handleStep1 : handleCadastro}
            style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
          >
            {step === 1 ? (
              <>
                <div>
                  <label style={labelStyle}>Nome Completo</label>
                  <input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Joao Silva" required style={inputStyle} />
                </div>

                <div>
                  <label style={labelStyle}>E-mail</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required style={inputStyle} />
                </div>

                {/* WhatsApp com mascara (FIX 7) */}
                <div>
                  <label style={labelStyle}>WhatsApp</label>
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={e => setWhatsapp(formatarWhatsApp(e.target.value))}
                    placeholder="(43) 98404-0576"
                    inputMode="numeric"
                    required
                    style={inputStyle}
                  />
                </div>

                {/* Senha com toggle (FIX 6) */}
                <div>
                  <label style={labelStyle}>Senha</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={mostrarSenha ? 'text' : 'password'}
                      value={senha}
                      onChange={e => setSenha(e.target.value)}
                      placeholder="********"
                      required
                      style={{ ...inputStyle, paddingRight: '48px' }}
                    />
                    <button type="button" onClick={() => setMostrarSenha(p => !p)} aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                      style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9B9690', fontSize: '18px', lineHeight: 1, padding: 0 }}>
                      {mostrarSenha ? '○' : '●'}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Confirmar Senha</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={mostrarConf ? 'text' : 'password'}
                      value={confirmarSenha}
                      onChange={e => setConfirmar(e.target.value)}
                      placeholder="********"
                      required
                      style={{ ...inputStyle, paddingRight: '48px' }}
                    />
                    <button type="button" onClick={() => setMostrarConf(p => !p)} aria-label={mostrarConf ? 'Ocultar senha' : 'Mostrar senha'}
                      style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9B9690', fontSize: '18px', lineHeight: 1, padding: 0 }}>
                      {mostrarConf ? '○' : '●'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label style={labelStyle}>CRECI</label>
                  <input type="text" value={creci} onChange={e => setCreci(e.target.value)} placeholder="123456" required style={inputStyle} />
                </div>

                <div>
                  <label style={labelStyle}>Estado do CRECI</label>
                  <select value={estadoCreci} onChange={e => setEstadoCreci(e.target.value)} required
                    style={{ ...inputStyle, appearance: 'none' as const }}>
                    <option value="">Selecione...</option>
                    {ESTADOS_BR.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Tipo</label>
                  <div style={{ display: 'flex', gap: '24px' }}>
                    {(['PF', 'PJ'] as const).map(t => (
                      <label key={t} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '15px', color: '#F0EDE6' }}>
                        <input type="radio" value={t} checked={tipo === t} onChange={() => setTipo(t)} style={{ accentColor: '#C9A84C', width: '18px', height: '18px' }} />
                        {t === 'PF' ? 'Pessoa Fisica' : 'Pessoa Juridica'}
                      </label>
                    ))}
                  </div>
                </div>

                {tipo === 'PJ' && (
                  <div>
                    <label style={labelStyle}>Nome da Imobiliaria</label>
                    <input type="text" value={nomeImobiliaria} onChange={e => setNomeImob(e.target.value)} placeholder="Imobiliaria ABC" style={inputStyle} />
                  </div>
                )}

                <div>
                  <label style={labelStyle}>Cidade de Atuacao</label>
                  <input type="text" value={cidade} onChange={e => setCidade(e.target.value)} placeholder="Jacarezinho" required style={inputStyle} />
                </div>

                {/* Checkbox de termos (FIX 10) */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginTop: '8px' }}>
                  <input
                    type="checkbox"
                    id="termos"
                    checked={aceitouTermos}
                    onChange={e => setAceitou(e.target.checked)}
                    style={{ marginTop: '3px', accentColor: '#C9A84C', cursor: 'pointer', flexShrink: 0, width: '18px', height: '18px' }}
                  />
                  <label htmlFor="termos" style={{ fontSize: '14px', color: '#9B9690', cursor: 'pointer', lineHeight: 1.6 }}>
                    Li e concordo com os{' '}
                    <a href="/termos" target="_blank" style={{ color: '#C9A84C', textDecoration: 'none' }}>Termos de Uso</a>
                    {' '}e a{' '}
                    <a href="/privacidade" target="_blank" style={{ color: '#C9A84C', textDecoration: 'none' }}>Politica de Privacidade</a>
                  </label>
                </div>
              </>
            )}

            {/* Botoes */}
            <div style={{ display: 'flex', gap: '16px', paddingTop: '12px' }}>
              {step === 2 && (
                <button
                  type="button"
                  onClick={() => { setStep(1); setErro('') }}
                  style={{
                    flex: 1,
                    padding: '14px',
                    backgroundColor: 'transparent',
                    color: '#F0EDE6',
                    border: '1px solid #2E2E30',
                    borderRadius: '2px',
                    fontSize: '15px',
                    cursor: 'pointer',
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                >
                  Voltar
                </button>
              )}
              <button
                type="submit"
                disabled={loading || (step === 2 && !aceitouTermos)}
                style={{
                  flex: 1,
                  padding: '14px',
                  backgroundColor: '#C9A84C',
                  color: '#0E0E0F',
                  border: 'none',
                  borderRadius: '2px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: loading || (step === 2 && !aceitouTermos) ? 'not-allowed' : 'pointer',
                  opacity: loading || (step === 2 && !aceitouTermos) ? 0.6 : 1,
                  fontFamily: 'DM Sans, sans-serif',
                  letterSpacing: '0.05em',
                  transition: 'opacity 0.2s',
                }}
              >
                {loading ? 'Criando...' : step === 1 ? 'Proximo' : 'Criar Conta'}
              </button>
            </div>
          </form>

          <p style={{ textAlign: 'center', fontSize: '15px', color: '#9B9690', marginTop: '28px', paddingTop: '28px', borderTop: '1px solid #232324' }}>
            Ja tem conta?{' '}
            <Link href="/login" style={{ color: '#C9A84C', textDecoration: 'none', fontWeight: 500 }}>
              Faca login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
