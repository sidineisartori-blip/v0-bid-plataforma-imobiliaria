import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const COLUNAS_VALIDAS = [
  'novo',
  'em_contato',
  'imovel_enviado',
  'visita_agendada',
  'proposta',
  'fechado',
] as const

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { id } = await params
  const { kanban_coluna } = await req.json()

  if (!COLUNAS_VALIDAS.includes(kanban_coluna)) {
    return NextResponse.json({ error: 'Coluna inválida' }, { status: 400 })
  }

  // IDOR: verificar que a solicitação pertence ao corretor
  const { data: sol } = await supabase
    .from('solicitacoes')
    .select('id')
    .eq('id', id)
    .eq('corretor_id', user.id)
    .single()

  if (!sol) return NextResponse.json({ error: 'Solicitação não encontrada' }, { status: 404 })

  const { error } = await supabase
    .from('solicitacoes')
    .update({ kanban_coluna, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
