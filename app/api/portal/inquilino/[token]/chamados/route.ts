import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

async function resolveContrato(token: string) {
  const { data } = await admin()
    .from('contratos')
    .select('id, cliente_nome, corretor_id')
    .eq('portal_token', token)
    .single()
  return data
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const contrato = await resolveContrato(token)
  if (!contrato) return NextResponse.json({ error: 'Link inválido' }, { status: 404 })

  const { data, error } = await admin()
    .from('chamados')
    .select('id, titulo, descricao, categoria, urgencia, status, midia_urls, aberto_por, created_at, updated_at')
    .eq('contrato_id', contrato.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const contrato = await resolveContrato(token)
  if (!contrato) return NextResponse.json({ error: 'Link inválido' }, { status: 404 })

  const { titulo, descricao, categoria, urgencia, midia_urls } = await req.json()

  if (!titulo?.trim() || !descricao?.trim()) {
    return NextResponse.json({ error: 'Título e descrição são obrigatórios' }, { status: 400 })
  }

  const { data, error } = await admin()
    .from('chamados')
    .insert({
      contrato_id: contrato.id,
      corretor_id: contrato.corretor_id,
      titulo: titulo.trim(),
      descricao: descricao.trim(),
      categoria: categoria || 'outro',
      urgencia: urgencia || 'media',
      status: 'aberto',
      aberto_por: 'inquilino',
      aberto_por_nome: contrato.cliente_nome,
      midia_urls: midia_urls || [],
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await admin().from('chamado_historico').insert({
    chamado_id: data.id,
    status_anterior: null,
    status_novo: 'aberto',
    autor: 'inquilino',
    autor_nome: contrato.cliente_nome,
    comentario: 'Chamado aberto pelo inquilino',
  })

  return NextResponse.json(data, { status: 201 })
}
