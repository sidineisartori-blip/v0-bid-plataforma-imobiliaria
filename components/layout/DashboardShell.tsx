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

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'true') setCollapsed(true)
    setMounted(true)
  }, [])

  function handleCollapsedChange(v: boolean) {
    setCollapsed(v)
    localStorage.setItem(STORAGE_KEY, String(v))
  }

  // Injeta collapsed + onCollapsedChange no elemento sidebar
  const sidebarWithProps = mounted && isValidElement(sidebar)
    ? cloneElement(sidebar as React.ReactElement<{
        collapsed?: boolean
        onCollapsedChange?: (v: boolean) => void
      }>, { collapsed, onCollapsedChange: handleCollapsedChange })
    : sidebar

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: '#0E0E0F' }}>
      {sidebarWithProps}
      <main style={{ flex: 1, overflowY: 'auto', backgroundColor: '#0E0E0F', minWidth: 0 }}>
        {children}
      </main>
    </div>
  )
}
