import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const admin = () => createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const { data, error } = await admin()
    .from('fichas_cadastrais')
    .select('id, status, nome_pre, email_pre, imovel_id, corretor_id, corretores(full_name, phone, creci, city)')
    .eq('token', token)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Link inválido ou expirado' }, { status: 404 })
  if (data.status === 'enviado' || data.status === 'aprovado') {
    return NextResponse.json({ preenchido: true, status: data.status })
  }

  return NextResponse.json({ ficha: data })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const body = await req.json()

  const { data: ficha, error: fetchErr } = await admin()
    .from('fichas_cadastrais')
    .select('id, status')
    .eq('token', token)
    .single()

  if (fetchErr || !ficha) return NextResponse.json({ error: 'Link inválido' }, { status: 404 })
  if (ficha.status !== 'pendente') return NextResponse.json({ error: 'Ficha já preenchida' }, { status: 409 })

  const { error } = await admin()
    .from('fichas_cadastrais')
    .update({
      nome: body.nome,
      cpf: body.cpf,
      rg: body.rg,
      data_nascimento: body.data_nascimento || null,
      estado_civil: body.estado_civil,
      profissao: body.profissao,
      renda_mensal: body.renda_mensal ? Number(body.renda_mensal) : null,
      email: body.email,
      telefone: body.telefone,
      cep: body.cep || null,
      endereco_atual: body.endereco_atual || null,
      referencia_1_nome: body.referencia_1_nome || null,
      referencia_1_fone: body.referencia_1_fone || null,
      referencia_2_nome: body.referencia_2_nome || null,
      referencia_2_fone: body.referencia_2_fone || null,
      tem_fiador: body.tem_fiador ?? false,
      observacoes: body.observacoes || null,
      status: 'enviado',
      enviado_em: new Date().toISOString(),
    })
    .eq('token', token)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
