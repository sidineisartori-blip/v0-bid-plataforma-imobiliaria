'use client'

import { useState, useOptimistic } from 'react'
import { useRouter } from 'next/navigation'
import { ToastContainer, useToastSimples } from '@/components/ui/ToastSimples'

const COLUNAS = [
  { key: 'novo',            label: 'Novo Lead',      cor: '#60a5fa', dica: 'Lead acabou de chegar' },
  { key: 'em_contato',      label: 'Em Contato',     cor: '#C9A84C', dica: 'Contato iniciado' },
  { key: 'imovel_enviado',  label: 'Imóvel Enviado', cor: '#a78bfa', dica: 'Opções enviadas ao cliente' },
  { key: 'visita_agendada', label: 'Visita',          cor: '#5CB88A', dica: 'Visita marcada' },
  { key: 'proposta',        label: 'Proposta',        cor: '#e07a2f', dica: 'Negociação em andamento' },
  { key: 'fechado',         label: 'Fechado',         cor: '#5CB88A', dica: 'Negócio concluído!' },
] as const

type ColunaKey = typeof COLUNAS[number]['key']

export interface Lead {
  id: string
  cliente_nome: string
  cliente_phone: string | null
  cliente_email: string | null
  tipo_negocio: string | null
  tipo_imovel: string | null
  cidade: string | null
  bairro_desejado: string | null
  valor_min: number | null
  valor_max: number | null
  status: string | null
  kanban_coluna: string | null
  created_at: string
  updated_at?: string | null
}

interface Props {
  leads: Lead[]
  corretorId: string
}

function formatValor(v: number | null) {
  if (!v) return null
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function diasNoPipeline(lead: Lead) {
  const from = lead.updated_at || lead.created_at
  return Math.floor((Date.now() - new Date(from).getTime()) / 86400000)
}

function isParado(lead: Lead) {
  return diasNoPipeline(lead) >= 10 && lead.kanban_coluna !== 'fechado'
}

export default function LeadKanbanClient({ leads, corretorId }: Props) {
  void corretorId
  const router = useRouter()
  const [toasts, addToast, removerToast] = useToastSimples()
  const [dragSobre, setDragSobre] = useState<string | null>(null)
  const [cardAberto, setCardAberto] = useState<Lead | null>(null)

  const [optimisticLeads, updateOptimistic] = useOptimistic(
    leads,
    (state: Lead[], { id, kanban_coluna }: { id: string; kanban_coluna: string }) =>
      state.map((l) => (l.id === id ? { ...l, kanban_coluna } : l)),
  )

  const parados = leads.filter(isParado)

  async function moverCard(leadId: string, novaColuna: string) {
    const lead = leads.find((l) => l.id === leadId)
    if (!lead || lead.kanban_coluna === novaColuna) return

    updateOptimistic({ id: leadId, kanban_coluna: novaColuna })
    setDragSobre(null)

    const res = await fetch(`/api/solicitacoes/${leadId}/kanban`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kanban_coluna: novaColuna }),
    })

    if (!res.ok) {
      addToast('erro', 'Erro ao mover lead')
    } else {
      const col = COLUNAS.find((c) => c.key === novaColuna)
      addToast('sucesso', `Movido para ${col?.label || novaColuna}`, lead.cliente_nome)
    }
    router.refresh()
  }

  return (
    <div className="p-8 flex flex-col gap-6" style={{ color: 'var(--color-text)' }}>
      <ToastContainer toasts={toasts} onRemover={removerToast} />

      {/* Alertas */}
      {parados.length > 0 && (
        <div
          className="rounded-sm border px-4 py-3 text-sm flex items-center justify-between"
          style={{ backgroundColor: 'rgba(201,168,76,0.07)', borderColor: 'rgba(201,168,76,0.25)', color: 'var(--color-gold)' }}
        >
          <span>⚠ {parados.length} lead(s) sem atualização há mais de 10 dias.</span>
          <span style={{ fontSize: 11, color: '#9B9690' }}>Clique no card para ver detalhes</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-xl font-bold" style={{ color: 'var(--color-text)' }}>
            Pipeline de Leads
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted)' }}>
            {leads.length} lead(s) · {leads.filter((l) => l.kanban_coluna === 'fechado').length} fechados
          </p>
        </div>
      </div>

      {/* Empty state */}
      {leads.length === 0 && (
        <div style={{
          background: '#181819', border: '1px solid rgba(96,165,250,0.1)',
          borderRadius: 2, padding: '60px 20px', textAlign: 'center',
        }}>
          <p style={{ color: '#9B9690', fontSize: 14 }}>
            Nenhum lead recebido ainda. Configure seu site público para começar a receber contatos.
          </p>
        </div>
      )}

      {/* Board */}
      {leads.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 172px)',
          gap: '7px',
          overflowX: 'auto',
          paddingBottom: '8px',
          minWidth: '1100px',
        }}>
          {COLUNAS.map((col) => {
            const cards = optimisticLeads.filter(
              (l) => (l.kanban_coluna || 'novo') === col.key,
            )
            const isDragTarget = dragSobre === col.key

            return (
              <div
                key={col.key}
                className="rounded-sm flex flex-col"
                style={{
                  backgroundColor: isDragTarget ? `rgba(${hexToRgb(col.cor)},0.06)` : 'var(--color-dark-3)',
                  border: isDragTarget ? `1px solid ${col.cor}40` : '1px solid transparent',
                  padding: '9px',
                  minHeight: '300px',
                  transition: 'background 0.15s, border 0.15s',
                }}
                onDragOver={(e) => { e.preventDefault(); setDragSobre(col.key) }}
                onDragLeave={() => setDragSobre(null)}
                onDrop={(e) => {
                  const leadId = e.dataTransfer.getData('leadId')
                  if (leadId) moverCard(leadId, col.key)
                }}
              >
                {/* Header da coluna */}
                <div className="flex items-center justify-between mb-1 px-1">
                  <p className="text-[9px] uppercase tracking-widest font-semibold" style={{ color: col.cor }}>
                    {col.label}
                  </p>
                  <span className="text-[9px] font-mono" style={{ color: 'var(--color-muted)' }}>
                    ({cards.length})
                  </span>
                </div>
                <p style={{ fontSize: 9, color: '#2E2E30', marginBottom: 8, paddingLeft: 4, lineHeight: 1.3 }}>
                  {col.dica}
                </p>

                {/* Cards */}
                <div className="flex flex-col gap-2 flex-1">
                  {cards.length === 0 && (
                    <div style={{
                      border: `1px dashed ${col.cor}20`,
                      borderRadius: 2, padding: '16px 8px',
                      textAlign: 'center', fontSize: 10, color: '#2E2E30',
                    }}>
                      Arraste um lead aqui
                    </div>
                  )}

                  {cards.map((lead) => {
                    const parado = isParado(lead)
                    const dias = diasNoPipeline(lead)
                    const valorMin = formatValor(lead.valor_min)
                    const valorMax = formatValor(lead.valor_max)
                    const faixaValor = valorMin && valorMax
                      ? `${valorMin} – ${valorMax}`
                      : valorMax || valorMin || null

                    return (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData('leadId', lead.id)}
                        onClick={() => setCardAberto(lead)}
                        className="rounded-sm cursor-pointer transition-all"
                        style={{
                          backgroundColor: 'var(--color-dark-4)',
                          borderLeft: `2px solid ${parado ? '#E05C5C' : col.cor}`,
                          padding: '8px 10px',
                        }}
                      >
                        <p className="text-[11px] font-semibold leading-tight" style={{ color: 'var(--color-text)' }}>
                          {lead.cliente_nome}
                        </p>
                        {lead.cidade && (
                          <p className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--color-muted)' }}>
                            {lead.bairro_desejado ? `${lead.bairro_desejado}, ` : ''}{lead.cidade}
                          </p>
                        )}
                        <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                          {lead.tipo_negocio && (
                            <span style={{
                              fontSize: 9, padding: '1px 5px', borderRadius: 2,
                              color: lead.tipo_negocio === 'Comprar' ? '#60a5fa' : '#5CB88A',
                              backgroundColor: lead.tipo_negocio === 'Comprar' ? 'rgba(96,165,250,0.12)' : 'rgba(92,184,138,0.12)',
                            }}>
                              {lead.tipo_negocio}
                            </span>
                          )}
                          {faixaValor && (
                            <span style={{ fontSize: 9, color: '#9B9690', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {faixaValor}
                            </span>
                          )}
                          {parado ? (
                            <span style={{ fontSize: 9, color: '#E05C5C', backgroundColor: 'rgba(224,92,92,0.1)', padding: '1px 5px', borderRadius: 2 }}>
                              {dias}d parado
                            </span>
                          ) : dias > 0 ? (
                            <span style={{ fontSize: 9, color: '#9B9690' }}>{dias}d</span>
                          ) : null}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal de detalhe do lead */}
      {cardAberto && (
        <ModalLead
          lead={cardAberto}
          onClose={() => setCardAberto(null)}
          onMover={(coluna: ColunaKey) => {
            moverCard(cardAberto.id, coluna)
            setCardAberto(null)
          }}
        />
      )}
    </div>
  )
}

// Helper: hex color → "r,g,b" for rgba()
function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}

function ModalLead({
  lead,
  onClose,
  onMover,
}: {
  lead: Lead
  onClose: () => void
  onMover: (col: ColunaKey) => void
}) {
  const colunaAtual = (lead.kanban_coluna || 'novo') as ColunaKey
  const colInfo = COLUNAS.find((c) => c.key === colunaAtual)

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: '#181819', border: '1px solid rgba(96,165,250,0.2)',
        borderRadius: 2, padding: '24px', width: '100%', maxWidth: 440,
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ fontSize: 11, color: colInfo?.cor || '#60a5fa', marginBottom: 4 }}>{colInfo?.label}</p>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#F0EDE6', margin: 0 }}>{lead.cliente_nome}</h2>
          </div>
          <button onClick={onClose} style={{ color: '#9B9690', fontSize: 22, background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
        </div>

        {/* Info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            ['Tipo', `${lead.tipo_negocio || '—'} ${lead.tipo_imovel ? `· ${lead.tipo_imovel}` : ''}`],
            ['Cidade', lead.cidade || '—'],
            ['Bairro', lead.bairro_desejado || 'Indiferente'],
            ['Valor', lead.valor_max ? `até ${formatValor(lead.valor_max)}` : '—'],
            ['WhatsApp', lead.cliente_phone || '—'],
            ['Email', lead.cliente_email || '—'],
          ].map(([label, value]) => (
            <div key={label}>
              <p style={{ fontSize: 10, color: '#9B9690', marginBottom: 2 }}>{label}</p>
              <p style={{ fontSize: 13, color: '#F0EDE6', wordBreak: 'break-all' }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Mover para coluna */}
        <div>
          <p style={{ fontSize: 10, color: '#9B9690', marginBottom: 8 }}>MOVER PARA</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {COLUNAS.filter((c) => c.key !== colunaAtual).map((c) => (
              <button
                key={c.key}
                onClick={() => onMover(c.key)}
                style={{
                  background: 'none', border: `1px solid ${c.cor}40`,
                  borderRadius: 2, padding: '5px 10px', fontSize: 11,
                  color: c.cor, cursor: 'pointer',
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* WhatsApp */}
        {lead.cliente_phone && (
          <a
            href={`https://wa.me/55${lead.cliente_phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${lead.cliente_nome.split(' ')[0]}! Vi seu interesse e gostaria de te ajudar.`)}`}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'block', textAlign: 'center', padding: '10px',
              background: 'rgba(92,184,138,0.1)', border: '1px solid rgba(92,184,138,0.25)',
              borderRadius: 2, color: '#5CB88A', fontSize: 13, fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            WhatsApp → {lead.cliente_phone}
          </a>
        )}
      </div>
    </div>
  )
}
