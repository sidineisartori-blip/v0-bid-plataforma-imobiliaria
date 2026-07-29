import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const contratoId = searchParams.get('contrato_id')
  const status = searchParams.get('status')

  let query = supabase
    .from('chamados')
    .select(`
      *,
      contrato:contratos(
        cliente_nome, portal_token, proprietario_nome,
        proprietario_phone, proprietario_email,
        imovel:imoveis(titulo, cidade)
      )
    `)
    .eq('corretor_id', user.id)
    .order('created_at', { ascending: false })

  if (contratoId) query = query.eq('contrato_id', contratoId)
  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { contrato_id, titulo, descricao, categoria, urgencia, midia_urls } = await req.json()

  if (!contrato_id || !titulo?.trim() || !descricao?.trim()) {
    return NextResponse.json({ error: 'Campos obrigatórios: contrato_id, titulo, descricao' }, { status: 400 })
  }

  // IDOR: verificar que contrato pertence ao corretor
  const { data: contrato } = await supabase
    .from('contratos')
    .select('id')
    .eq('id', contrato_id)
    .eq('corretor_id', user.id)
    .single()

  if (!contrato) return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 })

  const { data, error } = await supabase
    .from('chamados')
    .insert({
      contrato_id,
      corretor_id: user.id,
      titulo: titulo.trim(),
      descricao: descricao.trim(),
      categoria: categoria || 'outro',
      urgencia: urgencia || 'media',
      status: 'aberto',
      aberto_por: 'corretor',
      midia_urls: midia_urls || [],
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('chamado_historico').insert({
    chamado_id: data.id,
    status_anterior: null,
    status_novo: 'aberto',
    autor: 'corretor',
    comentario: 'Chamado aberto pelo corretor',
  })

  return NextResponse.json(data, { status: 201 })
}
