'use client'

import { useState, ReactNode } from 'react'

interface DashboardShellProps {
  sidebar: ReactNode
  children: ReactNode
}

export default function DashboardShell({ sidebar, children }: DashboardShellProps) {
  const [sidebarAberta, setSidebarAberta] = useState(true)

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: '#0E0E0F' }}>
      {/* Sidebar com transição */}
      <div
        style={{
          width: sidebarAberta ? '240px' : '0px',
          minWidth: sidebarAberta ? '240px' : '0px',
          overflow: 'hidden',
          transition: 'width 0.2s ease, min-width 0.2s ease',
          flexShrink: 0,
        }}
      >
        {sidebar}
      </div>

      {/* Conteúdo principal */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Topbar mínima com botão toggle */}
        <div
          style={{
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: '16px',
            borderBottom: '1px solid rgba(201,168,76,0.08)',
            backgroundColor: '#0E0E0F',
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => setSidebarAberta((v) => !v)}
            title={sidebarAberta ? 'Recolher menu' : 'Expandir menu'}
            style={{
              background: 'none',
              border: 'none',
              color: '#9B9690',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '2px',
              lineHeight: 1,
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#C9A84C' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#9B9690' }}
          >
            ☰
          </button>
        </div>

        {/* Área de conteúdo */}
        <main style={{ flex: 1, overflowY: 'auto', backgroundColor: '#0E0E0F' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
