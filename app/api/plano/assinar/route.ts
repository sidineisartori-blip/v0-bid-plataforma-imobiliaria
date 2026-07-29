import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, PreApproval } from 'mercadopago'
import { createClient } from '@/lib/supabase/server'

const PLANOS_MP = {
  pro:         { nome: 'BID Pro',         valor: 97  },
  premium:     { nome: 'BID Premium',     valor: 197 },
  imobiliaria: { nome: 'BID Imobiliária', valor: 497 },
} as const

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { plano } = await req.json()
  const info = PLANOS_MP[plano as keyof typeof PLANOS_MP]
  if (!info) return NextResponse.json({ error: 'Plano inválido' }, { status: 400 })

  const token = process.env.MERCADOPAGO_ACCESS_TOKEN
  if (!token) return NextResponse.json({ error: 'MP não configurado' }, { status: 500 })

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || 'https://v0-bid-plataforma-imobiliaria.vercel.app'

  try {
    const client = new MercadoPagoConfig({ accessToken: token })
    const preApproval = new PreApproval(client)

    const result = await preApproval.create({
      body: {
        reason: info.nome,
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: info.valor,
          currency_id: 'BRL',
        },
        payer_email: user.email!,
        back_url: `${siteUrl}/plano`,
        external_reference: JSON.stringify({ userId: user.id, plano }),
        status: 'pending',
      },
    })

    // Persist or update subscription reference
    const { data: existing } = await supabase
      .from('assinaturas')
      .select('id')
      .eq('corretor_id', user.id)
      .maybeSingle()

    if (existing) {
      await supabase
        .from('assinaturas')
        .update({
          plano,
          status: 'pendente',
          valor: info.valor,
          mp_subscription_id: result.id,
          mp_status: result.status,
          mp_checkout_url: result.init_point,
        })
        .eq('id', existing.id)
    } else {
      await supabase.from('assinaturas').insert({
        corretor_id: user.id,
        plano,
        status: 'pendente',
        valor: info.valor,
        mp_subscription_id: result.id,
        mp_status: result.status,
        mp_checkout_url: result.init_point,
      })
    }

    return NextResponse.json({ checkout_url: result.init_point })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro MP'
    console.error('[MP assinar]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
