import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// Esta rota cria o primeiro admin user — usa service_role para ignorar RLS
export async function POST(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  const { email, password, full_name, setup_key } = await request.json()

  // Chave de setup para proteger esta rota
  const SETUP_KEY = process.env.ADMIN_SETUP_KEY || 'BID_SETUP_2024'
  
  if (setup_key !== SETUP_KEY) {
    return NextResponse.json({ error: 'Chave de setup invalida' }, { status: 403 })
  }

  // Verifica se ja existe um admin
  const { count } = await supabase
    .from('admin_users')
    .select('*', { count: 'exact', head: true })

  if (count && count > 0) {
    return NextResponse.json({ error: 'Ja existe um admin cadastrado. Use o painel para adicionar mais.' }, { status: 400 })
  }

  // Cria o admin user
  const { data, error } = await supabase
    .from('admin_users')
    .insert({
      email: email.toLowerCase().trim(),
      password_hash: password, // Em producao, fazer hash com bcrypt
      full_name,
      role: 'master',
      is_active: true,
      permissions: {
        corretores: true,
        planos: true,
        financeiro: true,
        denuncias: true,
        configuracoes: true,
      },
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ 
    success: true, 
    message: 'Admin master criado com sucesso!',
    admin: { id: data.id, email: data.email, full_name: data.full_name }
  })
}
