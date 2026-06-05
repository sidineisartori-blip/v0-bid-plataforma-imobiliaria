'use client'

import { useState, useOptimistic } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ModalCard from './ModalCard'
import ModalAddCard from './ModalAddCard'
import { ToastContainer, useToastSimples } from '@/components/ui/ToastSimples'

const COLUNAS = [
  'Parceria Ativa',
  'Visita Agendada',
  'Proposta Enviada',
  'Negociacao',
  'Doc & Juridico',
  'Concluido',
] as const

type Coluna = typeof COLUNAS[number]

const COLUNA_DICA: Record<string, string> = {
  'Parceria Ativa':   'Arraste para avançar a negociação',
  'Visita Agendada':  'Visita confirmada com o cliente',
  'Proposta Enviada': 'Aguardando retorno do cliente',
  'Negociacao':       'Em processo de negociação de valores',
  'Doc & Juridico':   'Documentação em andamento',
  'Concluido':        'Negócio fechado!',
}

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

function diasSemAtualizar(card: Negociacao) {
  return Math.floor((Date.now() - new Date(card.updated_at).getTime()) / 86400000)
}

function isParado(card: Negociacao) {
  return diasSemAtualizar(card) >= 15 && card.coluna !== 'Concluido'
}

export default function CRMClient({ negociacoes, corretorId }: CRMClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [toasts, addToast, removerToast] = useToastSimples()

  const [cardSelecionado, setCardSelecionado] = useState<Negociacao | null>(null)
  const [showAddCard, setShowAddCard] = useState(false)
  const [dragSobre, setDragSobre] = useState<string | null>(null)
  const [optimisticNeg, updateOptimistic] = useOptimistic(
    negociacoes,
    (state: Negociacao[], { id, coluna }: { id: string; coluna: string }) =>
      state.map((n: Negociacao) => (n.id === id ? { ...n, coluna } : n))
  )

  const cardosParados = negociacoes.filter(isParado)

  async function handleDragDrop(cardId: string, novaColuna: string) {
    const card = negociacoes.find((n) => n.id === cardId)
    if (!card || card.coluna === novaColuna) return

    updateOptimistic({ id: cardId, coluna: novaColuna })
    setDragSobre(null)

    await supabase.from('negociacao_historico').insert({
      negociacao_id: cardId,
      coluna_anterior: card.coluna,
      coluna_nova: novaColuna,
      movido_por: corretorId,
    })
    const { error } = await supabase
      .from('negociacoes')
      .update({ coluna: novaColuna, updated_at: new Date().toISOString() })
      .eq('id', cardId)

    if (error) {
      addToast('erro', 'Erro ao mover card', error.message)
    } else {
      const titulo = getCardTitulo(card)
      addToast('sucesso', `Movido para ${novaColuna}`, titulo.length > 40 ? titulo.slice(0, 40) + '…' : titulo)
    }
    router.refresh()
  }

  return (
    <div className="p-8 flex flex-col gap-6" style={{ color: 'var(--color-text)' }}>
      <ToastContainer toasts={toasts} onRemover={removerToast} />

      {/* Alertas */}
      {cardosParados.length > 0 && (
        <div
          className="rounded-sm border px-4 py-3 text-sm flex items-center justify-between"
          style={{ backgroundColor: 'rgba(201,168,76,0.07)', borderColor: 'rgba(201,168,76,0.25)', color: 'var(--color-gold)' }}
        >
          <span>⚠ {cardosParados.length} negociação(ões) sem atualização há mais de 15 dias.</span>
          <span style={{ fontSize: 11, color: '#9B9690' }}>Clique no card para atualizar</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            CRM Kanban
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted)' }}>
            {negociacoes.length} negociação(ões) ·{' '}
            {negociacoes.filter(c => c.coluna === 'Concluido').length} concluídas
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

      {/* Empty state global */}
      {negociacoes.length === 0 && (
        <div style={{
          background: '#181819', border: '1px solid rgba(201,168,76,0.1)',
          borderRadius: 2, padding: '60px 20px', textAlign: 'center',
        }}>
          <p style={{ fontSize: 16, color: '#9B9690', marginBottom: 12 }}>
            Nenhuma negociação ativa ainda.
          </p>
          <p style={{ fontSize: 13, color: '#2E2E30', marginBottom: 20 }}>
            Aceite um match ou proponha uma parceria para criar seu primeiro card.
          </p>
          <button
            onClick={() => setShowAddCard(true)}
            style={{ background: '#C9A84C', color: '#0E0E0F', border: 'none', borderRadius: 2, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            + Criar card manual
          </button>
        </div>
      )}

      {/* Board */}
      {negociacoes.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 172px)',
          gap: '7px',
          overflowX: 'auto',
          paddingBottom: '8px',
          minWidth: '1100px',
        }}>
          {COLUNAS.map((coluna) => {
            const cards = optimisticNeg.filter((n: Negociacao) => n.coluna === coluna)
            const isDragTarget = dragSobre === coluna
            return (
              <div
                key={coluna}
                className="rounded-sm flex flex-col"
                style={{
                  backgroundColor: isDragTarget ? 'rgba(201,168,76,0.06)' : 'var(--color-dark-3)',
                  border: isDragTarget ? '1px solid rgba(201,168,76,0.3)' : '1px solid transparent',
                  padding: '9px',
                  minHeight: '300px',
                  transition: 'background 0.15s, border 0.15s',
                }}
                onDragOver={(e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setDragSobre(coluna) }}
                onDragLeave={() => setDragSobre(null)}
                onDrop={(e: React.DragEvent<HTMLDivElement>) => {
                  const cardId = e.dataTransfer.getData('cardId')
                  if (cardId) handleDragDrop(cardId, coluna)
                }}
              >
                {/* Coluna Header */}
                <div className="flex items-center justify-between mb-1 px-1">
                  <p className="text-[9px] uppercase tracking-widest font-semibold" style={{ color: 'var(--color-gold)' }}>
                    {coluna}
                  </p>
                  <span className="text-[9px] font-mono" style={{ color: 'var(--color-muted)' }}>
                    ({cards.length})
                  </span>
                </div>
                {/* Dica da coluna */}
                <p style={{ fontSize: 9, color: '#2E2E30', marginBottom: 8, paddingLeft: 4, lineHeight: 1.3 }}>
                  {COLUNA_DICA[coluna]}
                </p>

                {/* Cards */}
                <div className="flex flex-col gap-2 flex-1">
                  {cards.length === 0 && (
                    <div style={{
                      border: '1px dashed rgba(201,168,76,0.1)',
                      borderRadius: 2,
                      padding: '16px 8px',
                      textAlign: 'center',
                      fontSize: 10,
                      color: '#2E2E30',
                    }}>
                      Arraste um card aqui
                    </div>
                  )}
                  {cards.map((card: Negociacao) => {
                    const titulo = getCardTitulo(card)
                    const detalhe = getCardDetalhe(card)
                    const parado = isParado(card)
                    const interno = isInterno(card)
                    const dias = diasSemAtualizar(card)

                    const borderColor = parado
                      ? 'var(--color-red)'
                      : interno
                      ? 'var(--color-blue)'
                      : 'var(--color-gold)'

                    return (
                      <div
                        key={card.id}
                        draggable
                        onDragStart={(e: React.DragEvent<HTMLDivElement>) => e.dataTransfer.setData('cardId', card.id)}
                        onClick={() => setCardSelecionado(card)}
                        className="rounded-sm cursor-pointer transition-all"
                        style={{
                          backgroundColor: 'var(--color-dark-4)',
                          borderLeft: `2px solid ${borderColor}`,
                          padding: '8px 10px',
                        }}
                      >
                        <p className="text-[11px] font-semibold leading-tight" style={{ color: 'var(--color-text)' }}>
                          {titulo}
                        </p>
                        {detalhe && (
                          <p className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--color-muted)' }}>
                            {detalhe}
                          </p>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                          {card.parceria?.match?.tipo && (
                            <span
                              className="inline-block text-[9px] uppercase tracking-wide px-1 py-0.5 rounded-sm"
                              style={{
                                color: interno ? 'var(--color-blue)' : 'var(--color-gold)',
                                backgroundColor: interno ? 'rgba(92,155,224,0.12)' : 'rgba(201,168,76,0.12)',
                              }}
                            >
                              {card.parceria.match.tipo}
                            </span>
                          )}
                          {parado && (
                            <span style={{ fontSize: 9, color: '#E05C5C', backgroundColor: 'rgba(224,92,92,0.1)', padding: '1px 5px', borderRadius: 2 }}>
                              {dias}d parado
                            </span>
                          )}
                          {!parado && dias > 0 && (
                            <span style={{ fontSize: 9, color: '#9B9690' }}>
                              {dias}d
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}

                  {/* Botão + Card */}
                  <button
                    onClick={() => setShowAddCard(true)}
                    className="mt-auto w-full rounded-sm border border-dashed text-[11px] py-2 transition-colors"
                    style={{ borderColor: 'rgba(201,168,76,0.14)', color: 'var(--color-muted)' }}
                    onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(201,168,76,0.30)' }}
                    onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(201,168,76,0.14)' }}
                  >
                    + Card
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

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
