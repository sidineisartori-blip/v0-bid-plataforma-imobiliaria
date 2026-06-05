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

  // Buscar IDs de imoveis e solicitacoes do corretor para filtrar matches
  const [
    { data: corretor },
    { data: imoveis },
    { data: solicitacoes },
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
    supabase.from('negociacoes').select('*').eq('corretor_id', user.id).order('updated_at', { ascending: false }),
  ])

  // Filtrar matches apenas do corretor autenticado
  const imoveisIds = (imoveis || []).map((i) => i.id)
  const solicitacoesIds = (solicitacoes || []).map((s) => s.id)
  
  let matches: typeof imoveis extends Array<infer T> ? Array<{ imovel: T | null; solicitacao: unknown; [key: string]: unknown }> : never[] = []
  
  if (imoveisIds.length > 0 || solicitacoesIds.length > 0) {
    // Busca matches onde o imovel OU a solicitacao pertencem ao corretor
    const matchFilters = []
    if (imoveisIds.length > 0) matchFilters.push(`imovel_id.in.(${imoveisIds.join(',')})`)
    if (solicitacoesIds.length > 0) matchFilters.push(`solicitacao_id.in.(${solicitacoesIds.join(',')})`)
    
    const { data: matchesData } = await supabase
      .from('matches')
      .select(
        '*, imovel:imoveis(titulo,bairro,cidade,valor), solicitacao:solicitacoes(cliente_nome,cidade)'
      )
      .eq('status', 'pendente')
      .or(matchFilters.join(','))
      .order('created_at', { ascending: false })
      .limit(50)
    
    matches = matchesData || []
  }

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
