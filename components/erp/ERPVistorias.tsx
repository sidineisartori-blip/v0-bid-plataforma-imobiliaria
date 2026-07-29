'use client'

import { useState, useEffect, useCallback } from 'react'
import ModalVistoria from './ModalVistoria'
import { useToastSimples, ToastContainer } from '@/components/ui/ToastSimples'
import type { Contrato } from './ERPClient'

export interface Vistoria {
  id: string
  contrato_id: string
  tipo: 'entrada' | 'saida'
  status: 'em_preenchimento' | 'finalizada'
  data_vistoria: string | null
  observacoes_gerais: string | null
  assinado_por_corretor_em: string | null
  created_at: string
  contrato?: {
    cliente_nome: string
    imovel?: { titulo: string; cidade: string } | null
  } | null
}

const TIPO_MAP = {
  entrada: { label: 'Entrada', cor: '#5CB88A', bg: 'rgba(92,184,138,0.12)' },
  saida:   { label: 'Saída',   cor: '#E05C5C', bg: 'rgba(224,92,92,0.12)' },
}

const STATUS_MAP = {
  em_preenchimento: { label: 'Em Preenchimento', cor: '#C9A84C', bg: 'rgba(201,168,76,0.12)' },
  finalizada:       { label: 'Finalizada',        cor: '#5CB88A', bg: 'rgba(92,184,138,0.12)' },
}

interface Props {
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

export default function ERPVistorias({ contratos }: Props) {
  const [vistorias, setVistorias]       = useState<Vistoria[]>([])
  const [carregando, setCarregando]     = useState(true)
  const [modalAberto, setModalAberto]   = useState(false)
  const [vistoriaAtual, setVistoriaAtual] = useState<Vistoria | null>(null)
  const [filtroContrato, setFiltroContrato] = useState('')
  const [filtroTipo, setFiltroTipo]     = useState('')
  const [criando, setCriando]           = useState(false)
  const [formCriar, setFormCriar]       = useState({ contratoId: '', tipo: 'entrada', data: '' })
  const [toasts, addToast, removerToast] = useToastSimples()

  const carregar = useCallback(async () => {
    setCarregando(true)
    const params = new URLSearchParams()
    if (filtroContrato) params.set('contrato_id', filtroContrato)
    const res = await fetch(`/api/erp/vistorias?${params}`)
    if (res.ok) setVistorias(await res.json())
    setCarregando(false)
  }, [filtroContrato])

  useEffect(() => { carregar() }, [carregar])

  const filtradas = vistorias.filter((v) => {
    if (filtroTipo && v.tipo !== filtroTipo) return false
    return true
  })

  async function criarVistoria() {
    if (!formCriar.contratoId) { addToast('erro', 'Selecione o contrato'); return }
    setCriando(true)
    const res = await fetch('/api/erp/vistorias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contrato_id: formCriar.contratoId,
        tipo: formCriar.tipo,
        data_vistoria: formCriar.data || null,
      }),
    })
    if (res.ok) {
      const vistoria = await res.json()
      addToast('sucesso', `Vistoria de ${formCriar.tipo} criada com 30 itens!`)
      setFormCriar({ contratoId: '', tipo: 'entrada', data: '' })
      await carregar()
      // Abrir a vistoria para edição imediatamente
      setVistoriaAtual(vistoria)
      setModalAberto(true)
    } else {
      const e = await res.json()
      addToast('erro', 'Erro', e.error)
    }
    setCriando(false)
  }

  const contratoLocacao = contratos.filter((c) => c.tipo === 'locacao')

  return (
    <div>
      <ToastContainer toasts={toasts} onRemover={removerToast} />

      {/* Criar nova vistoria */}
      <div style={{ background: '#181819', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 2, padding: '16px', marginBottom: 20 }}>
        <p style={{ fontSize: 11, color: '#C9A84C', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Nova Vistoria</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '2 1 200px' }}>
            <label style={{ display: 'block', fontSize: 11, color: '#9B9690', marginBottom: 5 }}>CONTRATO</label>
            <select value={formCriar.contratoId} onChange={(e) => setFormCriar((p) => ({ ...p, contratoId: e.target.value }))} style={INP}>
              <option value="">— Selecionar —</option>
              {contratoLocacao.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.cliente_nome}{c.imovel ? ` — ${c.imovel.titulo}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div style={{ flex: '1 1 120px' }}>
            <label style={{ display: 'block', fontSize: 11, color: '#9B9690', marginBottom: 5 }}>TIPO</label>
            <select value={formCriar.tipo} onChange={(e) => setFormCriar((p) => ({ ...p, tipo: e.target.value }))} style={INP}>
              <option value="entrada">Entrada</option>
              <option value="saida">Saída</option>
            </select>
          </div>
          <div style={{ flex: '1 1 140px' }}>
            <label style={{ display: 'block', fontSize: 11, color: '#9B9690', marginBottom: 5 }}>DATA DA VISTORIA</label>
            <input type="date" value={formCriar.data} onChange={(e) => setFormCriar((p) => ({ ...p, data: e.target.value }))} style={INP} />
          </div>
          <button
            onClick={criarVistoria}
            disabled={criando}
            style={{ background: '#C9A84C', color: '#0E0E0F', border: 'none', borderRadius: 2, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: criando ? 'default' : 'pointer', whiteSpace: 'nowrap' }}
          >
            {criando ? 'Criando...' : '+ Criar Vistoria'}
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <select value={filtroContrato} onChange={(e) => setFiltroContrato(e.target.value)} style={{ ...INP, flex: '2 1 200px' }}>
          <option value="">Contrato: Todos</option>
          {contratos.map((c) => (
            <option key={c.id} value={c.id}>{c.cliente_nome}{c.imovel ? ` — ${c.imovel.titulo}` : ''}</option>
          ))}
        </select>
        <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} style={{ ...INP, flex: '1 1 140px' }}>
          <option value="">Tipo: Todos</option>
          <option value="entrada">Entrada</option>
          <option value="saida">Saída</option>
        </select>
      </div>

      {/* Lista */}
      {carregando ? (
        <p style={{ color: '#9B9690', fontSize: 13 }}>Carregando...</p>
      ) : filtradas.length === 0 ? (
        <div style={{ background: '#181819', border: '1px solid rgba(201,168,76,0.1)', borderRadius: 2, padding: '50px 20px', textAlign: 'center' }}>
          <p style={{ color: '#9B9690', fontSize: 14 }}>Nenhuma vistoria registrada. Crie a primeira acima.</p>
        </div>
      ) : (
        <div style={{ background: '#181819', border: '1px solid rgba(201,168,76,0.1)', borderRadius: 2, overflow: 'hidden' }}>
          {filtradas.map((v, i) => {
            const tm = TIPO_MAP[v.tipo]
            const sm = STATUS_MAP[v.status]
            return (
              <div
                key={v.id}
                onClick={() => { setVistoriaAtual(v); setModalAberto(true) }}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  borderBottom: i < filtradas.length - 1 ? '1px solid #232324' : 'none',
                  cursor: 'pointer',
                  gap: 12,
                  borderLeft: `3px solid ${tm.cor}`,
                }}
              >
                <div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 2, fontWeight: 700, background: tm.bg, color: tm.cor }}>
                      {tm.label}
                    </span>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 2, background: sm.bg, color: sm.cor }}>{sm.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#F0EDE6' }}>{v.contrato?.cliente_nome}</span>
                    {v.contrato?.imovel && <span style={{ fontSize: 12, color: '#9B9690' }}>{v.contrato.imovel.titulo} — {v.contrato.imovel.cidade}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {v.data_vistoria && (
                      <span style={{ fontSize: 12, color: '#9B9690' }}>
                        {new Date(v.data_vistoria + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </span>
                    )}
                    <span style={{ fontSize: 12, color: '#9B9690' }}>
                      Criada em {new Date(v.created_at).toLocaleDateString('pt-BR')}
                    </span>
                    {v.assinado_por_corretor_em && (
                      <span style={{ fontSize: 12, color: '#5CB88A' }}>✓ Assinado</span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                  {v.status === 'finalizada' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); window.open(`/imprimir/vistoria/${v.id}`, '_blank') }}
                      style={{ background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 2, padding: '5px 10px', fontSize: 11, color: '#60a5fa', cursor: 'pointer' }}
                    >
                      🖨
                    </button>
                  )}
                  <span style={{ color: '#C9A84C', fontSize: 13 }}>Abrir →</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modalAberto && vistoriaAtual && (
        <ModalVistoria
          vistoria={vistoriaAtual}
          onClose={() => { setModalAberto(false); setVistoriaAtual(null) }}
          onSucesso={(msg) => { addToast('sucesso', msg); carregar() }}
        />
      )}
    </div>
  )
}
