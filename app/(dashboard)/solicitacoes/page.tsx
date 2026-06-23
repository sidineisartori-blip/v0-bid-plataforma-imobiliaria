import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import SolicitacoesClient from '@/components/solicitacoes/SolicitacoesClient'

export default async function SolicitacoesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: solicitacoes }, { data: cidades }] = await Promise.all([
    supabase
      .from('solicitacoes')
      .select('*, ultimo_contato_em, qtd_imoveis_enviados, ultimo_followup_status, ultimo_followup_em')
      .eq('corretor_id', user.id)
      .order('created_at', { ascending: false }),
    supabase.from('cities').select('id, name, state').eq('active', true).order('name'),
  ])

  return (
    <SolicitacoesClient
      solicitacoes={solicitacoes || []}
      cidades={cidades || []}
      corretorId={user.id}
    />
  )
}
