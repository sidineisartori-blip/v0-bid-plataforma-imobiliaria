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

interface ModalAddCardProps {
  onClose: () => void
}

export default function ModalAddCard({ onClose }: ModalAddCardProps) {
  const router = useRouter()
  const supabase = createClient()

  const [coluna, setColuna] = useState<string>('Parceria Ativa')
  const [titulo, setTitulo] = useState('')
  const [detalhe, setDetalhe] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCriar() {
    if (!titulo.trim()) return
    setLoading(true)
    try {
      await supabase.from('negociacoes').insert({
        coluna,
        titulo: titulo.trim(),
        detalhe: detalhe.trim() || null,
      })
      router.refresh()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-[420px] rounded-sm border p-7 flex flex-col gap-5"
        style={{
          backgroundColor: 'var(--color-dark-2)',
          borderColor: 'rgba(201,168,76,0.2)',
        }}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg font-bold" style={{ color: 'var(--color-text)' }}>
            Novo Card
          </h2>
          <button onClick={onClose} className="text-xl leading-none" style={{ color: 'var(--color-muted)' }}>
            ×
          </button>
        </div>

        <div>
          <label className="block text-[11px] font-medium mb-1.5" style={{ color: 'var(--color-muted)' }}>
            Coluna
          </label>
          <select
            value={coluna}
            onChange={(e) => setColuna(e.target.value)}
            className="w-full rounded-sm border px-3 py-2 text-sm outline-none"
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
        </div>

        <div>
          <label className="block text-[11px] font-medium mb-1.5" style={{ color: 'var(--color-muted)' }}>
            Titulo
          </label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ex: Casa em Jd. America"
            className="w-full rounded-sm border px-3 py-2 text-sm outline-none"
            style={{
              backgroundColor: 'var(--color-dark-3)',
              borderColor: 'var(--color-dark-4)',
              color: 'var(--color-text)',
            }}
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium mb-1.5" style={{ color: 'var(--color-muted)' }}>
            Detalhe / Observacao
          </label>
          <input
            type="text"
            value={detalhe}
            onChange={(e) => setDetalhe(e.target.value)}
            placeholder="Ex: Cliente aguarda aprovacao de credito"
            className="w-full rounded-sm border px-3 py-2 text-sm outline-none"
            style={{
              backgroundColor: 'var(--color-dark-3)',
              borderColor: 'var(--color-dark-4)',
              color: 'var(--color-text)',
            }}
          />
        </div>

        <div className="flex items-center gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-sm border transition-colors"
            style={{ borderColor: 'var(--color-dark-4)', color: 'var(--color-muted)' }}
          >
            Cancelar
          </button>
          <button
            onClick={handleCriar}
            disabled={loading || !titulo.trim()}
            className="px-5 py-2 text-sm rounded-sm font-medium transition-colors"
            style={{
              backgroundColor: titulo.trim() ? 'var(--color-gold)' : 'rgba(201,168,76,0.3)',
              color: titulo.trim() ? 'var(--color-dark)' : 'var(--color-muted)',
            }}
          >
            {loading ? 'Criando...' : 'Criar Card'}
          </button>
        </div>
      </div>
    </div>
  )
}
