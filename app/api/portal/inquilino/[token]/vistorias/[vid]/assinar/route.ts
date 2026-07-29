import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

// POST — inquilino assina digitalmente a vistoria via portal
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string; vid: string }> }
) {
  const { token, vid } = await params

  const { data: contrato } = await admin()
    .from('contratos')
    .select('id')
    .eq('portal_token', token)
    .single()

  if (!contrato) return NextResponse.json({ error: 'Link inválido' }, { status: 404 })

  // Verificar que a vistoria pertence ao contrato e já foi assinada pelo corretor
  const { data: vistoria } = await admin()
    .from('vistorias')
    .select('id, status, assinado_por_corretor_em, assinado_por_inquilino_em')
    .eq('id', vid)
    .eq('contrato_id', contrato.id)
    .single()

  if (!vistoria) return NextResponse.json({ error: 'Vistoria não encontrada' }, { status: 404 })
  if (vistoria.status !== 'finalizada') return NextResponse.json({ error: 'Vistoria ainda não finalizada pelo corretor' }, { status: 400 })
  if (vistoria.assinado_por_inquilino_em) return NextResponse.json({ error: 'Vistoria já assinada' }, { status: 400 })

  const { error } = await admin()
    .from('vistorias')
    .update({ assinado_por_inquilino_em: new Date().toISOString() })
    .eq('id', vid)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
