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

// GET — listar pagamentos com filtros
export async function GET(req: NextRequest) {
  const session = await autenticar()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const mes = searchParams.get('mes')           // 'YYYY-MM'
  const status = searchParams.get('status')      // pendente|pago|atrasado|isento
  const corretorId = searchParams.get('corretor_id')

  const supabase = adminSupabase()
  let query = supabase
    .from('pagamentos')
    .select('*, corretor:corretores(full_name, email, phone, plano)')
    .order('data_vencimento', { ascending: false })

  if (mes) query = query.eq('mes_referencia', mes)
  if (status) query = query.eq('status', status)
  if (corretorId) query = query.eq('corretor_id', corretorId)

  const { data, error } = await query.limit(200)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ pagamentos: data })
}

// POST — criar/gerar cobranças do mês para todos os assinantes pagos
export async function POST(req: NextRequest) {
  const session = await autenticar()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const { mes_referencia, dia_vencimento = 10 } = body

  // Valida formato YYYY-MM
  if (!mes_referencia || !/^\d{4}-\d{2}$/.test(mes_referencia)) {
    return NextResponse.json({ error: 'mes_referencia deve ser no formato YYYY-MM.' }, { status: 400 })
  }

  const [ano, mes] = mes_referencia.split('-').map(Number)
  const dataVencimento = new Date(ano, mes - 1, dia_vencimento)
  const vencimentoStr = dataVencimento.toISOString().split('T')[0]

  const supabase = adminSupabase()

  // Busca todos os corretores ativos com plano pago
  const { data: planos } = await supabase.from('planos').select('id, nome, valor').gt('valor', 0)
  const planosMap = Object.fromEntries((planos || []).map(p => [p.id, p]))

  const { data: corretores } = await supabase
    .from('corretores')
    .select('id, full_name, email, plano, is_active')
    .eq('is_active', true)
    .neq('plano', 'free')

  if (!corretores || corretores.length === 0) {
    return NextResponse.json({ gerados: 0, msg: 'Nenhum assinante pago ativo encontrado.' })
  }

  // Monta registros para inserção (ignora se já existir por causa do UNIQUE)
  const registros = corretores.map(c => ({
    corretor_id: c.id,
    plano: c.plano,
    valor: planosMap[c.plano]?.valor ?? 0,
    mes_referencia,
    data_vencimento: vencimentoStr,
    status: 'pendente',
    registrado_por: session.email,
  }))

  const { data: inseridos, error } = await supabase
    .from('pagamentos')
    .upsert(registros, { onConflict: 'corretor_id,mes_referencia', ignoreDuplicates: true })
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('audit_log').insert({
    action: 'cobrancas_geradas',
    entity_type: 'pagamentos',
    entity_id: mes_referencia,
    performed_by: session.id,
    details: { total: corretores.length, mes_referencia, vencimento: vencimentoStr },
  })

  return NextResponse.json({ gerados: inseridos?.length ?? 0, mes_referencia, vencimento: vencimentoStr })
}
