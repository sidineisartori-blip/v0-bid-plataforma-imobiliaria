import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const min = Math.floor(diff / 60000)
  const h   = Math.floor(diff / 3600000)
  const d   = Math.floor(diff / 86400000)
  if (min < 1)  return 'agora'
  if (min < 60) return `${min}min`
  if (h < 24)   return `${h}h`
  if (d < 7)    return `${d}d`
  return new Date(date).toLocaleDateString('pt-BR')
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export function getSelo(nota: number, negocios: number): string {
  if (nota >= 4.5 && negocios >= 20) return 'Platinum'
  if (nota >= 4.0 && negocios >= 10) return 'Gold'
  if (nota >= 3.5 && negocios >= 5)  return 'Silver'
  return 'Standard'
}

export function getImovelIcon(tipo: string): string {
  const map: Record<string, string> = {
    Apartamento: 'Apt',
    Casa:        'Casa',
    Comercial:   'Com',
    Terreno:     'Ter',
    Rural:       'Rur',
  }
  return map[tipo] || 'Apt'
}

export function calcularScore(
  imovel: {
    cidade: string
    quartos: number
    banheiros: number
    vagas: number
    valor: number
    bairro: string | null
    aceita_animal: boolean
  },
  solicitacao: {
    cidade: string
    quartos: number | null
    banheiros: number | null
    vagas: number
    valor_min: number | null
    valor_max: number | null
    bairro_desejado: string | null
    tem_animal: boolean
  }
): number {
  if (imovel.cidade !== solicitacao.cidade) return -1

  let pts = 0
  let max = 80

  const dq = imovel.quartos - (solicitacao.quartos || 0)
  if (dq === 0)      pts += 20
  else if (dq === 1) pts += 10

  const db = imovel.banheiros - (solicitacao.banheiros || 0)
  if (db === 0)      pts += 20
  else if (db === 1) pts += 10

  const dv = imovel.vagas - (solicitacao.vagas || 0)
  if (dv === 0)      pts += 20
  else if (dv === 1) pts += 10

  const vMin = solicitacao.valor_min || 0
  const vMax = solicitacao.valor_max || 0
  if (vMax > 0) {
    const vMid = (vMin + vMax) / 2
    const diff = Math.abs(imovel.valor - vMid) / vMid
    if (diff <= 0.15)      pts += 20
    else if (diff <= 0.25) pts += 15
  }

  if (solicitacao.bairro_desejado && imovel.bairro === solicitacao.bairro_desejado) {
    pts += 10
    max += 10
  }

  if (solicitacao.tem_animal && imovel.aceita_animal) {
    pts += 10
    max += 10
  }

  return Math.round((pts / max) * 100)
}
