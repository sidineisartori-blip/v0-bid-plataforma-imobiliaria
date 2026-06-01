'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ModalParceria from './ModalParceria'

interface Corretor {
  id: string
  full_name: string
  creci: string | null
  nota_media: number
  total_avaliacoes: number
  deals_closed: number
  avatar_url: string | null
  plano: string
}

interface MatchItem {
  id: string
  score: number
  tipo: 'externo' | 'interno'
  status: 'pendente' | 'aceito' | 'recusado'
  imovel?: {
    id?: string
    titulo?: string
    bairro?: string
    cidade?: string
    valor?: number
    corretor_id?: string
  }
  solicitacao?: {
    id?: string
    cliente_nome?: string
    cidade?: string
    bairro_desejado?: string
    valor_min?: number
    valor_max?: number
    quartos?: number
    corretor_id?: string
  }
}

interface MatchesClientProps {
  matches: MatchItem[]
  corretores: Corretor[]
  corretorId: string
}

const SELOS: Record<string, { label: string; color: string }> = {
  platinum: { label: 'Platinum', color: '#C9A84C' },
  premium:  { label: 'Gold',     color: '#C9A84C' },
  pro:      { label: 'Silver',   color: '#9B9690' },
  basico:   { label: 'Standard', color: '#9B9690' },
}

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  pendente:  { label: 'Pendente',  color: 'var(--color-gold)' },
  aceito:    { label: 'Aceito',    color: 'var(--color-green)' },
  recusado:  { label: 'Recusado', color: 'var(--color-red)' },
}

export default function MatchesClient({ matches, corretores, corretorId }: MatchesClientProps) {
  const router = useRouter()
  const supabase = createClient()

  const [modalMatch, setModalMatch] = useState<MatchItem | null>(null)
  const [loading, setLoading] = useState<string | null>(null)

  const corretorMap = Object.fromEntries(corretores.map((c) => [c.id, c]))

  const externos = matches.filter((m) => m.tipo === 'externo' && m.status === 'pendente')
  const internos = matches.filter((m) => m.tipo === 'interno' && m.status === 'pendente')

  function getParceiro(match: MatchItem): Corretor | null {
    const id =
      match.imovel?.corretor_id === corretorId
        ? match.solicitacao?.corretor_id
        : match.imovel?.corretor_id
    return id ? corretorMap[id] || null : null
  }

  async function handleRecusar(matchId: string) {
    setLoading(matchId)
    await supabase.from('matches').update({ status: 'recusado' }).eq('id', matchId)
    setLoading(null)
    router.refresh()
  }

  async function handleIniciarAtendimento(match: MatchItem) {
    setLoading(match.id)
    await supabase.from('matches').update({ status: 'aceito' }).eq('id', match.id)
    await supabase.from('negociacoes').insert({ coluna: 'Parceria Ativa' })
    setLoading(null)
    router.refresh()
  }

  return (
    <div className="p-8" style={{ color: 'var(--color-text)' }}>
      {/* Alertas */}
      <div className="flex flex-col gap-3 mb-8">
        {externos.length > 0 && (
          <div
            className="rounded-sm border px-4 py-3 text-sm"
            style={{
              backgroundColor: 'rgba(201,168,76,0.07)',
              borderColor: 'rgba(201,168,76,0.25)',
              color: 'var(--color-gold)',
            }}
          >
            Voce tem {externos.length} interessado(s) em imoveis compativeis.
          </div>
        )}
        {internos.length > 0 && (
          <div
            className="rounded-sm border px-4 py-3 text-sm"
            style={{
              backgroundColor: 'rgba(92,155,224,0.07)',
              borderColor: 'rgba(92,155,224,0.25)',
              color: 'var(--color-blue)',
            }}
          >
            Voce tem {internos.length} compatibilidade(s) interna(s) na sua carteira.
          </div>
        )}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            Todos os Matches
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted)' }}>
            {matches.length} total &middot;{' '}
            {matches.filter((m) => m.status === 'pendente').length} pendentes
          </p>
        </div>
      </div>

      {/* Lista */}
      {matches.length === 0 ? (
        <div
          className="rounded-sm border flex items-center justify-center py-20 text-sm"
          style={{
            backgroundColor: 'var(--color-dark-2)',
            borderColor: 'rgba(201,168,76,0.1)',
            color: 'var(--color-muted)',
          }}
        >
          Nenhum match ainda. Cadastre imoveis e clique em Motor de Matching para rodar o algoritmo.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {matches.map((match) => {
            const parceiro = getParceiro(match)
            const selo = parceiro ? SELOS[parceiro.plano] || SELOS.basico : SELOS.basico
            const statusBadge = STATUS_BADGE[match.status] || STATUS_BADGE.pendente
            const titulo =
              match.imovel?.titulo ||
              `Solicitacao de ${match.solicitacao?.cliente_nome || '—'}`
            const detalhe = match.imovel
              ? `${match.imovel.bairro || ''}, ${match.imovel.cidade || ''}`
              : match.solicitacao?.cidade || '—'

            return (
              <div
                key={match.id}
                className="rounded-sm border p-5 flex items-start gap-5"
                style={{
                  backgroundColor: 'var(--color-dark-2)',
                  borderColor: 'rgba(201,168,76,0.12)',
                }}
              >
                {/* Score */}
                <div className="w-14 flex-shrink-0 text-center">
                  <p
                    className="font-serif text-2xl font-bold leading-none"
                    style={{
                      color: match.tipo === 'interno' ? 'var(--color-blue)' : 'var(--color-gold)',
                    }}
                  >
                    {match.score}%
                  </p>
                  <p className="text-[9px] mt-1" style={{ color: 'var(--color-muted)' }}>
                    {match.tipo === 'interno' ? 'INTERNO' : 'EXTERNO'}
                  </p>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[13px] font-semibold" style={{ color: 'var(--color-text)' }}>
                      {parceiro?.full_name || 'Parceiro desconhecido'}
                    </span>
                    <span
                      className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm font-semibold"
                      style={{ color: selo.color, backgroundColor: 'rgba(201,168,76,0.1)' }}
                    >
                      {selo.label}
                    </span>
                    {parceiro?.creci && (
                      <span className="text-[10px]" style={{ color: 'var(--color-muted)' }}>
                        CRECI {parceiro.creci}
                      </span>
                    )}
                  </div>
                  <p className="text-[12px]" style={{ color: 'var(--color-muted)' }}>
                    {titulo}
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-muted)' }}>
                    {detalhe}
                  </p>
                </div>

                {/* Status + Ações */}
                <div className="flex flex-col items-end gap-3 flex-shrink-0">
                  <span
                    className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-sm"
                    style={{
                      color: statusBadge.color,
                      backgroundColor: `${statusBadge.color}18`,
                    }}
                  >
                    {statusBadge.label}
                  </span>

                  {match.status === 'pendente' && (
                    <div className="flex items-center gap-2">
                      {match.tipo === 'externo' ? (
                        <button
                          onClick={() => setModalMatch(match)}
                          disabled={loading === match.id}
                          className="text-[12px] px-3 py-1.5 rounded-sm font-medium transition-colors"
                          style={{
                            backgroundColor: 'var(--color-gold)',
                            color: 'var(--color-dark)',
                          }}
                        >
                          Propor Parceria
                        </button>
                      ) : (
                        <button
                          onClick={() => handleIniciarAtendimento(match)}
                          disabled={loading === match.id}
                          className="text-[12px] px-3 py-1.5 rounded-sm font-medium transition-colors"
                          style={{
                            backgroundColor: 'var(--color-blue)',
                            color: '#fff',
                          }}
                        >
                          {loading === match.id ? 'Aguarde...' : 'Iniciar Atendimento'}
                        </button>
                      )}
                      <button
                        onClick={() => handleRecusar(match.id)}
                        disabled={loading === match.id}
                        className="text-[12px] px-3 py-1.5 rounded-sm border transition-colors"
                        style={{
                          borderColor: 'var(--color-red)',
                          color: 'var(--color-red)',
                        }}
                      >
                        {loading === match.id ? '...' : 'Recusar'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Parceria */}
      {modalMatch && (
        <ModalParceria
          match={modalMatch}
          parceiro={getParceiro(modalMatch) || {
            id: '',
            full_name: 'Parceiro',
            creci: null,
            nota_media: 0,
            total_avaliacoes: 0,
            deals_closed: 0,
            plano: 'basico',
          }}
          corretorId={corretorId}
          onClose={() => setModalMatch(null)}
        />
      )}
    </div>
  )
}
