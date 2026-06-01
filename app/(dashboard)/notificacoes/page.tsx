import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NotificacoesClient from '@/components/notificacoes/NotificacoesClient'

export default async function NotificacoesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: notificacoes } = await supabase
    .from('notificacoes')
    .select('*')
    .eq('corretor_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <NotificacoesClient
      notificacoes={notificacoes || []}
      corretorId={user.id}
    />
  )
}
