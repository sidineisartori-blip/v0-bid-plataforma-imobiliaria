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

// POST — criar corretor
export async function POST(req: NextRequest) {
  const session = await autenticar()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { full_name, email, phone, creci, plano, senha } = await req.json()

  if (!full_name || !email || !senha) {
    return NextResponse.json({ error: 'Nome, e-mail e senha são obrigatórios' }, { status: 400 })
  }

  const supabase = adminSupabase()

  // Cria usuário no Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: email.toLowerCase().trim(),
    password: senha,
    email_confirm: true,
    user_metadata: { full_name },
  })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  const userId = authData.user.id

  // Insere na tabela corretores (trigger pode já ter criado, então upsert)
  const { error: corrError } = await supabase.from('corretores').upsert({
    id: userId,
    full_name,
    email: email.toLowerCase().trim(),
    phone: phone || null,
    creci: creci || null,
    creci_status: creci ? 'pendente' : 'pendente',
    plano: plano || 'free',
    is_active: true,
    role: 'corretor',
    slug: userId,
  }, { onConflict: 'id' })

  if (corrError) {
    // Rollback: remove auth user
    await supabase.auth.admin.deleteUser(userId)
    return NextResponse.json({ error: corrError.message }, { status: 500 })
  }

  // Audit log
  await supabase.from('audit_log').insert({
    action: 'corretor_criado',
    entity_type: 'corretor',
    entity_id: userId,
    performed_by: session.id,
    details: { full_name, email, plano: plano || 'free', criado_por: session.email },
  })

  return NextResponse.json({ ok: true, id: userId })
}
