'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Imovel, Cidade } from '@/types/bid'
import { TIPO_IMOVEL_OPTIONS } from '@/lib/format'

interface ModalImovelProps {
  imovel?: Imovel | null
  corretorId: string
  cidades: Cidade[]
  onClose: () => void
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

const sectionTitleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-serif)',
  fontSize: '13px',
  color: '#C9A84C',
  marginBottom: '12px',
  paddingBottom: '8px',
  borderBottom: '1px solid #232324',
}

type FormData = {
  tipo_negocio: 'Venda' | 'Locação'
  tipo_imovel: string
  titulo: string
  descricao: string
  cidade: string
  bairro: string
  quartos: number
  banheiros: number
  vagas: number
  area_total: string
  valor: string
  aceita_animal: boolean
  lancamento: boolean
  publico_no_site: boolean
  prop_nome: string
  prop_whatsapp: string
}

export default function ModalImovel({ imovel, corretorId, cidades, onClose }: ModalImovelProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState<FormData>({
    tipo_negocio: imovel?.tipo_negocio || 'Venda',
    tipo_imovel: imovel?.tipo_imovel || 'Apartamento',
    titulo: imovel?.titulo || '',
    descricao: imovel?.descricao || '',
    cidade: imovel?.cidade || '',
    bairro: imovel?.bairro || '',
    quartos: imovel?.quartos || 0,
    banheiros: imovel?.banheiros || 0,
    vagas: imovel?.vagas || 0,
    area_total: imovel?.area_total?.toString() || '',
    valor: imovel?.valor?.toString() || '',
    aceita_animal: imovel?.aceita_animal || false,
    lancamento: imovel?.lancamento || false,
    publico_no_site: imovel?.publico_no_site || false,
    prop_nome: imovel?.prop_nome || '',
    prop_whatsapp: imovel?.prop_whatsapp || '',
  })

  const set = (field: keyof FormData, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const payload: Record<string, unknown> = {
      corretor_id: corretorId,
      tipo_negocio: form.tipo_negocio,
      tipo_imovel: form.tipo_imovel,
      titulo: form.titulo,
      descricao: form.descricao || null,
      cidade: form.cidade,
      bairro: form.bairro || null,
      quartos: form.quartos,
      banheiros: form.banheiros,
      vagas: form.vagas,
      area_total: form.area_total ? parseFloat(form.area_total) : null,
      valor: parseFloat(form.valor || '0'),
      aceita_animal: form.aceita_animal,
      lancamento: form.lancamento,
      publico_no_site: form.publico_no_site,
      matching_ativo: false,
      status: imovel?.status || 'aguardando_assinatura',
      prop_nome: form.prop_nome || null,
      prop_whatsapp: form.prop_whatsapp || null,
    }

    if (imovel?.id) payload.id = imovel.id

    const { error: err } = await supabase.from('imoveis').upsert(payload)
    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    router.refresh()
    onClose()
  }

  // Fecha ao pressionar Esc
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
          maxWidth: '640px',
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
            {imovel ? 'Editar Imovel' : 'Cadastrar Imovel'}
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#9B9690', cursor: 'pointer', fontSize: '20px', lineHeight: 1 }}
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Tipo de Negocio + Tipo de Imovel */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Tipo de Negocio</label>
              <select style={inputStyle} value={form.tipo_negocio} onChange={(e) => set('tipo_negocio', e.target.value)}>
                <option value="Venda">Venda</option>
                <option value="Locação">Locacao</option>
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

          {/* Titulo */}
          <div>
            <label style={labelStyle}>Nome / Titulo do Imovel *</label>
            <input
              required
              type="text"
              style={inputStyle}
              value={form.titulo}
              onChange={(e) => set('titulo', e.target.value)}
              placeholder="Ex: Apartamento Jardim America"
            />
          </div>

          {/* Descricao */}
          <div>
            <label style={labelStyle}>Descricao</label>
            <textarea
              style={{ ...inputStyle, minHeight: '72px', resize: 'vertical' }}
              value={form.descricao}
              onChange={(e) => set('descricao', e.target.value)}
              placeholder="Descricao do imovel..."
            />
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
              <label style={labelStyle}>Bairro</label>
              <input
                type="text"
                style={inputStyle}
                value={form.bairro}
                onChange={(e) => set('bairro', e.target.value)}
                placeholder="Nome do bairro"
              />
            </div>
          </div>

          {/* Quartos / Banheiros / Vagas */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            {(['quartos', 'banheiros', 'vagas'] as const).map((field) => (
              <div key={field}>
                <label style={labelStyle}>{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                <select style={inputStyle} value={form[field]} onChange={(e) => set(field, parseInt(e.target.value))}>
                  {[0, 1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>{n === 6 ? '6+' : n}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Area + Valor */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Area Total (m²)</label>
              <input
                type="number"
                style={inputStyle}
                value={form.area_total}
                onChange={(e) => set('area_total', e.target.value)}
                placeholder="0"
                min="0"
              />
            </div>
            <div>
              <label style={labelStyle}>Valor (R$) *</label>
              <input
                required
                type="number"
                style={inputStyle}
                value={form.valor}
                onChange={(e) => set('valor', e.target.value)}
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          {/* Flags */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Aceita Animal?</label>
              <select style={inputStyle} value={form.aceita_animal ? 'true' : 'false'} onChange={(e) => set('aceita_animal', e.target.value === 'true')}>
                <option value="false">Nao</option>
                <option value="true">Sim</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Lancamento?</label>
              <select style={inputStyle} value={form.lancamento ? 'true' : 'false'} onChange={(e) => set('lancamento', e.target.value === 'true')}>
                <option value="false">Nao</option>
                <option value="true">Sim</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Visivel no Site?</label>
              <select style={inputStyle} value={form.publico_no_site ? 'true' : 'false'} onChange={(e) => set('publico_no_site', e.target.value === 'true')}>
                <option value="false">Nao</option>
                <option value="true">Sim</option>
              </select>
            </div>
          </div>

          {/* Dados do Proprietario */}
          <div>
            <p style={sectionTitleStyle}>Dados do Proprietario (Privados)</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Nome Completo</label>
                <input
                  type="text"
                  style={inputStyle}
                  value={form.prop_nome}
                  onChange={(e) => set('prop_nome', e.target.value)}
                  placeholder="Nome do proprietario"
                />
              </div>
              <div>
                <label style={labelStyle}>WhatsApp</label>
                <input
                  type="text"
                  style={inputStyle}
                  value={form.prop_whatsapp}
                  onChange={(e) => set('prop_whatsapp', e.target.value)}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>
          </div>

          {/* Nota */}
          <p
            style={{
              fontSize: '11px',
              color: '#9B9690',
              backgroundColor: '#232324',
              padding: '10px 12px',
              borderRadius: '2px',
              borderLeft: '2px solid #C9A84C',
            }}
          >
            Apos salvar, o termo de autorizacao sera enviado ao proprietario via Certisign para assinatura digital.
          </p>

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
              {loading ? 'Salvando...' : 'Salvar e Enviar Termo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
