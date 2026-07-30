import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SERIES_BCB, buscarSerie } from '@/lib/financeiro/indices'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Sincroniza os indices economicos com a API do Banco Central.
 *
 * Roda diariamente. O BCB publica cada serie em dia proprio do mes, e a
 * gravacao e idempotente pelo UNIQUE (indice, competencia) — entao rodar
 * todo dia so custa quatro requisicoes e garante que o indice esteja no
 * banco no dia seguinte a divulgacao, sem depender de acertar a data.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const resultado: Record<string, { gravados: number; erro?: string }> = {}

  for (const indice of Object.keys(SERIES_BCB)) {
    try {
      const serie = await buscarSerie(indice, 24)
      if (serie.length === 0) {
        resultado[indice] = { gravados: 0, erro: 'serie vazia' }
        continue
      }

      const linhas = serie.map((p) => ({
        indice,
        competencia: p.competencia,
        percentual: p.percentual,
        fonte: 'bcb',
      }))

      const { error } = await admin
        .from('indices_economicos')
        .upsert(linhas, { onConflict: 'indice,competencia', ignoreDuplicates: false })

      resultado[indice] = error
        ? { gravados: 0, erro: error.message }
        : { gravados: linhas.length }
    } catch (e) {
      // Uma serie fora do ar nao pode derrubar as outras tres.
      resultado[indice] = {
        gravados: 0,
        erro: e instanceof Error ? e.message : 'falha desconhecida',
      }
    }
  }

  const totalGravados = Object.values(resultado).reduce((s, r) => s + r.gravados, 0)
  const houveErro = Object.values(resultado).some((r) => r.erro)

  return NextResponse.json(
    { ok: !houveErro, totalGravados, series: resultado },
    { status: houveErro ? 207 : 200 },
  )
}
