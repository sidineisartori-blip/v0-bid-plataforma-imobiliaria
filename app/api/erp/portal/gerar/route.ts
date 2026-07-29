import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

// POST /api/erp/portal/gerar
// Body: { contrato_id }
// Returns: { link, portal_token }
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { contrato_id } = await req.json()
  if (!contrato_id) return NextResponse.json({ error: 'contrato_id obrigatório' }, { status: 400 })

  // IDOR: verificar que contrato pertence ao corretor
  const { data: contrato } = await supabase
    .from('contratos')
    .select('id, portal_token')
    .eq('id', contrato_id)
    .eq('corretor_id', user.id)
    .single()

  if (!contrato) return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 })

  let token = contrato.portal_token

  // Gerar token se ainda não existir
  if (!token) {
    const admin = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )
    const { data: updated } = await admin
      .from('contratos')
      .update({ portal_token: undefined }) // força gen_random_uuid()
      .eq('id', contrato_id)
      .select('portal_token')
      .single()
    token = updated?.portal_token
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` || 'http://localhost:3000'
  const link = `${baseUrl}/portal/inquilino/${token}`

  return NextResponse.json({ link, portal_token: token })
}
