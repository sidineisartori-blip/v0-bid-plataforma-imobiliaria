import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const [{ data: vistoria }, { data: itens }] = await Promise.all([
    supabase
      .from('vistorias')
      .select(`
        *,
        contrato:contratos(
          cliente_nome,
          imovel:imoveis(titulo, cidade)
        )
      `)
      .eq('id', id)
      .eq('corretor_id', user.id)
      .single(),
    supabase
      .from('vistoria_itens')
      .select('*')
      .eq('vistoria_id', id)
      .order('ambiente')
      .order('item'),
  ])

  if (!vistoria) return NextResponse.json({ error: 'Não encontrada' }, { status: 404 })
  return NextResponse.json({ ...vistoria, itens: itens || [] })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const allowed = ['status', 'data_vistoria', 'observacoes_gerais', 'assinado_por_corretor_em']
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const k of allowed) if (body[k] !== undefined) payload[k] = body[k]

  const { data, error } = await supabase
    .from('vistorias')
    .update(payload)
    .eq('id', id)
    .eq('corretor_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Não encontrada' }, { status: 404 })
  return NextResponse.json(data)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { error } = await supabase
    .from('vistorias')
    .delete()
    .eq('id', id)
    .eq('corretor_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
