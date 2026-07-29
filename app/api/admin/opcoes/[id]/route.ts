import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

function adminSupa() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

async function autenticarAdmin() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: corretor } = await supabase
    .from('corretores')
    .select('role')
    .eq('id', user.id)
    .single()
  if (!corretor || !['admin', 'admin_completo'].includes(corretor.role)) return null
  return user
}

// PATCH — toggle ativo
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await autenticarAdmin()
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const { ativo } = await req.json()

  const supabase = adminSupa()
  const { data, error } = await supabase
    .from('bid_opcoes')
    .update({ ativo })
    .eq('id', id)
    .is('corretor_id', null)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE — admin remove opção (não sistema = não tem `sistema: true`)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await autenticarAdmin()
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const supabase = adminSupa()

  // Não permite remover opções marcadas como sistema
  const { data: opcao } = await supabase.from('bid_opcoes').select('sistema').eq('id', id).single()
  if (opcao?.sistema) return NextResponse.json({ error: 'Opção do sistema não pode ser removida' }, { status: 403 })

  const { error } = await supabase.from('bid_opcoes').delete().eq('id', id).is('corretor_id', null)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
