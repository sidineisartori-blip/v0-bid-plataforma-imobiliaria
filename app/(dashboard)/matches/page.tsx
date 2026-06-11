import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
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

  const imoveisIds = meusImoveis?.map((i: { id: string }) => i.id) || []
  const solsIds = minhasSols?.map((s: { id: string }) => s.id) || []

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

  // Coleta IDs de corretores dos joins (podem ser null por RLS em solicitacoes)
  const corretorIds = new Set<string>()
  const missingSolicitacaoIds: string[] = []

  for (const m of matches) {
    if (m.imovel?.corretor_id) corretorIds.add(m.imovel.corretor_id)
    if (m.solicitacao?.corretor_id) {
      corretorIds.add(m.solicitacao.corretor_id)
    } else if ((m as any).solicitacao_id) {
      // solicitacao retornou null por RLS — busca corretor_id via admin
      missingSolicitacaoIds.push((m as any).solicitacao_id)
    }
  }
  corretorIds.add(user.id)

  // Busca corretor_id das solicitacoes cujo join foi bloqueado por RLS
  if (missingSolicitacaoIds.length > 0) {
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data: sols } = await admin
      .from('solicitacoes')
      .select('id, corretor_id')
      .in('id', missingSolicitacaoIds)
    for (const s of sols || []) {
      if (s.corretor_id) corretorIds.add(s.corretor_id)
    }
  }

  const { data: corretores } = await supabase
    .from('corretores')
    .select('id, full_name, creci, nota_media, total_avaliacoes, deals_closed, avatar_url, plano')
    .in('id', [...corretorIds])

  return (
    <MatchesClient
      matches={matches as any}
      corretores={corretores || []}
      corretorId={user.id}
    />
  )
}
