'use client'

import React from 'react'
import Link from 'next/link'
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
}

const navigationGroups = [
  {
    title: 'PRINCIPAL',
    items: [
      { id: 'dashboard',   label: 'Dashboard',   icon: '⊞' },
      { id: 'matches',     label: 'Matches',      icon: '◎', badge: 'matchesPendentes' },
      { id: 'crm',         label: 'CRM Kanban',   icon: '⊡' },
      { id: 'chat',        label: 'Chat',         icon: '◉', badge: 'chatNaoLidos' },
    ],
  },
  {
    title: 'CAPTAÇÃO',
    items: [
      { id: 'imoveis',     label: 'Meus Imóveis',      icon: '⊟' },
      { id: 'solicitacoes',label: 'Solicitações',       icon: '◧' },
      { id: 'hub',         label: 'Hub de Publicação',  icon: '◈' },
      { id: 'site',        label: 'Meu Site',           icon: '◻' },
    ],
  },
  {
    title: 'PLATAFORMA',
    items: [
      { id: 'avaliacoes',    label: 'Avaliações',        icon: '◇' },
      { id: 'plano',         label: 'Meu Plano',         icon: '◈', badge: 'plano' },
      { id: 'credenciamento',label: 'Credenciamento',    icon: '◆' },
      { id: 'matching',      label: 'Motor de Matching', icon: '⊛' },
      { id: 'notificacoes',  label: 'Notificações',      icon: '◎', badge: 'notifsNaoLidas' },
    ],
  },
  {
    title: 'ADMIN',
    items: [{ id: 'admin', label: 'Painel Admin', icon: '◉' }],
  },
  {
    title: 'ERP',
    items: [{ id: 'erp', label: 'ERP Imobiliária', icon: '⊞', badge: 'novo' }],
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
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-[240px] flex flex-col bg-[--color-dark-2] border-r border-[--color-dark-3]">
      {/* Logo */}
      <div className="px-6 py-8 border-b border-[--color-dark-3]">
        <h1
          className="font-serif text-[32px] font-bold text-[--color-gold]"
          style={{ lineHeight: 1 }}
        >
          BID
        </h1>
        <p className="text-[11px] uppercase tracking-widest text-[--color-muted] mt-2">
          Plataforma Imobiliária
        </p>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {navigationGroups.map((group) => (
          <div key={group.title}>
            <p className="text-[11px] uppercase tracking-widest text-[--color-muted] px-2 mb-3 font-medium">
              {group.title}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = activeNav === item.id
                const badgeValue = getBadgeValue(item.badge as any)

                return (
                  <button
                    key={item.id}
                    onClick={() => onNavChange(item.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-3 text-[15px] transition-all rounded-sm border-l-2 border-transparent',
                      isActive
                        ? 'border-l-[--color-gold] bg-[rgba(201,168,76,0.07)] text-[--color-gold]'
                        : 'text-[--color-text] hover:bg-[rgba(201,168,76,0.04)]'
                    )}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="flex-1 text-left font-medium">{item.label}</span>
                    {badgeValue && (
                      <span
                        className={cn(
                          'text-[11px] px-2 py-0.5 rounded',
                          getBadgeColor(item.badge as any)
                        )}
                      >
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

      {/* Footer - User Profile */}
      <div className="border-t border-[--color-dark-3] p-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-[--color-gold] flex items-center justify-center text-[--color-dark] font-serif font-bold text-base">
            {corretorNome
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[--color-text] truncate">
              {corretorNome}
            </p>
            <p className="text-[12px] text-[--color-muted]">CRECI {corretorCreci}</p>
            <p className="text-[11px] text-[--color-gold] mt-0.5">{corretorSelo}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
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
        >
          ⎋ Sair da conta
        </button>
      </div>
    </aside>
  )
}
