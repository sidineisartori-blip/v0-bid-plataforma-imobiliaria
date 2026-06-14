import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const PLANOS_PERMITIDOS = ['pro', 'premium', 'enterprise']

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: corretor } = await supabase
    .from('corretores')
    .select('plano, full_name')
    .eq('id', user.id)
    .single()

  if (!corretor || !PLANOS_PERMITIDOS.includes(corretor.plano)) {
    return NextResponse.json({ error: 'Plano insuficiente', planoAtual: corretor?.plano || 'free' }, { status: 403 })
  }

  const [
    { data: imoveis },
    { data: solicitacoes },
    { data: matches },
    { data: negociacoes },
    { data: contratos },
    { data: leads },
  ] = await Promise.all([
    supabase.from('imoveis').select('id, tipo_negocio, tipo_imovel, cidade, valor, status, view_count, contact_count, match_count, created_at').eq('corretor_id', user.id),
    supabase.from('solicitacoes').select('id, tipo_negocio, tipo_imovel, cidade, status, created_at').eq('corretor_id', user.id),
    supabase.from('matches').select('id, tipo, status, score, created_at, imovel_id, solicitacao_id').or(`imovel_id.in.(${([] as string[]).join(',')})`),
    supabase.from('negociacoes').select('id, status, valor_negociado, created_at').eq('corretor_id', user.id),
    supabase.from('contratos').select('id, tipo, status, valor_aluguel, created_at').eq('corretor_id', user.id),
    supabase.from('leads').select('id, created_at').eq('corretor_id', user.id),
  ])

  // Busca matches corretamente usando IDs do corretor
  const imoveisIds = (imoveis || []).map(i => i.id)
  const solsIds = (solicitacoes || []).map(s => s.id)

  let matchesData: { id: string; tipo: string; status: string; score: number; created_at: string }[] = []
  if (imoveisIds.length > 0 || solsIds.length > 0) {
    const filtros: string[] = []
    if (imoveisIds.length > 0) filtros.push(`imovel_id.in.(${imoveisIds.join(',')})`)
    if (solsIds.length > 0) filtros.push(`solicitacao_id.in.(${solsIds.join(',')})`)
    const { data } = await supabase
      .from('matches')
      .select('id, tipo, status, score, created_at')
      .or(filtros.join(','))
    matchesData = data || []
  }

  const now = new Date()
  const meses = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    return { label: d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }), year: d.getFullYear(), month: d.getMonth() }
  })

  function porMes<T extends { created_at: string }>(items: T[]) {
    return meses.map(({ label, year, month }) => ({
      mes: label,
      total: items.filter(it => {
        const d = new Date(it.created_at)
        return d.getFullYear() === year && d.getMonth() === month
      }).length,
    }))
  }

  // Imóveis por tipo
  const tiposImovel = [...new Set((imoveis || []).map(i => i.tipo_imovel).filter(Boolean))]
  const imoveisPorTipo = tiposImovel.map(tipo => ({
    tipo,
    venda: (imoveis || []).filter(i => i.tipo_imovel === tipo && i.tipo_negocio === 'Venda').length,
    aluguel: (imoveis || []).filter(i => i.tipo_imovel === tipo && i.tipo_negocio !== 'Venda').length,
  }))

  // Solicitações por tipo de negócio
  const solPorNegocio = [
    { tipo: 'Comprar', total: (solicitacoes || []).filter(s => s.tipo_negocio === 'Comprar').length },
    { tipo: 'Alugar', total: (solicitacoes || []).filter(s => s.tipo_negocio === 'Alugar').length },
  ]

  // Matches internos x externos
  const matchesInternos = matchesData.filter(m => m.tipo === 'interno').length
  const matchesExternos = matchesData.filter(m => m.tipo === 'externo').length
  const matchesAceitos = matchesData.filter(m => m.status === 'aceito' || m.status === 'ativo').length

  // Score médio
  const comScore = matchesData.filter(m => m.score != null)
  const scoreMedio = comScore.length > 0
    ? Math.round(comScore.reduce((acc, m) => acc + m.score, 0) / comScore.length)
    : 0

  // Views e contatos nos imóveis
  const totalViews = (imoveis || []).reduce((acc, i) => acc + (i.view_count || 0), 0)
  const totalContatos = (imoveis || []).reduce((acc, i) => acc + (i.contact_count || 0), 0)

  // Valor médio do portfólio
  const imoveisComValor = (imoveis || []).filter(i => i.valor > 0)
  const valorMedioImovel = imoveisComValor.length > 0
    ? Math.round(imoveisComValor.reduce((acc, i) => acc + i.valor, 0) / imoveisComValor.length)
    : 0

  return NextResponse.json({
    plano: corretor.plano,
    resumo: {
      totalImoveis: (imoveis || []).length,
      imoveisAtivos: (imoveis || []).filter(i => i.status === 'disponivel').length,
      totalSolicitacoes: (solicitacoes || []).length,
      solsAtivas: (solicitacoes || []).filter(s => s.status === 'ativa').length,
      totalMatches: matchesData.length,
      matchesAceitos,
      totalNegociacoes: (negociacoes || []).length,
      negsAtivas: (negociacoes || []).filter(n => n.status === 'ativa').length,
      totalContratos: (contratos || []).length,
      totalLeads: (leads || []).length,
      totalViews,
      totalContatos,
      valorMedioImovel,
      scoreMedio,
    },
    imoveisPorTipo,
    solPorNegocio,
    matches: {
      internos: matchesInternos,
      externos: matchesExternos,
      aceitos: matchesAceitos,
      pendentes: matchesData.filter(m => m.status === 'pendente').length,
    },
    evolucao: {
      imoveis: porMes(imoveis || []),
      solicitacoes: porMes(solicitacoes || []),
      matches: porMes(matchesData),
      leads: porMes(leads || []),
    },
    funil: [
      { etapa: 'Leads', valor: (leads || []).length },
      { etapa: 'Solicitações', valor: (solicitacoes || []).length },
      { etapa: 'Matches', valor: matchesData.length },
      { etapa: 'Aceitos', valor: matchesAceitos },
      { etapa: 'Negociações', valor: (negociacoes || []).length },
      { etapa: 'Contratos', valor: (contratos || []).length },
    ],
  })
}
