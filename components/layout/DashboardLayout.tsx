'use client'

import { ReactNode } from 'react'

interface DashboardLayoutProps {
  children: ReactNode
  sidebar: ReactNode
}

export function DashboardLayout({ children, sidebar }: DashboardLayoutProps) {
  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: 'var(--color-dark)',
      }}
    >
      {/* Sidebar */}
      <aside
        style={{
          width: '216px',
          flexShrink: 0,
          borderRight: '1px solid var(--color-dark-3)',
          backgroundColor: 'var(--color-dark)',
        }}
      >
        {sidebar}
      </aside>

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {children}
      </main>
    </div>
  )
}

export default DashboardLayout
