'use client'

import React, { useState, useEffect, useRef } from 'react'
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
  collapsed?: boolean
  onCollapsedChange?: (v: boolean) => void
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
  collapsed = false,
  onCollapsedChange,
}: SidebarProps) {
  const router = useRouter()
  const [tooltipItem, setTooltipItem] = useState<string | null>(null)
  const tooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  function handleItemMouseEnter(id: string) {
    if (!collapsed) return
    if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current)
    tooltipTimerRef.current = setTimeout(() => setTooltipItem(id), 80)
  }

  function handleItemMouseLeave() {
    if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current)
    setTooltipItem(null)
  }

  useEffect(() => {
    return () => {
      if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current)
    }
  }, [])

  return (
    <aside style={{
      width: collapsed ? '64px' : '240px',
      minWidth: collapsed ? '64px' : '240px',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#181819',
      borderRight: '1px solid #232324',
      transition: 'width 0.2s ease, min-width 0.2s ease',
      overflow: 'hidden',
      flexShrink: 0,
      position: 'relative',
    }}>
      {/* Logo + Toggle */}
      <div style={{
        padding: collapsed ? '20px 0' : '20px 20px',
        borderBottom: '1px solid #232324',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        flexShrink: 0,
      }}>
        {!collapsed && (
          <div>
            <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, fontWeight: 700, color: '#C9A84C', margin: 0, lineHeight: 1 }}>
              BID
            </h1>
            <p style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#9B9690', marginTop: 4 }}>
              Plataforma Imobiliária
            </p>
          </div>
        )}
        {collapsed && (
          <span style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700, color: '#C9A84C' }}>B</span>
        )}
        <button
          onClick={() => onCollapsedChange?.(!collapsed)}
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          style={{
            background: 'none',
            border: '1px solid #2E2E30',
            borderRadius: 2,
            color: '#9B9690',
            fontSize: 11,
            cursor: 'pointer',
            padding: '4px 7px',
            lineHeight: 1,
            transition: 'color 0.15s, border-color 0.15s',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#C9A84C'
            e.currentTarget.style.borderColor = 'rgba(201,168,76,0.4)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#9B9690'
            e.currentTarget.style.borderColor = '#2E2E30'
          }}
        >
          {collapsed ? '▶' : '◀'}
        </button>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: collapsed ? '12px 6px' : '12px 10px' }}>
        {navigationGroups.map((group) => (
          <div key={group.title} style={{ marginBottom: 20 }}>
            {!collapsed && (
              <p style={{ fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#9B9690', padding: '0 8px', marginBottom: 6, fontWeight: 600, opacity: 0.6 }}>
                {group.title}
              </p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {group.items.map((item) => {
                const isActive = activeNav === item.id
                const badgeValue = getBadgeValue(item.badge)
                const badgeStyle = getBadgeStyle(item.badge)
                const showTooltip = collapsed && tooltipItem === item.id

                return (
                  <div key={item.id} style={{ position: 'relative' }}>
                    <button
                      onClick={() => onNavChange(item.id)}
                      onMouseEnter={() => handleItemMouseEnter(item.id)}
                      onMouseLeave={handleItemMouseLeave}
                      className={cn(
                        'w-full flex items-center transition-all rounded-sm border-l-2',
                        isActive
                          ? 'border-l-[--color-gold] bg-[rgba(201,168,76,0.07)] text-[--color-gold]'
                          : 'border-l-transparent text-[--color-text] hover:bg-[rgba(201,168,76,0.04)] hover:text-[--color-gold]'
                      )}
                      style={{
                        padding: collapsed ? '10px 0' : '9px 10px',
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        gap: collapsed ? 0 : 10,
                      }}
                    >
                      <span style={{ fontSize: 16, flexShrink: 0, position: 'relative' }}>
                        {item.icon}
                        {/* Badge no modo collapsed */}
                        {collapsed && badgeValue !== null && (
                          <span style={{
                            position: 'absolute',
                            top: -4, right: -6,
                            fontSize: 9, fontWeight: 700,
                            padding: '1px 4px', borderRadius: 9999,
                            ...badgeStyle,
                            minWidth: 14, textAlign: 'center',
                          }}>
                            {typeof badgeValue === 'number' && badgeValue > 9 ? '9+' : badgeValue}
                          </span>
                        )}
                      </span>
                      {!collapsed && (
                        <>
                          <span style={{ flex: 1, textAlign: 'left', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' }}>
                            {item.label}
                          </span>
                          {badgeValue !== null && (
                            <span style={{
                              fontSize: 10, fontWeight: 700,
                              padding: '1px 6px', borderRadius: 9999,
                              ...badgeStyle,
                            }}>
                              {badgeValue}
                            </span>
                          )}
                        </>
                      )}
                    </button>

                    {/* Tooltip no modo collapsed */}
                    {showTooltip && (
                      <div style={{
                        position: 'absolute',
                        left: '100%',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        marginLeft: 8,
                        backgroundColor: '#232324',
                        border: '1px solid #2E2E30',
                        borderRadius: 2,
                        padding: '6px 12px',
                        fontSize: 12,
                        color: '#F0EDE6',
                        whiteSpace: 'nowrap',
                        zIndex: 1000,
                        pointerEvents: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                      }}>
                        {item.label}
                        {badgeValue !== null && (
                          <span style={{ marginLeft: 6, ...badgeStyle, padding: '1px 5px', borderRadius: 9999, fontSize: 10 }}>
                            {badgeValue}
                          </span>
                        )}
                        {/* Seta */}
                        <span style={{
                          position: 'absolute',
                          left: -5, top: '50%', transform: 'translateY(-50%)',
                          width: 0, height: 0,
                          borderTop: '5px solid transparent',
                          borderBottom: '5px solid transparent',
                          borderRight: '5px solid #2E2E30',
                        }} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ borderTop: '1px solid #232324', padding: collapsed ? '10px 6px' : '10px', flexShrink: 0 }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px', marginBottom: 4 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(201,168,76,0.15)',
              border: '1px solid rgba(201,168,76,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#C9A84C', fontWeight: 700, fontSize: 12, flexShrink: 0,
            }}>
              {iniciais}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#F0EDE6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {corretorNome}
              </p>
              <p style={{ fontSize: 10, color: '#9B9690' }}>CRECI {corretorCreci}</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0 8px' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(201,168,76,0.15)',
              border: '1px solid rgba(201,168,76,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#C9A84C', fontWeight: 700, fontSize: 12,
            }}>
              {iniciais}
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          style={{
            width: '100%', background: 'none', border: 'none',
            borderTop: '1px solid rgba(255,255,255,0.04)',
            padding: '8px 10px', color: '#9B9690', fontSize: 12,
            cursor: 'pointer', textAlign: collapsed ? 'center' : 'left',
            marginTop: 2, borderRadius: 2, letterSpacing: '0.02em',
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.color = '#E05C5C')}
          onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.color = '#9B9690')}
        >
          {collapsed ? '⎋' : '⎋ Sair da conta'}
        </button>
      </div>
    </aside>
  )
}
