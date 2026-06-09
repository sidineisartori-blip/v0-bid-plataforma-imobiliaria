import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from '@/components/dashboard/DashboardClient'
import type { Match } from '@/types/bid'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Buscar IDs de imoveis e solicitacoes do corretor para filtrar matches
  const [
    { data: corretor },
    { data: imoveis },
    { data: solicitacoes },
    { data: negociacoes },
    { data: contratos },
    { data: cobrancasAtrasadas },
    { data: repassesPendentes },
  ] = await Promise.all([
    supabase.from('corretores').select('*').eq('id', user.id).single(),
    supabase.from('imoveis').select('*').eq('corretor_id', user.id).order('created_at', { ascending: false }),
    supabase.from('solicitacoes').select('*').eq('corretor_id', user.id).eq('status', 'ativa'),
    supabase.from('negociacoes').select('*').eq('corretor_id', user.id).order('updated_at', { ascending: false }),
    // Contratos ativos para alertas
    supabase
      .from('contratos')
      .select('id, tipo, status, data_inicio, data_fim, indice_reajuste, cliente_nome, valor_aluguel')
      .eq('corretor_id', user.id)
      .eq('status', 'ativo'),
    // Cobranças atrasadas
    supabase
      .from('contrato_parcelas')
      .select('id, valor, competencia')
      .eq('corretor_id', user.id)
      .eq('status', 'atrasado'),
    // Repasses pendentes
    supabase
      .from('repasses')
      .select('id, valor_liquido')
      .eq('corretor_id', user.id)
      .eq('status', 'pendente'),
  ])

  // Filtrar matches apenas do corretor autenticado
  const imoveisIds = (imoveis || []).map((i: { id: string }) => i.id)
  const solicitacoesIds = (solicitacoes || []).map((s: { id: string }) => s.id)

  let matches: Match[] = []
  if (imoveisIds.length > 0 || solicitacoesIds.length > 0) {
    const matchFilters = []
    if (imoveisIds.length > 0) matchFilters.push(`imovel_id.in.(${imoveisIds.join(',')})`)
    if (solicitacoesIds.length > 0) matchFilters.push(`solicitacao_id.in.(${solicitacoesIds.join(',')})`)

    const { data: matchesData } = await supabase
      .from('matches')
      .select('id,imovel_id,solicitacao_id,score,tipo,status,created_at,imovel:imoveis(titulo,bairro,cidade,valor),solicitacao:solicitacoes(cliente_nome,cidade)')
      .eq('status', 'pendente')
      .or(matchFilters.join(','))
      .order('created_at', { ascending: false })
      .limit(50)

    matches = (matchesData || []).map((m: Record<string, unknown>) => ({
      ...m,
      imovel:     Array.isArray(m.imovel)     ? m.imovel[0]     || null : m.imovel,
      solicitacao: Array.isArray(m.solicitacao) ? m.solicitacao[0] || null : m.solicitacao,
    })) as Match[]
  }

  return (
    <DashboardClient
      corretor={corretor}
      imoveis={imoveis || []}
      solicitacoes={solicitacoes || []}
      matches={matches}
      negociacoes={negociacoes || []}
      contratos={contratos || []}
      cobrancasAtrasadas={cobrancasAtrasadas || []}
      repassesPendentes={repassesPendentes || []}
    />
  )
}
