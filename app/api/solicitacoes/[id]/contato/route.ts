import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: solicitacaoId } = await params

  // IDOR: garante que a solicitação pertence ao corretor
  const { data: sol, error: solError } = await supabase
    .from('solicitacoes')
    .select('id')
    .eq('id', solicitacaoId)
    .eq('corretor_id', user.id)
    .single()

  if (solError || !sol) {
    return NextResponse.json({ error: 'Solicitação não encontrada' }, { status: 404 })
  }

  const body = await req.json().catch(() => ({}))
  const canal: string | null = body.canal ?? null
  const detalhe: string | null = body.detalhe ?? null

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const agora = new Date().toISOString()

  const [eventoResult] = await Promise.all([
    admin.from('solicitacao_eventos').insert({
      solicitacao_id: solicitacaoId,
      corretor_id: user.id,
      tipo: 'contato',
      canal,
      sucesso: null,
      imovel_id: null,
      detalhe,
      metadata: {},
    }).select('id').single(),
    admin.from('solicitacoes').update({ ultimo_contato_em: agora }).eq('id', solicitacaoId),
  ])

  if (eventoResult.error) {
    return NextResponse.json({ error: eventoResult.error.message }, { status: 500 })
  }

  return NextResponse.json({ id: eventoResult.data?.id })
}
