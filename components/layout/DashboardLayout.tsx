'use client'

import { ReactNode, useState } from 'react'

interface DashboardLayoutProps {
  children: ReactNode
  sidebar: ReactNode
  onToggleSidebar?: (isOpen: boolean) => void
}

export function DashboardLayout({ children, sidebar, onToggleSidebar }: DashboardLayoutProps) {
  const [sidebarAberta, setSidebarAberta] = useState(true)

  const handleToggle = () => {
    const novoEstado = !sidebarAberta
    setSidebarAberta(novoEstado)
    onToggleSidebar?.(novoEstado)
  }

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
          width: sidebarAberta ? '216px' : '0px',
          minWidth: sidebarAberta ? '216px' : '0px',
          flexShrink: 0,
          borderRight: sidebarAberta ? '1px solid var(--color-dark-3)' : 'none',
          backgroundColor: 'var(--color-dark)',
          overflow: 'hidden',
          transition: 'width 0.2s ease, min-width 0.2s ease, border-right 0.2s ease',
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
        {/* Exportar o estado para o children através de React Context se necessário */}
        {typeof children === 'function' ? children({ sidebarAberta, onToggleSidebar: handleToggle }) : children}
      </main>
    </div>
  )
}

export default DashboardLayout
