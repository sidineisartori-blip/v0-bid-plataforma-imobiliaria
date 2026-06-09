'use client'

import React, { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Solicitacao, Cidade } from '@/types/bid'
import { formatCurrency } from '@/lib/format'
import { exportarCSV, exportarXLS, solicitacoesParaExport } from '@/lib/exportCsv'
import { ToastContainer, useToastSimples } from '@/components/ui/ToastSimples'
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
  const [toasts, addToast, removerToast] = useToastSimples()

  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<Solicitacao | null>(null)
  const [deletandoId, setDeletandoId] = useState<string | null>(null)
  const [matchingId, setMatchingId] = useState<string | null>(null)
  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroCidade, setFiltroCidade] = useState('')
  const [pagina, setPagina] = useState(1)
  const PAGE_SIZE = 10

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

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / PAGE_SIZE))
  const paginaAtual  = Math.min(pagina, totalPaginas)
  const visiveis     = filtradas.slice((paginaAtual - 1) * PAGE_SIZE, paginaAtual * PAGE_SIZE)

  async function handleDeletar(id: string) {
    if (!confirm('Deseja realmente excluir esta solicitacao?')) return
    setDeletandoId(id)
    const { error } = await supabase
      .from('solicitacoes')
      .delete()
      .eq('id', id)
      .eq('corretor_id', corretorId)
    setDeletandoId(null)
    if (error) {
      alert('Erro ao excluir solicitação: ' + error.message)
      return
    }
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
      <ToastContainer toasts={toasts} onRemover={removerToast} />
      <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <select style={selectStyle} value={filtroStatus} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setFiltroStatus(e.target.value); setPagina(1) }}>
              <option value="">Todos os status</option>
              <option value="ativa">Ativa</option>
              <option value="concluida">Concluida</option>
              <option value="cancelada">Cancelada</option>
            </select>
            <select style={selectStyle} value={filtroCidade} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setFiltroCidade(e.target.value); setPagina(1) }}>
              <option value="">Todas as cidades</option>
              {cidades_unicas.map((c: string) => (
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

        {/* Contagem + Export */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <p style={{ fontSize: '12px', color: '#9B9690' }}>
            {filtradas.length} {filtradas.length === 1 ? 'solicitação' : 'solicitações'}
          </p>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => exportarCSV(solicitacoesParaExport(filtradas), 'solicitacoes')}
              style={{ background: 'none', border: '1px solid #2E2E30', borderRadius: 2, padding: '4px 10px', fontSize: 11, color: '#9B9690', cursor: 'pointer' }}>
              CSV
            </button>
            <button onClick={() => exportarXLS(solicitacoesParaExport(filtradas), 'solicitacoes')}
              style={{ background: 'none', border: '1px solid #2E2E30', borderRadius: 2, padding: '4px 10px', fontSize: 11, color: '#9B9690', cursor: 'pointer' }}>
              XLS
            </button>
          </div>
        </div>

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
            visiveis.map((sol: Solicitacao, i: number) => {
              const sc = statusColor(sol.status)
              return (
                <div
                  key={sol.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '14px 20px',
                    borderBottom: i < visiveis.length - 1 ? '1px solid #232324' : 'none',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => ((e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(201,168,76,0.02)')}
                  onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => ((e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent')}
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

        {/* Paginação */}
        {totalPaginas > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, paddingTop: 4 }}>
            <button
              onClick={() => setPagina((p: number) => Math.max(1, p - 1))}
              disabled={paginaAtual === 1}
              style={{ background: '#181819', border: '1px solid #232324', borderRadius: 2, padding: '6px 14px', fontSize: 13, cursor: paginaAtual === 1 ? 'default' : 'pointer', color: paginaAtual === 1 ? '#2E2E30' : '#9B9690' }}
            >←</button>
            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setPagina(n)}
                style={{ background: n === paginaAtual ? '#C9A84C' : '#181819', border: '1px solid ' + (n === paginaAtual ? '#C9A84C' : '#232324'), borderRadius: 2, padding: '6px 12px', fontSize: 13, color: n === paginaAtual ? '#0F0F10' : '#9B9690', cursor: 'pointer', fontWeight: n === paginaAtual ? 700 : 400 }}
              >{n}</button>
            ))}
            <button
              onClick={() => setPagina((p: number) => Math.min(totalPaginas, p + 1))}
              disabled={paginaAtual === totalPaginas}
              style={{ background: '#181819', border: '1px solid #232324', borderRadius: 2, padding: '6px 14px', fontSize: 13, cursor: paginaAtual === totalPaginas ? 'default' : 'pointer', color: paginaAtual === totalPaginas ? '#2E2E30' : '#9B9690' }}
            >→</button>
          </div>
        )}
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
