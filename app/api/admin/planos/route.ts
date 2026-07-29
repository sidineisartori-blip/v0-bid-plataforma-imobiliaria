import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAdminToken } from '@/lib/admin-session'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function adminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

async function autenticar() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  if (!token) return null
  try { return await verifyAdminToken(token) } catch { return null }
}

// GET — listar planos
export async function GET() {
  const session = await autenticar()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const supabase = adminSupabase()
  const { data, error } = await supabase.from('planos').select('*').order('ordem')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ planos: data })
}

// POST — criar plano
export async function POST(req: NextRequest) {
  const session = await autenticar()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const { id, nome, valor, cor, limite_imoveis, limite_solicitacoes, ordem } = body

  if (!id || !nome) {
    return NextResponse.json({ error: 'ID e nome são obrigatórios.' }, { status: 400 })
  }
  if (!/^[a-z0-9_-]+$/.test(id)) {
    return NextResponse.json({ error: 'ID deve conter apenas letras minúsculas, números, - ou _.' }, { status: 400 })
  }

  const supabase = adminSupabase()
  const { data, error } = await supabase
    .from('planos')
    .insert({
      id,
      nome,
      valor: Number(valor) || 0,
      cor: cor || '#9B9690',
      limite_imoveis: Number(limite_imoveis ?? 5),
      limite_solicitacoes: Number(limite_solicitacoes ?? 10),
      ordem: Number(ordem ?? 0),
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Já existe um plano com esse ID.' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await supabase.from('audit_log').insert({ action: 'plano_criado', entity_type: 'plano', entity_id: id, performed_by: session.id, details: body })

  return NextResponse.json({ plano: data }, { status: 201 })
}
