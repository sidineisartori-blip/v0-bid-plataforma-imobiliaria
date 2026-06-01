'use client'

import React, { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Solicitacao, Cidade } from '@/types/bid'
import { formatCurrency } from '@/lib/format'
import ModalSolicitacao from './ModalSolicitacao'

interface SolicitacoesClientProps {
  solicitacoes: Solicitacao[]
  cidades: Cidade[]
  corretorId: string
}

const btnIconStyle: React.CSSProperties = {
  background: 'none',
  border: '1px solid #232324',
  borderRadius: '2px',
  color: '#9B9690',
  cursor: 'pointer',
  fontSize: '13px',
  padding: '4px 8px',
}

export default function SolicitacoesClient({ solicitacoes, cidades, corretorId }: SolicitacoesClientProps) {
  const router = useRouter()
  const supabase = createClient()

  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<Solicitacao | null>(null)
  const [deletandoId, setDeletandoId] = useState<string | null>(null)
  const [matchingId, setMatchingId] = useState<string | null>(null)
  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroCidade, setFiltroCidade] = useState('')

  const cidades_unicas = useMemo(
    () => [...new Set(solicitacoes.map((s) => s.cidade))].sort(),
    [solicitacoes]
  )

  const filtradas = useMemo(
    () =>
      solicitacoes.filter((s) => {
        if (filtroStatus && s.status !== filtroStatus) return false
        if (filtroCidade && s.cidade !== filtroCidade) return false
        return true
      }),
    [solicitacoes, filtroStatus, filtroCidade]
  )

  async function handleDeletar(id: string) {
    if (!confirm('Deseja realmente excluir esta solicitacao?')) return
    setDeletandoId(id)
    await supabase.from('solicitacoes').delete().eq('id', id)
    setDeletandoId(null)
    router.refresh()
  }

  async function handleRodarMatching(id: string) {
    setMatchingId(id)
    await fetch(`/api/matching/solicitacao/${id}`, { method: 'POST' })
    setMatchingId(null)
    router.refresh()
  }

  function abrirNova() {
    setEditando(null)
    setModalAberto(true)
  }

  const selectStyle: React.CSSProperties = {
    backgroundColor: '#181819',
    border: '1px solid #232324',
    borderRadius: '2px',
    padding: '7px 12px',
    fontSize: '12px',
    color: '#F0EDE6',
    outline: 'none',
    cursor: 'pointer',
  }

  const statusColor = (status: string) => {
    if (status === 'ativa') return { bg: 'rgba(92,184,138,0.15)', text: '#5CB88A' }
    if (status === 'concluida') return { bg: 'rgba(92,155,224,0.15)', text: '#5C9BE0' }
    return { bg: 'rgba(155,150,144,0.15)', text: '#9B9690' }
  }

  return (
    <>
      <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <select style={selectStyle} value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
              <option value="">Todos os status</option>
              <option value="ativa">Ativa</option>
              <option value="concluida">Concluida</option>
              <option value="cancelada">Cancelada</option>
            </select>
            <select style={selectStyle} value={filtroCidade} onChange={(e) => setFiltroCidade(e.target.value)}>
              <option value="">Todas as cidades</option>
              {cidades_unicas.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <button
            onClick={abrirNova}
            style={{
              backgroundColor: '#C9A84C',
              color: '#0E0E0F',
              border: 'none',
              borderRadius: '2px',
              padding: '8px 18px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            + Nova Solicitacao
          </button>
        </div>

        {/* Contagem */}
        <p style={{ fontSize: '12px', color: '#9B9690' }}>
          {filtradas.length} {filtradas.length === 1 ? 'solicitacao' : 'solicitacoes'}
        </p>

        {/* Lista */}
        <div
          style={{
            backgroundColor: '#181819',
            border: '1px solid rgba(201,168,76,0.1)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}
        >
          {filtradas.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', color: '#9B9690' }}>Nenhuma solicitacao encontrada.</p>
              <p style={{ fontSize: '12px', color: '#2E2E30', marginTop: '8px' }}>
                Clique em &ldquo;+ Nova Solicitacao&rdquo; para adicionar.
              </p>
            </div>
          ) : (
            filtradas.map((sol, i) => {
              const sc = statusColor(sol.status)
              return (
                <div
                  key={sol.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '14px 20px',
                    borderBottom: i < filtradas.length - 1 ? '1px solid #232324' : 'none',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(201,168,76,0.02)')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent')}
                >
                  {/* Icone */}
                  <span style={{ fontSize: '20px', flexShrink: 0 }}>&#128269;</span>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <p style={{ fontSize: '14px', fontWeight: 500, color: '#F0EDE6' }}>
                        {sol.cliente_nome}
                      </p>
                      <span style={{ fontSize: '11px', color: '#9B9690' }}>
                        {sol.tipo_negocio} · {sol.tipo_imovel}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#9B9690', marginBottom: '2px' }}>
                      {[sol.bairro_desejado, sol.cidade].filter(Boolean).join(' · ')}
                      {(sol.quartos || sol.banheiros) && (
                        <span>
                          {sol.quartos && ` · ${sol.quartos}Q`}
                          {sol.banheiros && ` ${sol.banheiros}B`}
                          {` ${sol.vagas}V`}
                        </span>
                      )}
                    </p>
                    <p style={{ fontSize: '12px', color: '#9B9690' }}>
                      {sol.valor_min && sol.valor_max
                        ? `${formatCurrency(sol.valor_min)} — ${formatCurrency(sol.valor_max)}`
                        : sol.valor_max
                        ? `ate ${formatCurrency(sol.valor_max)}`
                        : 'Valor a definir'}
                      {' · '}
                      <span style={{ color: sol.prazo_fechar === 'Imediato' ? '#E05C5C' : '#9B9690' }}>
                        {sol.prazo_fechar}
                      </span>
                      {sol.tem_animal && (
                        <span style={{ marginLeft: '8px', color: '#5CB88A', fontSize: '11px' }}>+ Animal</span>
                      )}
                    </p>
                  </div>

                  {/* Badge status */}
                  <span style={{
                    fontSize: '11px',
                    padding: '3px 10px',
                    borderRadius: '2px',
                    backgroundColor: sc.bg,
                    color: sc.text,
                    flexShrink: 0,
                    textTransform: 'capitalize',
                  }}>
                    {sol.status}
                  </span>

                  {/* Botoes */}
                  <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                    <button
                      title="Rodar Matching"
                      style={btnIconStyle}
                      disabled={matchingId === sol.id}
                      onClick={() => handleRodarMatching(sol.id)}
                    >
                      {matchingId === sol.id ? '...' : '⚙'}
                    </button>
                    <button
                      title="Editar"
                      style={btnIconStyle}
                      onClick={() => { setEditando(sol); setModalAberto(true) }}
                    >
                      ✏
                    </button>
                    <button
                      title="Excluir"
                      style={{ ...btnIconStyle, color: deletandoId === sol.id ? '#E05C5C' : '#9B9690' }}
                      disabled={deletandoId === sol.id}
                      onClick={() => handleDeletar(sol.id)}
                    >
                      {deletandoId === sol.id ? '...' : '✕'}
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {modalAberto && (
        <ModalSolicitacao
          solicitacao={editando}
          corretorId={corretorId}
          cidades={cidades}
          onClose={() => setModalAberto(false)}
        />
      )}
    </>
  )
}
