'use client'

import React, { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Imovel, Cidade, ImovelStatus } from '@/types/bid'
import { formatCurrency, STATUS_LABELS, STATUS_COLORS, getImovelEmoji } from '@/lib/format'
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

  const [modalAberto, setModalAberto] = useState(false)
  const [imovelEditando, setImovelEditando] = useState<Imovel | null>(null)
  const [deletandoId, setDeletandoId] = useState<string | null>(null)
  const [matchingId, setMatchingId] = useState<string | null>(null)
  const [autorizandoId, setAutorizandoId] = useState<string | null>(null)
  const [filtroStatus, setFiltroStatus] = useState<ImovelStatus | ''>('')
  const [filtroCidade, setFiltroCidade] = useState('')

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

  async function handleDeletar(id: string) {
    if (!confirm('Deseja realmente excluir este imovel?')) return
    setDeletandoId(id)
    await supabase.from('imoveis').delete().eq('id', id)
    setDeletandoId(null)
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
      <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Header com filtros e botao */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <select
              style={selectStyle}
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value as ImovelStatus | '')}
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
              onChange={(e) => setFiltroCidade(e.target.value)}
            >
              <option value="">Todas as cidades</option>
              {cidades_unicas.map((c) => (
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

        {/* Contagem */}
        <p style={{ fontSize: '14px', color: '#9B9690' }}>
          {imoveisFiltrados.length} {imoveisFiltrados.length === 1 ? 'imovel' : 'imoveis'}
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
          {imoveisFiltrados.length === 0 ? (
            <div style={{ padding: '64px', textAlign: 'center' }}>
              <p style={{ fontSize: '16px', color: '#9B9690' }}>Nenhum imovel encontrado.</p>
              <p style={{ fontSize: '14px', color: '#2E2E30', marginTop: '10px' }}>
                Clique em &ldquo;+ Cadastrar Imovel&rdquo; para adicionar.
              </p>
            </div>
          ) : (
            imoveisFiltrados.map((imovel, i) => {
              const sc = STATUS_COLORS[imovel.status]
              return (
                <div
                  key={imovel.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    padding: '18px 24px',
                    borderBottom: i < imoveisFiltrados.length - 1 ? '1px solid #232324' : 'none',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(201,168,76,0.02)')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent')}
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
                    {STATUS_LABELS[imovel.status]}
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
