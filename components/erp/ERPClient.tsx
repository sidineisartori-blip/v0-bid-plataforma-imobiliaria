'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/format'
import { calcVencimento, calcReajuste, mesAtual } from '@/lib/vencimento'
import ModalContrato from './ModalContrato'
import ERPCobrancas, { type Cobranca } from './ERPCobrancas'
import ERPRepasses,  { type Repasse }  from './ERPRepasses'
import ERPExtrato,   { type MovimentacaoExtrato } from './ERPExtrato'

export interface Contrato {
  id: string
  corretor_id: string
  imovel_id: string | null
  tipo: 'locacao' | 'venda'
  status: 'rascunho' | 'aguardando_assinatura' | 'ativo' | 'encerrado' | 'cancelado'
  cliente_nome: string
  cliente_cpf_cnpj: string | null
  cliente_email: string | null
  cliente_whatsapp: string | null
  valor_contrato: number
  valor_comissao: number | null
  percentual_comissao: number | null
  forma_pagamento: string | null
  data_inicio: string | null
  data_fim: string | null
  data_assinatura: string | null
  valor_aluguel: number | null
  dia_vencimento: number | null
  indice_reajuste: string | null
  garantia: string | null
  observacoes: string | null
  arquivo_url: string | null
  created_at: string
  imovel?: { titulo: string; cidade: string; bairro: string | null } | null
}

interface ERPClientProps {
  contratos: Contrato[]
  cobrancas: Cobranca[]
  repasses: Repasse[]
  movimentacoes: MovimentacaoExtrato[]
  saldoAnterior: number
  imoveis: { id: string; titulo: string; cidade: string; bairro: string | null }[]
  corretorId: string
}

const STATUS_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  rascunho:              { label: 'Rascunho',        bg: 'rgba(155,150,144,0.12)', color: '#9B9690' },
  aguardando_assinatura: { label: 'Ag. Assinatura',  bg: 'rgba(201,168,76,0.12)',  color: '#C9A84C' },
  ativo:                 { label: 'Ativo',            bg: 'rgba(34,197,94,0.12)',   color: '#22c55e' },
  encerrado:             { label: 'Encerrado',        bg: 'rgba(155,150,144,0.12)', color: '#9B9690' },
  cancelado:             { label: 'Cancelado',        bg: 'rgba(239,68,68,0.12)',   color: '#ef4444' },
}

const TIPO_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  locacao: { label: 'Locação', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
  venda:   { label: 'Venda',   color: '#C9A84C', bg: 'rgba(201,168,76,0.12)' },
}

function formatData(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR')
}

const PAGE_SIZE = 10
type Aba = 'contratos' | 'cobrancas' | 'repasses' | 'extrato'

export default function ERPClient({
  contratos, cobrancas, repasses, movimentacoes, saldoAnterior, imoveis, corretorId
}: ERPClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [aba, setAba] = useState<Aba>('contratos')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroTipo, setFiltroTipo]     = useState('')
  const [busca, setBusca]               = useState('')
  const [pagina, setPagina]             = useState(1)
  const [modalAberto, setModalAberto]   = useState(false)
  const [contratoEditando, setContratoEditando] = useState<Contrato | null>(null)
  const [deletandoId, setDeletandoId]   = useState<string | null>(null)

  const filtrados = useMemo(() => {
    return contratos.filter((c) => {
      if (filtroStatus && c.status !== filtroStatus) return false
      if (filtroTipo   && c.tipo   !== filtroTipo)   return false
      if (busca) {
        const q = busca.toLowerCase()
        const hay = [c.cliente_nome, c.imovel?.titulo, c.imovel?.cidade, c.cliente_cpf_cnpj]
          .filter(Boolean).join(' ').toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [contratos, filtroStatus, filtroTipo, busca])

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE))
  const paginaAtual  = Math.min(pagina, totalPaginas)
  const visiveis     = filtrados.slice((paginaAtual - 1) * PAGE_SIZE, paginaAtual * PAGE_SIZE)

  // KPIs gerais
  const kpis = useMemo(() => {
    const ativos  = contratos.filter((c) => c.status === 'ativo')
    const locacoes = ativos.filter((c) => c.tipo === 'locacao')
    const vendas   = ativos.filter((c) => c.tipo === 'venda')
    const receitaMes = locacoes.reduce((s: number, c: Contrato) => s + (c.valor_aluguel || 0), 0)
    const comissaoPendente = contratos
      .filter((c) => c.status === 'aguardando_assinatura')
      .reduce((s: number, c: Contrato) => s + (c.valor_comissao || 0), 0)
    // Contratos a reajustar nos próximos 30 dias
    const aReajustar = locacoes.filter((c) => {
      const { precisaReajuste } = calcReajuste(c.data_inicio, c.indice_reajuste)
      return precisaReajuste
    }).length
    return { total: contratos.length, locacoes: locacoes.length, vendas: vendas.length, receitaMes, comissaoPendente, aReajustar }
  }, [contratos])

  // Badge de notificação por aba
  const badges: Record<Aba, number> = {
    contratos: kpis.aReajustar,
    cobrancas: cobrancas.filter(c => c.status === 'atrasado').length,
    repasses:  repasses.filter(r => r.status === 'pendente').length,
    extrato:   0,
  }

  async function handleDeletar(id: string) {
    if (!confirm('Excluir este contrato? Esta ação não pode ser desfeita.')) return
    setDeletandoId(id)
    await supabase.from('contratos').delete().eq('id', id).eq('corretor_id', corretorId)
    setDeletandoId(null)
    router.refresh()
  }

  const INP: React.CSSProperties = {
    background: 'var(--color-dark-2, #181819)',
    border: '1px solid var(--color-dark-4, #2E2E30)',
    borderRadius: 2,
    padding: '8px 12px',
    fontSize: 13,
    color: '#F0EDE6',
    outline: 'none',
  }

  const ABAS: { key: Aba; label: string }[] = [
    { key: 'contratos', label: 'Contratos' },
    { key: 'cobrancas', label: 'Cobranças' },
    { key: 'repasses',  label: 'Repasses'  },
    { key: 'extrato',   label: 'Extrato'   },
  ]

  return (
    <div style={{ padding: '32px 24px', maxWidth: 1100, margin: '0 auto', color: '#F0EDE6' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 700, color: '#F0EDE6', marginBottom: 4 }}>ERP Imobiliário</h1>
          <p style={{ fontSize: 13, color: '#9B9690' }}>Contratos, cobranças, repasses e extrato financeiro.</p>
        </div>
        {aba === 'contratos' && (
          <button
            onClick={() => { setContratoEditando(null); setModalAberto(true) }}
            style={{ background: '#C9A84C', color: '#0E0E0F', border: 'none', borderRadius: 2, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            + Novo Contrato
          </button>
        )}
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px,1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Contratos Ativos',  value: kpis.locacoes + kpis.vendas, cor: '#C9A84C' },
          { label: 'Locações',          value: kpis.locacoes,  cor: '#60a5fa' },
          { label: 'Vendas',            value: kpis.vendas,    cor: '#C9A84C' },
          { label: 'Receita Mês',       value: formatCurrency(kpis.receitaMes), cor: '#5CB88A' },
          { label: 'Comissão Pendente', value: formatCurrency(kpis.comissaoPendente), cor: '#C9A84C' },
          { label: 'A Reajustar',       value: kpis.aReajustar, cor: kpis.aReajustar > 0 ? '#E05C5C' : '#9B9690' },
        ].map((k) => (
          <div key={k.label} style={{ background: '#181819', border: '1px solid rgba(201,168,76,0.12)', borderRadius: 2, padding: '14px 18px' }}>
            <p style={{ fontSize: 11, color: '#9B9690', marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{k.label}</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: k.cor }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Abas */}
      <div style={{ display: 'flex', borderBottom: '1px solid #232324', marginBottom: 20, gap: 0 }}>
        {ABAS.map((a) => (
          <button
            key={a.key}
            onClick={() => setAba(a.key)}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: aba === a.key ? '2px solid #C9A84C' : '2px solid transparent',
              padding: '10px 20px',
              fontSize: 13,
              fontWeight: aba === a.key ? 600 : 400,
              color: aba === a.key ? '#C9A84C' : '#9B9690',
              cursor: 'pointer',
              position: 'relative',
              marginBottom: -1,
            }}
          >
            {a.label}
            {badges[a.key] > 0 && (
              <span style={{
                marginLeft: 6, background: '#E05C5C', color: '#fff',
                borderRadius: 9999, fontSize: 10, fontWeight: 700,
                padding: '1px 6px', verticalAlign: 'middle',
              }}>{badges[a.key]}</span>
            )}
          </button>
        ))}
      </div>

      {/* Aba: Contratos */}
      {aba === 'contratos' && (
        <>
          {/* Alerta reajuste */}
          {kpis.aReajustar > 0 && (
            <div style={{ background: 'rgba(224,92,92,0.08)', border: '1px solid rgba(224,92,92,0.25)', borderRadius: 2, padding: '12px 18px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: 13, color: '#E05C5C' }}>
                ⚠ Você tem <strong>{kpis.aReajustar}</strong> contrato(s) com reajuste nos próximos 30 dias.
              </p>
            </div>
          )}

          {/* Filtros */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            <input
              type="text" placeholder="Buscar cliente, imóvel..." value={busca}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setBusca(e.target.value); setPagina(1) }}
              style={{ ...INP, flex: '1 1 200px' }}
            />
            <select value={filtroTipo} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setFiltroTipo(e.target.value); setPagina(1) }} style={INP}>
              <option value="">Tipo: Todos</option>
              <option value="locacao">Locação</option>
              <option value="venda">Venda</option>
            </select>
            <select value={filtroStatus} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setFiltroStatus(e.target.value); setPagina(1) }} style={INP}>
              <option value="">Status: Todos</option>
              <option value="rascunho">Rascunho</option>
              <option value="aguardando_assinatura">Ag. Assinatura</option>
              <option value="ativo">Ativo</option>
              <option value="encerrado">Encerrado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          {/* Chips de filtros ativos */}
          {(filtroStatus || filtroTipo || busca) && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
              {filtroTipo && (
                <span style={{ fontSize: 11, padding: '3px 10px', background: 'rgba(96,165,250,0.12)', color: '#60a5fa', borderRadius: 2, cursor: 'pointer' }}
                  onClick={() => setFiltroTipo('')}>
                  Tipo: {TIPO_BADGE[filtroTipo]?.label} ×
                </span>
              )}
              {filtroStatus && (
                <span style={{ fontSize: 11, padding: '3px 10px', background: 'rgba(201,168,76,0.12)', color: '#C9A84C', borderRadius: 2, cursor: 'pointer' }}
                  onClick={() => setFiltroStatus('')}>
                  Status: {STATUS_BADGE[filtroStatus]?.label} ×
                </span>
              )}
              {busca && (
                <span style={{ fontSize: 11, padding: '3px 10px', background: 'rgba(155,150,144,0.1)', color: '#9B9690', borderRadius: 2, cursor: 'pointer' }}
                  onClick={() => setBusca('')}>
                  Busca: "{busca}" ×
                </span>
              )}
            </div>
          )}

          <p style={{ fontSize: 12, color: '#9B9690', marginBottom: 10 }}>
            {filtrados.length} {filtrados.length === 1 ? 'contrato' : 'contratos'}
            {filtrados.length > 0 && ` · Total: ${formatCurrency(filtrados.reduce((s: number, c: Contrato) => s + c.valor_contrato, 0))}`}
          </p>

          {filtrados.length === 0 ? (
            <div style={{ background: '#181819', border: '1px solid rgba(201,168,76,0.1)', borderRadius: 2, padding: '60px 20px', textAlign: 'center' }}>
              <p style={{ color: '#9B9690', fontSize: 14, marginBottom: 16 }}>
                {contratos.length === 0 ? 'Nenhum contrato cadastrado.' : 'Nenhum resultado para os filtros.'}
              </p>
              {contratos.length === 0 && (
                <button onClick={() => { setContratoEditando(null); setModalAberto(true) }}
                  style={{ background: '#C9A84C', color: '#0E0E0F', border: 'none', borderRadius: 2, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Criar primeiro contrato
                </button>
              )}
            </div>
          ) : (
            <div style={{ background: '#181819', border: '1px solid rgba(201,168,76,0.1)', borderRadius: 2, overflow: 'hidden' }}>
              {visiveis.map((c: Contrato, i: number) => {
                const sb = STATUS_BADGE[c.status]
                const tb = TIPO_BADGE[c.tipo]
                // Vencimento do contrato de locação
                const vencFim = c.tipo === 'locacao' ? calcVencimento(c.data_fim) : null
                // Reajuste
                const reajuste = c.tipo === 'locacao' && c.status === 'ativo'
                  ? calcReajuste(c.data_inicio, c.indice_reajuste) : null

                return (
                  <div key={c.id} style={{
                    display: 'grid', gridTemplateColumns: '1fr auto', gap: 12,
                    padding: '14px 18px',
                    borderBottom: i < visiveis.length - 1 ? '1px solid #232324' : 'none',
                    borderLeft: reajuste?.precisaReajuste ? '3px solid #E05C5C'
                      : vencFim?.status === 'atrasado_grave' ? '3px solid #E05C5C'
                      : vencFim?.status === 'vence_em_breve' ? '3px solid #C9A84C'
                      : '3px solid transparent',
                    alignItems: 'center',
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#F0EDE6' }}>{c.cliente_nome}</span>
                        <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 2, fontWeight: 600, background: tb?.bg, color: tb?.color }}>{tb?.label}</span>
                        <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 2, fontWeight: 600, background: sb?.bg, color: sb?.color }}>{sb?.label}</span>
                        {/* Status inline de vencimento */}
                        {vencFim && (vencFim.status === 'vence_hoje' || vencFim.status === 'vence_amanha' || vencFim.status === 'vence_em_breve' || vencFim.status.startsWith('atrasado')) && (
                          <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 2, fontWeight: 600, background: vencFim.bgCor, color: vencFim.cor }}>
                            {vencFim.label}
                          </span>
                        )}
                        {reajuste?.precisaReajuste && (
                          <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 2, fontWeight: 600, background: 'rgba(224,92,92,0.12)', color: '#E05C5C' }}>
                            {reajuste.label}
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                        {c.imovel && <span style={{ fontSize: 12, color: '#9B9690' }}>{c.imovel.titulo} · {[c.imovel.bairro, c.imovel.cidade].filter(Boolean).join(', ')}</span>}
                        <span style={{ fontSize: 12, color: '#C9A84C', fontWeight: 600 }}>{formatCurrency(c.valor_contrato)}</span>
                        {c.data_inicio && <span style={{ fontSize: 12, color: '#9B9690' }}>Início: {formatData(c.data_inicio)}</span>}
                        {c.tipo === 'locacao' && c.data_fim && <span style={{ fontSize: 12, color: '#9B9690' }}>Fim: {formatData(c.data_fim)}</span>}
                        {c.tipo === 'locacao' && c.valor_aluguel && <span style={{ fontSize: 12, color: '#9B9690' }}>Alug. {formatCurrency(c.valor_aluguel)}/mês</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button onClick={() => { setContratoEditando(c); setModalAberto(true) }}
                        style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 2, padding: '6px 12px', fontSize: 12, color: '#C9A84C', cursor: 'pointer' }}>
                        Editar
                      </button>
                      <button onClick={() => handleDeletar(c.id)} disabled={deletandoId === c.id}
                        style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 2, padding: '6px 12px', fontSize: 12, color: '#ef4444', cursor: 'pointer' }}>
                        {deletandoId === c.id ? '...' : 'Excluir'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Paginação */}
          {totalPaginas > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20 }}>
              <button onClick={() => setPagina((p: number) => Math.max(1, p - 1))} disabled={paginaAtual === 1}
                style={{ background: '#181819', border: '1px solid #2E2E30', borderRadius: 2, padding: '6px 14px', fontSize: 13, cursor: paginaAtual === 1 ? 'default' : 'pointer', color: paginaAtual === 1 ? '#2E2E30' : '#9B9690' }}>←</button>
              {Array.from({ length: totalPaginas }, (_: unknown, idx: number) => idx + 1).map((n: number) => (
                <button key={n} onClick={() => setPagina(n)}
                  style={{ background: n === paginaAtual ? '#C9A84C' : '#181819', border: '1px solid ' + (n === paginaAtual ? '#C9A84C' : '#2E2E30'), borderRadius: 2, padding: '6px 12px', fontSize: 13, color: n === paginaAtual ? '#0F0F10' : '#9B9690', cursor: 'pointer', fontWeight: n === paginaAtual ? 700 : 400 }}>{n}</button>
              ))}
              <button onClick={() => setPagina((p: number) => Math.min(totalPaginas, p + 1))} disabled={paginaAtual === totalPaginas}
                style={{ background: '#181819', border: '1px solid #2E2E30', borderRadius: 2, padding: '6px 14px', fontSize: 13, cursor: paginaAtual === totalPaginas ? 'default' : 'pointer', color: paginaAtual === totalPaginas ? '#2E2E30' : '#9B9690' }}>→</button>
            </div>
          )}
        </>
      )}

      {/* Aba: Cobranças */}
      {aba === 'cobrancas' && (
        <ERPCobrancas cobrancas={cobrancas} corretorId={corretorId} mesInicial={mesAtual()} />
      )}

      {/* Aba: Repasses */}
      {aba === 'repasses' && (
        <ERPRepasses repasses={repasses} corretorId={corretorId} mesInicial={mesAtual()} />
      )}

      {/* Aba: Extrato */}
      {aba === 'extrato' && (
        <ERPExtrato movimentacoes={movimentacoes} saldoAnterior={saldoAnterior} mesInicial={mesAtual()} />
      )}

      {/* Modal */}
      {modalAberto && (
        <ModalContrato
          contrato={contratoEditando}
          imoveis={imoveis}
          corretorId={corretorId}
          onClose={() => setModalAberto(false)}
        />
      )}
    </div>
  )
}
