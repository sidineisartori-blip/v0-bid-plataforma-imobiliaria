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

  const [{ data: chamado }, { data: historico }] = await Promise.all([
    supabase
      .from('chamados')
      .select(`
        *,
        contrato:contratos(
          cliente_nome, portal_token, proprietario_nome,
          proprietario_phone, proprietario_email,
          imovel:imoveis(titulo, cidade)
        )
      `)
      .eq('id', id)
      .eq('corretor_id', user.id)
      .single(),
    supabase
      .from('chamado_historico')
      .select('*')
      .eq('chamado_id', id)
      .order('created_at', { ascending: true }),
  ])

  if (!chamado) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  return NextResponse.json({ ...chamado, historico: historico || [] })
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
  const allowed = ['titulo', 'descricao', 'categoria', 'urgencia', 'midia_urls']
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const k of allowed) if (body[k] !== undefined) payload[k] = body[k]

  const { data, error } = await supabase
    .from('chamados')
    .update(payload)
    .eq('id', id)
    .eq('corretor_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
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
    .from('chamados')
    .delete()
    .eq('id', id)
    .eq('corretor_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
