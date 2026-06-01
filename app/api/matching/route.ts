import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { calcularScore } from '@/lib/utils'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { imovelId, corretorId } = await request.json()

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

    const { data: solicitacoes } = await supabase
      .from('solicitacoes')
      .select('*')
      .eq('cidade', imovel.cidade)
      .eq('status', 'ativa')

    const matchesGerados = []

    for (const sol of solicitacoes || []) {
      const score = calcularScore(imovel, sol)
      if (score < 70) continue

      const { data: existing } = await supabase
        .from('matches')
        .select('id')
        .eq('imovel_id', imovelId)
        .eq('solicitacao_id', sol.id)
        .maybeSingle()

      if (existing) continue

      const tipo = imovel.corretor_id === sol.corretor_id ? 'interno' : 'externo'

      const { data: novoMatch } = await supabase
        .from('matches')
        .insert({
          imovel_id: imovelId,
          solicitacao_id: sol.id,
          score,
          tipo,
          status: 'pendente',
          score_detalhado: {},
        })
        .select()
        .single()

      if (novoMatch) {
        matchesGerados.push(novoMatch)

        if (tipo === 'externo') {
          await supabase.from('notificacoes').insert({
            corretor_id: sol.corretor_id,
            tipo: 'match_externo',
            titulo: 'Novo Match!',
            mensagem: `Seu imovel tem compatibilidade com uma solicitacao. Score: ${score}%`,
            imovel_id: imovelId,
            solicitacao_id: sol.id,
          })
        }
      }
    }

    await supabase
      .from('imoveis')
      .update({ match_count: matchesGerados.length })
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
