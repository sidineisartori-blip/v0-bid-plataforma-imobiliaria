import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { acumular, aplicarReajuste } from '@/lib/financeiro/indices'

export const dynamic = 'force-dynamic'

type ContratoReajuste = {
  id: string
  tipo: string
  status: string
  data_inicio: string | null
  indice_reajuste: string | null
  valor_aluguel: number | null
}

/**
 * Competencia do proximo aniversario do contrato — e a data que dispara
 * o reajuste anual e define a janela de 12 meses do indice.
 */
function competenciaAniversario(dataInicio: string, hoje = new Date()): string {
  const [ano, mes] = dataInicio.split('-').map(Number)
  let aniversario = new Date(Date.UTC(hoje.getUTCFullYear(), mes - 1, 1))
  // Se o aniversario deste ano ja passou, o proximo e no ano seguinte.
  if (aniversario < new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), 1))) {
    aniversario = new Date(Date.UTC(hoje.getUTCFullYear() + 1, mes - 1, 1))
  }
  // Contrato que ainda nao completou um ano nao reajusta.
  if (aniversario.getUTCFullYear() <= ano) {
    aniversario = new Date(Date.UTC(ano + 1, mes - 1, 1))
  }
  return aniversario.toISOString().slice(0, 10)
}

async function carregar(
  supabase: Awaited<ReturnType<typeof createClient>>,
  id: string,
  corretorId: string,
) {
  const { data } = await supabase
    .from('contratos')
    .select('id, tipo, status, data_inicio, indice_reajuste, valor_aluguel')
    .eq('id', id)
    .eq('corretor_id', corretorId)
    .maybeSingle()
  return data as ContratoReajuste | null
}

/**
 * Calcula o reajuste sem aplicar. Devolve o indice acumulado, o valor novo
 * e quantos meses de serie foram encontrados — se vierem menos de 12, o
 * numero esta incompleto e o corretor precisa saber antes de aplicar.
 */
async function calcular(
  supabase: Awaited<ReturnType<typeof createClient>>,
  contrato: ContratoReajuste,
) {
  if (!contrato.data_inicio) {
    return { erro: 'Contrato sem data de início — não há como calcular o aniversário.' as const }
  }
  if (!contrato.indice_reajuste) {
    return { erro: 'Contrato sem índice de reajuste definido.' as const }
  }
  if (!contrato.valor_aluguel || contrato.valor_aluguel <= 0) {
    return { erro: 'Contrato sem valor de aluguel.' as const }
  }

  const competencia = competenciaAniversario(contrato.data_inicio)

  const { data: serie } = await supabase
    .from('indices_economicos')
    .select('competencia, percentual')
    .eq('indice', contrato.indice_reajuste)
    .lt('competencia', competencia)
    .order('competencia', { ascending: false })
    .limit(12)

  const meses = serie?.length ?? 0
  const percentual = acumular((serie ?? []).map((p) => Number(p.percentual)))
  const valorNovo = aplicarReajuste(contrato.valor_aluguel, percentual)

  return {
    competencia,
    indice: contrato.indice_reajuste,
    percentual,
    mesesEncontrados: meses,
    serieCompleta: meses === 12,
    valorAnterior: contrato.valor_aluguel,
    valorNovo,
    diferenca: Math.round((valorNovo - contrato.valor_aluguel) * 100) / 100,
  }
}

// GET — simula
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const contrato = await carregar(supabase, id, user.id)
  if (!contrato) return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 })

  const r = await calcular(supabase, contrato)
  if ('erro' in r) return NextResponse.json({ error: r.erro }, { status: 400 })
  return NextResponse.json(r)
}

// POST — aplica
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const contrato = await carregar(supabase, id, user.id)
  if (!contrato) return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 })

  const r = await calcular(supabase, contrato)
  if ('erro' in r) return NextResponse.json({ error: r.erro }, { status: 400 })

  // Aplicar com serie incompleta produz reajuste menor que o devido e
  // dificil de rastrear depois. Exige confirmacao explicita.
  let forcar = false
  try {
    forcar = Boolean((await req.json())?.forcar)
  } catch {
    // corpo vazio e aceitavel
  }

  if (!r.serieCompleta && !forcar) {
    return NextResponse.json(
      {
        error: `Série do ${r.indice} tem apenas ${r.mesesEncontrados} de 12 meses. ` +
               `Aguarde o cron de índices ou reenvie com { "forcar": true }.`,
        ...r,
      },
      { status: 409 },
    )
  }

  const agora = new Date().toISOString()

  const { data: registro, error: erroRegistro } = await supabase
    .from('contrato_reajustes')
    .upsert(
      {
        contrato_id: id,
        corretor_id: user.id,
        competencia: r.competencia,
        indice: r.indice,
        percentual: r.percentual,
        valor_anterior: r.valorAnterior,
        valor_novo: r.valorNovo,
        aplicado_em: agora,
      },
      { onConflict: 'contrato_id,competencia' },
    )
    .select()
    .single()

  if (erroRegistro) {
    return NextResponse.json({ error: erroRegistro.message }, { status: 500 })
  }

  const { error: erroContrato } = await supabase
    .from('contratos')
    .update({ valor_aluguel: r.valorNovo })
    .eq('id', id)
    .eq('corretor_id', user.id)

  if (erroContrato) {
    return NextResponse.json({ error: erroContrato.message }, { status: 500 })
  }

  // So os encargos marcados como reajustaveis sobem: IPTU e condominio
  // seguem o valor real cobrado, nao o indice do contrato.
  const { data: encargos } = await supabase
    .from('contrato_encargos')
    .select('id, valor')
    .eq('contrato_id', id)
    .eq('corretor_id', user.id)
    .eq('reajustavel', true)
    .eq('ativo', true)

  for (const e of encargos ?? []) {
    await supabase
      .from('contrato_encargos')
      .update({ valor: aplicarReajuste(Number(e.valor), r.percentual), updated_at: agora })
      .eq('id', e.id)
      .eq('corretor_id', user.id)
  }

  return NextResponse.json({
    ...r,
    aplicado: true,
    encargosReajustados: encargos?.length ?? 0,
    registro,
  })
}
