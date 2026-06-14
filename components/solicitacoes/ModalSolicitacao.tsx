'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Solicitacao, Cidade } from '@/types/bid'
import { TIPO_IMOVEL_OPTIONS } from '@/lib/format'

interface ModalSolicitacaoProps {
  solicitacao?: Solicitacao | null
  corretorId: string
  cidades: Cidade[]
  onClose: (salvo?: boolean) => void
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: '#232324',
  border: '1px solid #2E2E30',
  borderRadius: '2px',
  padding: '9px 12px',
  fontSize: '13px',
  color: '#F0EDE6',
  outline: 'none',
}

const labelStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#9B9690',
  marginBottom: '4px',
  display: 'block',
}

type FormData = {
  cliente_nome: string
  cliente_phone: string
  cliente_email: string
  tipo_negocio: 'Comprar' | 'Alugar'
  tipo_imovel: string
  cidade: string
  bairro_desejado: string
  valor_min: string
  valor_max: string
  quartos: string
  banheiros: string
  vagas: string
  tem_animal: boolean
  prazo_fechar: string
  observacoes: string
}

export default function ModalSolicitacao({
  solicitacao,
  corretorId,
  cidades,
  onClose,
}: ModalSolicitacaoProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'dados' | 'compativeis'>('dados')
  const [compativeis, setCompativeis] = useState<Record<string, unknown>[]>([])
  const [compativeisLoading, setCompativeisLoading] = useState(false)
  const [compativeisErro, setCompativeisErro] = useState('')
  const [matchLoading, setMatchLoading] = useState<string | null>(null)
  const [matchFeito, setMatchFeito] = useState<Set<string>>(new Set())
  const [matchErro, setMatchErro] = useState('')

  const [form, setForm] = useState<FormData>({
    cliente_nome: solicitacao?.cliente_nome || '',
    cliente_phone: solicitacao?.cliente_phone || '',
    cliente_email: solicitacao?.cliente_email || '',
    tipo_negocio: solicitacao?.tipo_negocio || 'Comprar',
    tipo_imovel: solicitacao?.tipo_imovel || 'Apartamento',
    cidade: solicitacao?.cidade || '',
    bairro_desejado: solicitacao?.bairro_desejado || '',
    valor_min: solicitacao?.valor_min?.toString() || '',
    valor_max: solicitacao?.valor_max?.toString() || '',
    quartos: solicitacao?.quartos?.toString() || '',
    banheiros: solicitacao?.banheiros?.toString() || '',
    vagas: solicitacao?.vagas?.toString() || '0',
    tem_animal: solicitacao?.tem_animal || false,
    prazo_fechar: solicitacao?.prazo_fechar || 'Sem prazo',
    observacoes: solicitacao?.observacoes || '',
  })

  const set = (field: keyof FormData, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  async function fetchCompativeis() {
    if (!solicitacao?.id) return
    setCompativeisLoading(true)
    setCompativeisErro('')
    try {
      const res = await fetch(`/api/matching/preview?solicitacaoId=${solicitacao.id}`)
      if (!res.ok) throw new Error('Erro ao buscar compatíveis')
      const json = await res.json()
      setCompativeis(json.compativeis || [])
      const jaFeitos = new Set<string>(
        (json.compativeis || []).filter((c: Record<string, unknown>) => c.jaTemMatch).map((c: Record<string, unknown>) => c.id as string)
      )
      setMatchFeito(jaFeitos)
    } catch {
      setCompativeisErro('Não foi possível carregar os imóveis compatíveis. Tente novamente.')
    }
    setCompativeisLoading(false)
  }

  async function proporParceria(imovelId: string) {
    setMatchLoading(imovelId)
    setMatchErro('')
    try {
      const res = await fetch('/api/matching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imovelId, solicitacaoId: solicitacao?.id }),
      })
      if (res.ok) {
        setMatchFeito((prev) => new Set(prev).add(imovelId))
      } else {
        const data = await res.json()
        setMatchErro(data.error || 'Erro ao registrar interesse.')
      }
    } catch {
      setMatchErro('Falha na conexão. Verifique sua internet.')
    }
    setMatchLoading(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const payload: Record<string, unknown> = {
      corretor_id: corretorId,
      cliente_nome: form.cliente_nome,
      cliente_phone: form.cliente_phone,
      cliente_email: form.cliente_email || null,
      tipo_negocio: form.tipo_negocio,
      tipo_imovel: form.tipo_imovel,
      cidade: form.cidade,
      bairro_desejado: form.bairro_desejado || null,
      valor_min: form.valor_min ? parseFloat(form.valor_min) : null,
      valor_max: form.valor_max ? parseFloat(form.valor_max) : null,
      quartos: form.quartos ? parseInt(form.quartos) : null,
      banheiros: form.banheiros ? parseInt(form.banheiros) : null,
      vagas: parseInt(form.vagas || '0'),
      tem_animal: form.tem_animal,
      prazo_fechar: form.prazo_fechar,
      observacoes: form.observacoes || null,
      status: 'ativa',
    }

    if (solicitacao?.id) payload.id = solicitacao.id

    const { error: err } = await supabase.from('solicitacoes').upsert(payload)
    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    router.refresh()
    onClose(true)
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.75)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          backgroundColor: '#181819',
          border: '1px solid #232324',
          borderRadius: '2px',
          width: '100%',
          maxWidth: '600px',
          maxHeight: '90vh',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #232324',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            backgroundColor: '#181819',
            zIndex: 1,
          }}
        >
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', color: '#F0EDE6' }}>
            {solicitacao ? 'Editar Solicitacao' : 'Nova Solicitacao'}
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#9B9690', cursor: 'pointer', fontSize: '20px', lineHeight: 1 }}
          >
            &times;
          </button>
        </div>

        {/* Tabs — só exibe quando editando solicitação existente */}
        {solicitacao?.id && (
          <div style={{ display: 'flex', borderBottom: '1px solid #232324', backgroundColor: '#181819', position: 'sticky', top: '61px', zIndex: 1 }}>
            {(['dados', 'compativeis'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setActiveTab(tab)
                  if (tab === 'compativeis' && compativeis.length === 0) fetchCompativeis()
                }}
                style={{
                  padding: '10px 20px',
                  fontSize: '13px',
                  fontWeight: 600,
                  border: 'none',
                  borderBottom: activeTab === tab ? '2px solid #C9A84C' : '2px solid transparent',
                  backgroundColor: 'transparent',
                  color: activeTab === tab ? '#C9A84C' : '#9B9690',
                  cursor: 'pointer',
                }}
              >
                {tab === 'dados' ? 'Dados' : 'Compatíveis'}
              </button>
            ))}
          </div>
        )}

        {/* Aba Compatíveis */}
        {solicitacao?.id && activeTab === 'compativeis' && (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {compativeisLoading && (
              <p style={{ fontSize: '13px', color: '#9B9690', textAlign: 'center' }}>Calculando compatibilidades...</p>
            )}
            {compativeisErro && (
              <div style={{ backgroundColor: 'rgba(224,92,92,0.1)', border: '1px solid rgba(224,92,92,0.25)', borderRadius: 2, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontSize: '13px', color: '#E05C5C', margin: 0 }}>{compativeisErro}</p>
                <button type="button" onClick={fetchCompativeis} style={{ fontSize: 12, color: '#E05C5C', background: 'none', border: '1px solid rgba(224,92,92,0.3)', borderRadius: 2, padding: '4px 10px', cursor: 'pointer' }}>Tentar novamente</button>
              </div>
            )}
            {matchErro && (
              <p style={{ fontSize: '12px', color: '#E05C5C', margin: 0 }}>{matchErro}</p>
            )}
            {!compativeisLoading && !compativeisErro && compativeis.length === 0 && (
              <p style={{ fontSize: '13px', color: '#9B9690', textAlign: 'center' }}>Nenhum imóvel compatível encontrado (score ≥ 70).</p>
            )}
            {compativeis.map((im) => {
              const id = im.id as string
              const jaFeito = matchFeito.has(id)
              return (
                <div key={id} style={{ backgroundColor: '#232324', border: '1px solid #2E2E30', borderRadius: '2px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#F0EDE6' }}>{im.titulo as string}</span>
                      <span style={{ fontSize: '11px', backgroundColor: 'rgba(201,168,76,0.15)', color: '#C9A84C', padding: '2px 6px', borderRadius: '2px' }}>Score {im.score as number}%</span>
                      {!!(im.corretor as Record<string, unknown>)?.nome && (
                        <span style={{ fontSize: '11px', color: '#6b6860' }}>via {(im.corretor as Record<string, unknown>).nome as string}</span>
                      )}
                    </div>
                    <p style={{ fontSize: '12px', color: '#9B9690', margin: 0 }}>
                      {im.tipo_imovel as string} · {im.tipo_negocio as string} · {im.cidade as string}
                      {im.valor ? ` · R$ ${(im.valor as number).toLocaleString('pt-BR')}` : ''}
                      {im.quartos ? ` · ${im.quartos as number}q` : ''}
                      {im.bairro ? ` · ${im.bairro as string}` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={jaFeito || matchLoading === id}
                    onClick={() => proporParceria(id)}
                    style={{
                      padding: '7px 14px',
                      fontSize: '12px',
                      fontWeight: 600,
                      borderRadius: '2px',
                      border: jaFeito ? '1px solid #3d5a3e' : '1px solid #C9A84C',
                      backgroundColor: jaFeito ? 'rgba(92,184,138,0.1)' : 'transparent',
                      color: jaFeito ? '#5CB88A' : '#C9A84C',
                      cursor: jaFeito ? 'default' : 'pointer',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    {matchLoading === id ? 'Enviando...' : jaFeito ? '✓ Interesse enviado' : 'Tenho interesse'}
                  </button>
                </div>
              )
            })}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ padding: '24px', display: activeTab === 'dados' ? 'flex' : 'none', flexDirection: 'column', gap: '16px' }}>
          {/* Cliente */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Nome do Cliente *</label>
              <input
                required
                type="text"
                style={inputStyle}
                value={form.cliente_nome}
                onChange={(e) => set('cliente_nome', e.target.value)}
                placeholder="Nome completo"
              />
            </div>
            <div>
              <label style={labelStyle}>WhatsApp *</label>
              <input
                required
                type="text"
                style={inputStyle}
                value={form.cliente_phone}
                onChange={(e) => set('cliente_phone', e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          {/* Tipo negocio + tipo imovel */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Tipo de Negocio</label>
              <select style={inputStyle} value={form.tipo_negocio} onChange={(e) => set('tipo_negocio', e.target.value)}>
                <option value="Comprar">Comprar</option>
                <option value="Alugar">Alugar</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Tipo de Imovel</label>
              <select style={inputStyle} value={form.tipo_imovel} onChange={(e) => set('tipo_imovel', e.target.value)}>
                {TIPO_IMOVEL_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Cidade + Bairro */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Cidade *</label>
              <select required style={inputStyle} value={form.cidade} onChange={(e) => set('cidade', e.target.value)}>
                <option value="">Selecione...</option>
                {cidades.map((c) => (
                  <option key={c.id} value={c.name}>{c.name} — {c.state}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>
                Bairro desejado{' '}
                <span style={{ color: '#5CB88A', fontSize: '10px' }}>+10pts no matching</span>
              </label>
              <input
                type="text"
                style={inputStyle}
                value={form.bairro_desejado}
                onChange={(e) => set('bairro_desejado', e.target.value)}
                placeholder="Opcional"
              />
            </div>
          </div>

          {/* Faixa de valor */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Valor Minimo (R$)</label>
              <input
                type="number"
                style={inputStyle}
                value={form.valor_min}
                onChange={(e) => set('valor_min', e.target.value)}
                placeholder="0"
                min="0"
              />
            </div>
            <div>
              <label style={labelStyle}>Valor Maximo (R$)</label>
              <input
                type="number"
                style={inputStyle}
                value={form.valor_max}
                onChange={(e) => set('valor_max', e.target.value)}
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          {/* Quartos / Banheiros / Vagas */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Quartos</label>
              <select style={inputStyle} value={form.quartos} onChange={(e) => set('quartos', e.target.value)}>
                <option value="">Qualquer</option>
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>{n === 6 ? '6+' : n}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Banheiros</label>
              <select style={inputStyle} value={form.banheiros} onChange={(e) => set('banheiros', e.target.value)}>
                <option value="">Qualquer</option>
                {[1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Vagas</label>
              <select style={inputStyle} value={form.vagas} onChange={(e) => set('vagas', e.target.value)}>
                {[0, 1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Animal + Prazo */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>
                Tem Animal?{' '}
                <span style={{ color: '#5CB88A', fontSize: '10px' }}>+10pts no matching</span>
              </label>
              <select style={inputStyle} value={form.tem_animal ? 'true' : 'false'} onChange={(e) => set('tem_animal', e.target.value === 'true')}>
                <option value="false">Nao</option>
                <option value="true">Sim</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Prazo para fechar</label>
              <select style={inputStyle} value={form.prazo_fechar} onChange={(e) => set('prazo_fechar', e.target.value)}>
                <option value="Imediato">Imediato</option>
                <option value="30 dias">30 dias</option>
                <option value="60 dias">60 dias</option>
                <option value="90 dias">90 dias</option>
                <option value="Sem prazo">Sem prazo</option>
              </select>
            </div>
          </div>

          {/* Observacoes */}
          <div>
            <label style={labelStyle}>
              Observacoes{' '}
              <span style={{ color: '#9B9690', fontSize: '10px' }}>
                — Visivel ao parceiro somente apos aceite
              </span>
            </label>
            <textarea
              style={{ ...inputStyle, minHeight: '72px', resize: 'vertical' }}
              value={form.observacoes}
              onChange={(e) => set('observacoes', e.target.value)}
              placeholder="Preferencias adicionais do cliente..."
            />
          </div>

          {error && (
            <p style={{ fontSize: '12px', color: '#E05C5C' }}>{error}</p>
          )}

          {/* Botoes */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 20px',
                borderRadius: '2px',
                border: '1px solid rgba(201,168,76,0.2)',
                backgroundColor: 'transparent',
                color: '#9B9690',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '9px 20px',
                borderRadius: '2px',
                border: 'none',
                backgroundColor: loading ? '#a08840' : '#C9A84C',
                color: '#0E0E0F',
                fontSize: '13px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Salvando...' : 'Salvar Solicitacao'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
