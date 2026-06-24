import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient as createUserClient } from '@/lib/supabase/server'
import { verifyAdminToken } from '@/lib/admin-session'
import { slugLocalidade, normalizarUF, limparNome, ufValida } from '@/lib/localidade'

export const dynamic = 'force-dynamic'

function serviceSupabase() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

type Ator = { id: string; tipo: 'admin' | 'corretor' }

// Admin (JWT próprio em cookie) OU corretor (sessão Supabase). Leads não passam.
async function autenticarAtor(): Promise<Ator | null> {
  const cookieStore = await cookies()
  const adminToken = cookieStore.get('admin_token')?.value
  if (adminToken) {
    try {
      const payload = await verifyAdminToken(adminToken)
      if (payload?.id) return { id: payload.id, tipo: 'admin' }
    } catch {
      // token inválido/expirado — cai para a checagem de corretor
    }
  }
  const supabase = await createUserClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) return { id: user.id, tipo: 'corretor' }
  return null
}

// GET — lista cidades ativas (para dropdowns e para atualizar a lista após adicionar)
export async function GET() {
  const ator = await autenticarAtor()
  if (!ator) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const supabase = serviceSupabase()
  const { data, error } = await supabase
    .from('cities')
    .select('id, name, state, active')
    .eq('active', true)
    .order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ cidades: data ?? [] })
}

// POST — adiciona cidade (admin master ou corretor). Bloqueia duplicata por (slug, UF).
export async function POST(req: NextRequest) {
  const ator = await autenticarAtor()
  if (!ator) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  let body: { name?: string; state?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 })
  }

  const name = limparNome(body.name ?? '')
  const state = normalizarUF(body.state ?? '')

  if (!name) return NextResponse.json({ error: 'Informe o nome da cidade.' }, { status: 400 })
  if (!ufValida(state)) {
    return NextResponse.json({ error: 'UF inválida. Use a sigla de 2 letras (ex.: PR, SP).' }, { status: 400 })
  }

  const slug = slugLocalidade(name)
  if (!slug) return NextResponse.json({ error: 'Nome de cidade inválido.' }, { status: 400 })

  const supabase = serviceSupabase()

  // Camada 1 (app): a cidade já existe? Se sim, devolve a existente (UI reaproveita).
  const { data: existente } = await supabase
    .from('cities')
    .select('id, name, state, active')
    .eq('slug', slug)
    .eq('state', state)
    .maybeSingle()

  if (existente) {
    return NextResponse.json({ cidade: existente, created: false }, { status: 200 })
  }

  // Camada 2 (app): insere. Camada 3 (banco): índice único (slug, state) é a rede final
  // contra corrida de concorrência — se dois inserirem ao mesmo tempo, um recebe 23505.
  const { data, error } = await supabase
    .from('cities')
    .insert({ name, state, slug, created_by: ator.id })
    .select('id, name, state, active')
    .single()

  if (error) {
    // 23505 = unique_violation → alguém inseriu no meio do caminho; busca e devolve
    if ((error as { code?: string }).code === '23505') {
      const { data: jaExiste } = await supabase
        .from('cities')
        .select('id, name, state, active')
        .eq('slug', slug)
        .eq('state', state)
        .maybeSingle()
      if (jaExiste) return NextResponse.json({ cidade: jaExiste, created: false }, { status: 200 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ cidade: data, created: true }, { status: 201 })
}
