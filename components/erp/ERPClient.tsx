'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/format'
import ModalContrato from './ModalContrato'

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
  imoveis: { id: string; titulo: string; cidade: string; bairro: string | null }[]
  corretorId: string
}

const STATUS_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  rascunho:              { label: 'Rascunho',              bg: 'rgba(155,150,144,0.12)', color: '#9B9690' },
  aguardando_assinatura: { label: 'Ag. Assinatura',        bg: 'rgba(201,168,76,0.12)',  color: '#C9A84C' },
  ativo:                 { label: 'Ativo',                  bg: 'rgba(34,197,94,0.12)',   color: '#22c55e' },
  encerrado:             { label: 'Encerrado',              bg: 'rgba(155,150,144,0.12)', color: '#9B9690' },
  cancelado:             { label: 'Cancelado',              bg: 'rgba(239,68,68,0.12)',   color: '#ef4444' },
}

const TIPO_BADGE: Record<string, { label: string; color: string }> = {
  locacao: { label: 'Locação', color: '#60a5fa' },
  venda:   { label: 'Venda',   color: '#C9A84C' },
}

function formatData(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR')
}

const PAGE_SIZE = 10

export default function ERPClient({ contratos, imoveis, corretorId }: ERPClientProps) {
  const router = useRouter()
  const supabase = createClient()

  const [filtroStatus, setFiltroStatus]     = useState('')
  const [filtroTipo, setFiltroTipo]         = useState('')
  const [busca, setBusca]                   = useState('')
  const [pagina, setPagina]                 = useState(1)
  const [modalAberto, setModalAberto]       = useState(false)
  const [contratoEditando, setContratoEditando] = useState<Contrato | null>(null)
  const [deletandoId, setDeletandoId]       = useState<string | null>(null)

  const filtrados = useMemo(() => {
    return contratos.filter((c) => {
      if (filtroStatus && c.status !== filtroStatus) return false
      if (filtroTipo   && c.tipo   !== filtroTipo)   return false
      if (busca) {
        const q = busca.toLowerCase()
        const haystack = [
          c.cliente_nome,
          c.imovel?.titulo,
          c.imovel?.cidade,
          c.cliente_cpf_cnpj,
        ].filter(Boolean).join(' ').toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [contratos, filtroStatus, filtroTipo, busca])

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE))
  const paginaAtual  = Math.min(pagina, totalPaginas)
  const visíveis     = filtrados.slice((paginaAtual - 1) * PAGE_SIZE, paginaAtual * PAGE_SIZE)

  // KPIs
  const kpis = useMemo(() => {
    const ativos    = contratos.filter((c) => c.status === 'ativo')
    const locacoes  = ativos.filter((c) => c.tipo === 'locacao')
    const vendas    = ativos.filter((c) => c.tipo === 'venda')
    const receitaMes = locacoes.reduce((s, c) => s + (c.valor_aluguel || 0), 0)
    const comissaoPendente = contratos
      .filter((c) => c.status === 'aguardando_assinatura')
      .reduce((s, c) => s + (c.valor_comissao || 0), 0)
    return { total: contratos.length, locacoes: locacoes.length, vendas: vendas.length, receitaMes, comissaoPendente }
  }, [contratos])

  async function handleDeletar(id: string) {
    if (!confirm('Excluir este contrato? Esta ação não pode ser desfeita.')) return
    setDeletandoId(id)
    await supabase.from('contratos').delete().eq('id', id).eq('corretor_id', corretorId)
    setDeletandoId(null)
    router.refresh()
  }

  function abrirNovo() {
    setContratoEditando(null)
    setModalAberto(true)
  }

  function abrirEdicao(c: Contrato) {
    setContratoEditando(c)
    setModalAberto(true)
  }

  const S: React.CSSProperties = {
    fontFamily: 'var(--font-sans)',
    color: 'var(--color-text)',
  }

  return (
    <div style={{ ...S, padding: '32px 24px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>
            ERP — Contratos
          </h1>
          <p style={{ fontSize: 13, color: 'var(--color-muted)' }}>
            Gerencie contratos de locação e venda, proprietários e cobranças.
          </p>
        </div>
        <button
          onClick={abrirNovo}
          style={{
            backgroundColor: 'var(--color-gold)',
            color: 'var(--color-dark)',
            border: 'none',
            borderRadius: 2,
            padding: '10px 20px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            letterSpacing: '0.02em',
          }}
        >
          + Novo Contrato
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12, marginBottom: 28 }}>
        {[
          { label: 'Total de Contratos', value: kpis.total, unit: '' },
          { label: 'Locações Ativas',    value: kpis.locacoes, unit: '' },
          { label: 'Vendas Ativas',      value: kpis.vendas, unit: '' },
          { label: 'Receita Mês (alug.)',value: formatCurrency(kpis.receitaMes), unit: '' },
          { label: 'Comissão Pendente',  value: formatCurrency(kpis.comissaoPendente), unit: '' },
        ].map((k) => (
          <div
            key={k.label}
            style={{
              background: 'var(--color-dark-2)',
              border: '1px solid rgba(201,168,76,0.12)',
              borderRadius: 2,
              padding: '14px 18px',
            }}
          >
            <p style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              {k.label}
            </p>
            <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-gold)' }}>
              {k.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Buscar por cliente, imóvel..."
          value={busca}
          onChange={(e) => { setBusca(e.target.value); setPagina(1) }}
          style={{
            flex: '1 1 200px',
            background: 'var(--color-dark-2)',
            border: '1px solid var(--color-dark-4)',
            borderRadius: 2,
            padding: '8px 12px',
            fontSize: 13,
            color: 'var(--color-text)',
            outline: 'none',
          }}
        />
        <select
          value={filtroTipo}
          onChange={(e) => { setFiltroTipo(e.target.value); setPagina(1) }}
          style={{
            background: 'var(--color-dark-2)',
            border: '1px solid var(--color-dark-4)',
            borderRadius: 2,
            padding: '8px 12px',
            fontSize: 13,
            color: 'var(--color-text)',
            cursor: 'pointer',
          }}
        >
          <option value="">Tipo: Todos</option>
          <option value="locacao">Locação</option>
          <option value="venda">Venda</option>
        </select>
        <select
          value={filtroStatus}
          onChange={(e) => { setFiltroStatus(e.target.value); setPagina(1) }}
          style={{
            background: 'var(--color-dark-2)',
            border: '1px solid var(--color-dark-4)',
            borderRadius: 2,
            padding: '8px 12px',
            fontSize: 13,
            color: 'var(--color-text)',
            cursor: 'pointer',
          }}
        >
          <option value="">Status: Todos</option>
          <option value="rascunho">Rascunho</option>
          <option value="aguardando_assinatura">Ag. Assinatura</option>
          <option value="ativo">Ativo</option>
          <option value="encerrado">Encerrado</option>
          <option value="cancelado">Cancelado</option>
        </select>
      </div>

      {/* Contagem */}
      <p style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 10 }}>
        {filtrados.length} {filtrados.length === 1 ? 'contrato' : 'contratos'}
        {(filtroStatus || filtroTipo || busca) ? ' (filtrado)' : ''}
      </p>

      {/* Tabela */}
      {filtrados.length === 0 ? (
        <div
          style={{
            background: 'var(--color-dark-2)',
            border: '1px solid rgba(201,168,76,0.1)',
            borderRadius: 2,
            padding: '60px 20px',
            textAlign: 'center',
          }}
        >
          <p style={{ color: 'var(--color-muted)', fontSize: 14, marginBottom: 16 }}>
            {contratos.length === 0 ? 'Nenhum contrato cadastrado ainda.' : 'Nenhum resultado para os filtros aplicados.'}
          </p>
          {contratos.length === 0 && (
            <button
              onClick={abrirNovo}
              style={{
                backgroundColor: 'var(--color-gold)',
                color: 'var(--color-dark)',
                border: 'none',
                borderRadius: 2,
                padding: '10px 20px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Criar primeiro contrato
            </button>
          )}
        </div>
      ) : (
        <div style={{ background: 'var(--color-dark-2)', border: '1px solid rgba(201,168,76,0.1)', borderRadius: 2, overflow: 'hidden' }}>
          {visíveis.map((c, i) => {
            const sb = STATUS_BADGE[c.status]
            const tb = TIPO_BADGE[c.tipo]
            return (
              <div
                key={c.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: 12,
                  padding: '14px 18px',
                  borderBottom: i < visíveis.length - 1 ? '1px solid #232324' : 'none',
                  alignItems: 'center',
                }}
              >
                {/* Left: info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.cliente_nome}
                    </span>
                    <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 2, fontWeight: 600, letterSpacing: '0.04em', backgroundColor: tb?.color === '#C9A84C' ? 'rgba(201,168,76,0.12)' : 'rgba(96,165,250,0.12)', color: tb?.color }}>
                      {tb?.label}
                    </span>
                    <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 2, fontWeight: 600, letterSpacing: '0.04em', backgroundColor: sb?.bg, color: sb?.color }}>
                      {sb?.label}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    {c.imovel && (
                      <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                        {c.imovel.titulo} · {[c.imovel.bairro, c.imovel.cidade].filter(Boolean).join(', ')}
                      </span>
                    )}
                    <span style={{ fontSize: 12, color: 'var(--color-gold)', fontWeight: 600 }}>
                      {formatCurrency(c.valor_contrato)}
                    </span>
                    {c.data_inicio && (
                      <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                        Início: {formatData(c.data_inicio)}
                      </span>
                    )}
                    {c.tipo === 'locacao' && c.data_fim && (
                      <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                        Fim: {formatData(c.data_fim)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: actions */}
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button
                    onClick={() => abrirEdicao(c)}
                    style={{
                      background: 'rgba(201,168,76,0.08)',
                      border: '1px solid rgba(201,168,76,0.2)',
                      borderRadius: 2,
                      padding: '6px 12px',
                      fontSize: 12,
                      color: 'var(--color-gold)',
                      cursor: 'pointer',
                    }}
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeletar(c.id)}
                    disabled={deletandoId === c.id}
                    style={{
                      background: 'rgba(239,68,68,0.06)',
                      border: '1px solid rgba(239,68,68,0.2)',
                      borderRadius: 2,
                      padding: '6px 12px',
                      fontSize: 12,
                      color: '#ef4444',
                      cursor: 'pointer',
                    }}
                  >
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
          <button
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
            disabled={paginaAtual === 1}
            style={{
              background: 'var(--color-dark-2)',
              border: '1px solid var(--color-dark-4)',
              borderRadius: 2,
              padding: '6px 14px',
              fontSize: 13,
              color: paginaAtual === 1 ? 'var(--color-muted)' : 'var(--color-text)',
              cursor: paginaAtual === 1 ? 'default' : 'pointer',
            }}
          >
            ←
          </button>
          {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => setPagina(n)}
              style={{
                background: n === paginaAtual ? 'var(--color-gold)' : 'var(--color-dark-2)',
                border: '1px solid ' + (n === paginaAtual ? 'var(--color-gold)' : 'var(--color-dark-4)'),
                borderRadius: 2,
                padding: '6px 12px',
                fontSize: 13,
                color: n === paginaAtual ? 'var(--color-dark)' : 'var(--color-muted)',
                cursor: 'pointer',
                fontWeight: n === paginaAtual ? 700 : 400,
              }}
            >
              {n}
            </button>
          ))}
          <button
            onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
            disabled={paginaAtual === totalPaginas}
            style={{
              background: 'var(--color-dark-2)',
              border: '1px solid var(--color-dark-4)',
              borderRadius: 2,
              padding: '6px 14px',
              fontSize: 13,
              color: paginaAtual === totalPaginas ? 'var(--color-muted)' : 'var(--color-text)',
              cursor: paginaAtual === totalPaginas ? 'default' : 'pointer',
            }}
          >
            →
          </button>
        </div>
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
