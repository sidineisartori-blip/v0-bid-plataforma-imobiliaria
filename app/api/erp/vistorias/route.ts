import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

const TEMPLATE_ITENS = [
  { ambiente: 'Sala', item: 'Paredes' },
  { ambiente: 'Sala', item: 'Piso' },
  { ambiente: 'Sala', item: 'Teto' },
  { ambiente: 'Sala', item: 'Portas e Janelas' },
  { ambiente: 'Sala', item: 'Iluminação' },
  { ambiente: 'Cozinha', item: 'Paredes e Azulejos' },
  { ambiente: 'Cozinha', item: 'Piso' },
  { ambiente: 'Cozinha', item: 'Teto' },
  { ambiente: 'Cozinha', item: 'Armários e Bancada' },
  { ambiente: 'Cozinha', item: 'Torneira e Pia' },
  { ambiente: 'Cozinha', item: 'Iluminação' },
  { ambiente: 'Quarto Principal', item: 'Paredes' },
  { ambiente: 'Quarto Principal', item: 'Piso' },
  { ambiente: 'Quarto Principal', item: 'Teto' },
  { ambiente: 'Quarto Principal', item: 'Portas e Janelas' },
  { ambiente: 'Quarto Principal', item: 'Closet / Armário' },
  { ambiente: 'Banheiro', item: 'Paredes e Azulejos' },
  { ambiente: 'Banheiro', item: 'Piso' },
  { ambiente: 'Banheiro', item: 'Teto' },
  { ambiente: 'Banheiro', item: 'Box e Chuveiro' },
  { ambiente: 'Banheiro', item: 'Vaso e Pia' },
  { ambiente: 'Banheiro', item: 'Torneira' },
  { ambiente: 'Área de Serviço', item: 'Paredes' },
  { ambiente: 'Área de Serviço', item: 'Piso' },
  { ambiente: 'Área de Serviço', item: 'Tanque' },
  { ambiente: 'Área de Serviço', item: 'Instalação para Máquina' },
  { ambiente: 'Geral', item: 'Instalações Elétricas' },
  { ambiente: 'Geral', item: 'Instalações Hidráulicas' },
  { ambiente: 'Geral', item: 'Portão / Entrada' },
  { ambiente: 'Geral', item: 'Área Externa / Garagem' },
]

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const contratoId = searchParams.get('contrato_id')

  let query = supabase
    .from('vistorias')
    .select(`
      *,
      contrato:contratos(
        cliente_nome,
        imovel:imoveis(titulo, cidade)
      )
    `)
    .eq('corretor_id', user.id)
    .order('created_at', { ascending: false })

  if (contratoId) query = query.eq('contrato_id', contratoId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { contrato_id, tipo, data_vistoria } = await req.json()

  if (!contrato_id || !tipo) {
    return NextResponse.json({ error: 'Campos obrigatórios: contrato_id, tipo' }, { status: 400 })
  }
  if (!['entrada', 'saida'].includes(tipo)) {
    return NextResponse.json({ error: 'tipo deve ser "entrada" ou "saida"' }, { status: 400 })
  }

  // IDOR: verificar que contrato pertence ao corretor
  const { data: contrato } = await supabase
    .from('contratos')
    .select('id')
    .eq('id', contrato_id)
    .eq('corretor_id', user.id)
    .single()

  if (!contrato) return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 })

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const { data: vistoria, error } = await admin
    .from('vistorias')
    .insert({
      contrato_id,
      corretor_id: user.id,
      tipo,
      status: 'em_preenchimento',
      data_vistoria: data_vistoria || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Gerar itens a partir do template
  const itens = TEMPLATE_ITENS.map((t) => ({
    vistoria_id: vistoria.id,
    ambiente: t.ambiente,
    item: t.item,
    estado: 'bom',
    observacao: null,
    foto_urls: [],
  }))

  await admin.from('vistoria_itens').insert(itens)

  return NextResponse.json(vistoria, { status: 201 })
}
