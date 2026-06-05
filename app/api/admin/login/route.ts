import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { createAdminToken } from '@/lib/admin-session'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { email, senha } = await request.json()

    if (!email || !senha) {
      return NextResponse.json({ error: 'Email e senha sao obrigatorios.' }, { status: 400 })
    }

    // Usa service_role para ignorar RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: adminUser, error } = await supabase
      .from('admin_users')
      .select('id, email, password_hash, role, is_active, full_name')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (error || !adminUser) {
      return NextResponse.json({ error: 'Credenciais invalidas.' }, { status: 401 })
    }

    if (!adminUser.is_active) {
      return NextResponse.json({ error: 'Esta conta foi desativada.' }, { status: 401 })
    }

    // Compara a senha com o hash armazenado usando bcrypt
    const senhaValida = await bcrypt.compare(senha, adminUser.password_hash)
    if (!senhaValida) {
      return NextResponse.json({ error: 'Credenciais invalidas.' }, { status: 401 })
    }

    // Atualiza ultimo login
    await supabase
      .from('admin_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', adminUser.id)

    // Gera token JWT e retorna como cookie httpOnly
    const token = await createAdminToken({
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
      full_name: adminUser.full_name,
    })

    const response = NextResponse.json({ ok: true })
    response.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8, // 8 horas
      path: '/',
    })

    return response
  } catch {
    return NextResponse.json({ error: 'Erro interno. Tente novamente.' }, { status: 500 })
  }
}
