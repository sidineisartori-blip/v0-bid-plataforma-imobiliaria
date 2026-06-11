import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { negociacao_id, imovel_id, nome_locatario, email_locatario } = await req.json()

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await admin
    .from('fichas_cadastrais')
    .insert({
      corretor_id: user.id,
      negociacao_id: negociacao_id || null,
      imovel_id: imovel_id || null,
      nome_pre: nome_locatario || null,
      email_pre: email_locatario || null,
      status: 'pendente',
    })
    .select('token')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` || 'http://localhost:3000'
  const link = `${baseUrl}/ficha/${data.token}`

  return NextResponse.json({ token: data.token, link })
}
