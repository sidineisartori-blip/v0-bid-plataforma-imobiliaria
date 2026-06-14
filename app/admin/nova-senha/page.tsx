'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

function NovaSenhaForm() {
  const router = useRouter()
  const params = useSearchParams()
  const token = params.get('token') || ''

  const [senha, setSenha] = useState('')
  const [confirma, setConfirma] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'erro'>('idle')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('erro')
      setMsg('Link inválido ou expirado.')
    }
  }, [token])

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    if (senha.length < 6) { setMsg('A senha deve ter pelo menos 6 caracteres.'); setStatus('erro'); return }
    if (senha !== confirma) { setMsg('As senhas não conferem.'); setStatus('erro'); return }

    setStatus('loading')
    try {
      const res = await fetch('/api/admin/nova-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, senha }),
      })
      const data = await res.json()
      if (res.ok) {
        setStatus('ok')
        setTimeout(() => router.push('/admin/login'), 2500)
      } else {
        setStatus('erro')
        setMsg(data.error || 'Erro ao redefinir senha.')
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
        <p style={{ fontSize: 14, color: '#9B9690', textAlign: 'center', margin: '0 0 36px' }}>Nova senha Master</p>

        {status === 'ok' ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
            <p style={{ fontSize: 15, color: '#5CB88A' }}>Senha redefinida! Redirecionando...</p>
          </div>
        ) : (
          <form onSubmit={salvar} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, color: '#9B9690', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Nova Senha</label>
              <input
                type="password"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••"
                style={{ width: '100%', padding: '12px 14px', backgroundColor: '#0E0E0F', border: '1px solid #2E2E30', borderRadius: 2, color: '#F0EDE6', fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#9B9690', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Confirmar Senha</label>
              <input
                type="password"
                value={confirma}
                onChange={e => setConfirma(e.target.value)}
                required
                placeholder="••••••••"
                style={{ width: '100%', padding: '12px 14px', backgroundColor: '#0E0E0F', border: '1px solid #2E2E30', borderRadius: 2, color: '#F0EDE6', fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {status === 'erro' && (
              <p style={{ fontSize: 13, color: '#E05C5C', margin: 0 }}>{msg}</p>
            )}

            <button
              type="submit"
              disabled={status === 'loading' || !token}
              style={{ backgroundColor: '#C9A84C', border: 'none', borderRadius: 2, color: '#0E0E0F', fontSize: 15, fontWeight: 700, padding: '14px', cursor: status === 'loading' ? 'not-allowed' : 'pointer', opacity: status === 'loading' ? 0.7 : 1, marginTop: 4 }}
            >
              {status === 'loading' ? 'Salvando...' : 'Salvar Nova Senha'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default function AdminNovaSenhaPage() {
  return (
    <Suspense>
      <NovaSenhaForm />
    </Suspense>
  )
}
