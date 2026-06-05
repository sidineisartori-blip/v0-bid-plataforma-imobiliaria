import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { calcularScore } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  // Cliente Auth para verificar usuário autenticado
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  // Cliente Service Role para operações privilegiadas
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const { imovelId, corretorId } = await request.json()

    // Valida que o corretorId pertence ao usuário autenticado
    if (corretorId && corretorId !== user.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    if (!imovelId) {
      return NextResponse.json({ error: 'imovelId obrigatorio' }, { status: 400 })
    }

    const { data: imovel, error: imovelErr } = await supabase
      .from('imoveis')
      .select('*')
      .eq('id', imovelId)
      .single()

    if (imovelErr || !imovel) {
      return NextResponse.json({ error: 'Imovel nao encontrado' }, { status: 404 })
    }

    // Busca solicitacoes compativeis e matches existentes em paralelo
    const [{ data: solicitacoes }, { data: matchesExistentes }] = await Promise.all([
      supabase
        .from('solicitacoes')
        .select('*')
        .eq('cidade', imovel.cidade)
        .eq('status', 'ativa'),
      supabase
        .from('matches')
        .select('solicitacao_id')
        .eq('imovel_id', imovelId),
    ])

    // Set para verificacao O(1) de matches existentes
    const solicitacoesComMatch = new Set(
      matchesExistentes?.map((m) => m.solicitacao_id) || []
    )

    // Prepara batches para insert
    const matchesParaInserir: {
      imovel_id: string
      solicitacao_id: string
      score: number
      tipo: string
      status: string
      score_detalhado: Record<string, unknown>
    }[] = []
    
    const notificacoesParaInserir: {
      corretor_id: string
      tipo: string
      titulo: string
      mensagem: string
      imovel_id: string
      solicitacao_id: string
    }[] = []

    for (const sol of solicitacoes || []) {
      // Pula se ja existe match
      if (solicitacoesComMatch.has(sol.id)) continue

      const score = calcularScore(imovel, sol)
      if (score < 70) continue

      const tipo = imovel.corretor_id === sol.corretor_id ? 'interno' : 'externo'

      matchesParaInserir.push({
        imovel_id: imovelId,
        solicitacao_id: sol.id,
        score,
        tipo,
        status: 'pendente',
        score_detalhado: {},
      })

      if (tipo === 'externo') {
        notificacoesParaInserir.push({
          corretor_id: sol.corretor_id,
          tipo: 'match_externo',
          titulo: 'Novo Match!',
          mensagem: `Seu imovel tem compatibilidade com uma solicitacao. Score: ${score}%`,
          imovel_id: imovelId,
          solicitacao_id: sol.id,
        })
      }
    }

    // Insere matches e notificacoes em batch
    let matchesGerados: typeof matchesParaInserir = []
    
    if (matchesParaInserir.length > 0) {
      const { data: novosMatches } = await supabase
        .from('matches')
        .insert(matchesParaInserir)
        .select()

      matchesGerados = novosMatches || []

      if (notificacoesParaInserir.length > 0) {
        await supabase.from('notificacoes').insert(notificacoesParaInserir)
      }
    }

    // Atualiza contador de matches do imovel
    await supabase
      .from('imoveis')
      .update({ match_count: (matchesExistentes?.length || 0) + matchesGerados.length })
      .eq('id', imovelId)

    return NextResponse.json({
      matchesGerados: matchesGerados.length,
      matches: matchesGerados,
    })
  } catch (err) {
    console.error('[matching] erro:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
