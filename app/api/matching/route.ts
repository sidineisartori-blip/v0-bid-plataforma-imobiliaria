import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { calcularScore } from '@/lib/utils'

export const dynamic = 'force-dynamic'

// POST /api/matching — cria match único por intenção explícita do corretor
// Body: { imovelId, solicitacaoId }
export async function POST(request: NextRequest) {
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const { imovelId, solicitacaoId } = await request.json()

    if (!imovelId || !solicitacaoId) {
      return NextResponse.json({ error: 'imovelId e solicitacaoId obrigatorios' }, { status: 400 })
    }

    const [{ data: imovel }, { data: sol }] = await Promise.all([
      supabase.from('imoveis').select('*').eq('id', imovelId).single(),
      supabase.from('solicitacoes').select('*').eq('id', solicitacaoId).single(),
    ])

    if (!imovel) return NextResponse.json({ error: 'Imóvel não encontrado' }, { status: 404 })
    if (!sol) return NextResponse.json({ error: 'Solicitação não encontrada' }, { status: 404 })

    // Verifica se match já existe
    const { data: existente } = await supabase
      .from('matches')
      .select('id')
      .eq('imovel_id', imovelId)
      .eq('solicitacao_id', solicitacaoId)
      .maybeSingle()

    if (existente) {
      return NextResponse.json({ ok: true, jaExistia: true, matchId: existente.id })
    }

    const score = calcularScore(imovel, sol)
    const tipo = imovel.corretor_id === sol.corretor_id ? 'interno' : 'externo'

    const { data: novoMatch, error: matchErr } = await supabase
      .from('matches')
      .insert({ imovel_id: imovelId, solicitacao_id: solicitacaoId, score, tipo, status: 'pendente', score_detalhado: {} })
      .select('id')
      .single()

    if (matchErr || !novoMatch) {
      return NextResponse.json({ error: matchErr?.message || 'Erro ao criar match' }, { status: 500 })
    }

    // Notifica o outro corretor se parceria externa
    if (tipo === 'externo') {
      await supabase.from('notificacoes').insert({
        corretor_id: sol.corretor_id,
        tipo: 'match_externo',
        titulo: 'Proposta de parceria recebida!',
        mensagem: `Um corretor tem um imóvel compatível com sua solicitação. Score: ${score}%`,
        imovel_id: imovelId,
        solicitacao_id: solicitacaoId,
        metadata: { score, matchId: novoMatch.id },
      })
    }

    // Atualiza match_count do imóvel
    const { count } = await supabase
      .from('matches')
      .select('id', { count: 'exact', head: true })
      .eq('imovel_id', imovelId)

    await supabase.from('imoveis').update({ match_count: count ?? 0 }).eq('id', imovelId)

    return NextResponse.json({ ok: true, matchId: novoMatch.id, score, tipo })
  } catch (err) {
    console.error('[matching] erro:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
