import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

// GET — lista vistorias finalizadas do contrato do inquilino
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const { data: contrato } = await admin()
    .from('contratos')
    .select('id')
    .eq('portal_token', token)
    .single()

  if (!contrato) return NextResponse.json({ error: 'Link inválido' }, { status: 404 })

  const { data, error } = await admin()
    .from('vistorias')
    .select('id, tipo, status, data_vistoria, observacoes_gerais, assinado_por_corretor_em, assinado_por_inquilino_em, created_at')
    .eq('contrato_id', contrato.id)
    .eq('status', 'finalizada')
    .order('tipo', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
