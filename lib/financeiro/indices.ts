/**
 * Indices economicos vindos do Banco Central (sistema SGS).
 *
 * API publica, sem chave e sem limite declarado. Cada serie devolve a
 * variacao percentual do mes — para reajuste anual de aluguel o que
 * interessa e o acumulado de 12 meses, que e o produto das variacoes,
 * nao a soma. Somar 12 variacoes de 0,5% da 6,00%; o correto e 6,17%.
 */

export const SERIES_BCB: Record<string, number> = {
  IGPM:     189,
  IPCA:     433,
  INPC:     188,
  'IGP-DI': 190,
}

export interface PontoIndice {
  /** YYYY-MM-01 */
  competencia: string
  /** Variacao do mes em percentual: 0.48 = 0,48%. */
  percentual: number
}

/** Converte dd/MM/yyyy do BCB para o primeiro dia do mes em ISO. */
function paraCompetencia(dataBR: string): string {
  const [, mes, ano] = dataBR.split('/')
  return `${ano}-${mes}-01`
}

/**
 * Busca os ultimos N valores mensais de uma serie.
 * @param indice Chave de SERIES_BCB (IGPM, IPCA, INPC, IGP-DI).
 */
export async function buscarSerie(indice: string, ultimosMeses = 24): Promise<PontoIndice[]> {
  const codigo = SERIES_BCB[indice]
  if (!codigo) throw new Error(`Indice desconhecido: ${indice}`)

  const url =
    `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${codigo}/dados/ultimos/${ultimosMeses}` +
    `?formato=json`

  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    // O cron roda mensalmente; nao ha ganho em cachear entre execucoes.
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(`BCB respondeu ${res.status} para a serie ${codigo} (${indice})`)
  }

  const bruto: { data: string; valor: string }[] = await res.json()

  return bruto
    .filter((p) => p.data && p.valor !== null && p.valor !== '')
    .map((p) => ({
      competencia: paraCompetencia(p.data),
      percentual: Number(p.valor),
    }))
    .filter((p) => Number.isFinite(p.percentual))
}

/**
 * Acumula variacoes mensais por composicao.
 * @param variacoes Percentuais mensais (0.48 = 0,48%).
 * @returns Percentual acumulado, tambem em percentual.
 */
export function acumular(variacoes: number[]): number {
  const fator = variacoes.reduce((acc, v) => acc * (1 + v / 100), 1)
  return Math.round((fator - 1) * 1_000_000) / 10_000
}

/**
 * Acumulado dos 12 meses que antecedem a competencia informada.
 * E o numero que reajusta o aluguel no aniversario do contrato.
 */
export function acumular12Meses(
  serie: PontoIndice[],
  competenciaBase: string,
): { percentual: number; meses: number } {
  const anteriores = serie
    .filter((p) => p.competencia < competenciaBase)
    .sort((a, b) => b.competencia.localeCompare(a.competencia))
    .slice(0, 12)

  return {
    percentual: acumular(anteriores.map((p) => p.percentual)),
    meses: anteriores.length,
  }
}

/** Aplica um percentual acumulado a um valor, arredondando em centavos. */
export function aplicarReajuste(valor: number, percentualAcumulado: number): number {
  return Math.round(valor * (1 + percentualAcumulado / 100) * 100) / 100
}
