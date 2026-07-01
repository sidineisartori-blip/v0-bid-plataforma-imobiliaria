'use client'

import { useState, useEffect, useCallback } from 'react'
import ModalChamado from './ModalChamado'
import { useToastSimples, ToastContainer } from '@/components/ui/ToastSimples'
import type { Contrato } from './ERPClient'

export interface Chamado {
  id: string
  contrato_id: string
  titulo: string
  descricao: string
  categoria: string
  urgencia: 'baixa' | 'media' | 'alta' | 'urgente'
  status: 'aberto' | 'aprovado_corretor' | 'aprovado_proprietario' | 'em_execucao' | 'concluido' | 'recusado'
  aberto_por: 'corretor' | 'inquilino'
  aberto_por_nome: string | null
  midia_urls: string[]
  proprietario_token: string
  comentario_recusa: string | null
  aprovado_corretor_em: string | null
  aprovado_proprietario_em: string | null
  concluido_em: string | null
  created_at: string
  contrato?: {
    cliente_nome: string
    portal_token: string | null
    proprietario_nome: string | null
    proprietario_phone: string | null
    proprietario_email: string | null
    imovel?: { titulo: string; cidade: string } | null
  } | null
}

const STATUS_MAP: Record<string, { label: string; cor: string; bg: string }> = {
  aberto:                 { label: 'Aberto',             cor: '#C9A84C', bg: 'rgba(201,168,76,0.12)' },
  aprovado_corretor:      { label: 'Ag. Proprietário',   cor: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
  aprovado_proprietario:  { label: 'Autorizado',         cor: '#5CB88A', bg: 'rgba(92,184,138,0.12)' },
  em_execucao:            { label: 'Em Execução',        cor: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  concluido:              { label: 'Concluído',          cor: '#9B9690', bg: 'rgba(155,150,144,0.12)' },
  recusado:               { label: 'Recusado',           cor: '#E05C5C', bg: 'rgba(224,92,92,0.12)' },
}

const URGENCIA_MAP: Record<string, { label: string; cor: string }> = {
  baixa:   { label: 'Baixa',   cor: '#5CB88A' },
  media:   { label: 'Média',   cor: '#C9A84C' },
  alta:    { label: 'Alta',    cor: '#e07a2f' },
  urgente: { label: 'Urgente', cor: '#E05C5C' },
}

const CAT_LABEL: Record<string, string> = {
  hidraulica: 'Hidráulica',
  eletrica: 'Elétrica',
  estrutural: 'Estrutural',
  pintura: 'Pintura',
  limpeza: 'Limpeza',
  outro: 'Outro',
}

interface Props {
  corretorId: string
  contratos: Contrato[]
}

const INP: React.CSSProperties = {
  background: '#181819',
  border: '1px solid #2E2E30',
  borderRadius: 2,
  padding: '8px 12px',
  fontSize: 13,
  color: '#F0EDE6',
  outline: 'none',
}

export default function ERPChamados({ contratos }: Props) {
  const [chamados, setChamados]         = useState<Chamado[]>([])
  const [carregando, setCarregando]     = useState(true)
  const [expandido, setExpandido]       = useState<string | null>(null)
  const [modalAberto, setModalAberto]   = useState(false)
  const [editando, setEditando]         = useState<Chamado | null>(null)
  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroContrato, setFiltroContrato] = useState('')
  const [agindo, setAgindo]             = useState<string | null>(null)
  const [linkPortal, setLinkPortal]     = useState<{ contratoId: string; url: string } | null>(null)
  const [copiando, setCopiando]         = useState<string | null>(null)
  const [toasts, addToast, removerToast] = useToastSimples()

  const carregar = useCallback(async () => {
    setCarregando(true)
    const params = new URLSearchParams()
    if (filtroStatus)    params.set('status', filtroStatus)
    if (filtroContrato)  params.set('contrato_id', filtroContrato)
    const res = await fetch(`/api/erp/chamados?${params}`)
    if (res.ok) setChamados(await res.json())
    setCarregando(false)
  }, [filtroStatus, filtroContrato])

  useEffect(() => { carregar() }, [carregar])

  async function acao(id: string, tipo: 'aprovar' | 'recusar' | 'iniciar' | 'concluir', comentario = '') {
    setAgindo(id)
    const res = await fetch(`/api/erp/chamados/${id}/aprovar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acao: tipo, comentario }),
    })
    if (res.ok) {
      addToast('sucesso', `Chamado ${tipo === 'aprovar' ? 'aprovado' : tipo === 'recusar' ? 'recusado' : tipo === 'iniciar' ? 'iniciado' : 'concluído'}`)
      await carregar()
    } else {
      const e = await res.json()
      addToast('erro', 'Erro', e.error)
    }
    setAgindo(null)
  }

  async function gerarLinkPortal(contrato_id: string) {
    if (linkPortal?.contratoId === contrato_id) {
      copiar(linkPortal.url, contrato_id)
      return
    }
    const res = await fetch('/api/erp/portal/gerar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contrato_id }),
    })
    if (res.ok) {
      const { link } = await res.json()
      setLinkPortal({ contratoId: contrato_id, url: link })
      copiar(link, contrato_id)
    }
  }

  function copiar(url: string, id: string) {
    navigator.clipboard.writeText(url).then(() => {
      setCopiando(id)
      setTimeout(() => setCopiando(null), 2000)
      addToast('sucesso', 'Link copiado! Envie ao inquilino via WhatsApp.')
    })
  }

  const filtrados = chamados.filter((c) => {
    if (filtroStatus && c.status !== filtroStatus) return false
    if (filtroContrato && c.contrato_id !== filtroContrato) return false
    return true
  })

  const pendentes = chamados.filter((c) => ['aberto', 'aprovado_proprietario'].includes(c.status)).length

  const contratoLocacao = contratos.filter((c) => c.tipo === 'locacao' && c.status === 'ativo')

  return (
    <div>
      <ToastContainer toasts={toasts} onRemover={removerToast} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <p style={{ fontSize: 13, color: '#9B9690' }}>
            Chamados de serviço durante o contrato de locação.
            {pendentes > 0 && <span style={{ marginLeft: 8, color: '#C9A84C', fontWeight: 600 }}>{pendentes} pendentes</span>}
          </p>
        </div>
        <button
          onClick={() => { setEditando(null); setModalAberto(true) }}
          style={{ background: '#C9A84C', color: '#0E0E0F', border: 'none', borderRadius: 2, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >
          + Novo Chamado
        </button>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} style={{ ...INP, flex: '1 1 160px' }}>
          <option value="">Status: Todos</option>
          {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={filtroContrato} onChange={(e) => setFiltroContrato(e.target.value)} style={{ ...INP, flex: '2 1 220px' }}>
          <option value="">Contrato: Todos</option>
          {contratos.map((c) => (
            <option key={c.id} value={c.id}>
              {c.cliente_nome} {c.imovel ? `— ${c.imovel.titulo}` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Links portal por contrato ativo */}
      {contratoLocacao.length > 0 && (
        <div style={{ background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.15)', borderRadius: 2, padding: '10px 14px', marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#9B9690' }}>Link portal do inquilino:</span>
          {contratoLocacao.slice(0, 3).map((c) => (
            <button
              key={c.id}
              onClick={() => gerarLinkPortal(c.id)}
              style={{ background: 'none', border: '1px solid rgba(96,165,250,0.3)', borderRadius: 2, padding: '4px 10px', fontSize: 11, color: '#60a5fa', cursor: 'pointer' }}
            >
              {copiando === c.id ? '✓ Copiado!' : `📋 ${c.cliente_nome}`}
            </button>
          ))}
        </div>
      )}

      {/* Lista */}
      {carregando ? (
        <p style={{ color: '#9B9690', fontSize: 13 }}>Carregando...</p>
      ) : filtrados.length === 0 ? (
        <div style={{ background: '#181819', border: '1px solid rgba(201,168,76,0.1)', borderRadius: 2, padding: '50px 20px', textAlign: 'center' }}>
          <p style={{ color: '#9B9690', fontSize: 14, marginBottom: 14 }}>
            {chamados.length === 0 ? 'Nenhum chamado registrado.' : 'Nenhum chamado para este filtro.'}
          </p>
          {chamados.length === 0 && (
            <button onClick={() => { setEditando(null); setModalAberto(true) }}
              style={{ background: '#C9A84C', color: '#0E0E0F', border: 'none', borderRadius: 2, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Abrir primeiro chamado
            </button>
          )}
        </div>
      ) : (
        <div style={{ background: '#181819', border: '1px solid rgba(201,168,76,0.1)', borderRadius: 2, overflow: 'hidden' }}>
          {filtrados.map((c, i) => {
            const sm = STATUS_MAP[c.status]
            const urg = URGENCIA_MAP[c.urgencia]
            const exp = expandido === c.id
            return (
              <div key={c.id} style={{ borderBottom: i < filtrados.length - 1 ? '1px solid #232324' : 'none' }}>
                {/* Linha principal */}
                <div
                  onClick={() => setExpandido(exp ? null : c.id)}
                  style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, padding: '12px 16px', cursor: 'pointer', alignItems: 'center' }}
                >
                  <div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#F0EDE6' }}>{c.titulo}</span>
                      <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 2, fontWeight: 600, background: sm.bg, color: sm.cor }}>{sm.label}</span>
                      <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 2, fontWeight: 600, color: urg.cor, background: 'rgba(0,0,0,0.2)', border: `1px solid ${urg.cor}33` }}>{urg.label}</span>
                      {c.aberto_por === 'inquilino' && (
                        <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 2, background: 'rgba(167,139,250,0.12)', color: '#a78bfa' }}>Inquilino</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, color: '#9B9690' }}>{c.contrato?.cliente_nome}</span>
                      {c.contrato?.imovel && <span style={{ fontSize: 12, color: '#9B9690' }}>{c.contrato.imovel.titulo}</span>}
                      <span style={{ fontSize: 12, color: '#9B9690' }}>{CAT_LABEL[c.categoria]}</span>
                      <span style={{ fontSize: 12, color: '#9B9690' }}>{new Date(c.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                  <span style={{ color: '#9B9690', fontSize: 16 }}>{exp ? '▲' : '▼'}</span>
                </div>

                {/* Detalhes expandidos */}
                {exp && (
                  <div style={{ padding: '0 16px 16px', borderTop: '1px solid #232324' }}>
                    <p style={{ fontSize: 13, color: '#9B9690', marginTop: 12, marginBottom: 12, lineHeight: 1.5 }}>{c.descricao}</p>

                    {/* Fotos */}
                    {c.midia_urls.length > 0 && (
                      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                        {c.midia_urls.map((url, idx) => (
                          <a key={idx} href={url} target="_blank" rel="noopener noreferrer">
                            <img src={url} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 2, border: '1px solid #2E2E30' }} />
                          </a>
                        ))}
                      </div>
                    )}

                    {c.comentario_recusa && (
                      <p style={{ fontSize: 12, color: '#E05C5C', marginBottom: 12 }}>Motivo da recusa: {c.comentario_recusa}</p>
                    )}

                    {/* Ações */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {c.status === 'aberto' && (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); acao(c.id, 'aprovar') }}
                            disabled={agindo === c.id}
                            style={{ background: 'rgba(92,184,138,0.1)', border: '1px solid rgba(92,184,138,0.3)', borderRadius: 2, padding: '6px 14px', fontSize: 12, color: '#5CB88A', cursor: 'pointer' }}
                          >
                            {agindo === c.id ? '...' : '✓ Aprovar → Proprietário'}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              const motivo = window.prompt('Motivo da recusa (opcional):')
                              if (motivo !== null) acao(c.id, 'recusar', motivo)
                            }}
                            disabled={agindo === c.id}
                            style={{ background: 'rgba(224,92,92,0.1)', border: '1px solid rgba(224,92,92,0.3)', borderRadius: 2, padding: '6px 14px', fontSize: 12, color: '#E05C5C', cursor: 'pointer' }}
                          >
                            ✕ Recusar
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditando(c); setModalAberto(true) }}
                            style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 2, padding: '6px 12px', fontSize: 12, color: '#C9A84C', cursor: 'pointer' }}
                          >
                            Editar
                          </button>
                        </>
                      )}

                      {c.status === 'aprovado_corretor' && (
                        <div style={{ fontSize: 12, color: '#60a5fa', padding: '6px 0' }}>
                          ⏳ Aguardando autorização do proprietário
                        </div>
                      )}

                      {c.status === 'aprovado_proprietario' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); acao(c.id, 'iniciar') }}
                          disabled={agindo === c.id}
                          style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.3)', borderRadius: 2, padding: '6px 14px', fontSize: 12, color: '#a78bfa', cursor: 'pointer' }}
                        >
                          {agindo === c.id ? '...' : '▶ Iniciar Execução'}
                        </button>
                      )}

                      {c.status === 'em_execucao' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            const obs = window.prompt('Observação de conclusão (opcional):')
                            if (obs !== null) acao(c.id, 'concluir', obs)
                          }}
                          disabled={agindo === c.id}
                          style={{ background: 'rgba(92,184,138,0.1)', border: '1px solid rgba(92,184,138,0.3)', borderRadius: 2, padding: '6px 14px', fontSize: 12, color: '#5CB88A', cursor: 'pointer' }}
                        >
                          {agindo === c.id ? '...' : '✓ Marcar Concluído'}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {modalAberto && (
        <ModalChamado
          chamado={editando}
          contratos={contratos}
          onClose={() => setModalAberto(false)}
          onSucesso={(msg) => { addToast('sucesso', msg); carregar() }}
        />
      )}
    </div>
  )
}
