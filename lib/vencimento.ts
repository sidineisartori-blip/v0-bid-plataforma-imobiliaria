/**
 * Utilitários de vencimento — usados no ERP, Dashboard e listagens.
 * Lógica inspirada no padrão do Superlógica: status inline com urgência visual.
 */

export type VencimentoStatus =
  | 'vence_hoje'
  | 'vence_amanha'
  | 'vence_em_breve'   // 2–7 dias
  | 'a_vencer'         // 8–30 dias
  | 'venceu_hoje'
  | 'atrasado_leve'    // 1–3 dias
  | 'atrasado'         // 4–15 dias
  | 'atrasado_grave'   // > 15 dias
  | 'sem_data'
  | 'ok'               // > 30 dias

export interface VencimentoInfo {
  status: VencimentoStatus
  label: string        // ex: "Vence amanhã", "Venceu há 3 dias"
  dias: number         // positivo = futuro, negativo = passado
  cor: string
  bgCor: string
}

export function calcVencimento(dataISO: string | null | undefined): VencimentoInfo {
  if (!dataISO) return { status: 'sem_data', label: '—', dias: 0, cor: '#9B9690', bgCor: 'rgba(155,150,144,0.1)' }

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const data = new Date(dataISO + (dataISO.length === 10 ? 'T00:00:00' : ''))
  data.setHours(0, 0, 0, 0)
  const diff = Math.round((data.getTime() - hoje.getTime()) / 86400000)

  if (diff === 0)  return { status: 'vence_hoje',    label: 'Vence hoje',          dias: 0,    cor: '#E05C5C', bgCor: 'rgba(224,92,92,0.12)' }
  if (diff === 1)  return { status: 'vence_amanha',  label: 'Vence amanhã',        dias: 1,    cor: '#C9A84C', bgCor: 'rgba(201,168,76,0.12)' }
  if (diff <= 7)   return { status: 'vence_em_breve',label: `Vence em ${diff}d`,   dias: diff, cor: '#C9A84C', bgCor: 'rgba(201,168,76,0.1)'  }
  if (diff <= 30)  return { status: 'a_vencer',      label: `Vence em ${diff}d`,   dias: diff, cor: '#9B9690', bgCor: 'rgba(155,150,144,0.08)' }
  if (diff > 30)   return { status: 'ok',            label: `Vence em ${diff}d`,   dias: diff, cor: '#5CB88A', bgCor: 'rgba(92,184,138,0.08)'  }

  const atraso = Math.abs(diff)
  if (atraso === 0) return { status: 'venceu_hoje',   label: 'Venceu hoje',         dias: diff, cor: '#E05C5C', bgCor: 'rgba(224,92,92,0.12)' }
  if (atraso <= 3)  return { status: 'atrasado_leve', label: `Venceu há ${atraso}d`,dias: diff, cor: '#E05C5C', bgCor: 'rgba(224,92,92,0.1)'  }
  if (atraso <= 15) return { status: 'atrasado',      label: `Atrasado ${atraso}d`, dias: diff, cor: '#E05C5C', bgCor: 'rgba(224,92,92,0.12)' }
  return              { status: 'atrasado_grave', label: `Atrasado ${atraso}d`, dias: diff, cor: '#E05C5C', bgCor: 'rgba(224,92,92,0.16)' }
}

/** Calcula se um contrato de locação precisa de reajuste (aniversário nos próximos 30 dias) */
export function calcReajuste(dataInicioISO: string | null | undefined, indice: string | null): {
  precisaReajuste: boolean
  diasParaAniversario: number
  label: string
} {
  if (!dataInicioISO) return { precisaReajuste: false, diasParaAniversario: Infinity, label: '' }

  const inicio = new Date(dataInicioISO + 'T00:00:00')
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  // Próximo aniversário anual
  const proximo = new Date(inicio)
  proximo.setFullYear(hoje.getFullYear())
  if (proximo < hoje) proximo.setFullYear(hoje.getFullYear() + 1)

  const dias = Math.round((proximo.getTime() - hoje.getTime()) / 86400000)
  const precisaReajuste = dias <= 30

  return {
    precisaReajuste,
    diasParaAniversario: dias,
    label: precisaReajuste
      ? dias === 0 ? `Reajuste hoje (${indice || 'IGPM'})`
      : dias === 1 ? `Reajuste amanhã (${indice || 'IGPM'})`
      : `Reajuste em ${dias}d (${indice || 'IGPM'})`
      : '',
  }
}

/** Formata valor em BRL sem centavos para KPIs */
export function fmtBRL(v: number): string {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1).replace('.', ',')}M`
  if (v >= 1_000)     return `R$ ${(v / 1_000).toFixed(0)}k`
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
}

/** Formata valor completo */
export function fmtBRLFull(v: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

/** Mês anterior / seguinte para navegação temporal */
export function mesAnterior(mes: string): string {
  const [ano, m] = mes.split('-').map(Number)
  const d = new Date(ano, m - 2, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
export function mesSeguinte(mes: string): string {
  const [ano, m] = mes.split('-').map(Number)
  const d = new Date(ano, m, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
export function mesAtual(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
export function formatarMes(mes: string): string {
  const [ano, m] = mes.split('-').map(Number)
  const nomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  return `${nomes[m - 1]} ${ano}`
}
