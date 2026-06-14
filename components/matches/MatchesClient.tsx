'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ModalParceria from './ModalParceria'
import { ToastContainer, useToastSimples } from '@/components/ui/ToastSimples'
import ModalConfirm from '@/components/ui/ModalConfirm'

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
  const [toasts, addToast, removerToast] = useToastSimples()

  const [modalMatch, setModalMatch] = useState<MatchItem | null>(null)
  const [confirmarRecusar, setConfirmarRecusar] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [filtroScore, setFiltroScore] = useState(0)

  const corretorMap = Object.fromEntries(corretores.map((c) => [c.id, c]))

  const externos = matches.filter((m) => m.tipo === 'externo' && m.status === 'pendente')
  const internos = matches.filter((m) => m.tipo === 'interno' && m.status === 'pendente')

  const matchesFiltrados = matches.filter((m) => {
    if (filtroStatus !== 'todos' && m.status !== filtroStatus) return false
    if (filtroTipo !== 'todos' && m.tipo !== filtroTipo) return false
    if (m.score < filtroScore) return false
    return true
  })

  function getParceiro(match: MatchItem): Corretor | null {
    const id =
      match.imovel?.corretor_id === corretorId
        ? match.solicitacao?.corretor_id
        : match.imovel?.corretor_id
    return id ? corretorMap[id] || null : null
  }

  async function handleRecusar(matchId: string) {
    setLoading(matchId)
    const { error } = await supabase.from('matches').update({ status: 'recusado' }).eq('id', matchId)
    setLoading(null)
    setConfirmarRecusar(null)
    if (error) { addToast('erro', 'Erro ao recusar match') }
    else { addToast('info', 'Match recusado') }
    router.refresh()
  }

  async function handleIniciarAtendimento(match: MatchItem) {
    setLoading(match.id)

    try {
      // 1. Marca match como aceito
      const { error: matchErr } = await supabase
        .from('matches')
        .update({ status: 'aceito' })
        .eq('id', match.id)
      if (matchErr) throw matchErr

      // 2. Identifica os dois corretores envolvidos
      const proponenteId = corretorId
      const receptorId =
        match.imovel?.corretor_id === corretorId
          ? match.solicitacao?.corretor_id
          : match.imovel?.corretor_id

      if (!receptorId) throw new Error('Corretor receptor não identificado')

      // 3. Cria parceria (match interno = mesmo corretor dos dois lados,
      //    proponente = quem clicou, receptor = o outro lado da carteira)
      const { data: parceria, error: parceriaErr } = await supabase
        .from('parcerias')
        .insert({
          match_id: match.id,
          corretor_proponente_id: proponenteId,
          corretor_receptor_id: receptorId,
          comissao_split: '50/50',
          responsavel_atendimento: 'Proponente',
          prazo_dias: 30,
          status: 'ativa',
          dados_liberados: true,
          is_partnership: true,
        })
        .select()
        .single()
      if (parceriaErr) throw parceriaErr

      // 4. Cria negociação para AMBOS os corretores (com parceria_id e corretor_id)
      const { error: negErr } = await supabase.from('negociacoes').insert([
        { parceria_id: parceria.id, coluna: 'Parceria Ativa', corretor_id: proponenteId },
        { parceria_id: parceria.id, coluna: 'Parceria Ativa', corretor_id: receptorId },
      ])
      if (negErr) throw negErr

      addToast('sucesso', 'Parceria criada!', 'A negociação foi iniciada no CRM Kanban.')
    } catch (err) {
      console.error('Erro ao iniciar atendimento:', err)
      addToast('erro', 'Erro ao iniciar atendimento', String(err))
    } finally {
      setLoading(null)
      router.refresh()
    }
  }

  return (
    <div className="p-8" style={{ color: 'var(--color-text)' }}>
      <ToastContainer toasts={toasts} onRemover={removerToast} />
      {confirmarRecusar && (
        <ModalConfirm
          titulo="Recusar este match?"
          descricao="O match será marcado como recusado. Esta ação pode ser revertida entrando em contato com o parceiro."
          labelConfirmar="Recusar"
          onConfirmar={() => handleRecusar(confirmarRecusar)}
          onCancelar={() => setConfirmarRecusar(null)}
          carregando={loading === confirmarRecusar}
        />
      )}
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
      <div className="flex items-center justify-between mb-4">
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

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          value={filtroStatus}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFiltroStatus(e.target.value)}
          style={{ background: '#232324', border: '1px solid rgba(201,168,76,0.14)', borderRadius: '2px', padding: '8px 12px', color: '#F0EDE6', fontSize: '13px', cursor: 'pointer', outline: 'none' }}
        >
          <option value="todos">Todos os status</option>
          <option value="pendente">Pendentes</option>
          <option value="aceito">Aceitos</option>
          <option value="recusado">Recusados</option>
        </select>
        <select
          value={filtroTipo}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFiltroTipo(e.target.value)}
          style={{ background: '#232324', border: '1px solid rgba(201,168,76,0.14)', borderRadius: '2px', padding: '8px 12px', color: '#F0EDE6', fontSize: '13px', cursor: 'pointer', outline: 'none' }}
        >
          <option value="todos">Todos os tipos</option>
          <option value="externo">Externos</option>
          <option value="interno">Internos</option>
        </select>
        <select
          value={filtroScore}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFiltroScore(Number(e.target.value))}
          style={{ background: '#232324', border: '1px solid rgba(201,168,76,0.14)', borderRadius: '2px', padding: '8px 12px', color: '#F0EDE6', fontSize: '13px', cursor: 'pointer', outline: 'none' }}
        >
          <option value={0}>Qualquer score</option>
          <option value={70}>Acima de 70%</option>
          <option value={80}>Acima de 80%</option>
          <option value={90}>Acima de 90%</option>
          <option value={100}>100% (perfeito)</option>
        </select>
        <span style={{ fontSize: '12px', color: '#9B9690' }}>
          {matchesFiltrados.length} resultado(s)
        </span>
      </div>

      {/* Lista */}
      {matchesFiltrados.length === 0 ? (
        <div
          className="rounded-sm border flex items-center justify-center py-20 text-sm"
          style={{
            backgroundColor: 'var(--color-dark-2)',
            borderColor: 'rgba(201,168,76,0.1)',
            color: 'var(--color-muted)',
          }}
        >
          {matches.length === 0
            ? 'Nenhum match ainda. Cadastre imóveis e clique em Motor de Matching para rodar o algoritmo.'
            : 'Nenhum resultado para os filtros selecionados.'}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {matchesFiltrados.map((match) => {
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
                        onClick={() => setConfirmarRecusar(match.id)}
                        disabled={loading === match.id}
                        className="text-[12px] px-3 py-1.5 rounded-sm border transition-colors"
                        style={{
                          borderColor: 'var(--color-red)',
                          color: 'var(--color-red)',
                        }}
                      >
                        Recusar
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
