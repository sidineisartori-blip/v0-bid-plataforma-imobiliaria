import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

// POST — proprietário aprova ou recusa via link de autorização
// token = chamado.proprietario_token
// Body: { acao: 'aprovar' | 'recusar', comentario? }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const { acao, comentario } = await req.json()

  if (!['aprovar', 'recusar'].includes(acao)) {
    return NextResponse.json({ error: 'acao deve ser "aprovar" ou "recusar"' }, { status: 400 })
  }

  const { data: chamado } = await admin()
    .from('chamados')
    .select('id, status, titulo, contrato_id')
    .eq('proprietario_token', token)
    .single()

  if (!chamado) return NextResponse.json({ error: 'Link inválido ou expirado' }, { status: 404 })

  if (chamado.status !== 'aprovado_corretor') {
    return NextResponse.json({
      error: `Chamado não pode ser autorizado neste status: ${chamado.status}`,
    }, { status: 400 })
  }

  const novoStatus = acao === 'aprovar' ? 'aprovado_proprietario' : 'recusado'
  const now = new Date().toISOString()

  const payload: Record<string, unknown> = {
    status: novoStatus,
    updated_at: now,
  }
  if (acao === 'aprovar') payload.aprovado_proprietario_em = now
  if (acao === 'recusar') payload.comentario_recusa = comentario?.trim() || null

  const { error } = await admin()
    .from('chamados')
    .update(payload)
    .eq('id', chamado.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await admin().from('chamado_historico').insert({
    chamado_id: chamado.id,
    status_anterior: 'aprovado_corretor',
    status_novo: novoStatus,
    comentario: acao === 'aprovar'
      ? (comentario?.trim() || 'Autorizado pelo proprietário')
      : (comentario?.trim() || 'Recusado pelo proprietário'),
    autor: 'proprietario',
  })

  return NextResponse.json({ ok: true, status: novoStatus })
}

// GET — valida token e retorna dados do chamado para exibição
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const { data: chamado } = await admin()
    .from('chamados')
    .select(`
      id, titulo, descricao, categoria, urgencia, status,
      midia_urls, created_at, aberto_por, aberto_por_nome,
      contrato:contratos(
        cliente_nome,
        imovel:imoveis(titulo, cidade, bairro)
      )
    `)
    .eq('proprietario_token', token)
    .single()

  if (!chamado) return NextResponse.json({ error: 'Link inválido ou expirado' }, { status: 404 })
  return NextResponse.json(chamado)
}
