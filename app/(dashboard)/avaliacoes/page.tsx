import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import AvaliacoesClient from '@/components/avaliacoes/AvaliacoesClient'

export default async function AvaliacoesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: corretor },
    { data: avaliacoesRecebidas },
    { data: ranking },
  ] = await Promise.all([
    supabase
      .from('corretores')
      .select('nota_media, total_avaliacoes, deals_closed')
      .eq('id', user.id)
      .single(),
    supabase
      .from('avaliacoes')
      .select('id, nota_final, comentario, created_at, avaliador:corretores!avaliacoes_avaliador_id_fkey(full_name)')
      .eq('avaliado_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('corretores')
      .select('id, full_name, nota_media, total_avaliacoes, deals_closed, creci')
      .eq('is_active', true)
      .order('nota_media', { ascending: false })
      .limit(10),
  ])

  return (
    <AvaliacoesClient
      corretorId={user.id}
      notaMedia={corretor?.nota_media || 0}
      totalAvaliacoes={corretor?.total_avaliacoes || 0}
      dealsClosed={corretor?.deals_closed || 0}
      avaliacoesRecebidas={(avaliacoesRecebidas as any[]) || []}
      ranking={ranking || []}
    />
  )
}
