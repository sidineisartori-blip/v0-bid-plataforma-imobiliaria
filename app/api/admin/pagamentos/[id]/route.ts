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

// PATCH — confirmar pagamento ou alterar status
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await autenticar()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { status, data_pagamento, forma_pagamento, comprovante_url, observacao } = body

  const STATUSES = ['pendente', 'pago', 'atrasado', 'isento']
  if (status && !STATUSES.includes(status)) {
    return NextResponse.json({ error: `Status inválido. Use: ${STATUSES.join(', ')}.` }, { status: 400 })
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString(), registrado_por: session.email }
  if (status) updates.status = status
  if (data_pagamento !== undefined) updates.data_pagamento = data_pagamento || null
  if (forma_pagamento !== undefined) updates.forma_pagamento = forma_pagamento || null
  if (comprovante_url !== undefined) updates.comprovante_url = comprovante_url || null
  if (observacao !== undefined) updates.observacao = observacao || null

  const supabase = adminSupabase()
  const { data, error } = await supabase
    .from('pagamentos')
    .update(updates)
    .eq('id', id)
    .select('*, corretor:corretores(id, full_name, plano)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Pagamento não encontrado.' }, { status: 404 })

  // Atualiza status_financeiro do corretor com base no novo status do pagamento
  if (status === 'pago' || status === 'isento') {
    // Verifica se há outros pagamentos em atraso antes de reativar
    const { count: atrasados } = await supabase
      .from('pagamentos')
      .select('id', { count: 'exact', head: true })
      .eq('corretor_id', data.corretor.id)
      .eq('status', 'atrasado')
      .neq('id', id)

    if (!atrasados || atrasados === 0) {
      await supabase
        .from('corretores')
        .update({ status_financeiro: 'normal' })
        .eq('id', data.corretor.id)
    }
  } else if (status === 'atrasado') {
    await supabase
      .from('corretores')
      .update({ status_financeiro: 'inadimplente' })
      .eq('id', data.corretor.id)
  }

  await supabase.from('audit_log').insert({
    action: 'pagamento_atualizado',
    entity_type: 'pagamento',
    entity_id: id,
    performed_by: session.id,
    details: { status, corretor_id: data.corretor?.id },
  })

  return NextResponse.json({ pagamento: data })
}
