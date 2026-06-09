'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { createClient } from '@/lib/supabase/client'

interface SidebarWrapperProps {
  corretorNome: string
  corretorCreci: string
  corretorSelo: string
  corretorId: string
  matchesPendentes: number
  chatNaoLidos?: number
  notifsNaoLidas?: number
  planoAtual?: string
  erpAlertas?: number
  collapsed?: boolean
  onCollapsedChange?: (v: boolean) => void
}

const pathToNav: Record<string, string> = {
  '/dashboard':      'dashboard',
  '/matches':        'matches',
  '/crm':            'crm',
  '/chat':           'chat',
  '/imoveis':        'imoveis',
  '/solicitacoes':   'solicitacoes',
  '/hub':            'hub',
  '/site':           'site',
  '/avaliacoes':     'avaliacoes',
  '/plano':          'plano',
  '/credenciamento': 'credenciamento',
  '/matching':       'matching',
  '/notificacoes':   'notificacoes',
  '/admin':          'admin',
  '/erp':            'erp',
}

export default function SidebarWrapper({
  corretorNome,
  corretorCreci,
  corretorSelo,
  corretorId,
  matchesPendentes,
  chatNaoLidos = 0,
  notifsNaoLidas: notifsInicial = 0,
  planoAtual = 'free',
  erpAlertas = 0,
  collapsed = false,
  onCollapsedChange,
}: SidebarWrapperProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  // Inicia com valor do servidor, atualiza via realtime
  const [notifsNaoLidas, setNotifsNaoLidas] = useState(notifsInicial)

  useEffect(() => {
    setNotifsNaoLidas(notifsInicial)
  }, [notifsInicial])

  useEffect(() => {
    if (!corretorId) return

    const channel = supabase
      .channel('notifs-count:' + corretorId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notificacoes',
          filter: `corretor_id=eq.${corretorId}`,
        },
        async () => {
          const { count } = await supabase
            .from('notificacoes')
            .select('id', { count: 'exact', head: true })
            .eq('corretor_id', corretorId)
            .eq('lida', false)
          setNotifsNaoLidas(count || 0)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [corretorId])

  const activeNav =
    Object.entries(pathToNav).find(([path]) => pathname.startsWith(path))?.[1] || 'dashboard'

  function handleNavChange(nav: string) {
    const entry = Object.entries(pathToNav).find(([, n]) => n === nav)
    if (entry) router.push(entry[0])
  }

  return (
    <Sidebar
      activeNav={activeNav}
      onNavChange={handleNavChange}
      corretorNome={corretorNome}
      corretorCreci={corretorCreci}
      corretorSelo={corretorSelo}
      matchesPendentes={matchesPendentes}
      chatNaoLidos={chatNaoLidos}
      notifsNaoLidas={notifsNaoLidas}
      planoAtual={planoAtual}
      collapsed={collapsed}
      onCollapsedChange={onCollapsedChange}
    />
  )
}
