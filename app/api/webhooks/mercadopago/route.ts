import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, PreApproval } from 'mercadopago'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}

function verificarAssinatura(req: NextRequest, rawBody: string): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET
  if (!secret) return true // skip se não configurado

  const xSignature = req.headers.get('x-signature') || ''
  const xRequestId = req.headers.get('x-request-id') || ''

  const parts = Object.fromEntries(
    xSignature.split(',').map((part) => {
      const [k, v] = part.split('=')
      return [k.trim(), v?.trim()]
    }),
  )
  const ts = parts['ts']
  const v1 = parts['v1']
  if (!ts || !v1) return false

  // Extract the notification data id from the raw body for signing
  let dataId = ''
  try {
    const body = JSON.parse(rawBody)
    dataId = body?.data?.id || ''
  } catch { return false }

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts}`
  const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex')
  return v1 === expected
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()

  if (!verificarAssinatura(req, rawBody)) {
    return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 })
  }

  let payload: { type?: string; data?: { id?: string } }
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  // Only process subscription events
  if (payload.type !== 'subscription_preapproval') {
    return NextResponse.json({ ok: true })
  }

  const subscriptionId = payload.data?.id
  if (!subscriptionId) return NextResponse.json({ ok: true })

  const token = process.env.MERCADOPAGO_ACCESS_TOKEN
  if (!token) return NextResponse.json({ error: 'MP não configurado' }, { status: 500 })

  try {
    const client = new MercadoPagoConfig({ accessToken: token })
    const preApproval = new PreApproval(client)
    const sub = await preApproval.get({ id: subscriptionId })

    const externalRef = sub.external_reference
    let userId: string | null = null
    let plano: string | null = null

    try {
      const parsed = JSON.parse(externalRef || '{}')
      userId = parsed.userId
      plano = parsed.plano
    } catch { /* ignore */ }

    if (!userId || !plano) {
      return NextResponse.json({ ok: true })
    }

    const db = admin()

    const mpStatus = sub.status // 'authorized', 'paused', 'cancelled', 'pending'

    // Map MP status → internal status
    const statusMap: Record<string, string> = {
      authorized: 'ativo',
      paused:     'pausado',
      cancelled:  'cancelada',
      pending:    'pendente',
    }
    const internalStatus = statusMap[mpStatus || ''] || mpStatus || 'pendente'

    // Update assinatura
    await db
      .from('assinaturas')
      .update({
        status: internalStatus,
        mp_status: mpStatus,
        plano: plano,
      })
      .eq('mp_subscription_id', subscriptionId)

    // If authorized → activate corretor plan
    if (mpStatus === 'authorized') {
      await db
        .from('corretores')
        .update({ plano, status_financeiro: 'normal' })
        .eq('id', userId)
    }

    // If cancelled/paused → revert to free
    if (mpStatus === 'cancelled') {
      await db
        .from('corretores')
        .update({ plano: 'free' })
        .eq('id', userId)
    }

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro'
    console.error('[MP webhook]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
