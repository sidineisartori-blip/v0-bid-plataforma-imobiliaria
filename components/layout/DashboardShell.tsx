'use client'

import { useState, useEffect, ReactNode, cloneElement, isValidElement } from 'react'

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
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: '#0E0E0F' }}>
      {/* Mobile overlay */}
      {isMobile && mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 40,
            backgroundColor: 'rgba(0,0,0,0.6)',
          }}
        />
      )}

      {/* Sidebar — hidden on mobile unless mobileOpen */}
      <div style={{
        position: isMobile ? 'fixed' : 'relative',
        top: 0, left: 0, bottom: 0,
        zIndex: isMobile ? 50 : undefined,
        transform: isMobile && !mobileOpen ? 'translateX(-100%)' : 'translateX(0)',
        transition: 'transform 0.25s ease',
      }}>
        {sidebarWithProps}
      </div>

      <main style={{ flex: 1, overflowY: 'auto', backgroundColor: '#0E0E0F', minWidth: 0 }}>
        {/* Mobile hamburger */}
        {isMobile && (
          <button
            onClick={() => setMobileOpen(true)}
            style={{
              position: 'fixed', top: 14, left: 14, zIndex: 30,
              background: '#181819', border: '1px solid #2E2E30',
              borderRadius: 4, width: 40, height: 40,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#C9A84C', fontSize: 18, cursor: 'pointer',
            }}
          >
            ☰
          </button>
        )}
        {children}
      </main>
    </div>
  )
}
