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
  prop_nome: string | null
  prop_whatsapp: string | null
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
