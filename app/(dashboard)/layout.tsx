import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SidebarWrapper from '@/components/layout/SidebarWrapper'
import DashboardShell from '@/components/layout/DashboardShell'

export const dynamic = 'force-dynamic'

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

  // Busca IDs do corretor para filtrar matches pendentes
  const [
    { data: corretor },
    { data: meusImoveis },
    { data: minhasSols },
    { count: chatNaoLidos },
    { count: notifsNaoLidas },
  ] = await Promise.all([
    supabase.from('corretores').select('full_name, creci, plano, deals_closed').eq('id', user.id).single(),
    supabase.from('imoveis').select('id').eq('corretor_id', user.id),
    supabase.from('solicitacoes').select('id').eq('corretor_id', user.id),
    supabase.from('mensagens').select('*', { count: 'exact', head: true }).eq('lida', false).neq('remetente_id', user.id),
    supabase.from('notificacoes').select('*', { count: 'exact', head: true }).eq('corretor_id', user.id).eq('lida', false),
  ])

  const imoveisIds = meusImoveis?.map((i) => i.id) || []
  const solsIds = minhasSols?.map((s) => s.id) || []

  let matchesPendentes = 0
  if (imoveisIds.length > 0 || solsIds.length > 0) {
    const matchFilters: string[] = []
    if (imoveisIds.length > 0) matchFilters.push(`imovel_id.in.(${imoveisIds.join(',')})`)
    if (solsIds.length > 0) matchFilters.push(`solicitacao_id.in.(${solsIds.join(',')})`)

    const { count } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pendente')
      .or(matchFilters.join(','))

    matchesPendentes = count || 0
  }

  const corretorNome = corretor?.full_name || user.email || 'Corretor'
  const corretorCreci = corretor?.creci || '—'
  const corretorSelo =
    corretor?.plano === 'premium'
      ? 'Membro Premium'
      : corretor?.plano === 'pro'
      ? 'Membro Pro'
      : 'Membro Básico'

  return (
    <DashboardShell
      sidebar={
        <SidebarWrapper
          corretorNome={corretorNome}
          corretorCreci={corretorCreci}
          corretorSelo={corretorSelo}
          corretorId={user.id}
          matchesPendentes={matchesPendentes}
          chatNaoLidos={chatNaoLidos || 0}
          notifsNaoLidas={notifsNaoLidas || 0}
          planoAtual={corretor?.plano || 'free'}
        />
      }
    >
      {children}
    </DashboardShell>
  )
}
