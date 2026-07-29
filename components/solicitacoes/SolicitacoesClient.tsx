'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Solicitacao, Cidade, SolicitacaoEvento } from '@/types/bid'
import { formatCurrency } from '@/lib/format'
import { exportarCSV, exportarXLS, solicitacoesParaExport } from '@/lib/exportCsv'
import { ToastContainer, useToastSimples } from '@/components/ui/ToastSimples'
import ModalConfirm from '@/components/ui/ModalConfirm'
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

// ── Helpers ──────────────────────────────────────────────────────────────────

function statusColor(status: string) {
  if (status === 'ativa') return { bg: 'rgba(92,184,138,0.15)', text: '#5CB88A' }
  if (status === 'concluida') return { bg: 'rgba(92,155,224,0.15)', text: '#5C9BE0' }
  return { bg: 'rgba(155,150,144,0.15)', text: '#9B9690' }
}

function atendimentoLabel(sol: Solicitacao): 'novo' | 'atendido' | 'sem_retorno' {
  if (!sol.ultimo_contato_em) return 'novo'
  const dias = (Date.now() - new Date(sol.ultimo_contato_em).getTime()) / 86400000
  return dias <= 7 ? 'atendido' : 'sem_retorno'
}

function followupLabel(status: string | null | undefined): 'enviado' | 'falhou' | 'sem_followup' {
  if (status === 'enviado') return 'enviado'
  if (status === 'falhou') return 'falhou'
  return 'sem_followup'
}

function formatarData(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}

// ── Badges ────────────────────────────────────────────────────────────────────

function BadgeAtendimento({ sol }: { sol: Solicitacao }) {
  const label = atendimentoLabel(sol)
  const map = {
    novo:        { text: 'Novo',        bg: 'rgba(201,168,76,0.15)',  color: '#C9A84C' },
    atendido:    { text: 'Atendido',    bg: 'rgba(92,184,138,0.15)',  color: '#5CB88A' },
    sem_retorno: { text: 'Sem retorno', bg: 'rgba(224,92,92,0.15)',   color: '#E05C5C' },
  }
  const s = map[label]
  return (
    <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '2px', backgroundColor: s.bg, color: s.color, whiteSpace: 'nowrap' }}>
      {s.text}
    </span>
  )
}

function BadgeImoveis({ qtd }: { qtd: number | undefined }) {
  const n = qtd ?? 0
  return (
    <span title={`${n} imóvel(is) enviado(s)`} style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '2px', backgroundColor: n > 0 ? 'rgba(92,155,224,0.15)' : 'rgba(46,46,48,0.5)', color: n > 0 ? '#5C9BE0' : '#555', whiteSpace: 'nowrap' }}>
      🏠 {n}
    </span>
  )
}

function BadgeFollowup({ status }: { status: string | null | undefined }) {
  const label = followupLabel(status)
  const map = {
    enviado:     { text: '✓ Follow-up', bg: 'rgba(92,184,138,0.15)', color: '#5CB88A' },
    falhou:      { text: '✗ Falhou',    bg: 'rgba(224,92,92,0.15)',  color: '#E05C5C' },
    sem_followup:{ text: '— Nenhum',    bg: 'rgba(46,46,48,0.5)',    color: '#555'    },
  }
  const s = map[label]
  return (
    <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '2px', backgroundColor: s.bg, color: s.color, whiteSpace: 'nowrap' }}>
      {s.text}
    </span>
  )
}

// ── Timeline ──────────────────────────────────────────────────────────────────

function TimelineRow({ solicitacaoId }: { solicitacaoId: string }) {
  const [eventos, setEventos] = useState<SolicitacaoEvento[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [registrando, setRegistrando] = useState(false)
  const [, addToast] = useToastSimples()

  const carregar = useCallback(async () => {
    if (eventos !== null) return
    setLoading(true)
    try {
      const res = await fetch(`/api/solicitacoes/${solicitacaoId}/eventos`)
      if (res.ok) setEventos(await res.json())
    } finally {
      setLoading(false)
    }
  }, [solicitacaoId, eventos])

  // Carrega ao montar
  React.useEffect(() => { carregar() }, [carregar])

  async function registrarContato(canal: string) {
    setRegistrando(true)
    try {
      const res = await fetch(`/api/solicitacoes/${solicitacaoId}/contato`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canal }),
      })
      if (res.ok) {
        setEventos(null) // força reload
        await carregar()
      }
    } finally {
      setRegistrando(false)
    }
  }

  const tipoIcon: Record<string, string> = {
    contato:       '📞',
    imovel_enviado:'🏠',
    mensagem_auto: '🤖',
    status:        '🔄',
    nota:          '📝',
  }

  const canalLabel: Record<string, string> = {
    whatsapp: 'WhatsApp',
    email:    'E-mail',
    app:      'App',
  }

  return (
    <div style={{ padding: '12px 20px 16px 56px', borderBottom: '1px solid #1a1a1b', backgroundColor: '#111112' }}>
      {/* Ações rápidas */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '11px', color: '#555', alignSelf: 'center', marginRight: '4px' }}>Registrar:</span>
        {(['whatsapp', 'email', 'app'] as const).map((canal) => (
          <button
            key={canal}
            disabled={registrando}
            onClick={() => registrarContato(canal)}
            style={{ ...btnIconStyle, fontSize: '11px', padding: '3px 10px', opacity: registrando ? 0.5 : 1 }}
          >
            {registrando ? '...' : `+ Contato ${canalLabel[canal]}`}
          </button>
        ))}
      </div>

      {/* Timeline */}
      {loading ? (
        <p style={{ fontSize: '12px', color: '#555' }}>Carregando...</p>
      ) : !eventos || eventos.length === 0 ? (
        <p style={{ fontSize: '12px', color: '#555' }}>Nenhum evento registrado ainda.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {eventos.map((ev) => (
            <div key={ev.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <span style={{ fontSize: '14px', flexShrink: 0 }}>{tipoIcon[ev.tipo] ?? '•'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '12px', color: '#F0EDE6', textTransform: 'capitalize' }}>
                    {ev.tipo.replace('_', ' ')}
                    {ev.canal && ` · ${canalLabel[ev.canal] ?? ev.canal}`}
                  </span>
                  {ev.sucesso === true  && <span style={{ fontSize: '10px', color: '#5CB88A' }}>✓ enviado</span>}
                  {ev.sucesso === false && <span style={{ fontSize: '10px', color: '#E05C5C' }}>✗ falhou</span>}
                  {ev.corretor_id === null && <span style={{ fontSize: '10px', color: '#555' }}>automático</span>}
                  <span style={{ fontSize: '10px', color: '#555', marginLeft: 'auto' }}>{formatarData(ev.created_at)}</span>
                </div>
                {ev.detalhe && <p style={{ fontSize: '11px', color: '#9B9690', marginTop: '2px' }}>{ev.detalhe}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Componente principal ───────────────────────────────────────────────────────

export default function SolicitacoesClient({ solicitacoes, cidades, corretorId }: SolicitacoesClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [toasts, addToast, removerToast] = useToastSimples()

  const [modalAberto, setModalAberto]     = useState(false)
  const [editando, setEditando]           = useState<Solicitacao | null>(null)
  const [deletandoId, setDeletandoId]     = useState<string | null>(null)
  const [confirmarExcluir, setConfirmarExcluir] = useState<string | null>(null)
  const [matchingId, setMatchingId]       = useState<string | null>(null)
  const [expandido, setExpandido]         = useState<string | null>(null)

  // Filtros
  const [filtroStatus, setFiltroStatus]           = useState('')
  const [filtroCidade, setFiltroCidade]           = useState('')
  const [filtroAtendimento, setFiltroAtendimento] = useState('')
  const [filtroImovel, setFiltroImovel]           = useState('')
  const [filtroFollowup, setFiltroFollowup]       = useState('')
  const [pagina, setPagina]                       = useState(1)
  const PAGE_SIZE = 10

  const cidades_unicas = useMemo(
    () => [...new Set(solicitacoes.map((s) => s.cidade))].sort(),
    [solicitacoes]
  )

  const filtradas = useMemo(() => {
    return solicitacoes.filter((s) => {
      if (filtroStatus && s.status !== filtroStatus) return false
      if (filtroCidade && s.cidade !== filtroCidade) return false
      if (filtroAtendimento && atendimentoLabel(s) !== filtroAtendimento) return false
      if (filtroImovel === 'sim' && !((s.qtd_imoveis_enviados ?? 0) > 0)) return false
      if (filtroImovel === 'nao' &&  (s.qtd_imoveis_enviados ?? 0) > 0) return false
      if (filtroFollowup && followupLabel(s.ultimo_followup_status) !== filtroFollowup) return false
      return true
    })
  }, [solicitacoes, filtroStatus, filtroCidade, filtroAtendimento, filtroImovel, filtroFollowup])

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / PAGE_SIZE))
  const paginaAtual  = Math.min(pagina, totalPaginas)
  const visiveis     = filtradas.slice((paginaAtual - 1) * PAGE_SIZE, paginaAtual * PAGE_SIZE)

  function resetarFiltros() {
    setFiltroStatus(''); setFiltroCidade(''); setFiltroAtendimento('')
    setFiltroImovel(''); setFiltroFollowup(''); setPagina(1)
  }

  const algumFiltroAtivo = filtroStatus || filtroCidade || filtroAtendimento || filtroImovel || filtroFollowup

  async function confirmarEExcluir(id: string) {
    setDeletandoId(id)
    const { error } = await supabase.from('solicitacoes').delete().eq('id', id).eq('corretor_id', corretorId)
    setDeletandoId(null)
    setConfirmarExcluir(null)
    if (error) { addToast('erro', 'Erro ao excluir', error.message); return }
    addToast('sucesso', 'Solicitação excluída')
    router.refresh()
  }

  async function handleRodarMatching(id: string) {
    setMatchingId(id)
    try {
      const res = await fetch(`/api/matching/solicitacao/${id}`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        addToast('erro', 'Erro no matching', data.error || 'Tente novamente.')
      } else {
        const qtd = data.matchesGerados || 0
        addToast(qtd > 0 ? 'sucesso' : 'info', qtd > 0 ? `${qtd} match(es) gerado(s)` : 'Nenhuma compatibilidade ≥ 70%')
      }
    } catch {
      addToast('erro', 'Erro ao rodar matching', 'Verifique sua conexão.')
    }
    setMatchingId(null)
    router.refresh()
  }

  return (
    <>
      <ToastContainer toasts={toasts} onRemover={removerToast} />
      {confirmarExcluir && (
        <ModalConfirm
          titulo="Excluir solicitação?"
          descricao="Esta ação é irreversível. O matching e os leads associados a ela também serão removidos."
          labelConfirmar="Excluir"
          onConfirmar={() => confirmarEExcluir(confirmarExcluir)}
          onCancelar={() => setConfirmarExcluir(null)}
          carregando={deletandoId === confirmarExcluir}
        />
      )}

      <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          {/* Filtros */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {/* Linha 1: filtros existentes */}
            <select style={selectStyle} value={filtroStatus} onChange={(e) => { setFiltroStatus(e.target.value); setPagina(1) }}>
              <option value="">Todos os status</option>
              <option value="ativa">Ativa</option>
              <option value="concluida">Concluída</option>
              <option value="cancelada">Cancelada</option>
            </select>
            <select style={selectStyle} value={filtroCidade} onChange={(e) => { setFiltroCidade(e.target.value); setPagina(1) }}>
              <option value="">Todas as cidades</option>
              {cidades_unicas.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {/* Novos filtros */}
            <select style={selectStyle} value={filtroAtendimento} onChange={(e) => { setFiltroAtendimento(e.target.value); setPagina(1) }}>
              <option value="">Atendimento</option>
              <option value="novo">Novo</option>
              <option value="atendido">Atendido</option>
              <option value="sem_retorno">Sem retorno</option>
            </select>
            <select style={selectStyle} value={filtroImovel} onChange={(e) => { setFiltroImovel(e.target.value); setPagina(1) }}>
              <option value="">Imóvel enviado</option>
              <option value="sim">Sim</option>
              <option value="nao">Não</option>
            </select>
            <select style={selectStyle} value={filtroFollowup} onChange={(e) => { setFiltroFollowup(e.target.value); setPagina(1) }}>
              <option value="">Follow-up</option>
              <option value="enviado">Em dia</option>
              <option value="falhou">Falhou</option>
              <option value="sem_followup">Nenhum</option>
            </select>
            {algumFiltroAtivo && (
              <button onClick={resetarFiltros} style={{ ...selectStyle, color: '#C9A84C', border: '1px solid rgba(201,168,76,0.3)' }}>
                ✕ Limpar
              </button>
            )}
          </div>

          <button
            onClick={() => { setEditando(null); setModalAberto(true) }}
            style={{ backgroundColor: '#C9A84C', color: '#0E0E0F', border: 'none', borderRadius: '2px', padding: '8px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}
          >
            + Nova Solicitação
          </button>
        </div>

        {/* Contagem + Export */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <p style={{ fontSize: '12px', color: '#9B9690' }}>
            {filtradas.length} {filtradas.length === 1 ? 'solicitação' : 'solicitações'}
            {algumFiltroAtivo && <span style={{ color: '#555' }}> · filtradas</span>}
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
        <div style={{ backgroundColor: '#181819', border: '1px solid rgba(201,168,76,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
          {filtradas.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', color: '#9B9690' }}>Nenhuma solicitação encontrada.</p>
              {algumFiltroAtivo && (
                <button onClick={resetarFiltros} style={{ marginTop: '12px', background: 'none', border: '1px solid #2E2E30', borderRadius: 2, padding: '6px 14px', fontSize: 12, color: '#C9A84C', cursor: 'pointer' }}>
                  Limpar filtros
                </button>
              )}
            </div>
          ) : (
            visiveis.map((sol, i) => {
              const sc = statusColor(sol.status)
              const aberto = expandido === sol.id
              return (
                <React.Fragment key={sol.id}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '14px 20px',
                      borderBottom: (!aberto && i < visiveis.length - 1) ? '1px solid #232324' : 'none',
                      transition: 'background-color 0.15s',
                      cursor: 'pointer',
                    }}
                    onClick={() => setExpandido(aberto ? null : sol.id)}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(201,168,76,0.03)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    {/* Ícone expand */}
                    <span style={{ fontSize: '12px', color: '#555', flexShrink: 0, width: '12px' }}>
                      {aberto ? '▾' : '▸'}
                    </span>

                    {/* Info principal */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                        <p style={{ fontSize: '14px', fontWeight: 500, color: '#F0EDE6' }}>{sol.cliente_nome}</p>
                        <span style={{ fontSize: '11px', color: '#9B9690' }}>{sol.tipo_negocio} · {sol.tipo_imovel}</span>
                        {/* Badges */}
                        <BadgeAtendimento sol={sol} />
                        <BadgeImoveis qtd={sol.qtd_imoveis_enviados} />
                        <BadgeFollowup status={sol.ultimo_followup_status} />
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
                          ? `até ${formatCurrency(sol.valor_max)}`
                          : 'Valor a definir'}
                        {' · '}
                        <span style={{ color: sol.prazo_fechar === 'Imediato' ? '#E05C5C' : '#9B9690' }}>
                          {sol.prazo_fechar}
                        </span>
                        {sol.tem_animal && <span style={{ marginLeft: '8px', color: '#5CB88A', fontSize: '11px' }}>+ Animal</span>}
                      </p>
                    </div>

                    {/* Badge status */}
                    <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '2px', backgroundColor: sc.bg, color: sc.text, flexShrink: 0, textTransform: 'capitalize' }}>
                      {sol.status}
                    </span>

                    {/* Botões (stopPropagation p/ não expandir) */}
                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                      <button title="Rodar Matching" style={btnIconStyle} disabled={matchingId === sol.id} onClick={() => handleRodarMatching(sol.id)}>
                        {matchingId === sol.id ? '...' : '⚙'}
                      </button>
                      <button title="Editar" style={btnIconStyle} onClick={() => { setEditando(sol); setModalAberto(true) }}>✏</button>
                      <button title="Excluir" style={{ ...btnIconStyle, color: deletandoId === sol.id ? '#E05C5C' : '#9B9690' }} disabled={deletandoId === sol.id} onClick={() => setConfirmarExcluir(sol.id)}>
                        {deletandoId === sol.id ? '...' : '✕'}
                      </button>
                    </div>
                  </div>

                  {/* Timeline expansível */}
                  {aberto && <TimelineRow solicitacaoId={sol.id} />}
                </React.Fragment>
              )
            })
          )}
        </div>

        {/* Paginação */}
        {totalPaginas > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, paddingTop: 4 }}>
            <button onClick={() => setPagina((p) => Math.max(1, p - 1))} disabled={paginaAtual === 1}
              style={{ background: '#181819', border: '1px solid #232324', borderRadius: 2, padding: '6px 14px', fontSize: 13, cursor: paginaAtual === 1 ? 'default' : 'pointer', color: paginaAtual === 1 ? '#2E2E30' : '#9B9690' }}>←</button>
            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
              <button key={n} onClick={() => setPagina(n)}
                style={{ background: n === paginaAtual ? '#C9A84C' : '#181819', border: '1px solid ' + (n === paginaAtual ? '#C9A84C' : '#232324'), borderRadius: 2, padding: '6px 12px', fontSize: 13, color: n === paginaAtual ? '#0F0F10' : '#9B9690', cursor: 'pointer', fontWeight: n === paginaAtual ? 700 : 400 }}
              >{n}</button>
            ))}
            <button onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))} disabled={paginaAtual === totalPaginas}
              style={{ background: '#181819', border: '1px solid #232324', borderRadius: 2, padding: '6px 14px', fontSize: 13, cursor: paginaAtual === totalPaginas ? 'default' : 'pointer', color: paginaAtual === totalPaginas ? '#2E2E30' : '#9B9690' }}>→</button>
          </div>
        )}
      </div>

      {modalAberto && (
        <ModalSolicitacao
          solicitacao={editando}
          corretorId={corretorId}
          cidades={cidades}
          onClose={(salvo?: boolean) => {
            setModalAberto(false)
            if (salvo) addToast('sucesso', editando ? 'Solicitação atualizada' : 'Solicitação criada com sucesso')
          }}
        />
      )}
    </>
  )
}
