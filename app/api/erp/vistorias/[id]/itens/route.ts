import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  // Verify vistoria ownership
  const { data: vistoria } = await supabase
    .from('vistorias')
    .select('id')
    .eq('id', id)
    .eq('corretor_id', user.id)
    .single()

  if (!vistoria) return NextResponse.json({ error: 'Não autorizado' }, { status: 404 })

  const { data, error } = await supabase
    .from('vistoria_itens')
    .select('*')
    .eq('vistoria_id', id)
    .order('ambiente')
    .order('item')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// PATCH: atualiza múltiplos itens em batch
// Body: { itens: [{ id, estado, observacao, foto_urls }] }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  // Verify ownership
  const { data: vistoria } = await supabase
    .from('vistorias')
    .select('id')
    .eq('id', id)
    .eq('corretor_id', user.id)
    .single()

  if (!vistoria) return NextResponse.json({ error: 'Não autorizado' }, { status: 404 })

  const { itens } = await req.json()
  if (!Array.isArray(itens) || itens.length === 0) {
    return NextResponse.json({ error: 'itens deve ser um array não vazio' }, { status: 400 })
  }

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const updates = itens.map((item: { id: string; estado?: string; observacao?: string; foto_urls?: string[] }) =>
    admin
      .from('vistoria_itens')
      .update({
        ...(item.estado !== undefined && { estado: item.estado }),
        ...(item.observacao !== undefined && { observacao: item.observacao }),
        ...(item.foto_urls !== undefined && { foto_urls: item.foto_urls }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', item.id)
      .eq('vistoria_id', id)
  )

  await Promise.all(updates)
  return NextResponse.json({ ok: true })
}
