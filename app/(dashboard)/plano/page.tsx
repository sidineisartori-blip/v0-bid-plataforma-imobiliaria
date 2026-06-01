import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PlanoClient from '@/components/plano/PlanoClient'

export default async function PlanoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: corretor }, { data: assinatura }, { count: imoveisUsados }, { count: solicitacoesUsadas }] =
    await Promise.all([
      supabase.from('corretores').select('plano, created_at, deals_closed, nota_media, total_avaliacoes').eq('id', user.id).single(),
      supabase.from('assinaturas').select('*').eq('corretor_id', user.id).single(),
      supabase.from('imoveis').select('*', { count: 'exact', head: true }).eq('corretor_id', user.id).eq('status', 'ativo'),
      supabase.from('solicitacoes').select('*', { count: 'exact', head: true }).eq('corretor_id', user.id).eq('status', 'ativa'),
    ])

  return (
    <PlanoClient
      corretor={corretor}
      assinatura={assinatura}
      imoveisUsados={imoveisUsados || 0}
      solicitacoesUsadas={solicitacoesUsadas || 0}
    />
  )
}
