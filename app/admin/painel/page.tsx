'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'
import ModalConfirm from '@/components/ui/ModalConfirm'

type Aba = 'dashboard' | 'corretores' | 'planos' | 'financeiro' | 'relatorios'

interface Corretor {
  id: string
  full_name: string
  email: string
  creci: string | null
  creci_status: string
  plano: string
  nota_media: number
  created_at: string
  phone: string | null
  is_active: boolean
}

interface Assinatura {
  id: string
  corretor_id: string
  plano: string
  status: string
  valor_mensal: number
  periodo_inicio: string
  periodo_fim: string | null
  corretor?: { full_name: string; email: string } | null
}

interface AdminSession {
  id: string
  email: string
  role: string
  full_name: string
}

const PLANOS = [
  { id: 'free',       nome: 'Free',       valor: 0,   cor: '#9B9690', limiteImoveis: 5,  limiteSolicitacoes: 10 },
  { id: 'pro',        nome: 'Pro',        valor: 97,  cor: '#5C9BE0', limiteImoveis: 30, limiteSolicitacoes: 50 },
  { id: 'premium',    nome: 'Premium',    valor: 240, cor: '#C9A84C', limiteImoveis: -1, limiteSolicitacoes: -1 },
  { id: 'enterprise', nome: 'Enterprise', valor: 720, cor: '#5CB88A', limiteImoveis: -1, limiteSolicitacoes: -1 },
]

const CRECI_STATUS = ['pendente', 'ativo', 'suspenso', 'cancelado']

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR')
}

function getIniciais(nome: string): string {
  return nome.trim().split(/\s+/).slice(0, 2).map((n) => n[0] || '').join('').toUpperCase()
}

const CORES_PLANO: Record<string, string> = {
  free: '#9B9690', pro: '#5C9BE0', premium: '#C9A84C', enterprise: '#5CB88A',
}

// ─── MODAL BASE ─────────────────────────────────────────────────────────────
function Modal({ titulo, onClose, children }: { titulo: string; onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div ref={ref} style={{ backgroundColor: '#181819', border: '1px solid #2E2E30', borderRadius: 4, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #232324' }}>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 600, color: '#F0EDE6', margin: 0 }}>{titulo}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9B9690', fontSize: 22, cursor: 'pointer', lineHeight: 1, padding: 0 }}>×</button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  )
}

// ─── CAMPO DE FORM ───────────────────────────────────────────────────────────
function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 11, color: '#9B9690', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  padding: '11px 13px', backgroundColor: '#0E0E0F', border: '1px solid #2E2E30',
  borderRadius: 2, color: '#F0EDE6', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box',
}

const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' }

// ─── MODAL CRIAR CORRETOR ────────────────────────────────────────────────────
function ModalCriar({ onClose, onSalvo }: { onClose: () => void; onSalvo: () => void }) {
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', creci: '', plano: 'free', senha: '' })
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    if (form.senha.length < 6) { setErro('A senha deve ter pelo menos 6 caracteres.'); return }
    setSalvando(true); setErro('')
    try {
      const res = await fetch('/api/admin/corretores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setErro(data.error || 'Erro ao criar corretor.'); return }
      onSalvo()
      onClose()
    } catch { setErro('Falha na conexão.') }
    finally { setSalvando(false) }
  }

  return (
    <Modal titulo="Novo Corretor" onClose={onClose}>
      <form onSubmit={salvar} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Campo label="Nome completo *">
            <input style={inputStyle} value={form.full_name} onChange={set('full_name')} required placeholder="João Silva" />
          </Campo>
          <Campo label="E-mail *">
            <input style={inputStyle} type="email" value={form.email} onChange={set('email')} required placeholder="joao@email.com" />
          </Campo>
          <Campo label="Telefone / WhatsApp">
            <input style={inputStyle} value={form.phone} onChange={set('phone')} placeholder="(43) 99999-9999" />
          </Campo>
          <Campo label="CRECI">
            <input style={inputStyle} value={form.creci} onChange={set('creci')} placeholder="PR-12345-F" />
          </Campo>
          <Campo label="Plano">
            <select style={selectStyle} value={form.plano} onChange={set('plano')}>
              {PLANOS.map(p => <option key={p.id} value={p.id}>{p.nome}{p.valor > 0 ? ` — R$ ${p.valor}/mês` : ' (Grátis)'}</option>)}
            </select>
          </Campo>
          <Campo label="Senha inicial *">
            <input style={inputStyle} type="password" value={form.senha} onChange={set('senha')} required minLength={6} placeholder="mín. 6 caracteres" />
          </Campo>
        </div>

        {erro && <p style={{ fontSize: 13, color: '#E05C5C', margin: 0 }}>{erro}</p>}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
          <button type="button" onClick={onClose} style={{ padding: '10px 20px', background: 'none', border: '1px solid #2E2E30', borderRadius: 2, color: '#9B9690', fontSize: 14, cursor: 'pointer' }}>
            Cancelar
          </button>
          <button type="submit" disabled={salvando} style={{ padding: '10px 24px', backgroundColor: '#C9A84C', border: 'none', borderRadius: 2, color: '#0E0E0F', fontSize: 14, fontWeight: 700, cursor: salvando ? 'not-allowed' : 'pointer', opacity: salvando ? 0.7 : 1 }}>
            {salvando ? 'Criando...' : 'Criar Corretor'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ─── MODAL EDITAR CORRETOR ───────────────────────────────────────────────────
function ModalEditar({ corretor, onClose, onSalvo }: { corretor: Corretor; onClose: () => void; onSalvo: () => void }) {
  const [form, setForm] = useState({
    full_name:    corretor.full_name,
    phone:        corretor.phone || '',
    creci:        corretor.creci || '',
    creci_status: corretor.creci_status || 'pendente',
    plano:        corretor.plano || 'free',
    is_active:    corretor.is_active ?? true,
    nova_senha:   '',
  })
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    if (form.nova_senha && form.nova_senha.length < 6) { setErro('Nova senha deve ter pelo menos 6 caracteres.'); return }
    setSalvando(true); setErro('')
    try {
      const res = await fetch(`/api/admin/corretores/${corretor.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setErro(data.error || 'Erro ao salvar.'); return }
      onSalvo()
      onClose()
    } catch { setErro('Falha na conexão.') }
    finally { setSalvando(false) }
  }

  return (
    <Modal titulo={`Editar — ${corretor.full_name}`} onClose={onClose}>
      <form onSubmit={salvar} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Info somente leitura */}
        <div style={{ backgroundColor: '#0E0E0F', border: '1px solid #232324', borderRadius: 2, padding: '10px 14px' }}>
          <p style={{ fontSize: 12, color: '#9B9690', margin: '0 0 2px' }}>E-mail (imutável)</p>
          <p style={{ fontSize: 14, color: '#F0EDE6', margin: 0 }}>{corretor.email}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Campo label="Nome completo">
            <input style={inputStyle} value={form.full_name} onChange={set('full_name')} required />
          </Campo>
          <Campo label="Telefone / WhatsApp">
            <input style={inputStyle} value={form.phone} onChange={set('phone')} placeholder="(43) 99999-9999" />
          </Campo>
          <Campo label="CRECI">
            <input style={inputStyle} value={form.creci} onChange={set('creci')} placeholder="PR-12345-F" />
          </Campo>
          <Campo label="Status CRECI">
            <select style={selectStyle} value={form.creci_status} onChange={set('creci_status')}>
              {CRECI_STATUS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </Campo>
          <Campo label="Plano">
            <select style={selectStyle} value={form.plano} onChange={set('plano')}>
              {PLANOS.map(p => <option key={p.id} value={p.id}>{p.nome}{p.valor > 0 ? ` — R$ ${p.valor}/mês` : ' (Grátis)'}</option>)}
            </select>
          </Campo>
          <Campo label="Status da conta">
            <select style={selectStyle} value={form.is_active ? 'ativo' : 'inativo'} onChange={e => setForm(f => ({ ...f, is_active: e.target.value === 'ativo' }))}>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo (bloqueado)</option>
            </select>
          </Campo>
          <Campo label="Nova senha (opcional)">
            <input style={inputStyle} type="password" value={form.nova_senha} onChange={set('nova_senha')} placeholder="deixe em branco para manter" minLength={6} />
          </Campo>
        </div>

        {erro && <p style={{ fontSize: 13, color: '#E05C5C', margin: 0 }}>{erro}</p>}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
          <button type="button" onClick={onClose} style={{ padding: '10px 20px', background: 'none', border: '1px solid #2E2E30', borderRadius: 2, color: '#9B9690', fontSize: 14, cursor: 'pointer' }}>
            Cancelar
          </button>
          <button type="submit" disabled={salvando} style={{ padding: '10px 24px', backgroundColor: '#C9A84C', border: 'none', borderRadius: 2, color: '#0E0E0F', fontSize: 14, fontWeight: 700, cursor: salvando ? 'not-allowed' : 'pointer', opacity: salvando ? 0.7 : 1 }}>
            {salvando ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ─── MODAL CONFIRMAR EXCLUSÃO ────────────────────────────────────────────────
function ModalExcluir({ corretor, onClose, onConfirm, excluindo }: { corretor: Corretor; onClose: () => void; onConfirm: () => void; excluindo: boolean }) {
  return (
    <Modal titulo="Confirmar Exclusão" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ backgroundColor: 'rgba(224,92,92,0.08)', border: '1px solid rgba(224,92,92,0.2)', borderRadius: 2, padding: 16 }}>
          <p style={{ fontSize: 14, color: '#E05C5C', margin: '0 0 8px', fontWeight: 600 }}>⚠ Atenção — esta ação não pode ser desfeita</p>
          <p style={{ fontSize: 13, color: '#9B9690', margin: 0, lineHeight: 1.5 }}>
            O corretor <strong style={{ color: '#F0EDE6' }}>{corretor.full_name}</strong> ({corretor.email}) será desativado. Todos os seus imóveis e solicitações permanecem no banco, mas o acesso à plataforma será bloqueado.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} disabled={excluindo} style={{ padding: '10px 20px', background: 'none', border: '1px solid #2E2E30', borderRadius: 2, color: '#9B9690', fontSize: 14, cursor: 'pointer' }}>
            Cancelar
          </button>
          <button onClick={onConfirm} disabled={excluindo} style={{ padding: '10px 24px', backgroundColor: '#E05C5C', border: 'none', borderRadius: 2, color: '#fff', fontSize: 14, fontWeight: 700, cursor: excluindo ? 'not-allowed' : 'pointer', opacity: excluindo ? 0.7 : 1 }}>
            {excluindo ? 'Excluindo...' : 'Confirmar Exclusão'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ─── PÁGINA PRINCIPAL ────────────────────────────────────────────────────────
export default function AdminPainelPage() {
  const router = useRouter()
  const supabase = createClient()
  const [session, setSession] = useState<AdminSession | null>(null)
  const [aba, setAba] = useState<Aba>('dashboard')
  const [corretores, setCorretores] = useState<Corretor[]>([])
  const [assinaturas, setAssinaturas] = useState<Assinatura[]>([])
  const [loading, setLoading] = useState(true)
  const [atualizando, setAtualizando] = useState<string | null>(null)
  const [telaEstreita, setTelaEstreita] = useState(false)
  const [busca, setBusca] = useState('')
  const [filtroPlano, setFiltroPlano] = useState<string>('todos')
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')
  const [linhaHover, setLinhaHover] = useState<string | null>(null)

  // Modais CRUD
  const [modalCriar, setModalCriar] = useState(false)
  const [modalEditar, setModalEditar] = useState<Corretor | null>(null)
  const [modalExcluir, setModalExcluir] = useState<Corretor | null>(null)
  const [excluindo, setExcluindo] = useState(false)
  const [confirmarCancelamento, setConfirmarCancelamento] = useState<{ id: string; corretorId: string } | null>(null)
  const [cancelando, setCancelando] = useState(false)

  const [metricas, setMetricas] = useState({ totalCorretores: 0, corretoresAtivos: 0, assinaturasPagas: 0, mrrTotal: 0 })

  useEffect(() => {
    const checar = () => setTelaEstreita(window.innerWidth < 1200)
    checar()
    window.addEventListener('resize', checar)
    return () => window.removeEventListener('resize', checar)
  }, [])

  useEffect(() => {
    async function verificarSessao() {
      try {
        const res = await fetch('/api/admin/me')
        if (!res.ok) { router.push('/admin/login'); return }
        setSession(await res.json())
        carregarDados()
      } catch { router.push('/admin/login') }
    }
    verificarSessao()
  }, [])

  async function carregarDados() {
    setLoading(true)
    const [
      { data: corretoresData, count: totalCorretores },
      { data: assinaturasData },
      { count: corretoresAtivos },
    ] = await Promise.all([
      supabase.from('corretores').select('id, full_name, email, creci, creci_status, plano, nota_media, created_at, phone, is_active', { count: 'exact' }).order('created_at', { ascending: false }),
      supabase.from('assinaturas').select('*, corretor:corretores(full_name, email)').order('created_at', { ascending: false }),
      supabase.from('corretores').select('*', { count: 'exact', head: true }).eq('is_active', true),
    ])
    setCorretores((corretoresData as Corretor[]) || [])
    setAssinaturas((assinaturasData as Assinatura[]) || [])

    const assinaturasPagas = (assinaturasData || []).filter((a: Assinatura) => a.status === 'ativa' && a.plano !== 'free').length
    const mrrTotal = (assinaturasData || []).filter((a: Assinatura) => a.status === 'ativa').reduce((acc: number, a: Assinatura) => acc + (a.valor_mensal || 0), 0)
    setMetricas({ totalCorretores: totalCorretores || 0, corretoresAtivos: corretoresAtivos || 0, assinaturasPagas, mrrTotal })
    setLoading(false)
  }

  async function alterarPlano(corretorId: string, novoPlano: string) {
    setAtualizando(corretorId)
    const planoInfo = PLANOS.find((p) => p.id === novoPlano)
    if (!planoInfo) return
    await supabase.from('corretores').update({ plano: novoPlano, plano_ativo_desde: new Date().toISOString() }).eq('id', corretorId)
    const { data: assinaturaExistente } = await supabase.from('assinaturas').select('id').eq('corretor_id', corretorId).eq('status', 'ativa').single()
    if (assinaturaExistente) {
      await supabase.from('assinaturas').update({ plano: novoPlano, valor_mensal: planoInfo.valor }).eq('id', assinaturaExistente.id)
    } else {
      await supabase.from('assinaturas').insert({ corretor_id: corretorId, plano: novoPlano, status: 'ativa', valor_mensal: planoInfo.valor, periodo_inicio: new Date().toISOString() })
    }
    await supabase.from('audit_log').insert({ action: 'plano_alterado', entity_type: 'corretor', entity_id: corretorId, performed_by: session?.id, details: { plano_novo: novoPlano } })
    await carregarDados()
    setAtualizando(null)
  }

  async function executarCancelamento() {
    if (!confirmarCancelamento) return
    const { id: assinaturaId, corretorId } = confirmarCancelamento
    setCancelando(true)
    await supabase.from('assinaturas').update({ status: 'cancelada', cancelado_em: new Date().toISOString() }).eq('id', assinaturaId)
    await supabase.from('corretores').update({ plano: 'free' }).eq('id', corretorId)
    await supabase.from('audit_log').insert({ action: 'assinatura_cancelada', entity_type: 'assinatura', entity_id: assinaturaId, performed_by: session?.id, details: { corretor_id: corretorId } })
    setCancelando(false)
    setConfirmarCancelamento(null)
    await carregarDados()
  }

  async function excluirCorretor() {
    if (!modalExcluir) return
    setExcluindo(true)
    await fetch(`/api/admin/corretores/${modalExcluir.id}`, { method: 'DELETE' })
    setExcluindo(false)
    setModalExcluir(null)
    carregarDados()
  }

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  const corretoresFiltrados = corretores.filter((c) => {
    const matchBusca = busca === '' || c.full_name.toLowerCase().includes(busca.toLowerCase()) || c.email?.toLowerCase().includes(busca.toLowerCase()) || c.creci?.toLowerCase().includes(busca.toLowerCase())
    const matchPlano = filtroPlano === 'todos' || c.plano === filtroPlano
    const matchStatus = filtroStatus === 'todos' || (filtroStatus === 'ativo' ? c.is_active : !c.is_active)
    return matchBusca && matchPlano && matchStatus
  })

  const btnAba = (id: Aba): React.CSSProperties => ({
    background: 'none', border: 'none',
    borderBottom: aba === id ? '2px solid #C9A84C' : '2px solid transparent',
    color: aba === id ? '#C9A84C' : '#9B9690',
    fontSize: '15px', fontWeight: aba === id ? 600 : 400,
    padding: '12px 20px', cursor: 'pointer', transition: 'color 0.15s',
  })

  const metricaBox = (valor: string | number, label: string, destaque?: string) => (
    <div style={{ backgroundColor: '#181819', border: '1px solid rgba(201,168,76,0.1)', borderRadius: '2px', padding: '24px 28px' }}>
      <p style={{ fontSize: '12px', color: '#9B9690', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 10px' }}>{label}</p>
      <p style={{ fontFamily: 'var(--font-serif, serif)', fontSize: '36px', fontWeight: 700, color: destaque || '#F0EDE6', margin: 0 }}>{valor}</p>
    </div>
  )

  if (loading || !session) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0E0E0F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #232324', borderTopColor: '#C9A84C', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0E0E0F' }}>
      {/* Modais */}
      {modalCriar && <ModalCriar onClose={() => setModalCriar(false)} onSalvo={carregarDados} />}
      {modalEditar && <ModalEditar corretor={modalEditar} onClose={() => setModalEditar(null)} onSalvo={carregarDados} />}
      {modalExcluir && <ModalExcluir corretor={modalExcluir} onClose={() => setModalExcluir(null)} onConfirm={excluirCorretor} excluindo={excluindo} />}
      {confirmarCancelamento && (
        <ModalConfirm
          titulo="Cancelar assinatura?"
          descricao="O corretor voltará ao plano Free imediatamente. Esta ação não pode ser desfeita."
          labelConfirmar="Cancelar Assinatura"
          onConfirmar={executarCancelamento}
          onCancelar={() => setConfirmarCancelamento(null)}
          carregando={cancelando}
        />
      )}

      {/* Header */}
      <header style={{ backgroundColor: '#181819', borderBottom: '1px solid #232324', padding: '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '28px', fontWeight: 700, color: '#C9A84C', margin: 0 }}>BID</h1>
          <span style={{ fontSize: '14px', color: '#9B9690' }}>Painel Master</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{ fontSize: '14px', color: '#F0EDE6' }}>{session.full_name}</span>
          <button onClick={logout} style={{ backgroundColor: 'transparent', border: '1px solid #E05C5C40', color: '#E05C5C', borderRadius: '2px', padding: '8px 16px', fontSize: '14px', cursor: 'pointer' }}>
            Sair
          </button>
        </div>
      </header>

      <div style={{ padding: '40px' }}>
        {/* Abas */}
        <div style={{ borderBottom: '1px solid #232324', marginBottom: '32px', display: 'flex', alignItems: 'center' }}>
          {(['dashboard', 'corretores', 'planos', 'financeiro'] as Aba[]).map((id) => (
            <button key={id} style={btnAba(id)} onClick={() => setAba(id)}>
              {aba === id && <span style={{ color: '#C9A84C', fontSize: '6px', marginRight: '8px', verticalAlign: 'middle', display: 'inline-block' }} aria-hidden="true">●</span>}
              {id === 'dashboard' && 'Dashboard'}
              {id === 'corretores' && `Corretores (${corretores.length})`}
              {id === 'planos' && 'Gerenciar Planos'}
              {id === 'financeiro' && 'Financeiro'}
            </button>
          ))}
          <button style={{ ...btnAba('relatorios'), marginLeft: 'auto', border: '1px solid #C9A84C40', borderRadius: '2px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => router.push('/admin/relatorios')}>
            📊 Relatórios
          </button>
        </div>

        {/* ── DASHBOARD ── */}
        {aba === 'dashboard' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
            {metricaBox(metricas.totalCorretores, 'Total Corretores')}
            {metricaBox(metricas.corretoresAtivos, 'Corretores Ativos')}
            {metricaBox(metricas.assinaturasPagas, 'Assinantes Pagos', '#5CB88A')}
            {metricaBox(formatCurrency(metricas.mrrTotal), 'MRR Total', '#C9A84C')}
          </div>
        )}

        {/* ── CORRETORES ── */}
        {aba === 'corretores' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Barra de ações */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Buscar por nome, e-mail ou CRECI..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                style={{ flex: 1, minWidth: 220, maxWidth: 360, padding: '11px 14px', backgroundColor: '#181819', border: '1px solid #232324', borderRadius: '2px', color: '#F0EDE6', fontSize: '14px', outline: 'none' }}
              />
              <select value={filtroPlano} onChange={(e) => setFiltroPlano(e.target.value)} style={{ padding: '11px 14px', backgroundColor: '#181819', border: '1px solid #232324', borderRadius: '2px', color: '#F0EDE6', fontSize: '14px', outline: 'none', cursor: 'pointer' }}>
                <option value="todos">Todos os planos</option>
                {PLANOS.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
              <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} style={{ padding: '11px 14px', backgroundColor: '#181819', border: '1px solid #232324', borderRadius: '2px', color: '#F0EDE6', fontSize: '14px', outline: 'none', cursor: 'pointer' }}>
                <option value="todos">Todos os status</option>
                <option value="ativo">Ativos</option>
                <option value="inativo">Inativos</option>
              </select>
              <span style={{ fontSize: '13px', color: '#9B9690', flexShrink: 0 }}>{corretoresFiltrados.length} corretor(es)</span>
              <button
                onClick={() => setModalCriar(true)}
                style={{ marginLeft: 'auto', padding: '11px 20px', backgroundColor: '#C9A84C', border: 'none', borderRadius: '2px', color: '#0E0E0F', fontSize: '14px', fontWeight: 700, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}
              >
                + Novo Corretor
              </button>
            </div>

            {/* Tabela */}
            <div style={{ backgroundColor: '#181819', border: '1px solid rgba(201,168,76,0.1)', borderRadius: '2px', overflowX: 'auto' }}>
              {/* Cabeçalho */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 110px 90px 80px 160px 100px', gap: 0, padding: '12px 20px', borderBottom: '1px solid #232324', backgroundColor: '#232324' }}>
                {['Nome', 'E-mail', 'CRECI', 'Status', 'Plano', 'Alterar Plano', 'Ações'].map(h => (
                  <span key={h} style={{ fontSize: '11px', color: '#9B9690', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>{h}</span>
                ))}
              </div>

              {corretoresFiltrados.length === 0 && (
                <div style={{ padding: '48px', textAlign: 'center' }}>
                  <p style={{ fontSize: 15, color: '#9B9690' }}>Nenhum corretor encontrado.</p>
                </div>
              )}

              {corretoresFiltrados.slice(0, 100).map((cor, i) => {
                const planoInfo = PLANOS.find((p) => p.id === cor.plano) || PLANOS[0]
                const inativo = !cor.is_active
                return (
                  <div
                    key={cor.id}
                    onMouseEnter={() => setLinhaHover(cor.id)}
                    onMouseLeave={() => setLinhaHover(null)}
                    style={{
                      display: 'grid', gridTemplateColumns: '1fr 160px 110px 90px 80px 160px 100px',
                      gap: 0, padding: '14px 20px',
                      borderBottom: i < corretoresFiltrados.length - 1 ? '1px solid #232324' : 'none',
                      alignItems: 'center',
                      backgroundColor: inativo ? 'rgba(224,92,92,0.03)' : linhaHover === cor.id ? '#1E1E20' : 'transparent',
                      transition: 'background-color 0.1s',
                      opacity: inativo ? 0.6 : 1,
                    }}
                  >
                    {/* Nome */}
                    <span style={{ fontSize: '14px', color: '#F0EDE6', display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                      <span style={{ width: 30, height: 30, borderRadius: '50%', backgroundColor: `${CORES_PLANO[cor.plano] || '#9B9690'}26`, border: `1px solid ${CORES_PLANO[cor.plano] || '#9B9690'}59`, color: CORES_PLANO[cor.plano] || '#9B9690', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {getIniciais(cor.full_name)}
                      </span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cor.full_name}</span>
                    </span>

                    {/* Email */}
                    <span style={{ fontSize: '13px', color: '#9B9690', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cor.email || '—'}</span>

                    {/* CRECI */}
                    <span style={{ fontSize: '13px', color: '#9B9690' }}>{cor.creci || '—'}</span>

                    {/* Status CRECI */}
                    <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '2px', display: 'inline-block', textTransform: 'capitalize', backgroundColor: cor.creci_status === 'ativo' ? 'rgba(92,184,138,0.12)' : cor.creci_status === 'pendente' ? 'rgba(201,168,76,0.12)' : 'rgba(224,92,92,0.12)', color: cor.creci_status === 'ativo' ? '#5CB88A' : cor.creci_status === 'pendente' ? '#C9A84C' : '#E05C5C' }}>
                      {cor.creci_status}
                    </span>

                    {/* Plano badge */}
                    <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '2px', backgroundColor: `${planoInfo.cor}20`, color: planoInfo.cor, display: 'inline-block', textTransform: 'capitalize' }}>
                      {planoInfo.nome}
                    </span>

                    {/* Alterar plano */}
                    <select
                      value={cor.plano || 'free'}
                      onChange={(e) => alterarPlano(cor.id, e.target.value)}
                      disabled={atualizando === cor.id || inativo}
                      style={{ padding: '7px 10px', backgroundColor: '#232324', border: '1px solid #2E2E30', borderRadius: '2px', color: '#F0EDE6', fontSize: '13px', cursor: atualizando === cor.id || inativo ? 'not-allowed' : 'pointer', opacity: atualizando === cor.id ? 0.6 : 1 }}
                    >
                      {PLANOS.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                    </select>

                    {/* Ações */}
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => setModalEditar(cor)}
                        title="Editar"
                        style={{ padding: '6px 10px', backgroundColor: 'transparent', border: '1px solid #2E2E30', borderRadius: 2, color: '#9B9690', fontSize: 14, cursor: 'pointer', lineHeight: 1 }}
                      >
                        ✏
                      </button>
                      <button
                        onClick={() => setModalExcluir(cor)}
                        title="Excluir"
                        style={{ padding: '6px 10px', backgroundColor: 'transparent', border: '1px solid rgba(224,92,92,0.3)', borderRadius: 2, color: '#E05C5C', fontSize: 14, cursor: 'pointer', lineHeight: 1 }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── GERENCIAR PLANOS ── */}
        {aba === 'planos' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
              {PLANOS.map((plano) => {
                const assinantes = corretores.filter((c) => c.plano === plano.id).length
                return (
                  <div key={plano.id} style={{ backgroundColor: '#181819', border: `1px solid ${plano.cor}40`, borderRadius: '2px', padding: '28px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <h3 style={{ fontFamily: 'var(--font-serif, serif)', fontSize: '22px', fontWeight: 600, color: plano.cor, margin: 0 }}>{plano.nome}</h3>
                      <span style={{ fontSize: '13px', padding: '4px 12px', borderRadius: '2px', backgroundColor: `${plano.cor}20`, color: plano.cor }}>{assinantes} assinante{assinantes !== 1 ? 's' : ''}</span>
                    </div>
                    <p style={{ fontSize: '28px', fontWeight: 700, color: '#F0EDE6', margin: '0 0 20px' }}>
                      {plano.valor > 0 ? `R$ ${plano.valor}` : 'Grátis'}
                      {plano.valor > 0 && <span style={{ fontSize: '14px', color: '#9B9690', fontWeight: 400 }}>/mês</span>}
                    </p>
                    <div style={{ fontSize: '14px', color: '#9B9690', lineHeight: 1.8 }}>
                      <p style={{ margin: 0 }}>Imóveis: {plano.limiteImoveis === -1 ? 'Ilimitados' : plano.limiteImoveis}</p>
                      <p style={{ margin: 0 }}>Solicitações: {plano.limiteSolicitacoes === -1 ? 'Ilimitadas' : plano.limiteSolicitacoes}</p>
                    </div>
                    <p style={{ fontSize: '13px', color: '#9B9690', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #232324' }}>
                      Receita: <span style={{ color: plano.cor, fontWeight: 600 }}>{formatCurrency(plano.valor * assinantes)}</span>/mês
                    </p>
                  </div>
                )
              })}
            </div>

            <div>
              <h3 style={{ fontFamily: 'var(--font-serif, serif)', fontSize: '18px', fontWeight: 600, color: '#F0EDE6', margin: '0 0 16px' }}>Assinaturas Ativas</h3>
              <div style={{ backgroundColor: '#181819', border: '1px solid rgba(201,168,76,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 120px 100px', gap: 0, padding: '12px 20px', borderBottom: '1px solid #232324', backgroundColor: '#232324' }}>
                  {['Corretor', 'Plano', 'Valor', 'Início', 'Ações'].map(h => (
                    <span key={h} style={{ fontSize: '11px', color: '#9B9690', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>{h}</span>
                  ))}
                </div>
                {assinaturas.filter(a => a.status === 'ativa').slice(0, 30).map((ass, i, arr) => {
                  const planoInfo = PLANOS.find(p => p.id === ass.plano) || PLANOS[0]
                  return (
                    <div key={ass.id} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 120px 100px', gap: 0, padding: '14px 20px', borderBottom: i < arr.length - 1 ? '1px solid #232324' : 'none', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', color: '#F0EDE6' }}>{ass.corretor?.full_name || '—'}</span>
                      <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '2px', backgroundColor: `${planoInfo.cor}20`, color: planoInfo.cor, display: 'inline-block' }}>{planoInfo.nome}</span>
                      <span style={{ fontSize: '13px', color: '#C9A84C' }}>{formatCurrency(ass.valor_mensal)}</span>
                      <span style={{ fontSize: '12px', color: '#9B9690' }}>{formatDate(ass.periodo_inicio)}</span>
                      <button onClick={() => setConfirmarCancelamento({ id: ass.id, corretorId: ass.corretor_id })} disabled={atualizando === ass.id} style={{ backgroundColor: 'transparent', border: '1px solid #E05C5C40', color: '#E05C5C', borderRadius: '2px', padding: '5px 10px', fontSize: '12px', cursor: 'pointer' }}>
                        Cancelar
                      </button>
                    </div>
                  )
                })}
                {assinaturas.filter(a => a.status === 'ativa').length === 0 && (
                  <div style={{ padding: '40px', textAlign: 'center' }}><p style={{ fontSize: 14, color: '#9B9690' }}>Nenhuma assinatura ativa.</p></div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── FINANCEIRO ── */}
        {aba === 'financeiro' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
              {metricaBox(formatCurrency(metricas.mrrTotal), 'MRR Total', '#C9A84C')}
              {metricaBox(metricas.assinaturasPagas, 'Assinantes Pagos', '#5CB88A')}
              {metricaBox(formatCurrency(metricas.assinaturasPagas > 0 ? metricas.mrrTotal / metricas.assinaturasPagas : 0), 'Ticket Médio')}
              {metricaBox(formatCurrency(metricas.mrrTotal * 12), 'ARR Projetado', '#5C9BE0')}
            </div>
            <div style={{ backgroundColor: '#181819', border: '1px solid rgba(201,168,76,0.1)', borderRadius: '2px', padding: '28px' }}>
              <h3 style={{ fontFamily: 'var(--font-serif, serif)', fontSize: '18px', fontWeight: 600, color: '#F0EDE6', margin: '0 0 20px' }}>Receita por Plano</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {PLANOS.filter(p => p.valor > 0).map(plano => {
                  const assinantes = corretores.filter(c => c.plano === plano.id).length
                  const receita = plano.valor * assinantes
                  const pct = metricas.mrrTotal > 0 ? (receita / metricas.mrrTotal) * 100 : 0
                  return (
                    <div key={plano.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '15px', color: '#F0EDE6' }}>{plano.nome}</span>
                        <span style={{ fontSize: '15px', color: plano.cor, fontWeight: 600 }}>{formatCurrency(receita)} ({pct.toFixed(1)}%)</span>
                      </div>
                      <div style={{ height: '8px', backgroundColor: '#232324', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, backgroundColor: plano.cor, borderRadius: '4px', transition: 'width 0.3s ease' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
