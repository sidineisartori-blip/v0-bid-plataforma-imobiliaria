import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// DELETE — corretor remove sua própria opção personalizada (não remove sistema)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ categoria: string; id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  // Verificar que pertence ao corretor e não é sistema
  const { data: opcao } = await supabase
    .from('bid_opcoes')
    .select('id, sistema, corretor_id')
    .eq('id', id)
    .single()

  if (!opcao) return NextResponse.json({ error: 'Opção não encontrada' }, { status: 404 })
  if (opcao.sistema) return NextResponse.json({ error: 'Opção do sistema não pode ser removida' }, { status: 403 })
  if (opcao.corretor_id !== user.id) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { error } = await supabase.from('bid_opcoes').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
