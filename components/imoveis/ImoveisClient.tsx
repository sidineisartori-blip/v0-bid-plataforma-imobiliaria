'use client'

import React, { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Imovel, Cidade, ImovelStatus } from '@/types/bid'
import { formatCurrency, STATUS_LABELS, STATUS_COLORS, getImovelEmoji } from '@/lib/format'
import { exportarCSV, exportarXLS, imoveisParaExport } from '@/lib/exportCsv'
import { ToastContainer, useToastSimples } from '@/components/ui/ToastSimples'
import ModalImovel from './ModalImovel'

interface ImoveisClientProps {
  imoveis: Imovel[]
  cidades: Cidade[]
  corretorId: string
  corretorNome?: string
  corretorCreci?: string
}

const btnIconStyle: React.CSSProperties = {
  background: 'none',
  border: '1px solid #232324',
  borderRadius: '2px',
  color: '#9B9690',
  cursor: 'pointer',
  fontSize: '16px',
  padding: '6px 10px',
  transition: 'color 0.15s',
}

export default function ImoveisClient({ imoveis, cidades, corretorId, corretorNome = '', corretorCreci = '' }: ImoveisClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [toasts, addToast, removerToast] = useToastSimples()

  const [modalAberto, setModalAberto] = useState(false)
  const [imovelEditando, setImovelEditando] = useState<Imovel | null>(null)
  const [deletandoId, setDeletandoId] = useState<string | null>(null)
  const [matchingId, setMatchingId] = useState<string | null>(null)
  const [autorizandoId, setAutorizandoId] = useState<string | null>(null)
  const [filtroStatus, setFiltroStatus] = useState<ImovelStatus | ''>('')
  const [filtroCidade, setFiltroCidade] = useState('')
  const [pagina, setPagina] = useState(1)
  const PAGE_SIZE = 10

  const cidades_unicas = useMemo(
    () => [...new Set(imoveis.map((i) => i.cidade))].sort(),
    [imoveis]
  )

  const imoveisFiltrados = useMemo(
    () =>
      imoveis.filter((i) => {
        if (filtroStatus && i.status !== filtroStatus) return false
        if (filtroCidade && i.cidade !== filtroCidade) return false
        return true
      }),
    [imoveis, filtroStatus, filtroCidade]
  )

  const totalPaginas = Math.max(1, Math.ceil(imoveisFiltrados.length / PAGE_SIZE))
  const paginaAtual  = Math.min(pagina, totalPaginas)
  const imoveisVisiveis = imoveisFiltrados.slice((paginaAtual - 1) * PAGE_SIZE, paginaAtual * PAGE_SIZE)

  async function handleDeletar(id: string) {
    if (!confirm('Deseja realmente excluir este imóvel?')) return
    setDeletandoId(id)
    const { error } = await supabase
      .from('imoveis')
      .delete()
      .eq('id', id)
      .eq('corretor_id', corretorId)
    setDeletandoId(null)
    if (error) { addToast('erro', 'Erro ao excluir', error.message) }
    else { addToast('sucesso', 'Imóvel excluído') }
    router.refresh()
  }

  const [matchMsg, setMatchMsg] = useState<string | null>(null)

  async function handleRodarMatching(id: string) {
    setMatchingId(id)
    setMatchMsg(null)
    try {
      const res = await fetch('/api/matching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imovelId: id, corretorId }),
      })
      const data = await res.json()
      if (data.matchesGerados > 0) {
        setMatchMsg(`${data.matchesGerados} match(es) gerado(s)!`)
      } else {
        setMatchMsg('Nenhuma compatibilidade >= 70% encontrada.')
      }
      setTimeout(() => setMatchMsg(null), 4000)
      router.refresh()
    } catch {
      setMatchMsg('Erro ao rodar matching.')
    }
    setMatchingId(null)
  }

  async function handleAutorizar(imovel: Imovel) {
    if (!confirm(`Confirmar que ${imovel.prop_nome || 'o proprietário'} autorizou a divulgação do imóvel "${imovel.titulo}"?`)) return
    setAutorizandoId(imovel.id)
    await supabase
      .from('imoveis')
      .update({ status: 'ativo', matching_ativo: true })
      .eq('id', imovel.id)
    setAutorizandoId(null)
    router.refresh()
  }

  function abrirNovo() {
    setImovelEditando(null)
    setModalAberto(true)
  }

  function abrirEdicao(imovel: Imovel) {
    setImovelEditando(imovel)
    setModalAberto(true)
  }

  const selectStyle: React.CSSProperties = {
    backgroundColor: '#181819',
    border: '1px solid #232324',
    borderRadius: '2px',
    padding: '10px 14px',
    fontSize: '15px',
    color: '#F0EDE6',
    outline: 'none',
    cursor: 'pointer',
  }

  return (
    <>
      <ToastContainer toasts={toasts} onRemover={removerToast} />
      <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Header com filtros e botao */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <select
              style={selectStyle}
              value={filtroStatus}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setFiltroStatus(e.target.value as ImovelStatus | ''); setPagina(1) }}
            >
              <option value="">Todos os status</option>
              <option value="ativo">Ativo</option>
              <option value="negociacao">Em Negociacao</option>
              <option value="aguardando_assinatura">Aguardando Assinatura</option>
              <option value="pausado">Pausado</option>
              <option value="concluido">Concluido</option>
            </select>
            <select
              style={selectStyle}
              value={filtroCidade}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setFiltroCidade(e.target.value); setPagina(1) }}
            >
              <option value="">Todas as cidades</option>
              {cidades_unicas.map((c: string) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <button
            onClick={abrirNovo}
            style={{
              backgroundColor: '#C9A84C',
              color: '#0E0E0F',
              border: 'none',
              borderRadius: '2px',
              padding: '12px 24px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            + Cadastrar Imóvel
          </button>
        </div>

        {/* Toast matching */}
        {matchMsg && (
          <div style={{
            backgroundColor: '#181819',
            border: '1px solid rgba(201,168,76,0.3)',
            borderRadius: '2px',
            padding: '14px 20px',
            fontSize: '15px',
            color: '#C9A84C',
          }}>
            {matchMsg}
          </div>
        )}

        {/* Contagem + Export */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <p style={{ fontSize: '13px', color: '#9B9690' }}>
            {imoveisFiltrados.length} {imoveisFiltrados.length === 1 ? 'imóvel' : 'imóveis'}
            {imoveisFiltrados.length > 0 && ` · Total: ${formatCurrency(imoveisFiltrados.reduce((s: number, i: Imovel) => s + i.valor, 0))}`}
          </p>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => exportarCSV(imoveisParaExport(imoveisFiltrados), 'imoveis')}
              style={{ background: 'none', border: '1px solid #2E2E30', borderRadius: 2, padding: '4px 10px', fontSize: 11, color: '#9B9690', cursor: 'pointer' }}>
              CSV
            </button>
            <button onClick={() => exportarXLS(imoveisParaExport(imoveisFiltrados), 'imoveis')}
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
          {imoveisFiltrados.length === 0 ? (
            <div style={{ padding: '64px', textAlign: 'center' }}>
              <p style={{ fontSize: '16px', color: '#9B9690' }}>Nenhum imovel encontrado.</p>
              <p style={{ fontSize: '14px', color: '#2E2E30', marginTop: '10px' }}>
                Clique em &ldquo;+ Cadastrar Imovel&rdquo; para adicionar.
              </p>
            </div>
          ) : (
            imoveisVisiveis.map((imovel: Imovel, i: number) => {
              const sc = STATUS_COLORS[imovel.status as ImovelStatus]
              return (
                <div
                  key={imovel.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    padding: '18px 24px',
                    borderBottom: i < imoveisVisiveis.length - 1 ? '1px solid #232324' : 'none',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => ((e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(201,168,76,0.02)')}
                  onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => ((e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent')}
                >
                  {/* Emoji */}
                  <span style={{ fontSize: '28px', flexShrink: 0 }}>{getImovelEmoji(imovel.tipo_imovel)}</span>

                  {/* Info principal */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <p style={{ fontSize: '16px', fontWeight: 500, color: '#F0EDE6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {imovel.titulo}
                      </p>
                      {imovel.lancamento && (
                        <span style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '2px',
                          backgroundColor: 'rgba(201,168,76,0.15)',
                          color: '#C9A84C',
                          fontWeight: 600,
                          letterSpacing: '0.05em',
                          flexShrink: 0,
                        }}>
                          LANCAMENTO
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '14px', color: '#9B9690' }}>
                      {[imovel.bairro, imovel.cidade].filter(Boolean).join(' · ')}
                      {' · '}
                      {imovel.quartos}Q {imovel.banheiros}B {imovel.vagas}V
                      {' · '}
                      <span style={{ color: '#C9A84C' }}>{formatCurrency(imovel.valor)}</span>
                    </p>
                  </div>

                  {/* Badge status */}
                  <span style={{
                    fontSize: '13px',
                    padding: '5px 14px',
                    borderRadius: '2px',
                    backgroundColor: sc.bg,
                    color: sc.text,
                    flexShrink: 0,
                  }}>
                    {STATUS_LABELS[imovel.status as ImovelStatus]}
                  </span>

                  {/* Botoes */}
                  <div style={{ display: 'flex', gap: '4px', flexShrink: 0, alignItems: 'center' }}>
                    {/* Botão de autorização — visível apenas em aguardando_assinatura */}
                    {imovel.status === 'aguardando_assinatura' && (
                      <button
                        title="Proprietário Autorizou"
                        disabled={autorizandoId === imovel.id}
                        onClick={() => handleAutorizar(imovel)}
                        style={{
                          backgroundColor: 'rgba(92,184,138,0.1)',
                          border: '1px solid rgba(92,184,138,0.35)',
                          borderRadius: '2px',
                          color: '#5CB88A',
                          cursor: autorizandoId === imovel.id ? 'not-allowed' : 'pointer',
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '6px 10px',
                          letterSpacing: '0.03em',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {autorizandoId === imovel.id ? '...' : 'Proprietário Autorizou'}
                      </button>
                    )}
                    <button
                      title="Rodar Matching"
                      style={btnIconStyle}
                      disabled={matchingId === imovel.id}
                      onClick={() => handleRodarMatching(imovel.id)}
                    >
                      {matchingId === imovel.id ? '...' : '⚙'}
                    </button>
                    <button
                      title="Editar"
                      style={btnIconStyle}
                      onClick={() => abrirEdicao(imovel)}
                    >
                      ✏
                    </button>
                    <button
                      title="Excluir"
                      style={{ ...btnIconStyle, color: deletandoId === imovel.id ? '#E05C5C' : '#9B9690' }}
                      disabled={deletandoId === imovel.id}
                      onClick={() => handleDeletar(imovel.id)}
                    >
                      {deletandoId === imovel.id ? '...' : '✕'}
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
              style={{
                background: '#181819', border: '1px solid #232324', borderRadius: 2,
                padding: '6px 14px', fontSize: 13, cursor: paginaAtual === 1 ? 'default' : 'pointer',
                color: paginaAtual === 1 ? '#2E2E30' : '#9B9690',
              }}
            >←</button>
            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setPagina(n)}
                style={{
                  background: n === paginaAtual ? '#C9A84C' : '#181819',
                  border: '1px solid ' + (n === paginaAtual ? '#C9A84C' : '#232324'),
                  borderRadius: 2, padding: '6px 12px', fontSize: 13,
                  color: n === paginaAtual ? '#0F0F10' : '#9B9690',
                  cursor: 'pointer', fontWeight: n === paginaAtual ? 700 : 400,
                }}
              >{n}</button>
            ))}
            <button
              onClick={() => setPagina((p: number) => Math.min(totalPaginas, p + 1))}
              disabled={paginaAtual === totalPaginas}
              style={{
                background: '#181819', border: '1px solid #232324', borderRadius: 2,
                padding: '6px 14px', fontSize: 13, cursor: paginaAtual === totalPaginas ? 'default' : 'pointer',
                color: paginaAtual === totalPaginas ? '#2E2E30' : '#9B9690',
              }}
            >→</button>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalAberto && (
        <ModalImovel
          imovel={imovelEditando}
          corretorId={corretorId}
          corretorNome={corretorNome}
          corretorCreci={corretorCreci}
          cidades={cidades}
          onClose={() => setModalAberto(false)}
        />
      )}
    </>
  )
}
