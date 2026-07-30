'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Plus, TriangleAlert, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/format'
import { calcVencimento, calcReajuste, mesAtual } from '@/lib/vencimento'
import { cn } from '@/lib/utils'
import ModalContrato from './ModalContrato'
import { ToastContainer, useToastSimples } from '@/components/ui/ToastSimples'
import ModalConfirm from '@/components/ui/ModalConfirm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/cockpit/PageHeader'
import { StatCard } from '@/components/cockpit/StatCard'
import { StatusBadge } from '@/components/cockpit/StatusBadge'
import ERPCobrancas, { type Cobranca } from './ERPCobrancas'
import ERPRepasses,  { type Repasse }  from './ERPRepasses'
import ERPExtrato,   { type MovimentacaoExtrato } from './ERPExtrato'
import ERPChamados from './ERPChamados'
import ERPVistorias from './ERPVistorias'

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
  portal_token: string | null
  proprietario_nome: string | null
  proprietario_email: string | null
  proprietario_phone: string | null
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

const TIPO_LABEL: Record<string, string> = {
  locacao: 'Locação',
  venda:   'Venda',
}

const STATUS_LABEL: Record<string, string> = {
  rascunho:              'Rascunho',
  aguardando_assinatura: 'Ag. Assinatura',
  ativo:                 'Ativo',
  encerrado:             'Encerrado',
  cancelado:             'Cancelado',
}

function formatData(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR')
}

const PAGE_SIZE = 10
type Aba = 'contratos' | 'cobrancas' | 'repasses' | 'extrato' | 'chamados' | 'vistorias'

const ABAS: { key: Aba; label: string }[] = [
  { key: 'contratos', label: 'Contratos' },
  { key: 'cobrancas', label: 'Cobranças' },
  { key: 'repasses',  label: 'Repasses'  },
  { key: 'extrato',   label: 'Extrato'   },
  { key: 'chamados',  label: 'Chamados'  },
  { key: 'vistorias', label: 'Vistorias' },
]

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
  const [confirmarExcluir, setConfirmarExcluir] = useState<string | null>(null)
  const [toasts, addToast, removerToast]  = useToastSimples()

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
    chamados:  0,
    vistorias: 0,
  }

  async function confirmarEExcluir(id: string) {
    setDeletandoId(id)
    const { error: delErr } = await supabase.from('contratos').delete().eq('id', id).eq('corretor_id', corretorId)
    setDeletandoId(null)
    setConfirmarExcluir(null)
    if (delErr) { addToast('erro', 'Erro ao excluir', delErr.message) }
    else { addToast('sucesso', 'Contrato excluído') }
    router.refresh()
  }

  const selectClasse =
    'h-9 rounded-md border border-input bg-card px-3 text-sm text-foreground shadow-xs outline-none ' +
    'transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'

  const chipClasse =
    'inline-flex items-center gap-1 rounded-md bg-secondary px-2.5 py-1 text-xs text-muted-foreground ' +
    'transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none ' +
    'focus-visible:ring-2 focus-visible:ring-ring'

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-8">
      <ToastContainer toasts={toasts} onRemover={removerToast} />
      {confirmarExcluir && (
        <ModalConfirm
          titulo="Excluir este contrato?"
          descricao="Esta ação é irreversível. As cobranças e repasses vinculados a este contrato também serão removidos."
          labelConfirmar="Excluir"
          onConfirmar={() => confirmarEExcluir(confirmarExcluir)}
          onCancelar={() => setConfirmarExcluir(null)}
          carregando={deletandoId === confirmarExcluir}
        />
      )}

      <PageHeader
        titulo="ERP Imobiliário"
        descricao="Contratos, cobranças, repasses e extrato financeiro."
        acoes={
          aba === 'contratos' && (
            <Button onClick={() => { setContratoEditando(null); setModalAberto(true) }}>
              <Plus /> Novo contrato
            </Button>
          )
        }
      />

      {/* KPIs */}
      <div className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3">
        <StatCard rotulo="Contratos ativos"  valor={kpis.locacoes + kpis.vendas} />
        <StatCard rotulo="Locações"          valor={kpis.locacoes} />
        <StatCard rotulo="Vendas"            valor={kpis.vendas} />
        <StatCard rotulo="Receita do mês"    valor={formatCurrency(kpis.receitaMes)} tom="positivo" />
        <StatCard rotulo="Comissão pendente" valor={formatCurrency(kpis.comissaoPendente)} tom="atencao" />
        <StatCard
          rotulo="A reajustar"
          valor={kpis.aReajustar}
          tom={kpis.aReajustar > 0 ? 'critico' : 'neutro'}
        />
      </div>

      {/* Abas */}
      <div role="tablist" className="mt-6 flex gap-0 overflow-x-auto border-b border-border">
        {ABAS.map((a) => (
          <button
            key={a.key}
            role="tab"
            aria-selected={aba === a.key}
            onClick={() => setAba(a.key)}
            className={cn(
              '-mb-px flex items-center gap-1.5 whitespace-nowrap border-b-2 px-5 py-2.5 text-sm transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
              aba === a.key
                ? 'border-primary font-semibold text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {a.label}
            {badges[a.key] > 0 && (
              <span className="rounded-full bg-destructive px-1.5 py-px text-[10px] font-bold text-white tabular-nums">
                {badges[a.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Aba: Contratos */}
      {aba === 'contratos' && (
        <div className="mt-5">
          {kpis.aReajustar > 0 && (
            <div className="mb-4 flex items-center gap-2.5 rounded-lg border border-destructive/25 bg-destructive/5 px-4 py-3">
              <TriangleAlert className="size-4 shrink-0 text-destructive" />
              <p className="text-sm text-destructive">
                Você tem <strong className="font-semibold">{kpis.aReajustar}</strong>{' '}
                {kpis.aReajustar === 1 ? 'contrato' : 'contratos'} com reajuste nos próximos 30 dias.
              </p>
            </div>
          )}

          {/* Filtros */}
          <div className="mb-4 flex flex-wrap gap-2.5">
            <Input
              type="text"
              placeholder="Buscar cliente, imóvel..."
              value={busca}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setBusca(e.target.value); setPagina(1) }}
              className="min-w-[200px] flex-1 bg-card"
            />
            <select
              aria-label="Filtrar por tipo"
              value={filtroTipo}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setFiltroTipo(e.target.value); setPagina(1) }}
              className={selectClasse}
            >
              <option value="">Tipo: todos</option>
              <option value="locacao">Locação</option>
              <option value="venda">Venda</option>
            </select>
            <select
              aria-label="Filtrar por status"
              value={filtroStatus}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setFiltroStatus(e.target.value); setPagina(1) }}
              className={selectClasse}
            >
              <option value="">Status: todos</option>
              <option value="rascunho">Rascunho</option>
              <option value="aguardando_assinatura">Ag. Assinatura</option>
              <option value="ativo">Ativo</option>
              <option value="encerrado">Encerrado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          {/* Chips de filtros ativos */}
          {(filtroStatus || filtroTipo || busca) && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {filtroTipo && (
                <button type="button" className={chipClasse} onClick={() => setFiltroTipo('')}>
                  Tipo: {TIPO_LABEL[filtroTipo]} <X className="size-3" />
                </button>
              )}
              {filtroStatus && (
                <button type="button" className={chipClasse} onClick={() => setFiltroStatus('')}>
                  Status: {STATUS_LABEL[filtroStatus]} <X className="size-3" />
                </button>
              )}
              {busca && (
                <button type="button" className={chipClasse} onClick={() => setBusca('')}>
                  Busca: “{busca}” <X className="size-3" />
                </button>
              )}
            </div>
          )}

          <p className="mb-2.5 text-xs text-muted-foreground">
            {filtrados.length} {filtrados.length === 1 ? 'contrato' : 'contratos'}
            {filtrados.length > 0 && ` · Total: ${formatCurrency(filtrados.reduce((s: number, c: Contrato) => s + c.valor_contrato, 0))}`}
          </p>

          {filtrados.length === 0 ? (
            <div className="rounded-lg border border-border bg-card px-5 py-14 text-center">
              <p className="mb-4 text-sm text-muted-foreground">
                {contratos.length === 0 ? 'Nenhum contrato cadastrado.' : 'Nenhum resultado para os filtros.'}
              </p>
              {contratos.length === 0 && (
                <Button onClick={() => { setContratoEditando(null); setModalAberto(true) }}>
                  <Plus /> Criar primeiro contrato
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              {visiveis.map((c: Contrato, i: number) => {
                const vencFim = c.tipo === 'locacao' ? calcVencimento(c.data_fim) : null
                const reajuste = c.tipo === 'locacao' && c.status === 'ativo'
                  ? calcReajuste(c.data_inicio, c.indice_reajuste) : null

                // Faixa lateral: sinaliza urgência sem depender só de cor no texto
                const faixa =
                  reajuste?.precisaReajuste || vencFim?.status === 'atrasado_grave'
                    ? 'border-l-destructive'
                    : vencFim?.status === 'vence_em_breve'
                    ? 'border-l-primary'
                    : 'border-l-transparent'

                return (
                  <div
                    key={c.id}
                    className={cn(
                      'grid grid-cols-[1fr_auto] items-center gap-3 border-l-[3px] px-4 py-3.5',
                      i < visiveis.length - 1 && 'border-b border-b-border',
                      faixa,
                    )}
                  >
                    <div className="flex min-w-0 flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{c.cliente_nome}</span>
                        <StatusBadge
                          label={TIPO_LABEL[c.tipo]}
                          tom={c.tipo === 'locacao' ? 'info' : 'atencao'}
                        />
                        <StatusBadge status={c.status} label={STATUS_LABEL[c.status]} />
                        {vencFim && (vencFim.status === 'vence_hoje' || vencFim.status === 'vence_amanha' || vencFim.status === 'vence_em_breve' || vencFim.status.startsWith('atrasado')) && (
                          <StatusBadge
                            label={vencFim.label}
                            tom={vencFim.status.startsWith('atrasado') ? 'critico' : 'atencao'}
                          />
                        )}
                        {reajuste?.precisaReajuste && (
                          <StatusBadge label={reajuste.label} tom="critico" />
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-3.5 gap-y-1 text-xs text-muted-foreground">
                        {c.imovel && (
                          <span>{c.imovel.titulo} · {[c.imovel.bairro, c.imovel.cidade].filter(Boolean).join(', ')}</span>
                        )}
                        <span className="font-semibold tabular-nums text-primary">
                          {formatCurrency(c.valor_contrato)}
                        </span>
                        {c.data_inicio && <span className="tabular-nums">Início: {formatData(c.data_inicio)}</span>}
                        {c.tipo === 'locacao' && c.data_fim && <span className="tabular-nums">Fim: {formatData(c.data_fim)}</span>}
                        {c.tipo === 'locacao' && c.valor_aluguel && (
                          <span className="tabular-nums">Aluguel {formatCurrency(c.valor_aluguel)}/mês</span>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setContratoEditando(c); setModalAberto(true) }}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setConfirmarExcluir(c.id)}
                        disabled={deletandoId === c.id}
                      >
                        {deletandoId === c.id ? '…' : 'Excluir'}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Paginação */}
          {totalPaginas > 1 && (
            <nav aria-label="Paginação" className="mt-5 flex items-center justify-center gap-1.5">
              <Button
                variant="outline" size="icon-sm" aria-label="Página anterior"
                onClick={() => setPagina((p: number) => Math.max(1, p - 1))}
                disabled={paginaAtual === 1}
              >
                <ChevronLeft />
              </Button>
              {Array.from({ length: totalPaginas }, (_: unknown, idx: number) => idx + 1).map((n: number) => (
                <Button
                  key={n}
                  variant={n === paginaAtual ? 'default' : 'outline'}
                  size="icon-sm"
                  aria-current={n === paginaAtual ? 'page' : undefined}
                  onClick={() => setPagina(n)}
                  className="tabular-nums"
                >
                  {n}
                </Button>
              ))}
              <Button
                variant="outline" size="icon-sm" aria-label="Próxima página"
                onClick={() => setPagina((p: number) => Math.min(totalPaginas, p + 1))}
                disabled={paginaAtual === totalPaginas}
              >
                <ChevronRight />
              </Button>
            </nav>
          )}
        </div>
      )}

      {aba === 'cobrancas' && (
        <ERPCobrancas cobrancas={cobrancas} corretorId={corretorId} mesInicial={mesAtual()} />
      )}
      {aba === 'repasses' && (
        <ERPRepasses repasses={repasses} corretorId={corretorId} mesInicial={mesAtual()} />
      )}
      {aba === 'extrato' && (
        <ERPExtrato movimentacoes={movimentacoes} saldoAnterior={saldoAnterior} mesInicial={mesAtual()} />
      )}
      {aba === 'chamados' && (
        <ERPChamados corretorId={corretorId} contratos={contratos} />
      )}
      {aba === 'vistorias' && (
        <ERPVistorias contratos={contratos} />
      )}

      {modalAberto && (
        <ModalContrato
          contrato={contratoEditando}
          imoveis={imoveis}
          corretorId={corretorId}
          onClose={() => setModalAberto(false)}
          onSucesso={(msg) => addToast('sucesso', msg)}
        />
      )}
    </div>
  )
}
