import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const solicitacaoId = params.id

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

  const { data: eventos, error } = await supabase
    .from('solicitacao_eventos')
    .select('*')
    .eq('solicitacao_id', solicitacaoId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(eventos ?? [])
}
