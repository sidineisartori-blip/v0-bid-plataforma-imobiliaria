/**
 * Motor de amortizacao para venda parcelada.
 *
 * Todo calculo interno roda em centavos inteiros. Em reais com float,
 * 300 parcelas de 1/3 acumulam centavos de erro e a soma das parcelas
 * deixa de bater com o valor financiado — o que aparece como divergencia
 * no extrato e no contrato impresso. O residuo do arredondamento vai na
 * ultima parcela, entao a soma sempre fecha exata.
 */

export type SistemaAmortizacao = 'price' | 'sac' | 'sem_juros'

export interface Parcela {
  numero: number
  vencimento: string        // YYYY-MM-DD
  /** Amortizacao do principal no periodo. */
  principal: number
  juros: number
  /** principal + juros */
  valor: number
  /** Saldo devedor depois de paga esta parcela. */
  saldoDevedor: number
}

export interface PlanoAmortizacao {
  sistema: SistemaAmortizacao
  valorTotal: number
  valorEntrada: number
  valorFinanciado: number
  taxaMensal: number
  parcelas: Parcela[]
  totalJuros: number
  /** entrada + soma das parcelas */
  totalPago: number
}

export interface ParametrosPlano {
  valorTotal: number
  valorEntrada?: number
  numParcelas: number
  /** Fracao decimal ao mes: 0.01 = 1% a.m. */
  taxaJurosMensal?: number
  /** YYYY-MM-DD */
  dataPrimeiraParcela: string
  sistema?: SistemaAmortizacao
}

const paraCentavos = (reais: number) => Math.round(reais * 100)
const paraReais = (centavos: number) => centavos / 100

/**
 * Soma meses preservando o dia. Se o dia nao existe no mes destino
 * (31 de janeiro + 1 mes), cai no ultimo dia do mes — que e o
 * comportamento esperado numa carne de pagamento.
 */
export function somarMeses(dataISO: string, meses: number): string {
  const [ano, mes, dia] = dataISO.split('-').map(Number)
  const alvo = new Date(Date.UTC(ano, mes - 1 + meses, 1))
  const ultimoDia = new Date(Date.UTC(alvo.getUTCFullYear(), alvo.getUTCMonth() + 1, 0)).getUTCDate()
  const diaFinal = Math.min(dia, ultimoDia)
  const mm = String(alvo.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(diaFinal).padStart(2, '0')
  return `${alvo.getUTCFullYear()}-${mm}-${dd}`
}

export function gerarPlano(p: ParametrosPlano): PlanoAmortizacao {
  const sistema = p.sistema ?? 'price'
  const taxa = p.taxaJurosMensal ?? 0
  const n = p.numParcelas

  if (n < 1 || !Number.isInteger(n)) {
    throw new Error('numParcelas deve ser inteiro maior que zero')
  }
  if (p.valorTotal <= 0) {
    throw new Error('valorTotal deve ser maior que zero')
  }

  const totalCent = paraCentavos(p.valorTotal)
  const entradaCent = paraCentavos(p.valorEntrada ?? 0)

  if (entradaCent < 0 || entradaCent >= totalCent) {
    throw new Error('valorEntrada deve ser maior ou igual a zero e menor que valorTotal')
  }

  const financiadoCent = totalCent - entradaCent
  const parcelas: Parcela[] = []

  // Sem juros e SAC com taxa zero produzem a mesma tabela; manter os dois
  // separados deixa o contrato dizer qual regime foi pactuado.
  const semJuros = sistema === 'sem_juros' || taxa === 0

  if (semJuros) {
    const base = Math.floor(financiadoCent / n)
    let saldo = financiadoCent
    for (let i = 1; i <= n; i++) {
      const principal = i === n ? saldo : base
      saldo -= principal
      parcelas.push({
        numero: i,
        vencimento: somarMeses(p.dataPrimeiraParcela, i - 1),
        principal: paraReais(principal),
        juros: 0,
        valor: paraReais(principal),
        saldoDevedor: paraReais(saldo),
      })
    }
  } else if (sistema === 'price') {
    // PMT = PV * [ i(1+i)^n ] / [ (1+i)^n - 1 ]
    const fator = Math.pow(1 + taxa, n)
    const pmtCent = Math.round((financiadoCent * taxa * fator) / (fator - 1))

    let saldo = financiadoCent
    for (let i = 1; i <= n; i++) {
      const juros = Math.round(saldo * taxa)
      // Na ultima, a parcela quita o saldo restante: absorve o residuo
      // de arredondamento acumulado ao longo do plano.
      const principal = i === n ? saldo : pmtCent - juros
      const valor = principal + juros
      saldo -= principal
      parcelas.push({
        numero: i,
        vencimento: somarMeses(p.dataPrimeiraParcela, i - 1),
        principal: paraReais(principal),
        juros: paraReais(juros),
        valor: paraReais(valor),
        saldoDevedor: paraReais(saldo),
      })
    }
  } else {
    // SAC: amortizacao constante, parcela decrescente.
    const amortBase = Math.floor(financiadoCent / n)
    let saldo = financiadoCent
    for (let i = 1; i <= n; i++) {
      const juros = Math.round(saldo * taxa)
      const principal = i === n ? saldo : amortBase
      const valor = principal + juros
      saldo -= principal
      parcelas.push({
        numero: i,
        vencimento: somarMeses(p.dataPrimeiraParcela, i - 1),
        principal: paraReais(principal),
        juros: paraReais(juros),
        valor: paraReais(valor),
        saldoDevedor: paraReais(saldo),
      })
    }
  }

  const totalJuros = parcelas.reduce((s, x) => s + x.juros, 0)
  const somaParcelas = parcelas.reduce((s, x) => s + x.valor, 0)

  return {
    sistema,
    valorTotal: p.valorTotal,
    valorEntrada: paraReais(entradaCent),
    valorFinanciado: paraReais(financiadoCent),
    taxaMensal: taxa,
    parcelas,
    totalJuros: Math.round(totalJuros * 100) / 100,
    totalPago: Math.round((paraReais(entradaCent) + somaParcelas) * 100) / 100,
  }
}

/**
 * Taxa anual para a mensal equivalente, em juros compostos.
 * 12% a.a. nao e 1% a.m. — e 0,9489% a.m.
 */
export function anualParaMensal(taxaAnual: number): number {
  return Math.pow(1 + taxaAnual, 1 / 12) - 1
}
