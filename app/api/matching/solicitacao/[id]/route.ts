import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { calcularScore } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verifica autenticação
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const { id: solicitacaoId } = await params

    // Valida que a solicitação pertence ao usuário
    const { data: solicitacao, error: solErr } = await supabase
      .from('solicitacoes')
      .select('*')
      .eq('id', solicitacaoId)
      .eq('corretor_id', user.id)
      .single()

    if (solErr || !solicitacao) {
      return NextResponse.json({ error: 'Solicitação não encontrada' }, { status: 404 })
    }

    // Busca imóveis compatíveis (mesma cidade, ativos)
    const { data: imoveis } = await supabase
      .from('imoveis')
      .select('*')
      .eq('cidade', solicitacao.cidade)
      .eq('status', 'ativo')
      .eq('matching_ativo', true)

    // Busca matches já existentes para esta solicitação em uma única query
    const { data: matchesExistentes } = await supabase
      .from('matches')
      .select('imovel_id')
      .eq('solicitacao_id', solicitacaoId)

    const imoveisComMatch = new Set(matchesExistentes?.map((m) => m.imovel_id) || [])

    const novosMatches: { imovel_id: string; solicitacao_id: string; score: number; tipo: string; status: string; score_detalhado: object }[] = []
    const novasNotificacoes: { corretor_id: string; tipo: string; titulo: string; mensagem: string; imovel_id: string; solicitacao_id: string }[] = []

    for (const imovel of imoveis || []) {
      if (imoveisComMatch.has(imovel.id)) continue

      const score = calcularScore(imovel, solicitacao)
      if (score < 70) continue

      const tipo = imovel.corretor_id === solicitacao.corretor_id ? 'interno' : 'externo'

      novosMatches.push({
        imovel_id: imovel.id,
        solicitacao_id: solicitacaoId,
        score,
        tipo,
        status: 'pendente',
        score_detalhado: {},
      })

      if (tipo === 'externo') {
        novasNotificacoes.push({
          corretor_id: imovel.corretor_id,
          tipo: 'match_externo',
          titulo: 'Novo Match!',
          mensagem: `Seu imóvel tem compatibilidade com uma solicitação. Score: ${score}%`,
          imovel_id: imovel.id,
          solicitacao_id: solicitacaoId,
        })
      }
    }

    if (novosMatches.length > 0) {
      await supabase.from('matches').insert(novosMatches)
    }
    if (novasNotificacoes.length > 0) {
      await supabase.from('notificacoes').insert(novasNotificacoes)
    }

    return NextResponse.json({
      matchesGerados: novosMatches.length,
      matches: novosMatches,
    })
  } catch (err) {
    console.error('[matching/solicitacao] erro:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
