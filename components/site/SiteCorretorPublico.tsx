'use client'

import React, { useState, useRef } from 'react'
import Image from 'next/image'
import { TIPO_IMOVEL_OPTIONS } from '@/lib/format'
import SelectField from './SelectField'

interface CorretorPublico {
  id: string
  full_name: string
  creci: string | null
  city: string | null
  bio: string | null
  avatar_url: string | null
  nota_media: number
  total_avaliacoes: number
  deals_closed: number
  plano: string
  site_boas_vindas: string | null
  site_modelo: string | null
  phone?: string | null
}

interface ImovelPublico {
  id: string
  titulo: string
  bairro: string | null
  cidade: string
  valor: number
  quartos: number
  banheiros: number
  vagas: number
  tipo_imovel: string
  tipo_negocio: 'Venda' | 'Locacao'
  image_urls: string[]
  lancamento: boolean
  aceita_animal: boolean
  area_total?: number | null
}

interface Props {
  corretor: CorretorPublico
  imoveis: ImovelPublico[]
}

function getSelo(nota: number, negocios: number): { label: string; cor: string } {
  if (nota >= 4.5 && negocios >= 20) return { label: 'Platinum', cor: '#C9A84C' }
  if (nota >= 4.0 && negocios >= 10) return { label: 'Gold', cor: '#C9A84C' }
  if (nota >= 3.5 && negocios >= 5)  return { label: 'Silver', cor: '#9B9690' }
  return { label: 'Verificado', cor: '#5CB88A' }
}

function Estrelas({ nota }: { nota: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: '2px' }}>
      {[1,2,3,4,5].map((i) => (
        <span key={i} style={{ fontSize: '12px', color: i <= Math.round(nota) ? '#C9A84C' : '#3a3a3c' }}>★</span>
      ))}
    </span>
  )
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

export default function SiteCorretorPublico({ corretor, imoveis }: Props) {
  const formRef = useRef<HTMLDivElement>(null)
  const catalogoRef = useRef<HTMLDivElement>(null)

  const [activeTab, setActiveTab] = useState<'proprietario' | 'comprador'>('proprietario')
  const [enviado, setEnviado] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erroForm, setErroForm] = useState('')
  const [imovelSelecionado, setImovelSelecionado] = useState<ImovelPublico | null>(null)

  const [formProprietario, setFormProprietario] = useState({
    nome: '', whatsapp: '', email: '', tipo_negocio: 'Venda', tipo_imovel: 'Apartamento',
    cidade: '', bairro: '', valor: '', observacoes: '',
  })

  const [formComprador, setFormComprador] = useState({
    nome: '', whatsapp: '', email: '', tipo_negocio: 'Comprar', tipo_imovel: 'Apartamento',
    cidade: '', bairro_desejado: '', valor_min: '', valor_max: '',
    quartos: '', tem_animal: 'nao',
  })

  const selo = getSelo(corretor.nota_media, corretor.deals_closed)
  const lancamentos = imoveis.filter((i) => i.lancamento)
  const demais = imoveis.filter((i) => !i.lancamento)

  function scrollToForm(tab: 'proprietario' | 'comprador') {
    setActiveTab(tab)
    formRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  function scrollToCatalogo() {
    catalogoRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  async function enviarProprietario(e: React.FormEvent) {
    e.preventDefault()
    setEnviando(true)
    setErroForm('')
    
    try {
      const res = await fetch('/api/public/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'imovel',
          corretorId: corretor.id,
          dados: {
            nome: formProprietario.nome,
            whatsapp: formProprietario.whatsapp.replace(/\D/g, ''),
            email: formProprietario.email || '',
            tipo_negocio: formProprietario.tipo_negocio,
            tipo_imovel: formProprietario.tipo_imovel,
            cidade: formProprietario.cidade,
            bairro: formProprietario.bairro || '',
            valor: Number(formProprietario.valor.replace(/\D/g, '')) || 0,
            observacoes: formProprietario.observacoes || '',
          },
        }),
      })
      
      const data = await res.json()
      
      if (res.status === 429) {
        setErroForm('Muitas tentativas. Aguarde antes de enviar novamente.')
        setEnviando(false)
        return
      }
      
      if (!res.ok) {
        const msg = data.details 
          ? Object.values(data.details).flat().join(', ')
          : data.error || 'Erro ao enviar. Tente novamente.'
        setErroForm(msg)
        setEnviando(false)
        return
      }
      
      setEnviando(false)
      setEnviado(true)
    } catch {
      setErroForm('Erro de conexao. Verifique sua internet.')
      setEnviando(false)
    }
  }

  async function enviarComprador(e: React.FormEvent) {
    e.preventDefault()
    setEnviando(true)
    setErroForm('')
    
    try {
      const res = await fetch('/api/public/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'busca',
          corretorId: corretor.id,
          dados: {
            nome: formComprador.nome,
            whatsapp: formComprador.whatsapp.replace(/\D/g, ''),
            email: formComprador.email || '',
            tipo_negocio: formComprador.tipo_negocio,
            tipo_imovel: formComprador.tipo_imovel,
            cidade: formComprador.cidade,
            bairro_desejado: formComprador.bairro_desejado || '',
            valor_min: Number(formComprador.valor_min.replace(/\D/g, '')) || undefined,
            valor_max: Number(formComprador.valor_max.replace(/\D/g, '')) || undefined,
            quartos: Number(formComprador.quartos) || undefined,
            tem_animal: formComprador.tem_animal === 'sim',
          },
        }),
      })
      
      const data = await res.json()
      
      if (res.status === 429) {
        setErroForm('Muitas tentativas. Aguarde antes de enviar novamente.')
        setEnviando(false)
        return
      }
      
      if (!res.ok) {
        const msg = data.details 
          ? Object.values(data.details).flat().join(', ')
          : data.error || 'Erro ao enviar. Tente novamente.'
        setErroForm(msg)
        setEnviando(false)
        return
      }
      
      setEnviando(false)
      setEnviado(true)
    } catch {
      setErroForm('Erro de conexao. Verifique sua internet.')
      setEnviando(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(201,168,76,0.12)',
    borderRadius: '2px',
    padding: '14px 16px',
    fontSize: '14px',
    color: '#F0EDE6',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s, background-color 0.2s',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '11px',
    color: '#9B9690',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    marginBottom: '8px',
    display: 'block',
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#0E0E0F', 
      color: '#F0EDE6', 
      fontFamily: 'var(--font-sans, system-ui, sans-serif)',
      overflowX: 'hidden',
    }}>

      {/* ══════════════════════════════════════════════════════════
          HERO SECTION
      ════════════════════════════════════════��═════════════════ */}
      <section style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '80px 24px',
        textAlign: 'center',
        overflow: 'hidden',
      }}>
        {/* Background grid pattern */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: `
            linear-gradient(rgba(201,168,76,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(201,168,76,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }} />

        {/* Radial glow top */}
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: '120%', height: '60%', pointerEvents: 'none',
          background: 'radial-gradient(ellipse 50% 50% at 50% 0%, rgba(201,168,76,0.06) 0%, transparent 70%)',
        }} />

        {/* Content */}
        <div style={{ position: 'relative', maxWidth: '720px', zIndex: 1 }}>
          {/* Avatar */}
          <div style={{ marginBottom: '32px' }}>
            {corretor.avatar_url ? (
              <div style={{ 
                width: 100, height: 100, borderRadius: '50%', 
                border: '3px solid rgba(201,168,76,0.3)', 
                overflow: 'hidden',
                boxShadow: '0 0 60px rgba(201,168,76,0.15)',
                position: 'relative',
              }}>
                <Image 
                  src={corretor.avatar_url} 
                  alt={corretor.full_name}
                  fill
                  sizes="100px"
                  style={{ objectFit: 'cover' }}
                  priority
                />
              </div>
            ) : (
              <div style={{ 
                width: 100, height: 100, borderRadius: '50%', 
                border: '3px solid rgba(201,168,76,0.3)', 
                backgroundColor: '#181819', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                fontSize: '36px', color: '#C9A84C', 
                fontFamily: 'var(--font-serif, Georgia, serif)',
                margin: '0 auto',
                boxShadow: '0 0 60px rgba(201,168,76,0.15)',
              }}>
                {corretor.full_name.charAt(0)}
              </div>
            )}
          </div>

          {/* Name & CRECI */}
          <h1 style={{ 
            fontFamily: 'var(--font-serif, Georgia, serif)', 
            fontSize: 'clamp(32px, 6vw, 52px)', 
            fontWeight: 400, 
            color: '#F0EDE6', 
            margin: '0 0 12px',
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
          }}>
            {corretor.full_name}
          </h1>

          {corretor.creci && (
            <p style={{ 
              fontSize: '12px', 
              color: '#C9A84C', 
              letterSpacing: '0.15em', 
              textTransform: 'uppercase',
              margin: '0 0 24px',
              fontWeight: 500,
            }}>
              CRECI {corretor.creci} {corretor.city && `· ${corretor.city}`}
            </p>
          )}

          {/* Badges */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '11px', padding: '6px 14px', borderRadius: '2px',
              border: `1px solid ${selo.cor}30`,
              color: selo.cor,
              backgroundColor: `${selo.cor}10`,
              fontWeight: 600, letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}>
              {selo.label}
            </span>

            {corretor.nota_media > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#9B9690' }}>
                <Estrelas nota={corretor.nota_media} />
                <span style={{ color: '#F0EDE6', fontWeight: 500 }}>{corretor.nota_media.toFixed(1)}</span>
                <span>({corretor.total_avaliacoes})</span>
              </span>
            )}

            {corretor.deals_closed > 0 && (
              <span style={{ fontSize: '13px', color: '#9B9690' }}>
                <span style={{ color: '#F0EDE6', fontWeight: 500 }}>{corretor.deals_closed}</span> negócios fechados
              </span>
            )}
          </div>

          {/* Bio / Boas-vindas */}
          {(corretor.site_boas_vindas || corretor.bio) && (
            <p style={{ 
              fontSize: '16px', 
              color: '#9B9690', 
              lineHeight: 1.7, 
              maxWidth: '520px', 
              margin: '0 auto 40px',
            }}>
              {corretor.site_boas_vindas || corretor.bio}
            </p>
          )}

          {/* CTAs */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => scrollToForm('proprietario')}
              style={{ 
                backgroundColor: '#C9A84C', color: '#0E0E0F', 
                border: 'none', borderRadius: '2px', 
                padding: '14px 32px', fontSize: '14px', fontWeight: 600, 
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                boxShadow: '0 4px 24px rgba(201,168,76,0.2)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(201,168,76,0.3)' }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(201,168,76,0.2)' }}
            >
              Tenho um imóvel para vender
            </button>
            <button
              onClick={() => scrollToForm('comprador')}
              style={{ 
                backgroundColor: 'transparent', color: '#C9A84C', 
                border: '1px solid rgba(201,168,76,0.4)', borderRadius: '2px', 
                padding: '14px 32px', fontSize: '14px', fontWeight: 500, 
                cursor: 'pointer',
                transition: 'background-color 0.2s, border-color 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(201,168,76,0.08)'; e.currentTarget.style.borderColor = 'rgba(201,168,76,0.6)' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = 'rgba(201,168,76,0.4)' }}
            >
              Estou buscando um imóvel
            </button>
          </div>
        </div>

        {/* Scroll indicator */}
        {imoveis.length > 0 && (
          <button
            onClick={scrollToCatalogo}
            style={{
              position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)',
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#9B9690', fontSize: '12px', letterSpacing: '0.1em',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
            }}
          >
            <span>VER CATÁLOGO</span>
            <span style={{ fontSize: '18px', animation: 'bounce 2s infinite' }}>↓</span>
          </button>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════════
          CATÁLOGO DE IMÓVEIS
      ══════════════════════════════════════════════════════════ */}
      {imoveis.length > 0 && (
        <section ref={catalogoRef} style={{ 
          padding: '80px 24px', 
          maxWidth: '1200px', 
          margin: '0 auto',
        }}>
          {/* Section header */}
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <p style={{ 
              fontSize: '11px', color: '#C9A84C', letterSpacing: '0.2em', 
              textTransform: 'uppercase', marginBottom: '16px', fontWeight: 600 
            }}>
              Catálogo
            </p>
            <h2 style={{ 
              fontFamily: 'var(--font-serif, Georgia, serif)', 
              fontSize: 'clamp(28px, 4vw, 40px)', 
              fontWeight: 400, 
              color: '#F0EDE6', 
              margin: 0,
              lineHeight: 1.2,
            }}>
              Imóveis disponíveis
            </h2>
            <p style={{ fontSize: '15px', color: '#9B9690', marginTop: '12px' }}>
              {imoveis.length} {imoveis.length === 1 ? 'imóvel' : 'imóveis'} para você conhecer
            </p>
          </div>

          {/* Lançamentos */}
          {lancamentos.length > 0 && (
            <div style={{ marginBottom: '60px' }}>
              <p style={{ 
                fontSize: '11px', color: '#E8C96A', letterSpacing: '0.15em', 
                marginBottom: '20px', fontWeight: 600, textTransform: 'uppercase',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <span style={{ display: 'inline-block', width: '24px', height: '1px', backgroundColor: '#E8C96A' }} />
                Lançamentos
              </p>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
                gap: '20px' 
              }}>
                {lancamentos.map((im) => (
                  <CardImovel 
                    key={im.id} 
                    imovel={im} 
                    onSelect={() => setImovelSelecionado(im)}
                    destaque 
                  />
                ))}
              </div>
            </div>
          )}

          {/* Demais imóveis */}
          {demais.length > 0 && (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
              gap: '20px' 
            }}>
              {demais.map((im) => (
                <CardImovel 
                  key={im.id} 
                  imovel={im} 
                  onSelect={() => setImovelSelecionado(im)}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════
          FORMULÁRIOS
      ══════════════════════════════════════════════════════════ */}
      <section ref={formRef} style={{ 
        padding: '100px 24px', 
        backgroundColor: '#0a0a0a',
        borderTop: '1px solid rgba(201,168,76,0.08)',
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          {/* Section header */}
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <p style={{ 
              fontSize: '11px', color: '#C9A84C', letterSpacing: '0.2em', 
              textTransform: 'uppercase', marginBottom: '16px', fontWeight: 600 
            }}>
              Contato
            </p>
            <h2 style={{ 
              fontFamily: 'var(--font-serif, Georgia, serif)', 
              fontSize: 'clamp(28px, 4vw, 40px)', 
              fontWeight: 400, 
              color: '#F0EDE6', 
              margin: 0,
              lineHeight: 1.2,
            }}>
              Como posso ajudar?
            </h2>
          </div>

          {/* Tabs */}
          <div style={{ 
            display: 'flex', 
            marginBottom: '32px', 
            border: '1px solid rgba(201,168,76,0.12)', 
            borderRadius: '2px', 
            overflow: 'hidden',
            backgroundColor: 'rgba(0,0,0,0.3)',
          }}>
            {([
              { key: 'proprietario', label: 'Quero vender/alugar meu imóvel' },
              { key: 'comprador', label: 'Estou buscando um imóvel' },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  flex: 1,
                  padding: '16px',
                  fontSize: '13px',
                  fontWeight: 500,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: activeTab === tab.key ? 'rgba(201,168,76,0.1)' : 'transparent',
                  color: activeTab === tab.key ? '#C9A84C' : '#9B9690',
                  transition: 'all 0.2s',
                  borderBottom: activeTab === tab.key ? '2px solid #C9A84C' : '2px solid transparent',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Form content */}
          {enviado ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px 32px', 
              backgroundColor: 'rgba(92,184,138,0.06)', 
              border: '1px solid rgba(92,184,138,0.15)', 
              borderRadius: '2px' 
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>✓</div>
              <p style={{ fontSize: '18px', color: '#5CB88A', fontWeight: 600, marginBottom: '8px' }}>
                Mensagem enviada com sucesso!
              </p>
              <p style={{ fontSize: '14px', color: '#9B9690' }}>
                {corretor.full_name} entrará em contato em breve.
              </p>
            </div>
          ) : activeTab === 'proprietario' ? (
            <form onSubmit={enviarProprietario} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {erroForm && (
                <div style={{
                  backgroundColor: 'rgba(224,92,92,0.1)',
                  border: '1px solid rgba(224,92,92,0.3)',
                  borderRadius: '2px',
                  padding: '12px 16px',
                  fontSize: '13px',
                  color: '#E05C5C',
                }}>
                  {erroForm}
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Nome completo *</label>
                  <input 
                    required 
                    placeholder="Seu nome" 
                    value={formProprietario.nome} 
                    onChange={(e) => setFormProprietario(p => ({ ...p, nome: e.target.value }))} 
                    style={inputStyle} 
                  />
                </div>
                <div>
                  <label style={labelStyle}>WhatsApp *</label>
                  <input 
                    required 
                    placeholder="(00) 00000-0000" 
                    value={formProprietario.whatsapp} 
                    onChange={(e) => setFormProprietario(p => ({ ...p, whatsapp: e.target.value }))} 
                    style={inputStyle} 
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>E-mail</label>
                <input 
                  type="email"
                  placeholder="seu@email.com" 
                  value={formProprietario.email} 
                  onChange={(e) => setFormProprietario(p => ({ ...p, email: e.target.value }))} 
                  style={inputStyle} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Tipo de negócio</label>
                  <SelectField
                    ariaLabel="Tipo de negócio"
                    value={formProprietario.tipo_negocio}
                    onChange={(v) => setFormProprietario(p => ({ ...p, tipo_negocio: v }))}
                    options={[
                      { value: 'Venda', label: 'Venda' },
                      { value: 'Locação', label: 'Locação' },
                    ]}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Tipo de imóvel</label>
                  <SelectField
                    ariaLabel="Tipo de imóvel"
                    value={formProprietario.tipo_imovel}
                    onChange={(v) => setFormProprietario(p => ({ ...p, tipo_imovel: v }))}
                    options={TIPO_IMOVEL_OPTIONS.map((t) => ({ value: t, label: t }))}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Cidade *</label>
                  <input 
                    required 
                    placeholder="Cidade do imóvel" 
                    value={formProprietario.cidade} 
                    onChange={(e) => setFormProprietario(p => ({ ...p, cidade: e.target.value }))} 
                    style={inputStyle} 
                  />
                </div>
                <div>
                  <label style={labelStyle}>Bairro</label>
                  <input 
                    placeholder="Bairro" 
                    value={formProprietario.bairro} 
                    onChange={(e) => setFormProprietario(p => ({ ...p, bairro: e.target.value }))} 
                    style={inputStyle} 
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Valor estimado (R$)</label>
                <input 
                  placeholder="Ex: 500.000" 
                  value={formProprietario.valor} 
                  onChange={(e) => setFormProprietario(p => ({ ...p, valor: e.target.value }))} 
                  style={inputStyle} 
                />
              </div>

              <div>
                <label style={labelStyle}>Observações</label>
                <textarea 
                  placeholder="Conte mais sobre seu imóvel..." 
                  value={formProprietario.observacoes} 
                  onChange={(e) => setFormProprietario(p => ({ ...p, observacoes: e.target.value }))} 
                  rows={4} 
                  style={{ ...inputStyle, resize: 'vertical' }} 
                />
              </div>

              <button 
                type="submit" 
                disabled={enviando} 
                style={{ 
                  backgroundColor: '#C9A84C', color: '#0E0E0F', 
                  border: 'none', borderRadius: '2px', 
                  padding: '16px', fontSize: '14px', fontWeight: 600, 
                  cursor: enviando ? 'not-allowed' : 'pointer',
                  opacity: enviando ? 0.7 : 1,
                  marginTop: '8px',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
              >
                {enviando ? 'Enviando...' : 'Enviar solicitação'}
              </button>
            </form>
          ) : (
            <form onSubmit={enviarComprador} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {erroForm && (
                <div style={{
                  backgroundColor: 'rgba(224,92,92,0.1)',
                  border: '1px solid rgba(224,92,92,0.3)',
                  borderRadius: '2px',
                  padding: '12px 16px',
                  fontSize: '13px',
                  color: '#E05C5C',
                }}>
                  {erroForm}
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Nome completo *</label>
                  <input 
                    required 
                    placeholder="Seu nome" 
                    value={formComprador.nome} 
                    onChange={(e) => setFormComprador(p => ({ ...p, nome: e.target.value }))} 
                    style={inputStyle} 
                  />
                </div>
                <div>
                  <label style={labelStyle}>WhatsApp *</label>
                  <input 
                    required 
                    placeholder="(00) 00000-0000" 
                    value={formComprador.whatsapp} 
                    onChange={(e) => setFormComprador(p => ({ ...p, whatsapp: e.target.value }))} 
                    style={inputStyle} 
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>E-mail</label>
                <input 
                  type="email"
                  placeholder="seu@email.com" 
                  value={formComprador.email} 
                  onChange={(e) => setFormComprador(p => ({ ...p, email: e.target.value }))} 
                  style={inputStyle} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Quero</label>
                  <SelectField
                    ariaLabel="Quero"
                    value={formComprador.tipo_negocio}
                    onChange={(v) => setFormComprador(p => ({ ...p, tipo_negocio: v }))}
                    options={[
                      { value: 'Comprar', label: 'Comprar' },
                      { value: 'Alugar', label: 'Alugar' },
                    ]}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Tipo de imóvel</label>
                  <SelectField
                    ariaLabel="Tipo de imóvel"
                    value={formComprador.tipo_imovel}
                    onChange={(v) => setFormComprador(p => ({ ...p, tipo_imovel: v }))}
                    options={TIPO_IMOVEL_OPTIONS.map((t) => ({ value: t, label: t }))}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Cidade *</label>
                  <input 
                    required 
                    placeholder="Cidade desejada" 
                    value={formComprador.cidade} 
                    onChange={(e) => setFormComprador(p => ({ ...p, cidade: e.target.value }))} 
                    style={inputStyle} 
                  />
                </div>
                <div>
                  <label style={labelStyle}>Bairro de preferência</label>
                  <input 
                    placeholder="Bairro" 
                    value={formComprador.bairro_desejado} 
                    onChange={(e) => setFormComprador(p => ({ ...p, bairro_desejado: e.target.value }))} 
                    style={inputStyle} 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Valor mínimo (R$)</label>
                  <input 
                    placeholder="Ex: 300.000" 
                    value={formComprador.valor_min} 
                    onChange={(e) => setFormComprador(p => ({ ...p, valor_min: e.target.value }))} 
                    style={inputStyle} 
                  />
                </div>
                <div>
                  <label style={labelStyle}>Valor máximo (R$)</label>
                  <input 
                    placeholder="Ex: 800.000" 
                    value={formComprador.valor_max} 
                    onChange={(e) => setFormComprador(p => ({ ...p, valor_max: e.target.value }))} 
                    style={inputStyle} 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Quartos</label>
                  <SelectField
                    ariaLabel="Quartos"
                    value={formComprador.quartos}
                    onChange={(v) => setFormComprador(p => ({ ...p, quartos: v }))}
                    options={[
                      { value: '', label: 'Qualquer' },
                      { value: '1', label: '1 quarto' },
                      { value: '2', label: '2 quartos' },
                      { value: '3', label: '3 quartos' },
                      { value: '4', label: '4+ quartos' },
                    ]}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Tem animal de estimação?</label>
                  <SelectField
                    ariaLabel="Tem animal de estimação?"
                    value={formComprador.tem_animal}
                    onChange={(v) => setFormComprador(p => ({ ...p, tem_animal: v }))}
                    options={[
                      { value: 'nao', label: 'Não' },
                      { value: 'sim', label: 'Sim' },
                    ]}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={enviando} 
                style={{ 
                  backgroundColor: '#C9A84C', color: '#0E0E0F', 
                  border: 'none', borderRadius: '2px', 
                  padding: '16px', fontSize: '14px', fontWeight: 600, 
                  cursor: enviando ? 'not-allowed' : 'pointer',
                  opacity: enviando ? 0.7 : 1,
                  marginTop: '8px',
                }}
              >
                {enviando ? 'Enviando...' : 'Enviar solicitação'}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════════ */}
      <footer style={{ 
        padding: '40px 24px', 
        borderTop: '1px solid rgba(201,168,76,0.08)',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: '12px', color: '#9B9690', margin: 0 }}>
          © {new Date().getFullYear()} {corretor.full_name} · Powered by{' '}
          <span style={{ color: '#C9A84C' }}>BID</span>
        </p>
      </footer>

      {/* ══════════════════════════════════════════════════════════
          WHATSAPP FLOATING BUTTON
      ══════════════════════════════════════════════════════════ */}
      {corretor.phone && (
        <a
          href={`https://wa.me/55${corretor.phone.replace(/\D/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 50,
            background: '#25D366', color: 'white',
            width: 56, height: 56, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            textDecoration: 'none',
            boxShadow: '0 4px 20px rgba(37,211,102,0.4)',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(37,211,102,0.5)' }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(37,211,102,0.4)' }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </a>
      )}

      {/* ══════════════════════════════════════════════════════════
          MODAL DE IMÓVEL SELECIONADO
      ══════════════════════════════════════════════════════════ */}
      {imovelSelecionado && (
        <ModalImovelDetalhe
          imovel={imovelSelecionado}
          corretor={corretor}
          onClose={() => setImovelSelecionado(null)}
        />
      )}

      {/* CSS Animation for bounce */}
      <style>{`
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
          60% { transform: translateY(-3px); }
        }
      `}</style>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════
// COMPONENTE: Card de Imóvel
// ════════════════════════════════════════════════════════════════════
function CardImovel({ 
  imovel, 
  onSelect,
  destaque = false 
}: { 
  imovel: ImovelPublico
  onSelect: () => void
  destaque?: boolean 
}) {
  const imgUrl = imovel.image_urls?.[0] || null
  const [hover, setHover] = useState(false)

  return (
    <div 
      onClick={onSelect}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ 
        backgroundColor: '#141415', 
        border: destaque ? '1px solid rgba(232,201,106,0.2)' : '1px solid rgba(201,168,76,0.08)', 
        borderRadius: '2px', 
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.3s, box-shadow 0.3s, border-color 0.3s',
        transform: hover ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hover ? '0 12px 40px rgba(0,0,0,0.4)' : 'none',
      }}
    >
      {/* Imagem */}
      <div style={{ position: 'relative', height: '200px', backgroundColor: '#1a1a1b', overflow: 'hidden' }}>
        {imgUrl ? (
          <Image 
            src={imgUrl} 
            alt={imovel.titulo}
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            style={{ 
              objectFit: 'cover',
              transition: 'transform 0.5s',
              transform: hover ? 'scale(1.05)' : 'scale(1)',
            }}
          />
        ) : (
          <div style={{ 
            width: '100%', height: '100%', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: '8px',
            color: '#3a3a3c',
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6M9 9h.01M15 9h.01" />
            </svg>
            <span style={{ fontSize: '12px' }}>Sem imagem</span>
          </div>
        )}

        {/* Badges */}
        <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '6px' }}>
          {imovel.lancamento && (
            <span style={{
              fontSize: '10px', padding: '4px 10px', borderRadius: '2px',
              backgroundColor: 'rgba(232,201,106,0.9)', color: '#0E0E0F',
              fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
            }}>
              Lançamento
            </span>
          )}
          <span style={{
            fontSize: '10px', padding: '4px 10px', borderRadius: '2px',
            backgroundColor: 'rgba(14,14,15,0.85)', color: '#F0EDE6',
            fontWeight: 500, letterSpacing: '0.03em',
          }}>
            {imovel.tipo_negocio}
          </span>
        </div>

        {/* Preço overlay */}
        <div style={{
          position: 'absolute', bottom: '12px', left: '12px',
          backgroundColor: 'rgba(14,14,15,0.9)', padding: '8px 14px', borderRadius: '2px',
        }}>
          <span style={{ fontSize: '16px', fontWeight: 700, color: '#C9A84C' }}>
            {formatCurrency(imovel.valor)}
          </span>
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '20px' }}>
        <h3 style={{ 
          fontSize: '15px', fontWeight: 600, color: '#F0EDE6', 
          margin: '0 0 8px', lineHeight: 1.3,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {imovel.titulo}
        </h3>

        <p style={{ fontSize: '12px', color: '#9B9690', margin: '0 0 16px' }}>
          {[imovel.bairro, imovel.cidade].filter(Boolean).join(', ')}
        </p>

        {/* Specs */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {imovel.quartos > 0 && (
            <span style={{ fontSize: '12px', color: '#9B9690', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ color: '#C9A84C' }}>◻</span> {imovel.quartos} qto{imovel.quartos > 1 ? 's' : ''}
            </span>
          )}
          {imovel.banheiros > 0 && (
            <span style={{ fontSize: '12px', color: '#9B9690', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ color: '#C9A84C' }}>◻</span> {imovel.banheiros} ban
            </span>
          )}
          {imovel.vagas > 0 && (
            <span style={{ fontSize: '12px', color: '#9B9690', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ color: '#C9A84C' }}>◻</span> {imovel.vagas} vaga{imovel.vagas > 1 ? 's' : ''}
            </span>
          )}
          {imovel.area_total && (
            <span style={{ fontSize: '12px', color: '#9B9690', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ color: '#C9A84C' }}>◻</span> {imovel.area_total}m²
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════
// COMPONENTE: Modal de Detalhe do Imóvel
// ════════════════════════════════════════════════════════════════════
function ModalImovelDetalhe({ 
  imovel, 
  corretor,
  onClose 
}: { 
  imovel: ImovelPublico
  corretor: CorretorPublico
  onClose: () => void 
}) {
  const [imgIndex, setImgIndex] = useState(0)
  const images = imovel.image_urls || []

  return (
    <div 
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        backgroundColor: 'rgba(0,0,0,0.9)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
        overflowY: 'auto',
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#141415',
          border: '1px solid rgba(201,168,76,0.15)',
          borderRadius: '2px',
          maxWidth: '900px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
      >
        {/* Header com imagem */}
        <div style={{ position: 'relative', height: '360px', backgroundColor: '#1a1a1b' }}>
          {images.length > 0 ? (
            <>
              <Image 
                src={images[imgIndex]} 
                alt={imovel.titulo}
                fill
                sizes="(max-width: 768px) 100vw, 600px"
                style={{ objectFit: 'cover' }}
                priority
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setImgIndex((imgIndex - 1 + images.length) % images.length)}
                    style={{
                      position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)',
                      width: '40px', height: '40px', borderRadius: '50%',
                      backgroundColor: 'rgba(0,0,0,0.6)', border: 'none',
                      color: 'white', fontSize: '18px', cursor: 'pointer',
                    }}
                  >
                    ‹
                  </button>
                  <button
                    onClick={() => setImgIndex((imgIndex + 1) % images.length)}
                    style={{
                      position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)',
                      width: '40px', height: '40px', borderRadius: '50%',
                      backgroundColor: 'rgba(0,0,0,0.6)', border: 'none',
                      color: 'white', fontSize: '18px', cursor: 'pointer',
                    }}
                  >
                    ›
                  </button>
                  <div style={{
                    position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)',
                    display: 'flex', gap: '6px',
                  }}>
                    {images.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setImgIndex(i)}
                        style={{
                          width: '8px', height: '8px', borderRadius: '50%',
                          backgroundColor: i === imgIndex ? '#C9A84C' : 'rgba(255,255,255,0.4)',
                          border: 'none', cursor: 'pointer',
                        }}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div style={{ 
              width: '100%', height: '100%', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: '12px',
              color: '#3a3a3c',
            }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6M9 9h.01M15 9h.01" />
              </svg>
              <span style={{ fontSize: '14px' }}>Sem imagens disponiveis</span>
            </div>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: '16px', right: '16px',
              width: '36px', height: '36px', borderRadius: '50%',
              backgroundColor: 'rgba(0,0,0,0.6)', border: 'none',
              color: 'white', fontSize: '20px', cursor: 'pointer',
            }}
          >
            ×
          </button>

          {/* Badges */}
          <div style={{ position: 'absolute', top: '16px', left: '16px', display: 'flex', gap: '8px' }}>
            {imovel.lancamento && (
              <span style={{
                fontSize: '11px', padding: '6px 12px', borderRadius: '2px',
                backgroundColor: 'rgba(232,201,106,0.9)', color: '#0E0E0F',
                fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
              }}>
                Lançamento
              </span>
            )}
            <span style={{
              fontSize: '11px', padding: '6px 12px', borderRadius: '2px',
              backgroundColor: 'rgba(14,14,15,0.85)', color: '#F0EDE6',
              fontWeight: 500,
            }}>
              {imovel.tipo_negocio}
            </span>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap', marginBottom: '24px' }}>
            <div>
              <h2 style={{ 
                fontFamily: 'var(--font-serif, Georgia, serif)',
                fontSize: '24px', fontWeight: 600, color: '#F0EDE6', 
                margin: '0 0 8px',
              }}>
                {imovel.titulo}
              </h2>
              <p style={{ fontSize: '14px', color: '#9B9690', margin: 0 }}>
                {[imovel.bairro, imovel.cidade].filter(Boolean).join(', ')}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '28px', fontWeight: 700, color: '#C9A84C', margin: 0 }}>
                {formatCurrency(imovel.valor)}
              </p>
              <p style={{ fontSize: '12px', color: '#9B9690', margin: '4px 0 0' }}>
                {imovel.tipo_imovel}
              </p>
            </div>
          </div>

          {/* Specs grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
            gap: '16px',
            padding: '24px',
            backgroundColor: 'rgba(201,168,76,0.04)',
            borderRadius: '2px',
            marginBottom: '32px',
          }}>
            {imovel.quartos > 0 && (
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '24px', fontWeight: 600, color: '#F0EDE6', margin: '0 0 4px' }}>{imovel.quartos}</p>
                <p style={{ fontSize: '12px', color: '#9B9690', margin: 0 }}>Quartos</p>
              </div>
            )}
            {imovel.banheiros > 0 && (
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '24px', fontWeight: 600, color: '#F0EDE6', margin: '0 0 4px' }}>{imovel.banheiros}</p>
                <p style={{ fontSize: '12px', color: '#9B9690', margin: 0 }}>Banheiros</p>
              </div>
            )}
            {imovel.vagas > 0 && (
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '24px', fontWeight: 600, color: '#F0EDE6', margin: '0 0 4px' }}>{imovel.vagas}</p>
                <p style={{ fontSize: '12px', color: '#9B9690', margin: 0 }}>Vagas</p>
              </div>
            )}
            {imovel.area_total && (
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '24px', fontWeight: 600, color: '#F0EDE6', margin: '0 0 4px' }}>{imovel.area_total}</p>
                <p style={{ fontSize: '12px', color: '#9B9690', margin: 0 }}>m²</p>
              </div>
            )}
            {imovel.aceita_animal && (
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '24px', fontWeight: 600, color: '#5CB88A', margin: '0 0 4px' }}>✓</p>
                <p style={{ fontSize: '12px', color: '#9B9690', margin: 0 }}>Aceita pet</p>
              </div>
            )}
          </div>

          {/* CTA */}
          {corretor.phone && (
            <a
              href={`https://wa.me/55${corretor.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${corretor.full_name}! Tenho interesse no imóvel: ${imovel.titulo} - ${formatCurrency(imovel.valor)}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                backgroundColor: '#25D366', color: 'white',
                padding: '16px', borderRadius: '2px',
                fontSize: '14px', fontWeight: 600, textDecoration: 'none',
                width: '100%',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Tenho interesse neste imóvel
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
