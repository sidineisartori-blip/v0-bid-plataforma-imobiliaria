import { NextResponse } from 'next/server'
import { MercadoPagoConfig, PreApproval } from 'mercadopago'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { data: assinatura } = await supabase
    .from('assinaturas')
    .select('id, mp_subscription_id')
    .eq('corretor_id', user.id)
    .maybeSingle()

  if (!assinatura?.mp_subscription_id) {
    return NextResponse.json({ error: 'Nenhuma assinatura ativa com MP' }, { status: 400 })
  }

  const token = process.env.MERCADOPAGO_ACCESS_TOKEN
  if (!token) return NextResponse.json({ error: 'MP não configurado' }, { status: 500 })

  try {
    const client = new MercadoPagoConfig({ accessToken: token })
    const preApproval = new PreApproval(client)

    await preApproval.update({
      id: assinatura.mp_subscription_id,
      body: { status: 'cancelled' },
    })

    await supabase
      .from('assinaturas')
      .update({ status: 'cancelada', mp_status: 'cancelled' })
      .eq('id', assinatura.id)

    // Revert corretor to free plan
    await supabase
      .from('corretores')
      .update({ plano: 'free' })
      .eq('id', user.id)

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro MP'
    console.error('[MP cancelar]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
