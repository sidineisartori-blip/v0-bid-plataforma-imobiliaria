import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  // IDOR: confirma que a notificação pertence ao corretor
  const { data: notif } = await supabase
    .from('notificacoes')
    .select('id, tipo, solicitacao_id, imovel_id, metadata')
    .eq('id', id)
    .eq('corretor_id', user.id)
    .single()

  if (!notif) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const solicitacaoId = notif.solicitacao_id ?? (notif.metadata as Record<string, unknown>)?.solicitacao_id as string | undefined

  if (!solicitacaoId) {
    return NextResponse.json({ solicitacao: null, imoveisCompativeis: [] })
  }

  // Busca a solicitação (IDOR: garantido pela notificação já pertencer ao corretor)
  const { data: sol } = await supabase
    .from('solicitacoes')
    .select('id, cliente_nome, cliente_phone, cliente_email, tipo_negocio, tipo_imovel, cidade, bairro_desejado, valor_min, valor_max, quartos, tem_animal, status, created_at, ultimo_contato_em')
    .eq('id', solicitacaoId)
    .eq('corretor_id', user.id)
    .single()

  if (!sol) return NextResponse.json({ solicitacao: null, imoveisCompativeis: [] })

  // Mapeia tipo_negocio da solicitação → tipo do imóvel
  const tipoImovelMap: Record<string, string> = {
    'Comprar': 'Venda',
    'Alugar':  'Locação',
  }
  const tipoNegocioImovel = tipoImovelMap[sol.tipo_negocio] ?? sol.tipo_negocio

  // Busca imóveis compatíveis na carteira do corretor
  let query = supabase
    .from('imoveis')
    .select('id, titulo, tipo_imovel, tipo_negocio, cidade, bairro, valor, quartos, banheiros, vagas, area_total, image_urls, aceita_animal, status')
    .eq('corretor_id', user.id)
    .in('status', ['ativo', 'disponivel', 'negociacao'])
    .eq('tipo_negocio', tipoNegocioImovel)

  if (sol.tipo_imovel) query = query.ilike('tipo_imovel', `%${sol.tipo_imovel}%`)
  if (sol.cidade)      query = query.ilike('cidade', `%${sol.cidade}%`)
  if (sol.valor_max)   query = query.lte('valor', sol.valor_max)
  if (sol.valor_min)   query = query.gte('valor', sol.valor_min)
  if (sol.quartos)     query = query.gte('quartos', sol.quartos)

  const { data: imoveis } = await query.order('created_at', { ascending: false }).limit(10)

  return NextResponse.json({
    solicitacao: sol,
    imoveisCompativeis: imoveis ?? [],
  })
}
