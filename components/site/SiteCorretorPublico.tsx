'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, TIPO_IMOVEL_OPTIONS } from '@/lib/format'

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
}

interface Props {
  corretor: CorretorPublico
  imoveis: ImovelPublico[]
}

function getSelo(nota: number, negocios: number): { label: string; cor: string } {
  if (nota >= 4.5 && negocios >= 20) return { label: 'Platinum', cor: '#C9A84C' }
  if (nota >= 4.0 && negocios >= 10) return { label: 'Gold', cor: '#C9A84C' }
  if (nota >= 3.5 && negocios >= 5)  return { label: 'Silver', cor: '#5C9BE0' }
  return { label: 'Standard', cor: '#9B9690' }
}

function Estrelas({ nota }: { nota: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: '2px' }}>
      {[1,2,3,4,5].map((i) => (
        <span key={i} style={{ fontSize: '11px', color: i <= Math.round(nota) ? '#C9A84C' : '#2E2E30' }}>★</span>
      ))}
    </span>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(201,168,76,0.15)',
  borderRadius: '2px',
  padding: '9px 12px',
  fontSize: '13px',
  color: '#F0EDE6',
  outline: 'none',
  boxSizing: 'border-box',
}

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer',
}

export default function SiteCorretorPublico({ corretor, imoveis }: Props) {
  const supabase = createClient()
  const [tabForm, setTabForm] = useState<'imovel' | 'busca'>('imovel')
  const [enviado, setEnviado] = useState(false)
  const [enviando, setEnviando] = useState(false)

  const [formImovel, setFormImovel] = useState({
    nome: '', whatsapp: '', tipo_negocio: 'Venda', tipo_imovel: 'Apartamento',
    cidade: '', bairro: '', valor: '', observacoes: '',
  })

  const [formBusca, setFormBusca] = useState({
    nome: '', whatsapp: '', tipo_negocio: 'Comprar', tipo_imovel: 'Apartamento',
    cidade: '', bairro_desejado: '', valor_min: '', valor_max: '',
    quartos: '', tem_animal: 'nao',
  })

  const selo = getSelo(corretor.nota_media, corretor.deals_closed)
  const lancamentos = imoveis.filter((i) => i.lancamento)
  const demais = imoveis.filter((i) => !i.lancamento)

  async function enviarImovel(e: React.FormEvent) {
    e.preventDefault()
    setEnviando(true)
    await supabase.from('imoveis').insert({
      corretor_id: corretor.id,
      titulo: `Rascunho - ${formImovel.tipo_imovel} em ${formImovel.cidade}`,
      status: 'aguardando_assinatura',
      matching_ativo: false,
      tipo_negocio: formImovel.tipo_negocio,
      tipo_imovel: formImovel.tipo_imovel,
      cidade: formImovel.cidade,
      bairro: formImovel.bairro || null,
      valor: Number(formImovel.valor.replace(/\D/g, '')) || 0,
      prop_nome: formImovel.nome,
      prop_whatsapp: formImovel.whatsapp,
      quartos: 0, banheiros: 0, vagas: 0,
      publico_no_site: false,
    })
    setEnviando(false)
    setEnviado(true)
  }

  async function enviarBusca(e: React.FormEvent) {
    e.preventDefault()
    setEnviando(true)
    await supabase.from('solicitacoes').insert({
      corretor_id: corretor.id,
      status: 'ativa',
      source: 'landing_page',
      cliente_nome: formBusca.nome,
      cliente_phone: formBusca.whatsapp,
      tipo_negocio: formBusca.tipo_negocio,
      tipo_imovel: formBusca.tipo_imovel,
      cidade: formBusca.cidade,
      bairro_desejado: formBusca.bairro_desejado || null,
      valor_min: Number(formBusca.valor_min.replace(/\D/g, '')) || null,
      valor_max: Number(formBusca.valor_max.replace(/\D/g, '')) || null,
      quartos: Number(formBusca.quartos) || null,
      tem_animal: formBusca.tem_animal === 'sim',
      prazo_fechar: '3 meses',
      vagas: 0,
    })
    setEnviando(false)
    setEnviado(true)
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0E0E0F', color: '#F0EDE6', fontFamily: 'var(--font-sans, sans-serif)' }}>

      {/* HERO */}
      <section style={{
        position: 'relative',
        padding: '64px 24px',
        textAlign: 'center',
        borderBottom: '1px solid rgba(201,168,76,0.1)',
        overflow: 'hidden',
      }}>
        {/* grid lines */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(201,168,76,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.04) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
        {/* radial glow */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(201,168,76,0.08) 0%, transparent 70%)',
        }} />

        <div style={{ position: 'relative', maxWidth: '480px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
          {/* Avatar */}
          {corretor.avatar_url ? (
            <img src={corretor.avatar_url} alt={corretor.full_name} style={{ width: 64, height: 64, borderRadius: '50%', border: '2px solid rgba(201,168,76,0.3)', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: 64, height: 64, borderRadius: '50%', border: '2px solid rgba(201,168,76,0.3)', backgroundColor: '#232324', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', color: '#C9A84C', fontFamily: 'var(--font-serif, serif)' }}>
              {corretor.full_name.charAt(0)}
            </div>
          )}

          <div>
            <h1 style={{ fontFamily: 'var(--font-serif, serif)', fontSize: '26px', fontWeight: 700, color: '#F0EDE6', margin: 0, lineHeight: 1.2 }}>
              {corretor.full_name}
            </h1>
            {corretor.creci && (
              <p style={{ fontSize: '10px', color: '#9B9690', letterSpacing: '0.08em', marginTop: '4px', textTransform: 'uppercase' }}>
                CRECI {corretor.creci}
              </p>
            )}
          </div>

          {/* Selo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontSize: '10px', padding: '3px 10px', borderRadius: '2px',
              border: `1px solid ${selo.cor}40`,
              color: selo.cor,
              backgroundColor: `${selo.cor}15`,
              fontWeight: 600, letterSpacing: '0.06em',
            }}>
              {selo.label}
            </span>
            {corretor.nota_media > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#9B9690' }}>
                <Estrelas nota={corretor.nota_media} />
                {corretor.nota_media.toFixed(1)}
              </span>
            )}
            {corretor.deals_closed > 0 && (
              <span style={{ fontSize: '11px', color: '#9B9690' }}>
                · {corretor.deals_closed} neg. fechados
              </span>
            )}
          </div>

          {/* Boas-vindas */}
          {corretor.site_boas_vindas && (
            <p style={{ fontSize: '13px', color: '#9B9690', lineHeight: 1.6, maxWidth: '320px', textAlign: 'center', margin: 0 }}>
              {corretor.site_boas_vindas}
            </p>
          )}

          {/* CTAs */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button
              onClick={() => { setTabForm('imovel'); document.getElementById('formulario')?.scrollIntoView({ behavior: 'smooth' }) }}
              style={{ backgroundColor: '#C9A84C', color: '#0E0E0F', border: 'none', borderRadius: '2px', padding: '9px 20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            >
              Tenho um imovel
            </button>
            <button
              onClick={() => { setTabForm('busca'); document.getElementById('formulario')?.scrollIntoView({ behavior: 'smooth' }) }}
              style={{ backgroundColor: 'transparent', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.4)', borderRadius: '2px', padding: '9px 20px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
            >
              Estou buscando
            </button>
          </div>
        </div>
      </section>

      {/* PORTFOLIO */}
      {imoveis.length > 0 && (
        <section style={{ padding: '40px 24px', maxWidth: '800px', margin: '0 auto' }}>
          <p style={{ fontSize: '10px', color: '#C9A84C', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '20px', fontWeight: 600 }}>
            Portfolio ({imoveis.length} {imoveis.length === 1 ? 'imovel' : 'imoveis'})
          </p>

          {lancamentos.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <p style={{ fontSize: '11px', color: '#9B9690', marginBottom: '12px', letterSpacing: '0.05em' }}>
                Lancamentos
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                {lancamentos.map((im) => <CardImovel key={im.id} imovel={im} />)}
              </div>
            </div>
          )}

          {demais.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
              {demais.map((im) => <CardImovel key={im.id} imovel={im} />)}
            </div>
          )}
        </section>
      )}

      {/* FORMULÁRIO */}
      <section id="formulario" style={{ padding: '40px 24px', maxWidth: '480px', margin: '0 auto 80px' }}>
        <p style={{ fontSize: '10px', color: '#C9A84C', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '20px', fontWeight: 600 }}>
          Fale comigo
        </p>

        {/* Toggle */}
        <div style={{ display: 'flex', marginBottom: '24px', border: '1px solid rgba(201,168,76,0.15)', borderRadius: '2px', overflow: 'hidden' }}>
          {(['imovel', 'busca'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setTabForm(tab)}
              style={{
                flex: 1,
                padding: '9px',
                fontSize: '12px',
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: tabForm === tab ? 'rgba(201,168,76,0.12)' : 'transparent',
                color: tabForm === tab ? '#C9A84C' : '#9B9690',
                transition: 'all 0.15s',
              }}
            >
              {tab === 'imovel' ? 'Tenho um imovel para vender/alugar' : 'Estou buscando um imovel'}
            </button>
          ))}
        </div>

        {enviado ? (
          <div style={{ textAlign: 'center', padding: '32px', backgroundColor: 'rgba(92,184,138,0.08)', border: '1px solid rgba(92,184,138,0.2)', borderRadius: '2px' }}>
            <p style={{ fontSize: '14px', color: '#5CB88A', fontWeight: 600 }}>Mensagem enviada!</p>
            <p style={{ fontSize: '12px', color: '#9B9690', marginTop: '8px' }}>
              Recebemos seus dados! {corretor.full_name} entrara em contato em breve.
            </p>
          </div>
        ) : tabForm === 'imovel' ? (
          <form onSubmit={enviarImovel} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <input required placeholder="Seu nome" value={formImovel.nome} onChange={(e) => setFormImovel(p => ({ ...p, nome: e.target.value }))} style={inputStyle} />
              <input required placeholder="WhatsApp" value={formImovel.whatsapp} onChange={(e) => setFormImovel(p => ({ ...p, whatsapp: e.target.value }))} style={inputStyle} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <select value={formImovel.tipo_negocio} onChange={(e) => setFormImovel(p => ({ ...p, tipo_negocio: e.target.value }))} style={selectStyle}>
                <option value="Venda">Venda</option>
                <option value="Locacao">Locacao</option>
              </select>
              <select value={formImovel.tipo_imovel} onChange={(e) => setFormImovel(p => ({ ...p, tipo_imovel: e.target.value }))} style={selectStyle}>
                {TIPO_IMOVEL_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <input required placeholder="Cidade" value={formImovel.cidade} onChange={(e) => setFormImovel(p => ({ ...p, cidade: e.target.value }))} style={inputStyle} />
              <input placeholder="Bairro" value={formImovel.bairro} onChange={(e) => setFormImovel(p => ({ ...p, bairro: e.target.value }))} style={inputStyle} />
            </div>
            <input placeholder="Valor estimado (R$)" value={formImovel.valor} onChange={(e) => setFormImovel(p => ({ ...p, valor: e.target.value }))} style={inputStyle} />
            <textarea placeholder="Observacoes (opcional)" value={formImovel.observacoes} onChange={(e) => setFormImovel(p => ({ ...p, observacoes: e.target.value }))} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
            <button type="submit" disabled={enviando} style={{ backgroundColor: '#C9A84C', color: '#0E0E0F', border: 'none', borderRadius: '2px', padding: '11px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', marginTop: '4px' }}>
              {enviando ? 'Enviando...' : 'Enviar'}
            </button>
          </form>
        ) : (
          <form onSubmit={enviarBusca} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <input required placeholder="Seu nome" value={formBusca.nome} onChange={(e) => setFormBusca(p => ({ ...p, nome: e.target.value }))} style={inputStyle} />
              <input required placeholder="WhatsApp" value={formBusca.whatsapp} onChange={(e) => setFormBusca(p => ({ ...p, whatsapp: e.target.value }))} style={inputStyle} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <select value={formBusca.tipo_negocio} onChange={(e) => setFormBusca(p => ({ ...p, tipo_negocio: e.target.value }))} style={selectStyle}>
                <option value="Comprar">Comprar</option>
                <option value="Alugar">Alugar</option>
              </select>
              <select value={formBusca.tipo_imovel} onChange={(e) => setFormBusca(p => ({ ...p, tipo_imovel: e.target.value }))} style={selectStyle}>
                {TIPO_IMOVEL_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <input required placeholder="Cidade" value={formBusca.cidade} onChange={(e) => setFormBusca(p => ({ ...p, cidade: e.target.value }))} style={inputStyle} />
              <input placeholder="Bairro desejado" value={formBusca.bairro_desejado} onChange={(e) => setFormBusca(p => ({ ...p, bairro_desejado: e.target.value }))} style={inputStyle} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <input placeholder="Valor min (R$)" value={formBusca.valor_min} onChange={(e) => setFormBusca(p => ({ ...p, valor_min: e.target.value }))} style={inputStyle} />
              <input placeholder="Valor max (R$)" value={formBusca.valor_max} onChange={(e) => setFormBusca(p => ({ ...p, valor_max: e.target.value }))} style={inputStyle} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <select value={formBusca.quartos} onChange={(e) => setFormBusca(p => ({ ...p, quartos: e.target.value }))} style={selectStyle}>
                <option value="">Quartos (qualquer)</option>
                <option value="1">1 quarto</option>
                <option value="2">2 quartos</option>
                <option value="3">3 quartos</option>
                <option value="4">4+ quartos</option>
              </select>
              <select value={formBusca.tem_animal} onChange={(e) => setFormBusca(p => ({ ...p, tem_animal: e.target.value }))} style={selectStyle}>
                <option value="nao">Sem animal</option>
                <option value="sim">Tem animal</option>
              </select>
            </div>
            <button type="submit" disabled={enviando} style={{ backgroundColor: '#C9A84C', color: '#0E0E0F', border: 'none', borderRadius: '2px', padding: '11px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', marginTop: '4px' }}>
              {enviando ? 'Enviando...' : 'Enviar'}
            </button>
          </form>
        )}
      </section>

      {/* Botão WhatsApp */}
      {corretor.phone && (
        <a
          href={`https://wa.me/55${corretor.phone.replace(/\D/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 50,
            background: '#25D366', color: 'white',
            padding: '12px 20px', borderRadius: '2px',
            display: 'flex', alignItems: 'center', gap: '8px',
            fontSize: '13px', fontWeight: 500, textDecoration: 'none',
            boxShadow: '0 4px 20px rgba(37,211,102,0.3)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          WhatsApp
        </a>
      )}
    </div>
  )
}

function CardImovel({ imovel }: { imovel: ImovelPublico }) {
  const imgUrl = imovel.image_urls?.[0] || null
  return (
    <div style={{ backgroundColor: '#181819', border: '1px solid rgba(201,168,76,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
      <div style={{ position: 'relative', height: '160px', backgroundColor: '#232324' }}>
        {imgUrl ? (
          <img src={imgUrl} alt={imovel.titulo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2E2E30', fontSize: '32px' }}>
            {imovel.tipo_imovel?.includes('Apart') ? '🏢' : '🏠'}
          </div>
        )}
        {imovel.lancamento && (
          <span style={{ position: 'absolute', top: '8px', left: '8px', fontSize: '9px', padding: '2px 8px', borderRadius: '2px', backgroundColor: '#C9A84C', color: '#0E0E0F', fontWeight: 700, letterSpacing: '0.06em' }}>
            LANCAMENTO
          </span>
        )}
      </div>
      <div style={{ padding: '12px 14px' }}>
        <p style={{ fontSize: '13px', fontWeight: 600, color: '#F0EDE6', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {imovel.titulo}
        </p>
        <p style={{ fontSize: '11px', color: '#9B9690', margin: '0 0 8px' }}>
          {[imovel.bairro, imovel.cidade].filter(Boolean).join(' · ')}
        </p>
        <p style={{ fontSize: '11px', color: '#9B9690', margin: '0 0 8px' }}>
          {imovel.quartos}q · {imovel.banheiros}b · {imovel.vagas}v
          {imovel.aceita_animal && ' · aceita animal'}
        </p>
        <p style={{ fontSize: '16px', fontWeight: 700, color: '#C9A84C', margin: 0, fontFamily: 'var(--font-serif, serif)' }}>
          {formatCurrency(imovel.valor)}
          {imovel.tipo_negocio === 'Locacao' && <span style={{ fontSize: '11px', fontWeight: 400, fontFamily: 'var(--font-sans, sans-serif)' }}>/mes</span>}
        </p>
      </div>
    </div>
  )
}
