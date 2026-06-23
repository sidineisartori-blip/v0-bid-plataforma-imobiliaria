import type { ImovelStatus } from '@/types/bid'

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR')
}

export const STATUS_LABELS: Record<ImovelStatus, string> = {
  aguardando_assinatura: 'Aguardando Assinatura',
  disponivel: 'Disponível',
  ativo: 'Ativo',
  pausado: 'Pausado',
  negociacao: 'Negociação',
  concluido: 'Concluído',
}

export const STATUS_COLORS: Record<ImovelStatus, { bg: string; text: string }> = {
  ativo: { bg: 'rgba(92,184,138,0.15)', text: '#5CB88A' },
  disponivel: { bg: 'rgba(92,184,138,0.15)', text: '#5CB88A' },
  negociacao: { bg: 'rgba(92,155,224,0.15)', text: '#5C9BE0' },
  aguardando_assinatura: { bg: 'rgba(201,168,76,0.15)', text: '#C9A84C' },
  pausado: { bg: 'rgba(155,150,144,0.15)', text: '#9B9690' },
  concluido: { bg: 'rgba(92,184,138,0.1)', text: '#5CB88A' },
}

// Fallback seguro para status desconhecidos vindos do banco
export const STATUS_COLOR_FALLBACK = { bg: 'rgba(155,150,144,0.15)', text: '#9B9690' }

export const TIPO_IMOVEL_OPTIONS = [
  'Apartamento',
  'Casa',
  'Casa em Condomínio',
  'Terreno',
  'Sala Comercial',
  'Loja',
  'Galpão',
  'Chácara / Sítio',
  'Flat',
  'Studio',
]

export const KANBAN_COLUNAS = [
  'Parceria Ativa',
  'Visita Agendada',
  'Proposta Enviada',
  'Negociação',
  'Doc & Jurídico',
  'Concluído',
] as const

export function getImovelEmoji(tipo: string): string {
  if (tipo.toLowerCase().includes('apart') || tipo.toLowerCase().includes('flat') || tipo.toLowerCase().includes('studio')) return '🏢'
  if (tipo.toLowerCase().includes('terreno')) return '🌳'
  if (tipo.toLowerCase().includes('comercial') || tipo.toLowerCase().includes('sala') || tipo.toLowerCase().includes('loja') || tipo.toLowerCase().includes('galpão')) return '🏗'
  if (tipo.toLowerCase().includes('chácara') || tipo.toLowerCase().includes('sítio')) return '🌿'
  return '🏠'
}
