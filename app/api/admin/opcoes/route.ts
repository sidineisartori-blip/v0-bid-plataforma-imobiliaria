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

// GET — lista todas opções do sistema (todas categorias)
export async function GET() {
  const admin = await autenticarAdmin()
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const supabase = adminSupa()
  const { data, error } = await supabase
    .from('bid_opcoes')
    .select('id, categoria, valor, label, ativo, ordem, sistema, corretor_id')
    .is('corretor_id', null)
    .order('categoria')
    .order('ordem')
    .order('label')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

// POST — admin cria nova opção de sistema
export async function POST(req: NextRequest) {
  const admin = await autenticarAdmin()
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { categoria, label } = await req.json()
  if (!categoria?.trim() || !label?.trim()) {
    return NextResponse.json({ error: 'Categoria e label obrigatórios' }, { status: 400 })
  }

  const supabase = adminSupa()
  const { data, error } = await supabase
    .from('bid_opcoes')
    .insert({ categoria: categoria.trim(), valor: label.trim(), label: label.trim(), sistema: false })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Opção já existe' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}
