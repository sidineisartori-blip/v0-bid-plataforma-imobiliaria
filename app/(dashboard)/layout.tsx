import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SidebarWrapper from '@/components/layout/SidebarWrapper'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: corretor } = await supabase
    .from('corretores')
    .select('full_name, creci, plano, deals_closed')
    .eq('id', user.id)
    .single()

  const { count: matchesPendentes } = await supabase
    .from('matches')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pendente')

  const corretorNome = corretor?.full_name || user.email || 'Corretor'
  const corretorCreci = corretor?.creci || '—'
  const corretorSelo =
    corretor?.plano === 'premium'
      ? 'Membro Premium'
      : corretor?.plano === 'pro'
      ? 'Membro Pro'
      : 'Membro Basico'

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: '#0E0E0F' }}>
      <SidebarWrapper
        corretorNome={corretorNome}
        corretorCreci={corretorCreci}
        corretorSelo={corretorSelo}
        corretorId={user.id}
        matchesPendentes={matchesPendentes || 0}
      />
      <main
        style={{
          marginLeft: '216px',
          flex: 1,
          overflowY: 'auto',
          backgroundColor: '#0E0E0F',
        }}
      >
        {children}
      </main>
    </div>
  )
}
