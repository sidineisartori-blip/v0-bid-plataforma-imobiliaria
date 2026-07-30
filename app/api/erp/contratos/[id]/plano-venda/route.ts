import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { gerarPlano, type SistemaAmortizacao } from '@/lib/financeiro/amortizacao'

export const dynamic = 'force-dynamic'

/** Confirma que o contrato e do corretor chamador antes de qualquer escrita. */
async function contratoDoCorretor(
  supabase: Awaited<ReturnType<typeof createClient>>,
  contratoId: string,
  corretorId: string,
) {
  const { data } = await supabase
    .from('contratos')
    .select('id, tipo, valor_contrato, corretor_id')
    .eq('id', contratoId)
    .eq('corretor_id', corretorId)
    .maybeSingle()
  return data
}

// GET — plano vigente e suas parcelas
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const contrato = await contratoDoCorretor(supabase, id, user.id)
  if (!contrato) return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 })

  const [{ data: plano }, { data: parcelas }] = await Promise.all([
    supabase.from('venda_planos').select('*').eq('contrato_id', id).eq('corretor_id', user.id).maybeSingle(),
    supabase
      .from('contrato_parcelas')
      .select('id, numero_parcela, total_parcelas, tipo, competencia, data_vencimento, valor, valor_principal, valor_juros, saldo_devedor, status, data_pagamento')
      .eq('contrato_id', id)
      .eq('corretor_id', user.id)
      .order('numero_parcela', { ascending: true, nullsFirst: false }),
  ])

  return NextResponse.json({ plano: plano ?? null, parcelas: parcelas ?? [] })
}

// POST — cria o plano e gera as parcelas
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const contrato = await contratoDoCorretor(supabase, id, user.id)
  if (!contrato) return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 })

  let corpo: {
    sistema?: SistemaAmortizacao
    valorTotal?: number
    valorEntrada?: number
    numParcelas?: number
    taxaJurosMensal?: number
    dataPrimeiraParcela?: string
    indiceCorrecao?: string
    substituir?: boolean
  }
  try {
    corpo = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 })
  }

  const valorTotal = corpo.valorTotal ?? contrato.valor_contrato
  const { numParcelas, dataPrimeiraParcela } = corpo

  if (!valorTotal || !numParcelas || !dataPrimeiraParcela) {
    return NextResponse.json(
      { error: 'valorTotal, numParcelas e dataPrimeiraParcela são obrigatórios' },
      { status: 400 },
    )
  }

  // Regerar por cima de parcelas ja pagas apagaria historico de recebimento.
  const { count: pagas } = await supabase
    .from('contrato_parcelas')
    .select('*', { count: 'exact', head: true })
    .eq('contrato_id', id)
    .eq('corretor_id', user.id)
    .eq('status', 'pago')

  if ((pagas ?? 0) > 0) {
    return NextResponse.json(
      { error: `Existem ${pagas} parcela(s) já paga(s). Cancele-as antes de regerar o plano.` },
      { status: 409 },
    )
  }

  let plano
  try {
    plano = gerarPlano({
      valorTotal,
      valorEntrada: corpo.valorEntrada,
      numParcelas,
      taxaJurosMensal: corpo.taxaJurosMensal,
      dataPrimeiraParcela,
      sistema: corpo.sistema,
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Erro ao gerar plano' },
      { status: 400 },
    )
  }

  // Limpa parcelas em aberto do plano anterior antes de gravar o novo.
  if (corpo.substituir) {
    await supabase
      .from('contrato_parcelas')
      .delete()
      .eq('contrato_id', id)
      .eq('corretor_id', user.id)
      .neq('status', 'pago')
  }

  const { data: planoSalvo, error: erroPlano } = await supabase
    .from('venda_planos')
    .upsert(
      {
        contrato_id: id,
        corretor_id: user.id,
        sistema: plano.sistema,
        valor_total: plano.valorTotal,
        valor_entrada: plano.valorEntrada,
        num_parcelas: numParcelas,
        taxa_juros_mensal: plano.taxaMensal,
        indice_correcao: corpo.indiceCorrecao ?? null,
        data_primeira_parcela: dataPrimeiraParcela,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'contrato_id' },
    )
    .select()
    .single()

  if (erroPlano) {
    return NextResponse.json({ error: erroPlano.message }, { status: 500 })
  }

  const linhas: Record<string, unknown>[] = []

  if (plano.valorEntrada > 0) {
    linhas.push({
      contrato_id: id,
      corretor_id: user.id,
      tipo: 'entrada',
      numero_parcela: 0,
      total_parcelas: numParcelas,
      competencia: dataPrimeiraParcela.slice(0, 8) + '01',
      data_vencimento: dataPrimeiraParcela,
      valor: plano.valorEntrada,
      valor_principal: plano.valorEntrada,
      valor_juros: 0,
      saldo_devedor: plano.valorFinanciado,
      status: 'aberto',
    })
  }

  for (const p of plano.parcelas) {
    linhas.push({
      contrato_id: id,
      corretor_id: user.id,
      tipo: 'venda_parcela',
      numero_parcela: p.numero,
      total_parcelas: numParcelas,
      competencia: p.vencimento.slice(0, 8) + '01',
      data_vencimento: p.vencimento,
      valor: p.valor,
      valor_principal: p.principal,
      valor_juros: p.juros,
      saldo_devedor: p.saldoDevedor,
      status: 'aberto',
    })
  }

  const { error: erroParcelas } = await supabase.from('contrato_parcelas').insert(linhas)
  if (erroParcelas) {
    return NextResponse.json({ error: erroParcelas.message }, { status: 500 })
  }

  return NextResponse.json({
    plano: planoSalvo,
    parcelasGeradas: linhas.length,
    totalJuros: plano.totalJuros,
    totalPago: plano.totalPago,
  })
}
