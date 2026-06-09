'use client'

import React from 'react'
<<<<<<< HEAD
import Link from 'next/link'
=======
>>>>>>> b88ca3fdf00752f153a0ecf1d7e74a7ed25d5d7a
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface SidebarProps {
  activeNav: string
  onNavChange: (nav: string) => void
  corretorNome: string
  corretorCreci: string
  corretorSelo: string
  matchesPendentes: number
  chatNaoLidos: number
  notifsNaoLidas?: number
  planoAtual?: string
<<<<<<< HEAD
=======
  erpAlertas?: number
>>>>>>> b88ca3fdf00752f153a0ecf1d7e74a7ed25d5d7a
}

const navigationGroups = [
  {
    title: 'PRINCIPAL',
    items: [
<<<<<<< HEAD
      { id: 'dashboard',   label: 'Dashboard',   icon: '⊞' },
      { id: 'matches',     label: 'Matches',      icon: '◎', badge: 'matchesPendentes' },
      { id: 'crm',         label: 'CRM Kanban',   icon: '⊡' },
      { id: 'chat',        label: 'Chat',         icon: '◉', badge: 'chatNaoLidos' },
=======
      { id: 'dashboard',    label: 'Dashboard',         icon: '⊞' },
      { id: 'matches',      label: 'Matches',            icon: '◎', badge: 'matchesPendentes' },
      { id: 'crm',          label: 'CRM Kanban',         icon: '⊡' },
      { id: 'chat',         label: 'Chat',               icon: '◉', badge: 'chatNaoLidos' },
>>>>>>> b88ca3fdf00752f153a0ecf1d7e74a7ed25d5d7a
    ],
  },
  {
    title: 'CAPTAÇÃO',
    items: [
<<<<<<< HEAD
      { id: 'imoveis',     label: 'Meus Imóveis',      icon: '⊟' },
      { id: 'solicitacoes',label: 'Solicitações',       icon: '◧' },
      { id: 'hub',         label: 'Hub de Publicação',  icon: '◈' },
      { id: 'site',        label: 'Meu Site',           icon: '◻' },
=======
      { id: 'imoveis',      label: 'Meus Imóveis',       icon: '⊟' },
      { id: 'solicitacoes', label: 'Solicitações',        icon: '◧' },
      { id: 'hub',          label: 'Hub de Publicação',   icon: '◈' },
      { id: 'site',         label: 'Meu Site',            icon: '◻' },
    ],
  },
  {
    title: 'FINANCEIRO',
    items: [
      { id: 'erp',          label: 'ERP Imobiliário',     icon: '⊞', badge: 'erpAlertas' },
>>>>>>> b88ca3fdf00752f153a0ecf1d7e74a7ed25d5d7a
    ],
  },
  {
    title: 'PLATAFORMA',
    items: [
<<<<<<< HEAD
      { id: 'avaliacoes',    label: 'Avaliações',        icon: '◇' },
      { id: 'plano',         label: 'Meu Plano',         icon: '◈', badge: 'plano' },
      { id: 'credenciamento',label: 'Credenciamento',    icon: '◆' },
      { id: 'matching',      label: 'Motor de Matching', icon: '⊛' },
      { id: 'notificacoes',  label: 'Notificações',      icon: '◎', badge: 'notifsNaoLidas' },
=======
      { id: 'avaliacoes',     label: 'Avaliações',         icon: '◇' },
      { id: 'notificacoes',   label: 'Notificações',       icon: '◎', badge: 'notifsNaoLidas' },
      { id: 'credenciamento', label: 'Credenciamento',     icon: '◆' },
      { id: 'matching',       label: 'Motor de Matching',  icon: '⊛' },
      { id: 'plano',          label: 'Meu Plano',          icon: '◈', badge: 'plano' },
>>>>>>> b88ca3fdf00752f153a0ecf1d7e74a7ed25d5d7a
    ],
  },
  {
    title: 'ADMIN',
    items: [{ id: 'admin', label: 'Painel Admin', icon: '◉' }],
<<<<<<< HEAD
  },
  {
    title: 'ERP',
    items: [{ id: 'erp', label: 'ERP Imobiliária', icon: '⊞', badge: 'novo' }],
=======
>>>>>>> b88ca3fdf00752f153a0ecf1d7e74a7ed25d5d7a
  },
]

export function Sidebar({
  activeNav,
  onNavChange,
  corretorNome,
  corretorCreci,
  corretorSelo,
  matchesPendentes,
  chatNaoLidos,
  notifsNaoLidas = 0,
  planoAtual = 'free',
<<<<<<< HEAD
=======
  erpAlertas = 0,
>>>>>>> b88ca3fdf00752f153a0ecf1d7e74a7ed25d5d7a
}: SidebarProps) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  function getPlanoBadge(plano: string): string | null {
    if (plano === 'free') return null
    if (plano === 'pro') return 'PRO'
    if (plano === 'premium') return 'PREMIUM'
    if (plano === 'imobiliaria') return 'IMOB'
    return null
  }

<<<<<<< HEAD
  const getBadgeValue = (badge?: string) => {
    if (!badge) return null
    if (badge === 'matchesPendentes') return matchesPendentes || null
    if (badge === 'chatNaoLidos') return chatNaoLidos || null
    if (badge === 'notifsNaoLidas') return notifsNaoLidas || null
    if (badge === 'plano') {
      const planoBadge = getPlanoBadge(planoAtual)
      return planoBadge ? planoBadge : null
    }
    if (badge === 'novo') return 'NOVO'
    return null
  }

  const getBadgeColor = (badge?: string) => {
    if (badge === 'plano') return 'bg-amber-600 text-white'
    if (badge === 'novo') return 'bg-blue-600 text-white'
    return 'bg-red-600 text-white'
=======
  const getBadgeValue = (badge?: string): string | number | null => {
    if (!badge) return null
    if (badge === 'matchesPendentes') return matchesPendentes || null
    if (badge === 'chatNaoLidos')     return chatNaoLidos || null
    if (badge === 'notifsNaoLidas')   return notifsNaoLidas || null
    if (badge === 'erpAlertas')       return erpAlertas || null
    if (badge === 'plano') {
      const planoBadge = getPlanoBadge(planoAtual)
      return planoBadge ?? null
    }
    return null
  }

  const getBadgeStyle = (badge?: string): React.CSSProperties => {
    if (badge === 'plano')      return { background: 'rgba(201,168,76,0.2)', color: '#C9A84C' }
    if (badge === 'erpAlertas') return { background: 'rgba(224,92,92,0.15)', color: '#E05C5C' }
    return { background: '#E05C5C', color: '#fff' }
>>>>>>> b88ca3fdf00752f153a0ecf1d7e74a7ed25d5d7a
  }

  const iniciais = corretorNome
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  return (
    <aside className="fixed left-0 top-0 h-screen w-[240px] flex flex-col bg-[--color-dark-2] border-r border-[--color-dark-3]">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-[--color-dark-3]">
        <h1 className="font-serif text-[30px] font-bold text-[--color-gold]" style={{ lineHeight: 1 }}>
          BID
        </h1>
<<<<<<< HEAD
        <p className="text-[11px] uppercase tracking-widest text-[--color-muted] mt-2">
=======
        <p className="text-[10px] uppercase tracking-widest text-[--color-muted] mt-1">
>>>>>>> b88ca3fdf00752f153a0ecf1d7e74a7ed25d5d7a
          Plataforma Imobiliária
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navigationGroups.map((group) => (
          <div key={group.title}>
            <p className="text-[10px] uppercase tracking-widest text-[--color-muted] px-2 mb-2 font-semibold opacity-60">
              {group.title}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = activeNav === item.id
                const badgeValue = getBadgeValue(item.badge)
                const badgeStyle = getBadgeStyle(item.badge)

                return (
                  <button
                    key={item.id}
                    onClick={() => onNavChange(item.id)}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] transition-all rounded-sm border-l-2',
                      isActive
                        ? 'border-l-[--color-gold] bg-[rgba(201,168,76,0.07)] text-[--color-gold]'
                        : 'border-l-transparent text-[--color-text] hover:bg-[rgba(201,168,76,0.04)] hover:text-[--color-gold]'
                    )}
                  >
                    <span style={{ fontSize: 15, flexShrink: 0 }}>{item.icon}</span>
                    <span className="flex-1 text-left font-medium">{item.label}</span>
                    {badgeValue !== null && (
                      <span style={{
                        fontSize: 10, fontWeight: 700,
                        padding: '1px 6px', borderRadius: 9999,
                        ...badgeStyle,
                      }}>
                        {badgeValue}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-[--color-dark-3] p-3">
        <div className="flex items-center gap-2.5 p-2 rounded-sm">
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(201,168,76,0.15)',
            border: '1px solid rgba(201,168,76,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#C9A84C', fontWeight: 700, fontSize: 13, flexShrink: 0,
          }}>
            {iniciais}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#F0EDE6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {corretorNome}
            </p>
            <p style={{ fontSize: 10, color: '#9B9690' }}>CRECI {corretorCreci}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
<<<<<<< HEAD
            width: '100%',
            background: 'none',
            border: 'none',
            borderTop: '1px solid rgba(201,168,76,0.08)',
            padding: '10px 14px',
            color: '#9B9690',
            fontSize: 12,
            cursor: 'pointer',
            textAlign: 'left',
            marginTop: 6,
            letterSpacing: '0.02em',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#E05C5C')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#9B9690')}
=======
            width: '100%', background: 'none', border: 'none',
            borderTop: '1px solid rgba(255,255,255,0.04)',
            padding: '8px 10px', color: '#9B9690', fontSize: 12,
            cursor: 'pointer', textAlign: 'left', marginTop: 4,
            borderRadius: 2, letterSpacing: '0.02em',
          }}
          onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.color = '#E05C5C')}
          onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.color = '#9B9690')}
>>>>>>> b88ca3fdf00752f153a0ecf1d7e74a7ed25d5d7a
        >
          ⎋ Sair da conta
        </button>
      </div>
    </aside>
  )
}
