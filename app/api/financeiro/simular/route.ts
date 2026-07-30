import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { gerarPlano, type SistemaAmortizacao } from '@/lib/financeiro/amortizacao'

export const dynamic = 'force-dynamic'

/**
 * Simula um plano de parcelamento sem gravar nada.
 * Serve a tela de montagem do contrato de venda, onde o corretor testa
 * combinacoes de entrada, prazo e juros antes de fechar.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  let corpo: {
    valorTotal?: number
    valorEntrada?: number
    numParcelas?: number
    taxaJurosMensal?: number
    dataPrimeiraParcela?: string
    sistema?: SistemaAmortizacao
  }

  try {
    corpo = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 })
  }

  const { valorTotal, numParcelas, dataPrimeiraParcela } = corpo
  if (!valorTotal || !numParcelas || !dataPrimeiraParcela) {
    return NextResponse.json(
      { error: 'valorTotal, numParcelas e dataPrimeiraParcela são obrigatórios' },
      { status: 400 },
    )
  }

  try {
    const plano = gerarPlano({
      valorTotal,
      valorEntrada: corpo.valorEntrada,
      numParcelas,
      taxaJurosMensal: corpo.taxaJurosMensal,
      dataPrimeiraParcela,
      sistema: corpo.sistema,
    })
    return NextResponse.json(plano)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Erro ao gerar plano' },
      { status: 400 },
    )
  }
}
