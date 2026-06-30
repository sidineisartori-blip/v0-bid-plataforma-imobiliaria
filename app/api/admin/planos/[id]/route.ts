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

// PATCH — editar plano
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await autenticar()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { nome, valor, cor, limite_imoveis, limite_solicitacoes, ordem, ativo } = body

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (nome !== undefined) updates.nome = nome
  if (valor !== undefined) updates.valor = Number(valor) || 0
  if (cor !== undefined) updates.cor = cor
  if (limite_imoveis !== undefined) updates.limite_imoveis = Number(limite_imoveis)
  if (limite_solicitacoes !== undefined) updates.limite_solicitacoes = Number(limite_solicitacoes)
  if (ordem !== undefined) updates.ordem = Number(ordem)
  if (ativo !== undefined) updates.ativo = !!ativo

  const supabase = adminSupabase()
  const { data, error } = await supabase.from('planos').update(updates).eq('id', id).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Plano não encontrado.' }, { status: 404 })

  await supabase.from('audit_log').insert({ action: 'plano_editado', entity_type: 'plano', entity_id: id, performed_by: session.id, details: updates })

  return NextResponse.json({ plano: data })
}

// DELETE — excluir plano
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await autenticar()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params

  if (id === 'free') {
    return NextResponse.json({ error: 'O plano Free não pode ser excluído — é o plano padrão.' }, { status: 400 })
  }

  const supabase = adminSupabase()

  const { count } = await supabase
    .from('corretores')
    .select('id', { count: 'exact', head: true })
    .eq('plano', id)

  if (count && count > 0) {
    return NextResponse.json(
      { error: `Não é possível excluir: ${count} corretor(es) usam este plano. Altere o plano deles primeiro.` },
      { status: 409 }
    )
  }

  const { error } = await supabase.from('planos').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('audit_log').insert({ action: 'plano_excluido', entity_type: 'plano', entity_id: id, performed_by: session.id, details: {} })

  return NextResponse.json({ ok: true })
}
