'use client'

import React, { useEffect, useState } from 'react'
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
  erpAlertas?: number
}

const navigationGroups = [
  {
    title: 'PRINCIPAL',
    items: [
      { id: 'dashboard',    label: 'Dashboard',         icon: '⊞' },
      { id: 'matches',      label: 'Matches',            icon: '◎', badge: 'matchesPendentes' },
      { id: 'crm',          label: 'CRM Kanban',         icon: '⊡' },
      { id: 'chat',         label: 'Chat',               icon: '◉', badge: 'chatNaoLidos' },
    ],
  },
  {
    title: 'CAPTAÇÃO',
    items: [
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
    ],
  },
  {
    title: 'PLATAFORMA',
    items: [
      { id: 'avaliacoes',     label: 'Avaliações',         icon: '◇' },
      { id: 'notificacoes',   label: 'Notificações',       icon: '◎', badge: 'notifsNaoLidas' },
      { id: 'credenciamento', label: 'Credenciamento',     icon: '◆' },
      { id: 'matching',       label: 'Motor de Matching',  icon: '⊛' },
      { id: 'plano',          label: 'Meu Plano',          icon: '◈', badge: 'plano' },
    ],
  },
  {
    title: 'ADMIN',
    items: [{ id: 'admin', label: 'Painel Admin', icon: '◉' }],
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
  erpAlertas = 0,
}: SidebarProps) {
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [montado, setMontado] = useState(false)
  const [tooltip, setTooltip] = useState<{ label: string; top: number } | null>(null)

  // Restaura preferencia do localStorage ao montar
  useEffect(() => {
    let inicial = false
    try {
      inicial = localStorage.getItem('bid_sidebar_collapsed') === '1'
      if (inicial) setCollapsed(true)
    } catch { /* ignore */ }
    setMontado(true)
    // Informa o layout sobre o estado inicial para reservar a largura correta
    window.dispatchEvent(new CustomEvent('bid-sidebar-collapse', { detail: inicial }))
  }, [])

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const novo = !prev
      try { localStorage.setItem('bid_sidebar_collapsed', novo ? '1' : '0') } catch { /* ignore */ }
      window.dispatchEvent(new CustomEvent('bid-sidebar-collapse', { detail: novo }))
      return novo
    })
    setTooltip(null)
  }

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
  }

  const iniciais = corretorNome
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  const larguraExpandida = 240
  const larguraRecolhida = 64

  return (
    <aside
      className="fixed left-0 top-0 h-screen flex flex-col bg-[--color-dark-2] border-r border-[--color-dark-3]"
      style={{
        width: collapsed ? larguraRecolhida : larguraExpandida,
        transition: montado ? 'width 0.2s ease' : undefined,
        zIndex: 40,
      }}
    >
      {/* Logo + toggle */}
      <div
        className="border-b border-[--color-dark-3]"
        style={{ padding: collapsed ? '20px 0 16px' : '24px', position: 'relative' }}
      >
        {collapsed ? (
          <h1
            className="font-serif font-bold text-[--color-gold]"
            style={{ fontSize: 24, lineHeight: 1, textAlign: 'center' }}
          >
            B
          </h1>
        ) : (
          <>
            <h1 className="font-serif text-[30px] font-bold text-[--color-gold]" style={{ lineHeight: 1 }}>
              BID
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-[--color-muted] mt-1">
              Plataforma Imobiliária
            </p>
          </>
        )}

        {/* Botao de toggle */}
        <button
          onClick={toggleCollapsed}
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          style={{
            position: 'absolute',
            right: collapsed ? '50%' : 12,
            transform: collapsed ? 'translateX(50%)' : 'none',
            bottom: collapsed ? -12 : 'auto',
            top: collapsed ? 'auto' : 18,
            width: 24,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#232324',
            border: '1px solid #2E2E30',
            borderRadius: 2,
            color: '#9B9690',
            fontSize: 11,
            cursor: 'pointer',
            lineHeight: 1,
            transition: 'color 0.15s, border-color 0.15s',
            zIndex: 2,
          }}
          onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.currentTarget.style.color = '#C9A84C'
            e.currentTarget.style.borderColor = 'rgba(201,168,76,0.4)'
          }}
          onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.currentTarget.style.color = '#9B9690'
            e.currentTarget.style.borderColor = '#2E2E30'
          }}
        >
          {collapsed ? '▶' : '◀'}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-5">
        {navigationGroups.map((group) => (
          <div key={group.title}>
            {!collapsed && (
              <p className="text-[10px] uppercase tracking-widest text-[--color-muted] px-2 mb-2 font-semibold opacity-60">
                {group.title}
              </p>
            )}
            {collapsed && <div style={{ height: 1, background: '#232324', margin: '0 8px 8px' }} />}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = activeNav === item.id
                const badgeValue = getBadgeValue(item.badge)
                const badgeStyle = getBadgeStyle(item.badge)

                return (
                  <button
                    key={item.id}
                    onClick={() => onNavChange(item.id)}
                    onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                      if (collapsed) {
                        const rect = e.currentTarget.getBoundingClientRect()
                        setTooltip({ label: item.label, top: rect.top + rect.height / 2 })
                      }
                    }}
                    onMouseLeave={() => collapsed && setTooltip(null)}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      'w-full flex items-center py-2.5 text-[13px] transition-all rounded-sm border-l-2',
                      collapsed ? 'justify-center px-0' : 'gap-2.5 px-3',
                      isActive
                        ? 'border-l-[--color-gold] bg-[rgba(201,168,76,0.07)] text-[--color-gold]'
                        : 'border-l-transparent text-[--color-text] hover:bg-[rgba(201,168,76,0.04)] hover:text-[--color-gold]'
                    )}
                    style={{ position: 'relative' }}
                  >
                    <span style={{ fontSize: 15, flexShrink: 0 }}>{item.icon}</span>
                    {!collapsed && <span className="flex-1 text-left font-medium">{item.label}</span>}
                    {badgeValue !== null && (
                      collapsed ? (
                        <span style={{
                          position: 'absolute', top: 4, right: 8,
                          width: 7, height: 7, borderRadius: '50%',
                          ...badgeStyle,
                        }} />
                      ) : (
                        <span style={{
                          fontSize: 10, fontWeight: 700,
                          padding: '1px 6px', borderRadius: 9999,
                          ...badgeStyle,
                        }}>
                          {badgeValue}
                        </span>
                      )
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
        <div className={cn('flex items-center p-2 rounded-sm', collapsed ? 'justify-center' : 'gap-2.5')}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(201,168,76,0.15)',
            border: '1px solid rgba(201,168,76,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#C9A84C', fontWeight: 700, fontSize: 13, flexShrink: 0,
          }}>
            {iniciais}
          </div>
          {!collapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#F0EDE6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {corretorNome}
              </p>
              <p style={{ fontSize: 10, color: '#9B9690' }}>CRECI {corretorCreci}</p>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          title={collapsed ? 'Sair da conta' : undefined}
          style={{
            width: '100%', background: 'none', border: 'none',
            borderTop: '1px solid rgba(255,255,255,0.04)',
            padding: '8px 10px', color: '#9B9690', fontSize: 12,
            cursor: 'pointer', textAlign: collapsed ? 'center' : 'left', marginTop: 4,
            borderRadius: 2, letterSpacing: '0.02em',
          }}
          onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.color = '#E05C5C')}
          onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.color = '#9B9690')}
        >
          {collapsed ? '⎋' : '⎋ Sair da conta'}
        </button>
      </div>

      {/* Tooltip flutuante no modo recolhido */}
      {collapsed && tooltip && (
        <div
          style={{
            position: 'fixed',
            left: larguraRecolhida + 8,
            top: tooltip.top,
            transform: 'translateY(-50%)',
            background: '#232324',
            border: '1px solid #2E2E30',
            borderRadius: 2,
            padding: '6px 12px',
            fontSize: 12,
            color: '#F0EDE6',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 50,
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          }}
        >
          {tooltip.label}
        </div>
      )}
    </aside>
  )
}
