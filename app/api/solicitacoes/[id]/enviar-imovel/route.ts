import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const solicitacaoId = params.id

  // IDOR: garante que a solicitação pertence ao corretor
  const { data: sol, error: solError } = await supabase
    .from('solicitacoes')
    .select('id, qtd_imoveis_enviados')
    .eq('id', solicitacaoId)
    .eq('corretor_id', user.id)
    .single()

  if (solError || !sol) {
    return NextResponse.json({ error: 'Solicitação não encontrada' }, { status: 404 })
  }

  const body = await req.json().catch(() => ({}))
  const imovelId: string | undefined = body.imovel_id
  const canal: string | null = body.canal ?? null

  if (!imovelId) {
    return NextResponse.json({ error: 'imovel_id é obrigatório' }, { status: 400 })
  }

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const qtdAtual: number = sol.qtd_imoveis_enviados ?? 0

  const [eventoResult] = await Promise.all([
    admin.from('solicitacao_eventos').insert({
      solicitacao_id: solicitacaoId,
      corretor_id: user.id,
      tipo: 'imovel_enviado',
      canal,
      sucesso: null,
      imovel_id: imovelId,
      detalhe: null,
      metadata: {},
    }).select('id').single(),
    admin
      .from('solicitacoes')
      .update({ qtd_imoveis_enviados: qtdAtual + 1 })
      .eq('id', solicitacaoId),
  ])

  if (eventoResult.error) {
    return NextResponse.json({ error: eventoResult.error.message }, { status: 500 })
  }

  return NextResponse.json({ id: eventoResult.data?.id, qtd_imoveis_enviados: qtdAtual + 1 })
}
