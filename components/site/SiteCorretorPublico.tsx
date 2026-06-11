'use client'

import React, { useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { TIPO_IMOVEL_OPTIONS } from '@/lib/format'

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

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function Estrelas({ nota }: { nota: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: '2px' }}>
      {[1,2,3,4,5].map((i) => (
        <span key={i} style={{ fontSize: '13px', color: i <= Math.round(nota) ? '#C9A84C' : '#D1CBC0' }}>★</span>
      ))}
    </span>
  )
}

export default function SiteCorretorPublico({ corretor, imoveis }: Props) {
  const catalogoRef = useRef<HTMLDivElement>(null)
  const contatoRef = useRef<HTMLDivElement>(null)

  const [filtroNegocio, setFiltroNegocio] = useState<'Todos' | 'Venda' | 'Locacao'>('Todos')
  const [filtroTipo, setFiltroTipo] = useState('Todos')
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

  const imoveisFiltrados = imoveis.filter(im => {
    const negocioOk = filtroNegocio === 'Todos' || im.tipo_negocio === filtroNegocio
    const tipoOk = filtroTipo === 'Todos' || im.tipo_imovel === filtroTipo
    return negocioOk && tipoOk
  })

  const tiposDisponiveis = ['Todos', ...Array.from(new Set(imoveis.map(im => im.tipo_imovel)))]
  const whatsNum = corretor.phone ? `55${corretor.phone.replace(/\D/g, '')}` : null

  async function enviarForm(tipo: 'proprietario' | 'comprador', e: React.FormEvent) {
    e.preventDefault()
    setEnviando(true)
    setErroForm('')
    const dados = tipo === 'proprietario'
      ? { ...formProprietario, whatsapp: formProprietario.whatsapp.replace(/\D/g, ''), valor: Number(formProprietario.valor.replace(/\D/g, '')) || 0 }
      : { ...formComprador, whatsapp: formComprador.whatsapp.replace(/\D/g, ''), valor_min: Number(formComprador.valor_min.replace(/\D/g, '')) || undefined, valor_max: Number(formComprador.valor_max.replace(/\D/g, '')) || undefined, quartos: Number(formComprador.quartos) || undefined, tem_animal: formComprador.tem_animal === 'sim' }
    try {
      const res = await fetch('/api/public/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: tipo === 'proprietario' ? 'imovel' : 'busca', corretorId: corretor.id, dados }),
      })
      if (!res.ok) {
        const d = await res.json()
        setErroForm(d.error || 'Erro ao enviar.')
        setEnviando(false)
        return
      }
      setEnviado(true)
    } catch {
      setErroForm('Erro de conexão.')
    } finally {
      setEnviando(false)
    }
  }

  const inputCls: React.CSSProperties = {
    width: '100%', padding: '12px 14px', fontSize: '14px',
    border: '1px solid #DDD8D0', borderRadius: 4, outline: 'none',
    backgroundColor: '#fff', color: '#2C2C2C', boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  }
  const labelCls: React.CSSProperties = {
    display: 'block', fontSize: '12px', fontWeight: 600,
    color: '#6B6560', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6,
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8F7F5', color: '#2C2C2C', fontFamily: 'var(--font-sans, system-ui, sans-serif)' }}>

      {/* ── NAV ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        backgroundColor: '#fff', borderBottom: '1px solid #EAE7E1',
        padding: '0 32px', height: 68,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {corretor.avatar_url ? (
            <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
              <Image src={corretor.avatar_url} alt={corretor.full_name} fill sizes="40px" style={{ objectFit: 'cover' }} />
            </div>
          ) : (
            <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: '#C9A84C', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
              {corretor.full_name.charAt(0)}
            </div>
          )}
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1A1A1A', lineHeight: 1.2 }}>{corretor.full_name}</div>
            {corretor.creci && <div style={{ fontSize: 11, color: '#9B9690' }}>CRECI {corretor.creci}</div>}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => catalogoRef.current?.scrollIntoView({ behavior: 'smooth' })} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#6B6560', fontWeight: 500 }}>
            Imóveis
          </button>
          <button onClick={() => contatoRef.current?.scrollIntoView({ behavior: 'smooth' })} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#6B6560', fontWeight: 500 }}>
            Contato
          </button>
          {whatsNum && (
            <a
              href={`https://wa.me/${whatsNum}`}
              target="_blank" rel="noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                backgroundColor: '#25D366', color: '#fff',
                padding: '9px 18px', borderRadius: 4, fontSize: 13, fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </a>
          )}
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ position: 'relative', minHeight: 500, backgroundColor: '#1A1A1A', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '80px 24px 60px' }}>
        {/* Subtle gradient bg */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2520 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C9A84C' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />

        <div style={{ position: 'relative', textAlign: 'center', maxWidth: 680, zIndex: 1 }}>
          <div style={{ display: 'inline-block', backgroundColor: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 20, padding: '5px 16px', fontSize: 12, color: '#C9A84C', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 24 }}>
            Corretor de Imóveis {corretor.city ? `· ${corretor.city}` : ''}
          </div>

          <h1 style={{ fontFamily: 'var(--font-serif, Georgia, serif)', fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 700, color: '#F0EDE6', margin: '0 0 12px', lineHeight: 1.1 }}>
            {corretor.site_boas_vindas || `Bem-vindo ao site de ${corretor.full_name.split(' ')[0]}`}
          </h1>

          {corretor.bio && (
            <p style={{ fontSize: 16, color: 'rgba(240,237,230,0.7)', lineHeight: 1.7, margin: '0 0 32px', maxWidth: 520, marginLeft: 'auto', marginRight: 'auto' }}>
              {corretor.bio}
            </p>
          )}

          {/* Stats bar */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginBottom: 36, flexWrap: 'wrap' }}>
            {corretor.nota_media > 0 && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', marginBottom: 2 }}>
                  <Estrelas nota={corretor.nota_media} />
                  <span style={{ color: '#F0EDE6', fontWeight: 700, fontSize: 15 }}>{corretor.nota_media.toFixed(1)}</span>
                </div>
                <div style={{ fontSize: 11, color: 'rgba(240,237,230,0.5)' }}>{corretor.total_avaliacoes} avaliações</div>
              </div>
            )}
            {corretor.deals_closed > 0 && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#F0EDE6', fontWeight: 700, fontSize: 22 }}>{corretor.deals_closed}</div>
                <div style={{ fontSize: 11, color: 'rgba(240,237,230,0.5)' }}>negócios fechados</div>
              </div>
            )}
            {imoveis.length > 0 && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#F0EDE6', fontWeight: 700, fontSize: 22 }}>{imoveis.length}</div>
                <div style={{ fontSize: 11, color: 'rgba(240,237,230,0.5)' }}>imóveis disponíveis</div>
              </div>
            )}
          </div>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => catalogoRef.current?.scrollIntoView({ behavior: 'smooth' })}
              style={{ backgroundColor: '#C9A84C', color: '#0E0E0F', border: 'none', borderRadius: 4, padding: '13px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
            >
              Ver imóveis disponíveis
            </button>
            <button
              onClick={() => contatoRef.current?.scrollIntoView({ behavior: 'smooth' })}
              style={{ backgroundColor: 'transparent', color: '#F0EDE6', border: '1px solid rgba(240,237,230,0.3)', borderRadius: 4, padding: '13px 28px', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
            >
              Entrar em contato
            </button>
          </div>
        </div>
      </section>

      {/* ── CATÁLOGO ── */}
      {imoveis.length > 0 && (
        <section ref={catalogoRef} style={{ padding: '64px 24px', maxWidth: 1200, margin: '0 auto' }}>
          {/* Filtros */}
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontFamily: 'var(--font-serif, Georgia, serif)', fontSize: 28, fontWeight: 700, color: '#1A1A1A', marginBottom: 20 }}>
              Imóveis disponíveis
            </h2>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              {(['Todos', 'Venda', 'Locacao'] as const).map(op => (
                <button
                  key={op}
                  onClick={() => setFiltroNegocio(op)}
                  style={{
                    padding: '8px 20px', borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    border: '1px solid',
                    borderColor: filtroNegocio === op ? '#C9A84C' : '#DDD8D0',
                    backgroundColor: filtroNegocio === op ? '#C9A84C' : '#fff',
                    color: filtroNegocio === op ? '#0E0E0F' : '#6B6560',
                  }}
                >
                  {op === 'Todos' ? 'Todos' : op === 'Venda' ? 'Venda' : 'Aluguel'}
                </button>
              ))}
              <div style={{ width: 1, height: 28, backgroundColor: '#DDD8D0', margin: '0 4px' }} />
              <select
                value={filtroTipo}
                onChange={e => setFiltroTipo(e.target.value)}
                style={{ padding: '8px 14px', borderRadius: 4, fontSize: 13, border: '1px solid #DDD8D0', backgroundColor: '#fff', color: '#2C2C2C', cursor: 'pointer' }}
              >
                {tiposDisponiveis.map(t => <option key={t} value={t}>{t === 'Todos' ? 'Tipo: Todos' : t}</option>)}
              </select>
              <span style={{ fontSize: 13, color: '#9B9690', marginLeft: 8 }}>
                {imoveisFiltrados.length} imóvel{imoveisFiltrados.length !== 1 ? 'is' : ''}
              </span>
            </div>
          </div>

          {imoveisFiltrados.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#9B9690' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🏠</div>
              <p>Nenhum imóvel nesta categoria no momento.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
              {imoveisFiltrados.map(im => (
                <CardImovel key={im.id} imovel={im} onSelect={() => setImovelSelecionado(im)} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── CONTATO ── */}
      <section ref={contatoRef} style={{ backgroundColor: '#fff', borderTop: '1px solid #EAE7E1', borderBottom: '1px solid #EAE7E1', padding: '64px 24px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontFamily: 'var(--font-serif, Georgia, serif)', fontSize: 28, fontWeight: 700, color: '#1A1A1A', marginBottom: 8 }}>
              Como posso te ajudar?
            </h2>
            <p style={{ fontSize: 14, color: '#6B6560' }}>Preencha o formulário e entro em contato em breve.</p>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', borderRadius: 6, border: '1px solid #EAE7E1', overflow: 'hidden', marginBottom: 32 }}>
            {([
              { key: 'proprietario', label: 'Quero vender / alugar meu imóvel' },
              { key: 'comprador', label: 'Estou buscando um imóvel' },
            ] as const).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  flex: 1, padding: '14px 8px', fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer',
                  backgroundColor: activeTab === tab.key ? '#C9A84C' : '#fff',
                  color: activeTab === tab.key ? '#0E0E0F' : '#6B6560',
                  transition: 'all 0.2s',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {enviado ? (
            <div style={{ textAlign: 'center', padding: '48px 32px', backgroundColor: '#F0FAF4', border: '1px solid #B8E0C9', borderRadius: 8 }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>✓</div>
              <p style={{ fontSize: 18, color: '#2E7D52', fontWeight: 700, marginBottom: 6 }}>Mensagem enviada!</p>
              <p style={{ fontSize: 14, color: '#6B6560' }}>{corretor.full_name} entrará em contato em breve.</p>
            </div>
          ) : activeTab === 'proprietario' ? (
            <form onSubmit={e => enviarForm('proprietario', e)} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {erroForm && <div style={{ padding: '12px 14px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 4, fontSize: 13, color: '#DC2626' }}>{erroForm}</div>}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div><label style={labelCls}>Nome *</label><input required placeholder="Seu nome" value={formProprietario.nome} onChange={e => setFormProprietario(p => ({ ...p, nome: e.target.value }))} style={inputCls} /></div>
                <div><label style={labelCls}>WhatsApp *</label><input required placeholder="(00) 00000-0000" value={formProprietario.whatsapp} onChange={e => setFormProprietario(p => ({ ...p, whatsapp: e.target.value }))} style={inputCls} /></div>
              </div>
              <div><label style={labelCls}>E-mail</label><input type="email" placeholder="seu@email.com" value={formProprietario.email} onChange={e => setFormProprietario(p => ({ ...p, email: e.target.value }))} style={inputCls} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div><label style={labelCls}>Negócio</label><select value={formProprietario.tipo_negocio} onChange={e => setFormProprietario(p => ({ ...p, tipo_negocio: e.target.value }))} style={inputCls}><option value="Venda">Venda</option><option value="Locação">Locação</option></select></div>
                <div><label style={labelCls}>Tipo de imóvel</label><select value={formProprietario.tipo_imovel} onChange={e => setFormProprietario(p => ({ ...p, tipo_imovel: e.target.value }))} style={inputCls}>{TIPO_IMOVEL_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div><label style={labelCls}>Cidade *</label><input required placeholder="Cidade" value={formProprietario.cidade} onChange={e => setFormProprietario(p => ({ ...p, cidade: e.target.value }))} style={inputCls} /></div>
                <div><label style={labelCls}>Bairro</label><input placeholder="Bairro" value={formProprietario.bairro} onChange={e => setFormProprietario(p => ({ ...p, bairro: e.target.value }))} style={inputCls} /></div>
              </div>
              <div><label style={labelCls}>Valor estimado (R$)</label><input placeholder="Ex: 500.000" value={formProprietario.valor} onChange={e => setFormProprietario(p => ({ ...p, valor: e.target.value }))} style={inputCls} /></div>
              <div><label style={labelCls}>Observações</label><textarea placeholder="Conte mais sobre seu imóvel..." value={formProprietario.observacoes} onChange={e => setFormProprietario(p => ({ ...p, observacoes: e.target.value }))} rows={3} style={{ ...inputCls, resize: 'vertical' }} /></div>
              <button type="submit" disabled={enviando} style={{ backgroundColor: '#C9A84C', color: '#0E0E0F', border: 'none', borderRadius: 4, padding: '14px', fontSize: 14, fontWeight: 700, cursor: enviando ? 'not-allowed' : 'pointer', opacity: enviando ? 0.7 : 1 }}>
                {enviando ? 'Enviando...' : 'Enviar solicitação'}
              </button>
            </form>
          ) : (
            <form onSubmit={e => enviarForm('comprador', e)} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {erroForm && <div style={{ padding: '12px 14px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 4, fontSize: 13, color: '#DC2626' }}>{erroForm}</div>}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div><label style={labelCls}>Nome *</label><input required placeholder="Seu nome" value={formComprador.nome} onChange={e => setFormComprador(p => ({ ...p, nome: e.target.value }))} style={inputCls} /></div>
                <div><label style={labelCls}>WhatsApp *</label><input required placeholder="(00) 00000-0000" value={formComprador.whatsapp} onChange={e => setFormComprador(p => ({ ...p, whatsapp: e.target.value }))} style={inputCls} /></div>
              </div>
              <div><label style={labelCls}>E-mail</label><input type="email" placeholder="seu@email.com" value={formComprador.email} onChange={e => setFormComprador(p => ({ ...p, email: e.target.value }))} style={inputCls} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div><label style={labelCls}>Quero</label><select value={formComprador.tipo_negocio} onChange={e => setFormComprador(p => ({ ...p, tipo_negocio: e.target.value }))} style={inputCls}><option value="Comprar">Comprar</option><option value="Alugar">Alugar</option></select></div>
                <div><label style={labelCls}>Tipo de imóvel</label><select value={formComprador.tipo_imovel} onChange={e => setFormComprador(p => ({ ...p, tipo_imovel: e.target.value }))} style={inputCls}>{TIPO_IMOVEL_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div><label style={labelCls}>Cidade *</label><input required placeholder="Cidade desejada" value={formComprador.cidade} onChange={e => setFormComprador(p => ({ ...p, cidade: e.target.value }))} style={inputCls} /></div>
                <div><label style={labelCls}>Bairro de preferência</label><input placeholder="Bairro" value={formComprador.bairro_desejado} onChange={e => setFormComprador(p => ({ ...p, bairro_desejado: e.target.value }))} style={inputCls} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div><label style={labelCls}>Valor mínimo</label><input placeholder="R$ 300.000" value={formComprador.valor_min} onChange={e => setFormComprador(p => ({ ...p, valor_min: e.target.value }))} style={inputCls} /></div>
                <div><label style={labelCls}>Valor máximo</label><input placeholder="R$ 800.000" value={formComprador.valor_max} onChange={e => setFormComprador(p => ({ ...p, valor_max: e.target.value }))} style={inputCls} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div><label style={labelCls}>Quartos</label><select value={formComprador.quartos} onChange={e => setFormComprador(p => ({ ...p, quartos: e.target.value }))} style={inputCls}><option value="">Qualquer</option><option value="1">1 quarto</option><option value="2">2 quartos</option><option value="3">3 quartos</option><option value="4">4+ quartos</option></select></div>
                <div><label style={labelCls}>Tem pet?</label><select value={formComprador.tem_animal} onChange={e => setFormComprador(p => ({ ...p, tem_animal: e.target.value }))} style={inputCls}><option value="nao">Não</option><option value="sim">Sim</option></select></div>
              </div>
              <button type="submit" disabled={enviando} style={{ backgroundColor: '#C9A84C', color: '#0E0E0F', border: 'none', borderRadius: 4, padding: '14px', fontSize: 14, fontWeight: 700, cursor: enviando ? 'not-allowed' : 'pointer', opacity: enviando ? 0.7 : 1 }}>
                {enviando ? 'Enviando...' : 'Enviar solicitação'}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ backgroundColor: '#1A1A1A', padding: '32px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 13, color: 'rgba(240,237,230,0.5)', marginBottom: 8 }}>
          © {new Date().getFullYear()} {corretor.full_name}
          {corretor.creci && <> · CRECI {corretor.creci}</>}
        </div>
        <div style={{ fontSize: 12, color: 'rgba(240,237,230,0.3)' }}>
          Powered by <span style={{ color: '#C9A84C' }}>BID</span> — Balcão Imobiliário Digital ·{' '}
          <Link href="/privacidade" style={{ color: 'rgba(240,237,230,0.4)', textDecoration: 'none' }}>Privacidade</Link>
        </div>
      </footer>

      {/* ── WhatsApp float ── */}
      {whatsNum && (
        <a href={`https://wa.me/${whatsNum}`} target="_blank" rel="noreferrer"
          style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 50, backgroundColor: '#25D366', color: '#fff', width: 56, height: 56, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', boxShadow: '0 4px 20px rgba(37,211,102,0.4)' }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        </a>
      )}

      {/* ── Modal imóvel ── */}
      {imovelSelecionado && (
        <ModalImovel imovel={imovelSelecionado} corretor={corretor} onClose={() => setImovelSelecionado(null)} />
      )}
    </div>
  )
}

// ── Card Imóvel ──
function CardImovel({ imovel, onSelect }: { imovel: ImovelPublico; onSelect: () => void }) {
  const [hover, setHover] = useState(false)
  const img = imovel.image_urls?.[0] || null

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        backgroundColor: '#fff', borderRadius: 8,
        boxShadow: hover ? '0 12px 40px rgba(0,0,0,0.14)' : '0 2px 12px rgba(0,0,0,0.07)',
        overflow: 'hidden', cursor: 'pointer',
        transform: hover ? 'translateY(-4px)' : 'none',
        transition: 'all 0.25s',
        border: '1px solid #EAE7E1',
      }}
    >
      <div style={{ position: 'relative', height: 210, backgroundColor: '#F0EDE6', overflow: 'hidden' }}>
        {img ? (
          <Image src={img} alt={imovel.titulo} fill sizes="400px" style={{ objectFit: 'cover', transform: hover ? 'scale(1.05)' : 'scale(1)', transition: 'transform 0.4s' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9B9690', fontSize: 13 }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6M9 9h.01M15 9h.01" /></svg>
          </div>
        )}
        <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6 }}>
          {imovel.lancamento && <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 3, backgroundColor: '#C9A84C', color: '#0E0E0F', fontWeight: 700, textTransform: 'uppercase' }}>Lançamento</span>}
          <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 3, backgroundColor: imovel.tipo_negocio === 'Venda' ? '#1A1A1A' : '#2E7D52', color: '#fff', fontWeight: 600 }}>
            {imovel.tipo_negocio === 'Locacao' ? 'Aluguel' : 'Venda'}
          </span>
        </div>
      </div>
      <div style={{ padding: '16px 18px' }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#C9A84C', marginBottom: 4 }}>{formatCurrency(imovel.valor)}{imovel.tipo_negocio === 'Locacao' && <span style={{ fontSize: 12, fontWeight: 400, color: '#9B9690' }}>/mês</span>}</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{imovel.titulo}</div>
        <div style={{ fontSize: 12, color: '#9B9690', marginBottom: 12 }}>{[imovel.bairro, imovel.cidade].filter(Boolean).join(', ')}</div>
        <div style={{ display: 'flex', gap: 14, borderTop: '1px solid #F0EDE6', paddingTop: 10 }}>
          {imovel.quartos > 0 && <span style={{ fontSize: 12, color: '#6B6560' }}>🛏 {imovel.quartos} qto{imovel.quartos > 1 ? 's' : ''}</span>}
          {imovel.banheiros > 0 && <span style={{ fontSize: 12, color: '#6B6560' }}>🚿 {imovel.banheiros}</span>}
          {imovel.vagas > 0 && <span style={{ fontSize: 12, color: '#6B6560' }}>🚗 {imovel.vagas}</span>}
          {imovel.area_total && <span style={{ fontSize: 12, color: '#6B6560' }}>📐 {imovel.area_total}m²</span>}
        </div>
      </div>
    </div>
  )
}

// ── Modal Imóvel ──
function ModalImovel({ imovel, corretor, onClose }: { imovel: ImovelPublico; corretor: CorretorPublico; onClose: () => void }) {
  const [idx, setIdx] = useState(0)
  const imgs = imovel.image_urls || []
  const whatsNum = corretor.phone ? `55${corretor.phone.replace(/\D/g, '')}` : null

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 200, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ backgroundColor: '#fff', borderRadius: 10, maxWidth: 860, width: '100%', maxHeight: '92vh', overflow: 'auto' }}>
        {/* Galeria */}
        <div style={{ position: 'relative', height: 340, backgroundColor: '#F0EDE6' }}>
          {imgs.length > 0 ? (
            <Image src={imgs[idx]} alt={imovel.titulo} fill sizes="860px" style={{ objectFit: 'cover' }} priority />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9B9690' }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6M9 9h.01M15 9h.01" /></svg>
            </div>
          )}
          {imgs.length > 1 && (
            <>
              <button onClick={() => setIdx((idx - 1 + imgs.length) % imgs.length)} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer' }}>‹</button>
              <button onClick={() => setIdx((idx + 1) % imgs.length)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer' }}>›</button>
              <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6 }}>
                {imgs.map((_, i) => <button key={i} onClick={() => setIdx(i)} style={{ width: 8, height: 8, borderRadius: '50%', border: 'none', cursor: 'pointer', backgroundColor: i === idx ? '#C9A84C' : 'rgba(255,255,255,0.5)' }} />)}
              </div>
            </>
          )}
          <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 12, width: 34, height: 34, borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
          <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 6 }}>
            {imovel.lancamento && <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 3, backgroundColor: '#C9A84C', color: '#0E0E0F', fontWeight: 700 }}>Lançamento</span>}
            <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 3, backgroundColor: imovel.tipo_negocio === 'Venda' ? '#1A1A1A' : '#2E7D52', color: '#fff', fontWeight: 600 }}>{imovel.tipo_negocio === 'Locacao' ? 'Aluguel' : 'Venda'}</span>
          </div>
        </div>

        <div style={{ padding: '28px 32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-serif, Georgia, serif)', fontSize: 22, fontWeight: 700, color: '#1A1A1A', margin: '0 0 6px' }}>{imovel.titulo}</h2>
              <p style={{ fontSize: 13, color: '#9B9690', margin: 0 }}>{[imovel.bairro, imovel.cidade].filter(Boolean).join(', ')} · {imovel.tipo_imovel}</p>
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#C9A84C' }}>
              {formatCurrency(imovel.valor)}{imovel.tipo_negocio === 'Locacao' && <span style={{ fontSize: 13, fontWeight: 400, color: '#9B9690' }}>/mês</span>}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 20, padding: '16px 20px', backgroundColor: '#F8F7F5', borderRadius: 6, marginBottom: 24, flexWrap: 'wrap' }}>
            {imovel.quartos > 0 && <div style={{ textAlign: 'center' }}><div style={{ fontWeight: 700, fontSize: 20, color: '#1A1A1A' }}>{imovel.quartos}</div><div style={{ fontSize: 11, color: '#9B9690' }}>Quartos</div></div>}
            {imovel.banheiros > 0 && <div style={{ textAlign: 'center' }}><div style={{ fontWeight: 700, fontSize: 20, color: '#1A1A1A' }}>{imovel.banheiros}</div><div style={{ fontSize: 11, color: '#9B9690' }}>Banheiros</div></div>}
            {imovel.vagas > 0 && <div style={{ textAlign: 'center' }}><div style={{ fontWeight: 700, fontSize: 20, color: '#1A1A1A' }}>{imovel.vagas}</div><div style={{ fontSize: 11, color: '#9B9690' }}>Vagas</div></div>}
            {imovel.area_total && <div style={{ textAlign: 'center' }}><div style={{ fontWeight: 700, fontSize: 20, color: '#1A1A1A' }}>{imovel.area_total}</div><div style={{ fontSize: 11, color: '#9B9690' }}>m²</div></div>}
            {imovel.aceita_animal && <div style={{ textAlign: 'center' }}><div style={{ fontWeight: 700, fontSize: 20, color: '#2E7D52' }}>✓</div><div style={{ fontSize: 11, color: '#9B9690' }}>Aceita pet</div></div>}
          </div>

          {whatsNum ? (
            <a href={`https://wa.me/${whatsNum}?text=${encodeURIComponent(`Olá ${corretor.full_name}! Tenho interesse no imóvel: ${imovel.titulo} — ${formatCurrency(imovel.valor)}`)}`} target="_blank" rel="noreferrer"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#25D366', color: '#fff', padding: '14px', borderRadius: 6, fontSize: 14, fontWeight: 700, textDecoration: 'none', width: '100%' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Tenho interesse neste imóvel
            </a>
          ) : (
            <button onClick={onClose} style={{ width: '100%', padding: 14, borderRadius: 6, border: '1px solid #EAE7E1', backgroundColor: '#F8F7F5', cursor: 'pointer', fontSize: 14, color: '#6B6560' }}>Fechar</button>
          )}
        </div>
      </div>
    </div>
  )
}
