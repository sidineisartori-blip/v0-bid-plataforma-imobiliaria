'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Notificacao {
  id: string
  corretor_id: string
  tipo: string
  titulo: string
  mensagem: string
  rota?: string
  lida: boolean
  created_at: string
}

interface ToastData {
  tipo: string
  titulo: string
  mensagem: string
}

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

const tipoLabel: Record<string, string> = {
  match_externo: 'Match',
  auto_match:    'Auto-Match',
  parceria:      'Parceria',
  chat:          'Chat',
  parceria_exp:  'Parceria',
  creci:         'Sistema',
  avaliacao:     'Avaliacao',
  landing:       'Lead',
  geral:         'Sistema',
}

const tabs = [
  { id: 'todas', label: 'Todas' },
  { id: 'nao_lidas', label: 'Nao lidas' },
  { id: 'match_externo', label: 'Matches' },
  { id: 'parceria', label: 'Parcerias' },
  { id: 'geral', label: 'Sistema' },
]

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

const templates = [
  { titulo: 'Para quem tem o Imovel', texto: 'Ola, [Nome]! Voce tem X interessados no imovel [Tipo] no [Bairro]. Acesse a plataforma BID para ver os detalhes e iniciar uma negociacao.' },
  { titulo: 'Para quem tem a Solicitacao', texto: 'Ola, [Nome]! Voce possui X imoveis compativeis com a solicitacao de [Perfil] em [Cidade]. Acesse a plataforma para ver os matches.' },
  { titulo: 'Auto-Match Interno', texto: 'Ola, [Nome]! Identificamos 1 compatibilidade interna na sua carteira: [Imovel] x [Solicitacao]. Inicie o atendimento agora.' },
  { titulo: 'Mensagem Nao Lida', texto: 'Ola, [Nome]! Voce tem uma mensagem nao lida na negociacao [Imovel] com [Corretor]. Responda para nao perder o prazo.' },
  { titulo: 'Parceria Expirando', texto: 'Ola, [Nome]! Sua parceria em [Imovel] vence em 7 dias sem avanco no CRM. Atualize o status para manter ativa.' },
  { titulo: 'CRECI Inativo', texto: 'Ola, [Nome]! Seu CRECI consta como inativo no COFECI. Sua conta sera suspensa em 48h. Regularize ou entre em contato.' },
  { titulo: 'Novo Lead (Landing)', texto: 'Ola, [Nome]! Um cliente preencheu sua pagina BID. Voce tem 48h para revisar e dar retorno. Acesse agora.' },
]

export default function NotificacoesClient({ notificacoes: inicial, corretorId }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [lista, setLista]             = useState<Notificacao[]>(inicial)
  const [tab, setTab]                 = useState('todas')
  const [toast, setToast]             = useState<ToastData | null>(null)
  const [templatesAberto, setTemplatesAberto] = useState(false)

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
          setTimeout(() => setToast(null), 4000)
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [corretorId])

  const marcarLida = async (n: Notificacao) => {
    if (!n.lida) {
      await supabase.from('notificacoes').update({ lida: true }).eq('id', n.id)
      setLista(prev => prev.map(x => x.id === n.id ? { ...x, lida: true } : x))
    }
    if (n.rota) router.push(n.rota)
  }

  const marcarTodasLidas = async () => {
    await supabase.from('notificacoes').update({ lida: true }).eq('corretor_id', corretorId).eq('lida', false)
    setLista(prev => prev.map(n => ({ ...n, lida: true })))
  }

  const naoLidas = lista.filter(n => !n.lida).length

  const filtradas = lista.filter(n => {
    if (tab === 'todas')      return true
    if (tab === 'nao_lidas')  return !n.lida
    if (tab === 'match_externo') return n.tipo === 'match_externo' || n.tipo === 'auto_match'
    if (tab === 'parceria')   return n.tipo === 'parceria' || n.tipo === 'parceria_exp'
    if (tab === 'geral')      return n.tipo === 'geral' || n.tipo === 'creci' || n.tipo === 'landing'
    return true
  })

  return (
    <div style={{ padding: '32px 40px', maxWidth: 760, minHeight: '100vh' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 200,
          background: '#181819', border: '1px solid rgba(201,168,76,0.3)',
          borderRadius: 2, padding: '12px 16px', maxWidth: 320,
          display: 'flex', alignItems: 'flex-start', gap: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          animation: 'slideInRight 0.3s ease',
        }}>
          <span style={{ fontSize: 18, marginTop: 1 }}>{rotulos[toast.tipo] || '🔔'}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: '#F0EDE6', fontWeight: 500 }}>{toast.titulo}</div>
            <div style={{ fontSize: 11, color: '#9B9690', marginTop: 2 }}>
              {toast.mensagem.length > 60 ? toast.mensagem.slice(0, 60) + '...' : toast.mensagem}
            </div>
          </div>
          <button
            onClick={() => setToast(null)}
            style={{ background: 'none', border: 'none', color: '#9B9690', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 0 }}
          >×</button>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, color: '#F0EDE6', fontWeight: 700 }}>
            Notificacoes
          </h1>
          {naoLidas > 0 && (
            <span style={{
              background: '#E05C5C', color: '#fff', fontSize: 11, fontWeight: 700,
              borderRadius: 999, padding: '2px 8px',
            }}>
              {naoLidas}
            </span>
          )}
        </div>
        {naoLidas > 0 && (
          <button
            onClick={marcarTodasLidas}
            style={{
              background: 'none', border: '1px solid rgba(201,168,76,0.3)',
              borderRadius: 2, color: '#C9A84C', fontSize: 12, padding: '6px 14px', cursor: 'pointer',
            }}
          >
            Marcar todas como lidas
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #232324', paddingBottom: 0 }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 13, padding: '8px 14px',
              color: tab === t.id ? '#C9A84C' : '#9B9690',
              borderBottom: tab === t.id ? '2px solid #C9A84C' : '2px solid transparent',
              fontWeight: tab === t.id ? 600 : 400,
              transition: 'all 0.15s',
              marginBottom: -1,
            }}
          >
            {t.label}
            {t.id === 'nao_lidas' && naoLidas > 0 && (
              <span style={{
                marginLeft: 6, background: '#E05C5C', color: '#fff',
                fontSize: 10, borderRadius: 999, padding: '1px 6px',
              }}>{naoLidas}</span>
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
        {filtradas.map(n => (
          <button
            key={n.id}
            onClick={() => marcarLida(n)}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 14,
              padding: '14px 16px',
              background: n.lida ? 'transparent' : 'rgba(201,168,76,0.04)',
              borderLeft: n.lida ? '2px solid transparent' : '2px solid #C9A84C',
              borderTop: 'none', borderRight: 'none', borderBottom: '1px solid #232324',
              borderRadius: 2,
              cursor: 'pointer', textAlign: 'left', width: '100%',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(201,168,76,0.06)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = n.lida ? 'transparent' : 'rgba(201,168,76,0.04)' }}
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
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
              <span style={{ fontSize: 11, color: '#9B9690' }}>{tempoRelativo(n.created_at)}</span>
              {!n.lida && (
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#C9A84C', display: 'block' }} />
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Templates WhatsApp */}
      <div style={{ marginTop: 40 }}>
        <button
          onClick={() => setTemplatesAberto(!templatesAberto)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 13, color: '#9B9690', padding: '8px 0',
          }}
        >
          <span style={{ color: '#C9A84C' }}>{templatesAberto ? '▼' : '▶'}</span>
          Templates WhatsApp do Sistema
        </button>

        {templatesAberto && (
          <div style={{
            marginTop: 12, background: '#232324', borderRadius: 2,
            border: '1px solid #2E2E30', padding: '16px 20px',
            display: 'flex', flexDirection: 'column', gap: 16,
          }}>
            {templates.map((t, i) => (
              <div key={i}>
                <div style={{ fontSize: 11, color: '#C9A84C', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {t.titulo}
                </div>
                <div style={{
                  fontSize: 12, color: '#F0EDE6', lineHeight: 1.6,
                  background: '#181819', borderRadius: 2, padding: '10px 12px',
                  border: '1px solid #2E2E30',
                }}>
                  {t.texto}
                </div>
              </div>
            ))}
          </div>
        )}
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
