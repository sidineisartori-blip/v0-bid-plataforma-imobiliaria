'use client'

import { useState, useOptimistic } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ModalCard from './ModalCard'
import ModalAddCard from './ModalAddCard'

const COLUNAS = [
  'Parceria Ativa',
  'Visita Agendada',
  'Proposta Enviada',
  'Negociacao',
  'Doc & Juridico',
  'Concluido',
] as const

type Coluna = typeof COLUNAS[number]

interface Negociacao {
  id: string
  coluna: string
  titulo?: string | null
  detalhe?: string | null
  updated_at: string
  parceria?: {
    id?: string
    comissao_split?: string
    status?: string
    dados_liberados?: boolean
    corretor_proponente_id?: string
    corretor_receptor_id?: string
    match?: {
      score?: number
      tipo?: string
      imovel?: { titulo?: string; bairro?: string; cidade?: string; valor?: number }
      solicitacao?: { cliente_nome?: string; cidade?: string }
    }
  } | null
}

interface CRMClientProps {
  negociacoes: Negociacao[]
  corretorId: string
}

function getCardTitulo(card: Negociacao) {
  return (
    card.parceria?.match?.imovel?.titulo ||
    (card.parceria?.match?.solicitacao?.cliente_nome
      ? `Sol. ${card.parceria.match.solicitacao.cliente_nome}`
      : card.titulo || 'Card manual')
  )
}

function getCardDetalhe(card: Negociacao) {
  return (
    (card.parceria?.match?.imovel?.bairro
      ? `${card.parceria.match.imovel.bairro}, ${card.parceria.match.imovel.cidade}`
      : card.parceria?.match?.solicitacao?.cidade) ||
    card.detalhe ||
    ''
  )
}

function isInterno(card: Negociacao) {
  return card.parceria?.match?.tipo === 'interno'
}

function isParado(card: Negociacao) {
  const dias = Math.floor(
    (Date.now() - new Date(card.updated_at).getTime()) / (1000 * 60 * 60 * 24)
  )
  return dias >= 15 && card.coluna !== 'Concluido'
}

export default function CRMClient({ negociacoes, corretorId }: CRMClientProps) {
  const router = useRouter()
  const supabase = createClient()

  const [cardSelecionado, setCardSelecionado] = useState<Negociacao | null>(null)
  const [showAddCard, setShowAddCard] = useState(false)
  const [optimisticNeg, updateOptimistic] = useOptimistic(
    negociacoes,
    (state, { id, coluna }: { id: string; coluna: string }) =>
      state.map((n) => (n.id === id ? { ...n, coluna } : n))
  )

  const cardosParados = negociacoes.filter(isParado)

  async function handleDragDrop(cardId: string, novaColuna: string) {
    updateOptimistic({ id: cardId, coluna: novaColuna })
    const card = negociacoes.find((n) => n.id === cardId)
    if (!card || card.coluna === novaColuna) return
    await supabase.from('negociacao_historico').insert({
      negociacao_id: cardId,
      coluna_anterior: card.coluna,
      coluna_nova: novaColuna,
      movido_por: corretorId,
    })
    await supabase
      .from('negociacoes')
      .update({ coluna: novaColuna, updated_at: new Date().toISOString() })
      .eq('id', cardId)
    router.refresh()
  }

  return (
    <div className="p-8 flex flex-col gap-6" style={{ color: 'var(--color-text)' }}>
      {/* Alertas */}
      {cardosParados.length > 0 && (
        <div
          className="rounded-sm border px-4 py-3 text-sm"
          style={{
            backgroundColor: 'rgba(201,168,76,0.07)',
            borderColor: 'rgba(201,168,76,0.25)',
            color: 'var(--color-gold)',
          }}
        >
          {cardosParados.length} negociacao(es) sem atualizacao ha mais de 15 dias.
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            CRM Kanban
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted)' }}>
            {negociacoes.length} negociacao(es) ativas
          </p>
        </div>
        <button
          onClick={() => setShowAddCard(true)}
          className="text-sm px-4 py-2 rounded-sm font-medium"
          style={{ backgroundColor: 'var(--color-gold)', color: 'var(--color-dark)' }}
        >
          + Novo Card
        </button>
      </div>

      {/* Board */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 172px)',
          gap: '7px',
          overflowX: 'auto',
          paddingBottom: '8px',
          minWidth: '1100px',
        }}
      >
        {COLUNAS.map((coluna) => {
          const cards = optimisticNeg.filter((n) => n.coluna === coluna)
          return (
            <div
              key={coluna}
              className="rounded-sm flex flex-col"
              style={{
                backgroundColor: 'var(--color-dark-3)',
                padding: '9px',
                minHeight: '300px',
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const cardId = e.dataTransfer.getData('cardId')
                if (cardId) handleDragDrop(cardId, coluna)
              }}
            >
              {/* Coluna Header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <p
                  className="text-[9px] uppercase tracking-widest font-semibold"
                  style={{ color: 'var(--color-gold)' }}
                >
                  {coluna}
                </p>
                <span
                  className="text-[9px] font-mono"
                  style={{ color: 'var(--color-muted)' }}
                >
                  ({cards.length})
                </span>
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-2 flex-1">
                {cards.map((card) => {
                  const titulo = getCardTitulo(card)
                  const detalhe = getCardDetalhe(card)
                  const parado = isParado(card)
                  const interno = isInterno(card)

                  const borderColor = parado
                    ? 'var(--color-red)'
                    : interno
                    ? 'var(--color-blue)'
                    : 'var(--color-gold)'

                  return (
                    <div
                      key={card.id}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData('cardId', card.id)}
                      onClick={() => setCardSelecionado(card)}
                      className="rounded-sm cursor-pointer transition-all"
                      style={{
                        backgroundColor: 'var(--color-dark-4)',
                        borderLeft: `2px solid ${borderColor}`,
                        padding: '8px 10px',
                      }}
                    >
                      <p
                        className="text-[11px] font-semibold leading-tight"
                        style={{ color: 'var(--color-text)' }}
                      >
                        {titulo}
                      </p>
                      {detalhe && (
                        <p
                          className="text-[10px] mt-0.5 truncate"
                          style={{ color: 'var(--color-muted)' }}
                        >
                          {detalhe}
                        </p>
                      )}
                      {card.parceria?.match?.tipo && (
                        <span
                          className="inline-block text-[9px] uppercase tracking-wide mt-1.5 px-1 py-0.5 rounded-sm"
                          style={{
                            color: interno ? 'var(--color-blue)' : 'var(--color-gold)',
                            backgroundColor: interno
                              ? 'rgba(92,155,224,0.12)'
                              : 'rgba(201,168,76,0.12)',
                          }}
                        >
                          {card.parceria.match.tipo}
                        </span>
                      )}
                    </div>
                  )
                })}

                {/* Botao + Card */}
                <button
                  onClick={() => setShowAddCard(true)}
                  className="mt-auto w-full rounded-sm border border-dashed text-[11px] py-2 transition-colors"
                  style={{
                    borderColor: 'rgba(201,168,76,0.14)',
                    color: 'var(--color-muted)',
                  }}
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLButtonElement).style.borderColor =
                      'rgba(201,168,76,0.30)'
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLButtonElement).style.borderColor =
                      'rgba(201,168,76,0.14)'
                  }}
                >
                  + Card
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modals */}
      {cardSelecionado && (
        <ModalCard
          card={cardSelecionado}
          corretorId={corretorId}
          onClose={() => setCardSelecionado(null)}
        />
      )}
      {showAddCard && <ModalAddCard corretorId={corretorId} onClose={() => setShowAddCard(false)} />}
    </div>
  )
}
