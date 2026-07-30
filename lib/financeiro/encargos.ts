/**
 * Encargos de atraso e desconto por pontualidade.
 *
 * Os padroes seguem o que se pratica em contrato de locacao residencial:
 * multa de 2% sobre o valor em atraso e juros de mora de 1% ao mes,
 * calculados pro rata die. A Lei 8.245/91 nao fixa esses percentuais —
 * eles vem do contrato — entao ficam parametrizaveis.
 */

export interface ParametrosEncargo {
  /** Percentual de multa em fracao: 0.02 = 2%. */
  multaPercentual?: number
  /** Juros de mora ao mes em fracao: 0.01 = 1% a.m. */
  jurosMoraMensal?: number
  /** Desconto por pagar ate o vencimento, em fracao. */
  descontoPontualidade?: number
}

export interface CalculoEncargo {
  valorOriginal: number
  diasAtraso: number
  multa: number
  juros: number
  desconto: number
  /** valorOriginal + multa + juros - desconto */
  valorTotal: number
}

const PADRAO: Required<ParametrosEncargo> = {
  multaPercentual: 0.02,
  jurosMoraMensal: 0.01,
  descontoPontualidade: 0,
}

const arred = (n: number) => Math.round(n * 100) / 100

/** Diferenca em dias inteiros entre duas datas YYYY-MM-DD. */
export function diasEntre(deISO: string, ateISO: string): number {
  const [a1, m1, d1] = deISO.split('-').map(Number)
  const [a2, m2, d2] = ateISO.split('-').map(Number)
  const de = Date.UTC(a1, m1 - 1, d1)
  const ate = Date.UTC(a2, m2 - 1, d2)
  return Math.floor((ate - de) / 86_400_000)
}

/**
 * @param dataReferencia Data do pagamento (ou hoje, para simular).
 */
export function calcularEncargos(
  valorOriginal: number,
  dataVencimento: string,
  dataReferencia: string,
  params: ParametrosEncargo = {},
): CalculoEncargo {
  const p = { ...PADRAO, ...params }
  const diasAtraso = Math.max(0, diasEntre(dataVencimento, dataReferencia))

  if (diasAtraso === 0) {
    const desconto = arred(valorOriginal * p.descontoPontualidade)
    return {
      valorOriginal,
      diasAtraso: 0,
      multa: 0,
      juros: 0,
      desconto,
      valorTotal: arred(valorOriginal - desconto),
    }
  }

  // Multa incide uma vez, no primeiro dia de atraso.
  const multa = arred(valorOriginal * p.multaPercentual)
  // Mora pro rata die sobre mes comercial de 30 dias.
  const juros = arred(valorOriginal * (p.jurosMoraMensal / 30) * diasAtraso)

  return {
    valorOriginal,
    diasAtraso,
    multa,
    juros,
    desconto: 0,
    valorTotal: arred(valorOriginal + multa + juros),
  }
}
