'use client'

import { useState, useEffect, ReactNode, cloneElement, isValidElement } from 'react'
import { Menu } from 'lucide-react'

interface DashboardShellProps {
  sidebar: ReactNode
  children: ReactNode
}

const STORAGE_KEY = 'bid_sidebar_collapsed'

export default function DashboardShell({ sidebar, children }: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'true') setCollapsed(true)
    setMounted(true)

    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  function handleCollapsedChange(v: boolean) {
    setCollapsed(v)
    localStorage.setItem(STORAGE_KEY, String(v))
  }

  const sidebarWithProps = mounted && isValidElement(sidebar)
    ? cloneElement(sidebar as React.ReactElement<{
        collapsed?: boolean
        onCollapsedChange?: (v: boolean) => void
        mobileOpen?: boolean
        onMobileClose?: () => void
      }>, {
        collapsed: isMobile ? false : collapsed,
        onCollapsedChange: handleCollapsedChange,
        mobileOpen,
        onMobileClose: () => setMobileOpen(false),
      })
    : sidebar

  return (
    // data-surface="cockpit" liga o tema claro de trabalho (globals.css).
    // A sidebar continua escura de propósito: não sobrescrevemos os tokens
    // --sidebar-* no cockpit, então ela herda o dourado sobre escuro da marca.
    <div data-surface="cockpit" className="flex h-screen overflow-hidden bg-background">
      {isMobile && mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/60"
          aria-hidden="true"
        />
      )}

      <div
        className={[
          'top-0 left-0 bottom-0 transition-transform duration-200 ease-out',
          isMobile ? 'fixed z-50' : 'relative',
          isMobile && !mobileOpen ? '-translate-x-full' : 'translate-x-0',
        ].join(' ')}
      >
        {sidebarWithProps}
      </div>

      <main className="flex-1 min-w-0 overflow-y-auto bg-background text-foreground">
        {isMobile && (
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menu"
            className="fixed top-3.5 left-3.5 z-30 flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-primary shadow-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Menu className="h-[18px] w-[18px]" />
          </button>
        )}
        {children}
      </main>
    </div>
  )
}
