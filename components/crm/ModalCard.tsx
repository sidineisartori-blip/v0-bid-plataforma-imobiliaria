'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const COLUNAS = [
  'Parceria Ativa',
  'Visita Agendada',
  'Proposta Enviada',
  'Negociacao',
  'Doc & Juridico',
  'Concluido',
] as const

const CHECKLIST_ITEMS = [
  'Matricula atualizada do imovel',
  'Certidoes do proprietario',
  'Documentos do comprador/locatario',
  'Contrato elaborado',
  'Contrato assinado via Certisign',
  'Registro em cartorio',
]

interface Negociacao {
  id: string
  coluna: string
  titulo?: string | null
  detalhe?: string | null
  updated_at?: string
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

interface ModalCardProps {
  card: Negociacao
  corretorId: string
  onClose: () => void
}

export default function ModalCard({ card, corretorId, onClose }: ModalCardProps) {
  const router = useRouter()
  const supabase = createClient()

  const [novaColuna, setNovaColuna] = useState(card.coluna)
  const [checklist, setChecklist] = useState<boolean[]>(new Array(CHECKLIST_ITEMS.length).fill(false))
  const [loading, setLoading] = useState(false)

  const isDocJuridico = novaColuna === 'Doc & Juridico'
  const todosMarcados = checklist.every(Boolean)

  const imovelTitulo =
    card.parceria?.match?.imovel?.titulo ||
    (card.parceria?.match?.solicitacao?.cliente_nome
      ? `Solicitacao de ${card.parceria.match.solicitacao.cliente_nome}`
      : card.titulo || 'Card sem titulo')

  const detalhe =
    card.parceria?.match?.imovel?.bairro
      ? `${card.parceria.match.imovel.bairro}, ${card.parceria.match.imovel.cidade}`
      : card.parceria?.match?.solicitacao?.cidade || card.detalhe || '—'

  const parceiroId =
    card.parceria?.corretor_proponente_id === corretorId
      ? card.parceria?.corretor_receptor_id
      : card.parceria?.corretor_proponente_id

  async function handleMover() {
    if (novaColuna === card.coluna) return
    setLoading(true)
    try {
      await supabase.from('negociacao_historico').insert({
        negociacao_id: card.id,
        coluna_anterior: card.coluna,
        coluna_nova: novaColuna,
        movido_por: corretorId,
      })
      await supabase
        .from('negociacoes')
        .update({ coluna: novaColuna, updated_at: new Date().toISOString() })
        .eq('id', card.id)
      router.refresh()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  async function handleConcluir() {
    setLoading(true)
    try {
      await supabase
        .from('negociacoes')
        .update({ coluna: 'Concluido', updated_at: new Date().toISOString() })
        .eq('id', card.id)
      router.refresh()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  async function handleRemover() {
    setLoading(true)
    try {
      await supabase.from('negociacoes').delete().eq('id', card.id)
      router.refresh()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  function toggleCheck(i: number) {
    setChecklist((prev) => {
      const next = [...prev]
      next[i] = !next[i]
      return next
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-[500px] rounded-sm border flex flex-col gap-5 p-7"
        style={{
          backgroundColor: 'var(--color-dark-2)',
          borderColor: 'rgba(201,168,76,0.2)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-serif text-lg font-bold" style={{ color: 'var(--color-text)' }}>
              {imovelTitulo}
            </h2>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-muted)' }}>
              {detalhe}
            </p>
          </div>
          <button onClick={onClose} className="text-xl leading-none" style={{ color: 'var(--color-muted)' }}>
            ×
          </button>
        </div>

        {/* Infos */}
        <div
          className="rounded-sm border p-4 flex flex-col gap-2 text-[12px]"
          style={{
            backgroundColor: 'var(--color-dark-3)',
            borderColor: 'rgba(201,168,76,0.1)',
          }}
        >
          {card.parceria?.comissao_split && (
            <div className="flex justify-between">
              <span style={{ color: 'var(--color-muted)' }}>Comissao</span>
              <span style={{ color: 'var(--color-text)' }}>{card.parceria.comissao_split}</span>
            </div>
          )}
          {card.parceria?.match?.score && (
            <div className="flex justify-between">
              <span style={{ color: 'var(--color-muted)' }}>Score de Match</span>
              <span style={{ color: 'var(--color-gold)' }}>{card.parceria.match.score}%</span>
            </div>
          )}
          {card.parceria?.status && (
            <div className="flex justify-between">
              <span style={{ color: 'var(--color-muted)' }}>Status da Parceria</span>
              <span style={{ color: 'var(--color-green)' }}>{card.parceria.status}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span style={{ color: 'var(--color-muted)' }}>Coluna atual</span>
            <span style={{ color: 'var(--color-text)' }}>{card.coluna}</span>
          </div>
        </div>

        {/* Mover para Coluna */}
        <div>
          <label className="block text-[11px] font-medium mb-2" style={{ color: 'var(--color-muted)' }}>
            Mover para Coluna
          </label>
          <div className="flex items-center gap-2">
            <select
              value={novaColuna}
              onChange={(e) => setNovaColuna(e.target.value)}
              className="flex-1 rounded-sm border px-3 py-2 text-sm outline-none"
              style={{
                backgroundColor: 'var(--color-dark-3)',
                borderColor: 'var(--color-dark-4)',
                color: 'var(--color-text)',
              }}
            >
              {COLUNAS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button
              onClick={handleMover}
              disabled={loading || novaColuna === card.coluna}
              className="px-4 py-2 text-sm rounded-sm font-medium transition-colors"
              style={{
                backgroundColor: novaColuna === card.coluna ? 'rgba(201,168,76,0.2)' : 'var(--color-gold)',
                color: novaColuna === card.coluna ? 'var(--color-muted)' : 'var(--color-dark)',
              }}
            >
              Mover
            </button>
          </div>
        </div>

        {/* Checklist Doc & Juridico */}
        {isDocJuridico && (
          <div>
            <p className="text-[11px] font-medium mb-3" style={{ color: 'var(--color-muted)' }}>
              Checklist — Doc & Juridico
            </p>
            <div className="flex flex-col gap-2">
              {CHECKLIST_ITEMS.map((item, i) => (
                <label
                  key={i}
                  className="flex items-center gap-3 cursor-pointer text-[12px]"
                  style={{ color: checklist[i] ? 'var(--color-green)' : 'var(--color-text)' }}
                >
                  <input
                    type="checkbox"
                    checked={checklist[i]}
                    onChange={() => toggleCheck(i)}
                    className="accent-green-500"
                  />
                  {item}
                </label>
              ))}
            </div>
            <button
              onClick={handleConcluir}
              disabled={!todosMarcados || loading}
              className="mt-4 w-full py-2 rounded-sm text-sm font-medium transition-colors"
              style={{
                backgroundColor: todosMarcados ? 'var(--color-gold)' : 'rgba(201,168,76,0.2)',
                color: todosMarcados ? 'var(--color-dark)' : 'var(--color-muted)',
              }}
            >
              Concluir Negociacao
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--color-dark-3)' }}>
          <button
            onClick={handleRemover}
            disabled={loading}
            className="text-[12px] px-3 py-1.5 rounded-sm border transition-colors"
            style={{
              borderColor: 'var(--color-red)',
              color: 'var(--color-red)',
            }}
          >
            Remover card
          </button>
          <button
            onClick={onClose}
            className="text-[12px] px-3 py-1.5 rounded-sm border transition-colors"
            style={{
              borderColor: 'var(--color-dark-4)',
              color: 'var(--color-muted)',
            }}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
