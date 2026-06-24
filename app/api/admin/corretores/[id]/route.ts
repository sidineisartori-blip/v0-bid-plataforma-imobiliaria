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

// PATCH — editar corretor
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await autenticar()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { full_name, phone, creci, creci_status, plano, is_active, nova_senha } = body

  const supabase = adminSupabase()

  // Atualiza dados na tabela corretores
  const updates: Record<string, unknown> = {}
  if (full_name   !== undefined) updates.full_name   = full_name
  if (phone       !== undefined) updates.phone       = phone || null
  if (creci       !== undefined) updates.creci       = creci || null
  if (creci_status !== undefined) updates.creci_status = creci_status
  if (plano       !== undefined) updates.plano       = plano
  if (is_active   !== undefined) updates.is_active   = is_active

  if (Object.keys(updates).length > 0) {
    const { error } = await supabase.from('corretores').update(updates).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Atualiza senha no Auth se fornecida
  if (nova_senha && nova_senha.length >= 6) {
    const { error } = await supabase.auth.admin.updateUserById(id, { password: nova_senha })
    if (error) return NextResponse.json({ error: `Senha: ${error.message}` }, { status: 500 })
  }

  // Sync plano na assinatura
  if (plano !== undefined) {
    const VALORES: Record<string, number> = { free: 0, pro: 97, premium: 240, enterprise: 720 }
    const { data: assSub } = await supabase
      .from('assinaturas')
      .select('id')
      .eq('corretor_id', id)
      .eq('status', 'ativa')
      .single()

    if (assSub) {
      await supabase.from('assinaturas')
        .update({ plano, valor_mensal: VALORES[plano] || 0 })
        .eq('id', assSub.id)
    }
  }

  await supabase.from('audit_log').insert({
    action: 'corretor_editado',
    entity_type: 'corretor',
    entity_id: id,
    performed_by: session.id,
    details: { campos: Object.keys(updates), editado_por: session.email },
  })

  return NextResponse.json({ ok: true })
}

// DELETE — excluir corretor
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await autenticar()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const supabase = adminSupabase()

  // Soft delete: desativa o corretor
  const { error: corrError } = await supabase
    .from('corretores')
    .update({ is_active: false, plano: 'free' })
    .eq('id', id)

  if (corrError) return NextResponse.json({ error: corrError.message }, { status: 500 })

  // Cancela assinaturas ativas
  await supabase
    .from('assinaturas')
    .update({ status: 'cancelada', cancelado_em: new Date().toISOString() })
    .eq('corretor_id', id)
    .eq('status', 'ativa')

  // Desabilita no Auth
  await supabase.auth.admin.updateUserById(id, { ban_duration: '876600h' })

  await supabase.from('audit_log').insert({
    action: 'corretor_excluido',
    entity_type: 'corretor',
    entity_id: id,
    performed_by: session.id,
    details: { excluido_por: session.email },
  })

  return NextResponse.json({ ok: true })
}
