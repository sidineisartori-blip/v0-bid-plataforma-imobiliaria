import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

// GET — valida token e retorna dados do contrato (sem dados sensíveis)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const db = admin()

  const { data: contrato } = await db
    .from('contratos')
    .select(`
      id, tipo, status, cliente_nome, valor_aluguel, dia_vencimento,
      data_inicio, data_fim,
      imovel:imoveis(titulo, bairro, cidade, area_total, quartos)
    `)
    .eq('portal_token', token)
    .single()

  if (!contrato) return NextResponse.json({ error: 'Link inválido ou expirado' }, { status: 404 })

  return NextResponse.json(contrato)
}
