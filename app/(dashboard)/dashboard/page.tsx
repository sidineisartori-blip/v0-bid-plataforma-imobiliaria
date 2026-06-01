import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from '@/components/dashboard/DashboardClient'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: corretor },
    { data: imoveis },
    { data: solicitacoes },
    { data: matches },
    { data: negociacoes },
  ] = await Promise.all([
    supabase.from('corretores').select('*').eq('id', user.id).single(),
    supabase
      .from('imoveis')
      .select('*')
      .eq('corretor_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('solicitacoes')
      .select('*')
      .eq('corretor_id', user.id)
      .eq('status', 'ativa'),
    supabase
      .from('matches')
      .select(
        '*, imovel:imoveis(titulo,bairro,cidade,valor), solicitacao:solicitacoes(cliente_nome,cidade)'
      )
      .eq('status', 'pendente'),
    supabase.from('negociacoes').select('*').order('updated_at', { ascending: false }),
  ])

  return (
    <DashboardClient
      corretor={corretor}
      imoveis={imoveis || []}
      solicitacoes={solicitacoes || []}
      matches={matches || []}
      negociacoes={negociacoes || []}
    />
  )
}
