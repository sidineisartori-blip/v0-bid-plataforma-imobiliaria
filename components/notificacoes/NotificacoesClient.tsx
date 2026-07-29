'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Notificacao {
  id: string
  corretor_id: string
  tipo: string
  titulo: string
  mensagem: string
  rota?: string
  solicitacao_id?: string | null
  imovel_id?: string | null
  metadata?: Record<string, unknown>
  lida: boolean
  created_at: string
}

interface Solicitacao {
  id: string
  cliente_nome: string
  cliente_phone: string
  cliente_email?: string | null
  tipo_negocio: string
  tipo_imovel: string
  cidade: string
  bairro_desejado?: string | null
  valor_min?: number | null
  valor_max?: number | null
  quartos?: number | null
  tem_animal?: boolean
  status: string
  created_at: string
  ultimo_contato_em?: string | null
}

interface ImovelCompativel {
  id: string
  titulo: string
  tipo_imovel: string
  tipo_negocio: string
  cidade: string
  bairro?: string | null
  valor?: number | null
  quartos?: number | null
  area_total?: number | null
  image_urls?: string[] | null
  aceita_animal?: boolean | null
  status: string
}

interface Detalhe {
  solicitacao: Solicitacao | null
  imoveisCompativeis: ImovelCompativel[]
}

interface ToastData { tipo: string; titulo: string; mensagem: string }

interface Props {
  notificacoes: Notificacao[]
  corretorId: string
}

const rotulos: Record<string, string> = {
  match_externo: '🏠',
  auto_match:    '✨',
  parceria:      '🤝',
  chat:          '💬',
  parceria_exp:  '⏰',
  creci:         '⚠️',
  avaliacao:     '⭐',
  landing:       '📋',
  geral:         '🔔',
}

const tabs = [
  { id: 'todas',         label: 'Todas' },
  { id: 'nao_lidas',    label: 'Nao lidas' },
  { id: 'match_externo', label: 'Matches' },
  { id: 'parceria',     label: 'Parcerias' },
  { id: 'geral',        label: 'Sistema' },
]

const EXPANDIVEIS = new Set(['landing', 'match_externo', 'auto_match'])

function tempoRelativo(data: string): string {
  const diff = Date.now() - new Date(data).getTime()
  const min = Math.floor(diff / 60000)
  const h   = Math.floor(diff / 3600000)
  const d   = Math.floor(diff / 86400000)
  if (min < 1)  return 'agora'
  if (min < 60) return `${min}min`
  if (h < 24)   return `${h}h`
  if (d < 7)    return `${d}d`
  return new Date(data).toLocaleDateString('pt-BR')
}

function fmtValor(v?: number | null) {
  if (!v) return null
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function fmtPhone(p?: string) {
  if (!p) return ''
  const n = p.replace(/\D/g, '')
  if (n.length === 11) return `(${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7)}`
  if (n.length === 10) return `(${n.slice(0,2)}) ${n.slice(2,6)}-${n.slice(6)}`
  return p
}

// ─────────────────────────────────────────────────────────────
// Painel de detalhes expandido
// ─────────────────────────────────────────────────────────────
function PainelDetalhe({
  notifId,
  corretorId,
  onContatoRegistrado,
}: {
  notifId: string
  corretorId: string
  onContatoRegistrado: () => void
}) {
  void corretorId
  const [detalhe, setDetalhe] = useState<Detalhe | null>(null)
  const [loading, setLoading]     = useState(true)
  const [registrando, setRegistrando] = useState(false)
  const [contatado, setContatado] = useState(false)

  useEffect(() => {
    fetch(`/api/notificacoes/${notifId}/detalhe`)
      .then(r => r.json())
      .then((d: Detalhe) => { setDetalhe(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [notifId])

  const registrarContato = async () => {
    if (!detalhe?.solicitacao || registrando || contatado) return
    setRegistrando(true)
    try {
      await fetch(`/api/solicitacoes/${detalhe.solicitacao.id}/contato`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canal: 'whatsapp', detalhe: 'Contato registrado via notificação' }),
      })
      setContatado(true)
      onContatoRegistrado()
    } finally {
      setRegistrando(false)
    }
  }

  const card: React.CSSProperties = {
    background: '#0E0E0F',
    border: '1px solid #2E2E30',
    borderTop: 'none',
    borderRadius: '0 0 4px 4px',
    overflow: 'hidden',
  }

  const sectionTitle: React.CSSProperties = {
    fontSize: 10, fontWeight: 700, color: '#C9A84C',
    letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10,
  }

  const pill: React.CSSProperties = {
    display: 'inline-block',
    background: '#1A1A1B', border: '1px solid #2E2E30',
    borderRadius: 999, fontSize: 11, color: '#D4CFC7',
    padding: '3px 10px', marginRight: 6, marginBottom: 4,
  }

  const btnStyle = (color: string, bg: string, border?: string): React.CSSProperties => ({
    padding: '8px 14px', borderRadius: 3,
    border: border ?? 'none',
    cursor: 'pointer', fontSize: 12, fontWeight: 600,
    color, background: bg, display: 'inline-flex',
    alignItems: 'center', gap: 5,
    textDecoration: 'none', whiteSpace: 'nowrap',
  })

  if (loading) {
    return (
      <div style={card}>
        <div style={{ padding: '20px', textAlign: 'center', color: '#9B9690', fontSize: 12 }}>
          Carregando detalhes…
        </div>
      </div>
    )
  }

  if (!detalhe?.solicitacao) {
    return (
      <div style={card}>
        <div style={{ padding: '16px', color: '#9B9690', fontSize: 12 }}>
          Detalhes não disponíveis para notificações antigas.{' '}
          <a href="/solicitacoes" style={{ color: '#C9A84C' }}>Ver solicitações →</a>
        </div>
      </div>
    )
  }

  const sol = detalhe.solicitacao
  const compat = detalhe.imoveisCompativeis

  const whatsappUrl = `https://wa.me/55${sol.cliente_phone.replace(/\D/g, '')}?text=${encodeURIComponent(
    `Olá ${sol.cliente_nome.split(' ')[0]}! Sou corretor e vi que você está buscando um ${sol.tipo_imovel} em ${sol.cidade}. Posso te ajudar a encontrar!`
  )}`

  return (
    <div style={card}>
      {/* Perfil */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #1A1A1B' }}>
        <div style={sectionTitle}>Perfil do Lead</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#F0EDE6', marginBottom: 4 }}>
              {sol.cliente_nome}
            </div>
            <div style={{ fontSize: 12, color: '#9B9690', marginBottom: 10 }}>
              📱 {fmtPhone(sol.cliente_phone)}
              {sol.cliente_email && <span style={{ marginLeft: 10 }}>✉ {sol.cliente_email}</span>}
            </div>
            <div style={{ lineHeight: 1.8 }}>
              <span style={pill}>{sol.tipo_negocio}</span>
              <span style={pill}>{sol.tipo_imovel}</span>
              <span style={pill}>📍 {sol.cidade}{sol.bairro_desejado ? ` · ${sol.bairro_desejado}` : ''}</span>
              {sol.quartos ? <span style={pill}>{sol.quartos}+ quartos</span> : null}
              {sol.valor_max ? <span style={pill}>até {fmtValor(sol.valor_max)}</span> : null}
              {sol.valor_min && !sol.valor_max ? <span style={pill}>a partir {fmtValor(sol.valor_min)}</span> : null}
              {sol.tem_animal ? <span style={pill}>🐾 tem animal</span> : null}
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{
              display: 'inline-block', fontSize: 10, fontWeight: 700,
              padding: '3px 8px', borderRadius: 999,
              background: sol.status === 'ativa' ? 'rgba(52,168,83,0.15)' : 'rgba(155,150,144,0.15)',
              color: sol.status === 'ativa' ? '#34A853' : '#9B9690',
              textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>{sol.status}</div>
            <div style={{ fontSize: 10, color: '#9B9690', marginTop: 4 }}>
              Recebido {tempoRelativo(sol.created_at)}
            </div>
            {sol.ultimo_contato_em && (
              <div style={{ fontSize: 10, color: '#34A853', marginTop: 2 }}>
                ✓ Contatado {tempoRelativo(sol.ultimo_contato_em)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Imóveis compatíveis */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #1A1A1B' }}>
        <div style={sectionTitle}>
          {compat.length > 0
            ? `${compat.length} imóve${compat.length === 1 ? 'l compatível' : 'is compatíveis'} na sua carteira`
            : 'Nenhum imóvel compatível encontrado'}
        </div>

        {compat.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {compat.map(im => (
              <a
                key={im.id}
                href={`/imoveis/${im.id}`}
                style={{
                  display: 'flex', gap: 8, alignItems: 'center',
                  background: '#181819', border: '1px solid #2E2E30',
                  borderRadius: 3, padding: '8px 10px',
                  textDecoration: 'none',
                  flex: '1 1 calc(50% - 4px)',
                }}
              >
                {im.image_urls?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={im.image_urls[0]} alt="" style={{ width: 44, height: 36, objectFit: 'cover', borderRadius: 2, flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 44, height: 36, background: '#232324', borderRadius: 2, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🏠</div>
                )}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: '#F0EDE6', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {im.titulo}
                  </div>
                  <div style={{ fontSize: 10, color: '#9B9690', marginTop: 1 }}>
                    {im.bairro || im.cidade}
                    {im.quartos ? ` · ${im.quartos}q` : ''}
                    {im.valor ? ` · ${fmtValor(im.valor)}` : ''}
                  </div>
                  {im.aceita_animal && <div style={{ fontSize: 9, color: '#C9A84C' }}>🐾 aceita animal</div>}
                </div>
              </a>
            ))}
          </div>
        ) : (
          <a href="/imoveis" style={{ fontSize: 12, color: '#C9A84C', textDecoration: 'none' }}>
            Cadastrar imóvel para este perfil →
          </a>
        )}
      </div>

      {/* Ações */}
      <div style={{ padding: '12px 20px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={btnStyle('#fff', '#25D366')}
          onClick={registrarContato}
        >
          <span>📱</span> WhatsApp
        </a>

        <a href="/solicitacoes" style={btnStyle('#F0EDE6', '#232324')}>
          <span>📋</span> Ver Solicitação
        </a>

        <button
          onClick={registrarContato}
          disabled={registrando || contatado || !!sol.ultimo_contato_em}
          style={{
            ...btnStyle(
              contatado || sol.ultimo_contato_em ? '#34A853' : '#C9A84C',
              'transparent',
              `1px solid ${contatado || sol.ultimo_contato_em ? '#34A853' : '#C9A84C'}`
            ),
            opacity: registrando ? 0.6 : 1,
          }}
        >
          {contatado || sol.ultimo_contato_em ? '✓ Contato registrado' : '✎ Registrar contato'}
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────
export default function NotificacoesClient({ notificacoes: inicial, corretorId }: Props) {
  const supabase = createClient()

  const [lista, setLista]         = useState<Notificacao[]>(inicial)
  const [tab, setTab]             = useState('todas')
  const [toast, setToast]         = useState<ToastData | null>(null)
  const [expandido, setExpandido] = useState<string | null>(null)

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel('notifs:' + corretorId)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notificacoes', filter: `corretor_id=eq.${corretorId}` },
        (payload) => {
          const nova = payload.new as Notificacao
          setLista(prev => [nova, ...prev])
          setToast({ tipo: nova.tipo, titulo: nova.titulo, mensagem: nova.mensagem })
          setTimeout(() => setToast(null), 5000)
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [corretorId, supabase])

  const marcarLida = useCallback(async (n: Notificacao) => {
    if (!n.lida) {
      await supabase.from('notificacoes').update({ lida: true }).eq('id', n.id)
      setLista(prev => prev.map(x => x.id === n.id ? { ...x, lida: true } : x))
    }
    if (EXPANDIVEIS.has(n.tipo)) {
      setExpandido(prev => prev === n.id ? null : n.id)
    } else if (n.rota) {
      window.location.href = n.rota
    }
  }, [supabase])

  const marcarTodasLidas = async () => {
    await supabase.from('notificacoes').update({ lida: true }).eq('corretor_id', corretorId).eq('lida', false)
    setLista(prev => prev.map(n => ({ ...n, lida: true })))
  }

  const naoLidas = lista.filter(n => !n.lida).length

  const filtradas = lista.filter(n => {
    if (tab === 'todas')          return true
    if (tab === 'nao_lidas')      return !n.lida
    if (tab === 'match_externo')  return n.tipo === 'match_externo' || n.tipo === 'auto_match'
    if (tab === 'parceria')       return n.tipo === 'parceria' || n.tipo === 'parceria_exp'
    if (tab === 'geral')          return n.tipo === 'geral' || n.tipo === 'creci' || n.tipo === 'landing'
    return true
  })

  return (
    <div style={{ padding: '32px 40px', maxWidth: 820, minHeight: '100vh' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 200,
          background: '#181819', border: '1px solid rgba(201,168,76,0.3)',
          borderRadius: 2, padding: '12px 16px', maxWidth: 340,
          display: 'flex', alignItems: 'flex-start', gap: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)', animation: 'slideInRight 0.3s ease',
        }}>
          <span style={{ fontSize: 18, marginTop: 1 }}>{rotulos[toast.tipo] || '🔔'}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: '#F0EDE6', fontWeight: 500 }}>{toast.titulo}</div>
            <div style={{ fontSize: 11, color: '#9B9690', marginTop: 2 }}>
              {toast.mensagem.length > 70 ? toast.mensagem.slice(0, 70) + '...' : toast.mensagem}
            </div>
          </div>
          <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', color: '#9B9690', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, color: '#F0EDE6', fontWeight: 700 }}>
            Notificacoes
          </h1>
          {naoLidas > 0 && (
            <span style={{ background: '#E05C5C', color: '#fff', fontSize: 11, fontWeight: 700, borderRadius: 999, padding: '2px 8px' }}>
              {naoLidas}
            </span>
          )}
        </div>
        {naoLidas > 0 && (
          <button
            onClick={marcarTodasLidas}
            style={{ background: 'none', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 2, color: '#C9A84C', fontSize: 12, padding: '6px 14px', cursor: 'pointer' }}
          >
            Marcar todas como lidas
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #232324' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 13, padding: '8px 14px',
              color: tab === t.id ? '#C9A84C' : '#9B9690',
              borderBottom: tab === t.id ? '2px solid #C9A84C' : '2px solid transparent',
              fontWeight: tab === t.id ? 600 : 400, marginBottom: -1,
            }}
          >
            {t.label}
            {t.id === 'nao_lidas' && naoLidas > 0 && (
              <span style={{ marginLeft: 6, background: '#E05C5C', color: '#fff', fontSize: 10, borderRadius: 999, padding: '1px 6px' }}>{naoLidas}</span>
            )}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {filtradas.length === 0 && (
          <div style={{ textAlign: 'center', color: '#9B9690', fontSize: 13, padding: '48px 0' }}>
            Nenhuma notificacao encontrada.
          </div>
        )}

        {filtradas.map(n => {
          const estaExpandido = expandido === n.id
          const expandivel    = EXPANDIVEIS.has(n.tipo)

          return (
            <div key={n.id}>
              <button
                onClick={() => marcarLida(n)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 14,
                  padding: '14px 16px',
                  background: estaExpandido
                    ? 'rgba(201,168,76,0.08)'
                    : n.lida ? 'transparent' : 'rgba(201,168,76,0.04)',
                  borderLeft: (estaExpandido || !n.lida) ? '2px solid #C9A84C' : '2px solid transparent',
                  borderTop: 'none', borderRight: 'none',
                  borderBottom: '1px solid #232324',
                  borderRadius: estaExpandido ? '2px 2px 0 0' : 2,
                  cursor: 'pointer', textAlign: 'left', width: '100%',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(201,168,76,0.08)' }}
                onMouseLeave={e => {
                  const bg = estaExpandido ? 'rgba(201,168,76,0.08)' : n.lida ? 'transparent' : 'rgba(201,168,76,0.04)'
                  ;(e.currentTarget as HTMLButtonElement).style.background = bg
                }}
              >
                <span style={{ fontSize: 18, marginTop: 1, flexShrink: 0 }}>
                  {rotulos[n.tipo] || '🔔'}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: '#F0EDE6', fontWeight: n.lida ? 400 : 600 }}>
                    {n.titulo}
                  </div>
                  <div style={{ fontSize: 12, color: '#9B9690', marginTop: 3, lineHeight: 1.5 }}>
                    {n.mensagem}
                  </div>
                  {expandivel && !estaExpandido && (
                    <div style={{ fontSize: 11, color: '#C9A84C', marginTop: 5 }}>
                      Clique para ver perfil e compatibilidades →
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                  <span style={{ fontSize: 11, color: '#9B9690' }}>{tempoRelativo(n.created_at)}</span>
                  {!n.lida && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#C9A84C', display: 'block' }} />}
                  {expandivel && <span style={{ fontSize: 10, color: '#9B9690' }}>{estaExpandido ? '▲' : '▼'}</span>}
                </div>
              </button>

              {estaExpandido && (
                <PainelDetalhe
                  notifId={n.id}
                  corretorId={corretorId}
                  onContatoRegistrado={() => setLista(prev => prev.map(x => x.id === n.id ? { ...x, lida: true } : x))}
                />
              )}
            </div>
          )
        })}
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(120%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>
  )
}
