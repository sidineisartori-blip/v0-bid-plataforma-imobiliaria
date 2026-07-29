import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient as createUserClient } from '@/lib/supabase/server'
import { verifyAdminToken } from '@/lib/admin-session'
import { slugLocalidade, limparNome } from '@/lib/localidade'

export const dynamic = 'force-dynamic'

function serviceSupabase() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

type Ator = { id: string; tipo: 'admin' | 'corretor' }

async function autenticarAtor(): Promise<Ator | null> {
  const cookieStore = await cookies()
  const adminToken = cookieStore.get('admin_token')?.value
  if (adminToken) {
    try {
      const payload = await verifyAdminToken(adminToken)
      if (payload?.id) return { id: payload.id, tipo: 'admin' }
    } catch {
      // token inválido — tenta corretor
    }
  }
  const supabase = await createUserClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) return { id: user.id, tipo: 'corretor' }
  return null
}

// GET /api/localidades/bairros?city_id=... — lista bairros ativos de uma cidade
export async function GET(req: NextRequest) {
  const ator = await autenticarAtor()
  if (!ator) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const cityId = req.nextUrl.searchParams.get('city_id')
  if (!cityId) return NextResponse.json({ error: 'city_id é obrigatório.' }, { status: 400 })

  const supabase = serviceSupabase()
  const { data, error } = await supabase
    .from('neighborhoods')
    .select('id, city_id, name, active')
    .eq('city_id', cityId)
    .eq('active', true)
    .order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ bairros: data ?? [] })
}

// POST — adiciona bairro a uma cidade (admin ou corretor). Dedup por (city_id, slug).
export async function POST(req: NextRequest) {
  const ator = await autenticarAtor()
  if (!ator) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  let body: { city_id?: string; name?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 })
  }

  const cityId = (body.city_id ?? '').trim()
  const name = limparNome(body.name ?? '')

  if (!cityId) return NextResponse.json({ error: 'Selecione a cidade do bairro.' }, { status: 400 })
  if (!name) return NextResponse.json({ error: 'Informe o nome do bairro.' }, { status: 400 })

  const slug = slugLocalidade(name)
  if (!slug) return NextResponse.json({ error: 'Nome de bairro inválido.' }, { status: 400 })

  const supabase = serviceSupabase()

  // Cidade existe?
  const { data: cidade } = await supabase
    .from('cities')
    .select('id')
    .eq('id', cityId)
    .maybeSingle()
  if (!cidade) return NextResponse.json({ error: 'Cidade não encontrada.' }, { status: 404 })

  // Já existe esse bairro na cidade?
  const { data: existente } = await supabase
    .from('neighborhoods')
    .select('id, city_id, name, active')
    .eq('city_id', cityId)
    .eq('slug', slug)
    .maybeSingle()
  if (existente) return NextResponse.json({ bairro: existente, created: false }, { status: 200 })

  const { data, error } = await supabase
    .from('neighborhoods')
    .insert({ city_id: cityId, name, slug, created_by: ator.id })
    .select('id, city_id, name, active')
    .single()

  if (error) {
    if ((error as { code?: string }).code === '23505') {
      const { data: jaExiste } = await supabase
        .from('neighborhoods')
        .select('id, city_id, name, active')
        .eq('city_id', cityId)
        .eq('slug', slug)
        .maybeSingle()
      if (jaExiste) return NextResponse.json({ bairro: jaExiste, created: false }, { status: 200 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ bairro: data, created: true }, { status: 201 })
}
