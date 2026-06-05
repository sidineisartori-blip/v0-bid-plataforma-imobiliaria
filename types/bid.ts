export type ImovelStatus = 'aguardando_assinatura' | 'ativo' | 'pausado' | 'negociacao' | 'concluido'
export type MatchStatus = 'pendente' | 'aceito' | 'recusado'
export type MatchTipo = 'externo' | 'interno'
export type KanbanColuna = 'Parceria Ativa' | 'Visita Agendada' | 'Proposta Enviada' | 'Negociação' | 'Doc & Jurídico' | 'Concluído'

export interface Corretor {
  id: string
  slug: string
  full_name: string
  phone: string | null
  email: string
  avatar_url: string | null
  city: string | null
  creci: string | null
  nota_media: number
  total_avaliacoes: number
  plano: string
  deals_closed: number
  is_active: boolean
  created_at: string
}

export interface Imovel {
  id: string
  corretor_id: string
  titulo: string
  descricao: string | null
  tipo_negocio: 'Venda' | 'Locação'
  tipo_imovel: string
  cidade: string
  bairro: string | null
  endereco: string | null
  cep: string | null
  estado: string | null
  logradouro: string | null
  numero: string | null
  complemento: string | null
  quartos: number
  banheiros: number
  vagas: number
  area_total: number | null
  valor: number
  valor_aluguel: number | null
  image_urls: string[]
  status: ImovelStatus
  aceita_animal: boolean
  lancamento: boolean
  publico_no_site: boolean
  matching_ativo: boolean
  // Proprietário
  prop_nome: string | null
  prop_cpf_cnpj: string | null
  prop_nacionalidade: string | null
  prop_estado_civil: string | null
  prop_profissao: string | null
  prop_rg: string | null
  prop_whatsapp: string | null
  prop_email: string | null
  prop_conjuge_nome: string | null
  prop_conjuge_cpf: string | null
  prop_conjuge_whatsapp: string | null
  // Imóvel
  prop_matricula: string | null
  cartorio_registro: string | null
  // Condições financeiras
  percentual_comissao: string | null
  formas_pagamento: string[] | null
  aceita_negociacao: string | null
  // Prazo
  validade_autorizacao: string | null
  exclusividade: string | null
  match_count: number
  view_count: number
  created_at: string
}

export interface Solicitacao {
  id: string
  corretor_id: string
  cliente_nome: string
  cliente_phone: string
  cliente_email: string | null
  tipo_negocio: 'Comprar' | 'Alugar'
  tipo_imovel: string
  cidade: string
  bairro_desejado: string | null
  quartos: number | null
  banheiros: number | null
  vagas: number
  valor_min: number | null
  valor_max: number | null
  tem_animal: boolean
  prazo_fechar: string
  observacoes: string | null
  status: string
  created_at: string
}

export interface Match {
  id: string
  imovel_id: string
  solicitacao_id: string
  score: number
  tipo: MatchTipo
  status: MatchStatus
  created_at: string
  imovel?: Pick<Imovel, 'titulo' | 'bairro' | 'cidade' | 'valor'>
  solicitacao?: Pick<Solicitacao, 'cliente_nome' | 'cidade'>
}

export interface Negociacao {
  id: string
  parceria_id: string
  coluna: KanbanColuna
  created_at: string
  updated_at: string
}

export interface Cidade {
  id: string
  name: string
  state: string
}

// Tipos para joins/relações usados nas páginas
export interface MatchComRelacoes extends Match {
  imovel?: Pick<Imovel, 'titulo' | 'bairro' | 'cidade' | 'valor'> & {
    id?: string
    quartos?: number
    banheiros?: number
    vagas?: number
    tipo_imovel?: string
    corretor_id?: string
  }
  solicitacao?: Pick<Solicitacao, 'cliente_nome' | 'cidade'> & {
    id?: string
    bairro_desejado?: string | null
    valor_min?: number | null
    valor_max?: number | null
    quartos?: number | null
    corretor_id?: string
  }
}

export interface Avaliacao {
  id: string
  nota_final: number
  comentario: string | null
  created_at: string
  avaliador?: { full_name: string } | null
}

export interface Parceria {
  id: string
  comissao_split: string | null
  status: string
  dados_liberados: boolean
  corretor_proponente_id: string
  corretor_receptor_id: string
  match?: {
    score?: number
    tipo?: string
    imovel?: Pick<Imovel, 'titulo' | 'bairro' | 'cidade' | 'valor'>
    solicitacao?: Pick<Solicitacao, 'cliente_nome' | 'cidade'>
  } | null
}

export interface NegociacaoComParceria extends Omit<Negociacao, 'parceria_id'> {
  titulo?: string | null
  detalhe?: string | null
  parceria?: Parceria | null
}

export interface ChatNegociacao {
  id: string
  coluna: string
  updated_at: string
  parceria?: {
    id: string
    comissao_split: string | null
    corretor_proponente_id: string
    corretor_receptor_id: string
    match?: {
      imovel?: { titulo?: string; bairro?: string; cidade?: string }
      solicitacao?: { cliente_nome?: string }
    } | null
    proponente?: { id: string; full_name: string; avatar_url: string | null } | null
    receptor?: { id: string; full_name: string; avatar_url: string | null } | null
  } | null
}

export interface Assinatura {
  id: string
  corretor_id: string
  plano: string
  status: string
  valor_mensal: number
  periodo_inicio: string
  periodo_fim: string | null
}
