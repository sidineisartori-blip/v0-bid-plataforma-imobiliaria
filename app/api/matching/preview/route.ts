import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { calcularScore } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { searchParams } = new URL(req.url)
  const imovelId = searchParams.get('imovelId')
  const solicitacaoId = searchParams.get('solicitacaoId')

  if (!imovelId && !solicitacaoId) {
    return NextResponse.json({ error: 'imovelId ou solicitacaoId obrigatorio' }, { status: 400 })
  }

  try {
    if (imovelId) {
      const { data: imovel } = await supabase.from('imoveis').select('*').eq('id', imovelId).single()
      if (!imovel) return NextResponse.json({ error: 'Imóvel não encontrado' }, { status: 404 })

      const [{ data: solicitacoes }, { data: matchesExistentes }] = await Promise.all([
        supabase.from('solicitacoes').select('*, corretor:corretores(nome)').eq('cidade', imovel.cidade).eq('status', 'ativa'),
        supabase.from('matches').select('solicitacao_id').eq('imovel_id', imovelId),
      ])

      const comMatch = new Set(matchesExistentes?.map((m) => m.solicitacao_id) || [])

      const compativeis = (solicitacoes || [])
        .map((sol) => ({ ...sol, score: calcularScore(imovel, sol), jaTemMatch: comMatch.has(sol.id) }))
        .filter((sol) => sol.score >= 70)
        .sort((a, b) => b.score - a.score)
        .slice(0, 20)

      return NextResponse.json({ tipo: 'imovel', compativeis })
    }

    // solicitacaoId
    const { data: sol } = await supabase.from('solicitacoes').select('*').eq('id', solicitacaoId!).single()
    if (!sol) return NextResponse.json({ error: 'Solicitação não encontrada' }, { status: 404 })

    const [{ data: imoveis }, { data: matchesExistentes }] = await Promise.all([
      supabase.from('imoveis').select('*, corretor:corretores(nome)').eq('cidade', sol.cidade).eq('status', 'disponivel').eq('matching_ativo', true),
      supabase.from('matches').select('imovel_id').eq('solicitacao_id', solicitacaoId!),
    ])

    const comMatch = new Set(matchesExistentes?.map((m) => m.imovel_id) || [])

    const compativeis = (imoveis || [])
      .map((im) => ({ ...im, score: calcularScore(im, sol), jaTemMatch: comMatch.has(im.id) }))
      .filter((im) => im.score >= 70)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)

    return NextResponse.json({ tipo: 'solicitacao', compativeis })
  } catch (err) {
    console.error('[matching/preview] erro:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
