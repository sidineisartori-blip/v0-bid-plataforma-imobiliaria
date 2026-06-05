import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MatchesClient from '@/components/matches/MatchesClient'
import type { MatchComRelacoes } from '@/types/bid'

export const dynamic = 'force-dynamic'

export default async function MatchesPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: meusImoveis }, { data: minhasSols }] = await Promise.all([
    supabase.from('imoveis').select('id').eq('corretor_id', user.id),
    supabase.from('solicitacoes').select('id').eq('corretor_id', user.id),
  ])

  const imoveisIds = meusImoveis?.map((i) => i.id) || []
  const solsIds = minhasSols?.map((s) => s.id) || []

  let matches: MatchComRelacoes[] = []
  if (imoveisIds.length > 0 || solsIds.length > 0) {
    const matchFilters: string[] = []
    if (imoveisIds.length > 0) matchFilters.push(`imovel_id.in.(${imoveisIds.join(',')})`)
    if (solsIds.length > 0) matchFilters.push(`solicitacao_id.in.(${solsIds.join(',')})`)

    const { data } = await supabase
      .from('matches')
      .select(
        `
        *,
        imovel:imoveis(id, titulo, bairro, cidade, valor, quartos, banheiros, vagas, tipo_imovel, corretor_id),
        solicitacao:solicitacoes(id, cliente_nome, cidade, bairro_desejado, valor_min, valor_max, quartos, corretor_id)
      `
      )
      .or(matchFilters.join(','))
      .order('score', { ascending: false })
      .limit(100)
    matches = data || []
  }

  // Busca apenas corretores relacionados aos matches (não todos)
  const corretorIds = new Set<string>()
  for (const m of matches) {
    if (m.imovel?.corretor_id) corretorIds.add(m.imovel.corretor_id)
    if (m.solicitacao?.corretor_id) corretorIds.add(m.solicitacao.corretor_id)
  }
  corretorIds.add(user.id)

  const { data: corretores } = await supabase
    .from('corretores')
    .select('id, full_name, creci, nota_media, total_avaliacoes, deals_closed, avatar_url, plano')
    .in('id', [...corretorIds])

  return (
    <MatchesClient
      matches={matches}
      corretores={corretores || []}
      corretorId={user.id}
    />
  )
}
