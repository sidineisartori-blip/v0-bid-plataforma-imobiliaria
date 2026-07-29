import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAdminToken } from '@/lib/admin-session'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  // Auth: apenas admin master
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  let session = null
  if (token) {
    try { session = await verifyAdminToken(token) } catch { /* token inválido */ }
  }
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const supabase = await createClient()

  const [
    { data: corretores },
    { data: imoveis },
    { data: solicitacoes },
    { data: matches },
    { data: negociacoes },
    { data: assinaturas },
    { data: contratos },
  ] = await Promise.all([
    supabase.from('corretores').select('id, plano, created_at, is_active, cidade'),
    supabase.from('imoveis').select('id, tipo_negocio, tipo_imovel, cidade, valor, status, created_at'),
    supabase.from('solicitacoes').select('id, tipo_negocio, tipo_imovel, cidade, status, created_at'),
    supabase.from('matches').select('id, tipo, status, score, created_at'),
    supabase.from('negociacoes').select('id, status, created_at'),
    supabase.from('assinaturas').select('id, plano, status, valor_mensal, created_at'),
    supabase.from('contratos').select('id, tipo, status, valor_aluguel, created_at'),
  ])

  const now = new Date()
  const meses = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    return { label: d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }), year: d.getFullYear(), month: d.getMonth() }
  })

  function porMes<T extends { created_at: string }>(items: T[] | null) {
    return meses.map(({ label, year, month }) => ({
      mes: label,
      total: (items || []).filter(it => {
        const d = new Date(it.created_at)
        return d.getFullYear() === year && d.getMonth() === month
      }).length,
    }))
  }

  // Corretores por plano
  const planos = ['free', 'pro', 'premium', 'enterprise']
  const corretoresPorPlano = planos.map(p => ({
    plano: p,
    total: (corretores || []).filter(c => c.plano === p).length,
  }))

  // Imóveis por tipo
  const tiposImovel = [...new Set((imoveis || []).map(i => i.tipo_imovel).filter(Boolean))]
  const imoveisPorTipo = tiposImovel.map(tipo => ({
    tipo,
    total: (imoveis || []).filter(i => i.tipo_imovel === tipo).length,
  })).sort((a, b) => b.total - a.total).slice(0, 6)

  // Imóveis por cidade
  const cidades = [...new Set((imoveis || []).map(i => i.cidade).filter(Boolean))]
  const imoveisPorCidade = cidades.map(c => ({
    cidade: c,
    imoveis: (imoveis || []).filter(i => i.cidade === c).length,
    solicitacoes: (solicitacoes || []).filter(s => s.cidade === c).length,
  })).sort((a, b) => b.imoveis - a.solicitacoes).slice(0, 8)

  // Funil de matches
  const totalMatches = (matches || []).length
  const matchesAceitos = (matches || []).filter(m => m.status === 'aceito' || m.status === 'ativo').length
  const totalNegs = (negociacoes || []).length
  const negsAtivas = (negociacoes || []).filter(n => n.status === 'ativa').length
  const totalContratos = (contratos || []).length

  // MRR
  const mrrTotal = (assinaturas || [])
    .filter(a => a.status === 'ativa')
    .reduce((acc, a) => acc + (a.valor_mensal || 0), 0)

  // Score médio dos matches
  const matchesComScore = (matches || []).filter(m => m.score != null)
  const scoreMedio = matchesComScore.length > 0
    ? Math.round(matchesComScore.reduce((acc, m) => acc + m.score, 0) / matchesComScore.length)
    : 0

  return NextResponse.json({
    resumo: {
      totalCorretores: (corretores || []).length,
      corretoresAtivos: (corretores || []).filter(c => c.is_active).length,
      totalImoveis: (imoveis || []).length,
      totalSolicitacoes: (solicitacoes || []).length,
      totalMatches,
      matchesAceitos,
      totalNegociacoes: totalNegs,
      totalContratos,
      mrrTotal,
      scoreMedio,
    },
    corretoresPorPlano,
    imoveisPorTipo,
    imoveisPorCidade,
    funil: [
      { etapa: 'Imóveis', valor: (imoveis || []).length },
      { etapa: 'Solicitações', valor: (solicitacoes || []).length },
      { etapa: 'Matches', valor: totalMatches },
      { etapa: 'Aceitos', valor: matchesAceitos },
      { etapa: 'Negociações', valor: totalNegs },
      { etapa: 'Contratos', valor: totalContratos },
    ],
    evolucao: {
      corretores: porMes(corretores),
      imoveis: porMes(imoveis),
      matches: porMes(matches),
    },
  })
}
