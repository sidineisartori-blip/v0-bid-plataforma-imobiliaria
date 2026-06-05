'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface MatchItem {
  id: string
  score: number
  tipo: 'externo' | 'interno'
  imovel?: { titulo?: string; bairro?: string; cidade?: string; corretor_id?: string }
  solicitacao?: { cliente_nome?: string; cidade?: string; corretor_id?: string }
}

interface Corretor {
  id: string
  full_name: string
  creci: string | null
  nota_media: number
  total_avaliacoes: number
  deals_closed: number
  plano: string
}

interface ModalParceiraProps {
  match: MatchItem
  parceiro: Corretor
  corretorId: string
  onClose: () => void
}

const SELOS: Record<string, string> = {
  platinum: 'Platinum',
  premium: 'Gold',
  pro: 'Silver',
  basico: 'Standard',
}

export default function ModalParceria({ match, parceiro, corretorId, onClose }: ModalParceiraProps) {
  const router = useRouter()
  const supabase = createClient()

  const [comissao, setComissao] = useState('50/50')
  const [responsavel, setResponsavel] = useState('Proponente (eu)')
  const [prazo, setPrazo] = useState('30')
  const [obs, setObs] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const parceiroId =
    match.imovel?.corretor_id === corretorId
      ? match.solicitacao?.corretor_id
      : match.imovel?.corretor_id

  const titulo =
    match.imovel?.titulo ||
    `Solicitação de ${match.solicitacao?.cliente_nome || '—'}`

  const selo = SELOS[parceiro.plano] || 'Standard'

  async function handleEnviar() {
    setLoading(true)
    setError(null)
    try {
      await supabase
        .from('matches')
        .update({
          status: 'aceito',
          comissao_split: comissao,
          responsavel_atend: responsavel,
          prazo_parceria_dias: Number(prazo),
          obs_parceria: obs,
        })
        .eq('id', match.id)

      const { data: parceria, error: parceiroErr } = await supabase
        .from('parcerias')
        .insert({
          match_id: match.id,
          corretor_proponente_id: corretorId,
          corretor_receptor_id: parceiroId,
          comissao_split: comissao,
          responsavel_atendimento: responsavel,
          prazo_dias: Number(prazo),
          observacoes: obs,
          status: 'ativa',
          dados_liberados: true,
          is_partnership: true,
        })
        .select()
        .single()

      if (parceiroErr) throw parceiroErr

      // Cria negociacao para AMBOS os corretores (proponente e receptor)
      await supabase.from('negociacoes').insert([
        {
          parceria_id: parceria.id,
          coluna: 'Parceria Ativa',
          corretor_id: corretorId,
        },
        {
          parceria_id: parceria.id,
          coluna: 'Parceria Ativa',
          corretor_id: parceiroId,
        },
      ])

      router.refresh()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar proposta.')
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
        className="w-full max-w-[480px] rounded-sm border p-8 flex flex-col gap-6"
        style={{
          backgroundColor: 'var(--color-dark-2)',
          borderColor: 'rgba(201,168,76,0.2)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl font-bold" style={{ color: 'var(--color-text)' }}>
            Propor Parceria
          </h2>
          <button
            onClick={onClose}
            className="text-lg leading-none transition-colors"
            style={{ color: 'var(--color-muted)' }}
          >
            ×
          </button>
        </div>

        {/* Card do Parceiro */}
        <div
          className="rounded-sm border p-4"
          style={{
            backgroundColor: 'var(--color-dark-3)',
            borderColor: 'rgba(201,168,76,0.15)',
          }}
        >
          <div className="flex items-start justify-between mb-1">
            <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
              {parceiro.full_name}
            </span>
            <span
              className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-sm font-semibold"
              style={{
                backgroundColor: 'rgba(201,168,76,0.12)',
                color: 'var(--color-gold)',
              }}
            >
              {selo}
            </span>
          </div>
          <p className="text-[11px] mb-2" style={{ color: 'var(--color-muted)' }}>
            CRECI {parceiro.creci || '—'} · {parceiro.deals_closed} negociações concluídas
          </p>
          <p className="text-[11px]" style={{ color: 'var(--color-muted)' }}>
            Score de compatibilidade:{' '}
            <span style={{ color: 'var(--color-gold)' }}>{match.score}%</span>
            {' · '}
            {titulo}
          </p>
        </div>

        {/* Formulário */}
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-[11px] font-medium mb-1.5" style={{ color: 'var(--color-muted)' }}>
              Divisão de Comissão
            </label>
            <select
              value={comissao}
              onChange={(e) => setComissao(e.target.value)}
              className="w-full rounded-sm border px-3 py-2 text-sm outline-none transition-colors"
              style={{
                backgroundColor: 'var(--color-dark-3)',
                borderColor: 'var(--color-dark-4)',
                color: 'var(--color-text)',
              }}
            >
              {['50/50', '60/40', '70/30', '40/60', '30/70'].map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium mb-1.5" style={{ color: 'var(--color-muted)' }}>
              Responsável pelo Atendimento
            </label>
            <select
              value={responsavel}
              onChange={(e) => setResponsavel(e.target.value)}
              className="w-full rounded-sm border px-3 py-2 text-sm outline-none"
              style={{
                backgroundColor: 'var(--color-dark-3)',
                borderColor: 'var(--color-dark-4)',
                color: 'var(--color-text)',
              }}
            >
              {['Proponente (eu)', 'Receptor (parceiro)', 'Ambos'].map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium mb-1.5" style={{ color: 'var(--color-muted)' }}>
              Prazo de Validade
            </label>
            <select
              value={prazo}
              onChange={(e) => setPrazo(e.target.value)}
              className="w-full rounded-sm border px-3 py-2 text-sm outline-none"
              style={{
                backgroundColor: 'var(--color-dark-3)',
                borderColor: 'var(--color-dark-4)',
                color: 'var(--color-text)',
              }}
            >
              <option value="30">30 dias</option>
              <option value="60">60 dias</option>
              <option value="90">90 dias</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium mb-1.5" style={{ color: 'var(--color-muted)' }}>
              Observações
            </label>
            <textarea
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              rows={3}
              placeholder="Combinados adicionais..."
              className="w-full rounded-sm border px-3 py-2 text-sm outline-none resize-none"
              style={{
                backgroundColor: 'var(--color-dark-3)',
                borderColor: 'var(--color-dark-4)',
                color: 'var(--color-text)',
              }}
            />
          </div>
        </div>

        {/* Nota Certisign */}
        <p
          className="text-[11px] rounded-sm border px-3 py-2.5 leading-relaxed"
          style={{
            color: 'var(--color-gold)',
            backgroundColor: 'rgba(201,168,76,0.06)',
            borderColor: 'rgba(201,168,76,0.15)',
          }}
        >
          Após aceite mútuo: A Certisign enviará o contrato para assinatura digital de ambos. Os dados completos do imóvel e do cliente só serão liberados após as duas assinaturas.
        </p>

        {error && (
          <p className="text-xs" style={{ color: 'var(--color-red)' }}>{error}</p>
        )}

        {/* Footer */}
        <div className="flex items-center gap-3 justify-end pt-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm rounded-sm border transition-colors"
            style={{
              borderColor: 'var(--color-dark-4)',
              color: 'var(--color-muted)',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleEnviar}
            disabled={loading}
            className="px-5 py-2 text-sm rounded-sm font-medium transition-colors"
            style={{
              backgroundColor: loading ? 'rgba(201,168,76,0.5)' : 'var(--color-gold)',
              color: 'var(--color-dark)',
            }}
          >
            {loading ? 'Enviando...' : 'Enviar Proposta'}
          </button>
        </div>
      </div>
    </div>
  )
}
