'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import SiteCorretorPublico from './SiteCorretorPublico'

interface CorretorConfig {
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
  phone: string | null
  site_ativo: boolean
  site_boas_vindas: string | null
  site_modelo: string | null
  slug: string
}

interface ImovelPrevia {
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

const MODELOS = [
  { value: '01', label: '01 · Noir Luxo' },
  { value: '02', label: '02 · Branco Premium' },
  { value: '03', label: '03 · Urbano Bold' },
  { value: '04', label: '04 · Terra & Natureza' },
  { value: '05', label: '05 · Tech Futurista' },
]

const inputStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: '#181819',
  border: '1px solid #232324',
  borderRadius: '2px',
  padding: '9px 12px',
  fontSize: '13px',
  color: '#F0EDE6',
  outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#9B9690',
  letterSpacing: '0.05em',
  textTransform: 'uppercase' as const,
  marginBottom: '6px',
  display: 'block',
}

export default function SiteConfigClient({
  corretor: corretorInicial,
  imoveisPrevia,
}: {
  corretor: CorretorConfig
  imoveisPrevia: ImovelPrevia[]
}) {
  const supabase = createClient()
  const router = useRouter()

  const [slug, setSlug] = useState(corretorInicial.slug || '')
  const [modelo, setModelo] = useState(corretorInicial.site_modelo || '01')
  const [boasVindas, setBoasVindas] = useState(corretorInicial.site_boas_vindas || '')
  const [status, setStatus] = useState(corretorInicial.site_ativo ? 'Ativa' : 'Pausada')
  const [salvando, setSalvando] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const [erro, setErro] = useState('')

  const linkPublico = `bid.app.br/corretor/${slug}`

  const corretorPrevia = {
    ...corretorInicial,
    site_boas_vindas: boasVindas,
    site_modelo: modelo,
  }

  async function handleSalvar() {
    if (!slug.trim()) { setErro('O slug nao pode ser vazio.'); return }
    setSalvando(true)
    setErro('')

    const { error } = await supabase
      .from('corretores')
      .update({
        site_slug_custom: slug,
        site_ativo: status === 'Ativa',
        site_boas_vindas: boasVindas,
        site_modelo: modelo,
      })
      .eq('id', corretorInicial.id)

    setSalvando(false)
    if (error) {
      setErro('Erro ao salvar: ' + error.message)
    } else {
      router.refresh()
    }
  }

  function handleCopiarLink() {
    navigator.clipboard.writeText(`https://${linkPublico}`)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div style={{ padding: '32px', display: 'flex', gap: '28px', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>

      {/* CONFIGURACOES */}
      <div style={{ width: '360px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto' }}>
        <div>
          <p style={{ fontFamily: 'var(--font-serif, serif)', fontSize: '20px', fontWeight: 700, color: '#F0EDE6', margin: '0 0 8px' }}>
            Meu Site
          </p>
          <p style={{ fontSize: '13px', color: '#9B9690', margin: 0, lineHeight: 1.5 }}>
            Configure sua página pública para receber solicitações de compradores e cadastros de proprietários.
          </p>
        </div>

        {/* Status card */}
        <div style={{
          backgroundColor: status === 'Ativa' ? 'rgba(92,184,138,0.08)' : 'rgba(224,92,92,0.08)',
          border: `1px solid ${status === 'Ativa' ? 'rgba(92,184,138,0.2)' : 'rgba(224,92,92,0.2)'}`,
          borderRadius: '2px',
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <div style={{
            width: '10px', height: '10px', borderRadius: '50%',
            backgroundColor: status === 'Ativa' ? '#5CB88A' : '#E05C5C',
          }} />
          <div>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#F0EDE6', margin: '0 0 2px' }}>
              {status === 'Ativa' ? 'Site ativo' : 'Site pausado'}
            </p>
            <p style={{ fontSize: '11px', color: '#9B9690', margin: 0 }}>
              {status === 'Ativa' ? 'Visível para todos' : 'Apenas você pode ver'}
            </p>
          </div>
        </div>

        {/* Slug */}
        <div>
          <label style={labelStyle}>Link público</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#9B9690', userSelect: 'none' }}>
              bid.app.br/corretor/
            </span>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              style={{ ...inputStyle, paddingLeft: '150px' }}
              placeholder="seu-nome"
            />
          </div>
        </div>

        {/* Modelo */}
        <div>
          <label style={labelStyle}>Modelo visual</label>
          <select
            value={modelo}
            onChange={(e) => setModelo(e.target.value)}
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            {MODELOS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        {/* Boas-vindas */}
        <div>
          <label style={labelStyle}>Texto de apresentação</label>
          <textarea
            value={boasVindas}
            onChange={(e) => setBoasVindas(e.target.value)}
            rows={4}
            placeholder="Ex: Olá! Sou especialista em imóveis de alto padrão na região..."
            style={{ ...inputStyle, resize: 'vertical' }}
          />
          <p style={{ fontSize: '11px', color: '#9B9690', marginTop: '6px' }}>
            Este texto aparece no hero do seu site.
          </p>
        </div>

        {/* Status */}
        <div>
          <label style={labelStyle}>Status da página</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            <option value="Ativa">Ativa — visível para todos</option>
            <option value="Pausada">Pausada — apenas prévia</option>
          </select>
        </div>

        {erro && (
          <p style={{ fontSize: '12px', color: '#E05C5C', backgroundColor: 'rgba(224,92,92,0.08)', padding: '10px 14px', borderRadius: '2px', margin: 0 }}>
            {erro}
          </p>
        )}

        {/* Botoes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
          <button
            onClick={handleSalvar}
            disabled={salvando}
            style={{ 
              backgroundColor: salvando ? '#a08840' : '#C9A84C', 
              color: '#0E0E0F', 
              border: 'none', 
              borderRadius: '2px', 
              padding: '13px', 
              fontSize: '13px', 
              fontWeight: 600, 
              cursor: salvando ? 'not-allowed' : 'pointer', 
              width: '100%' 
            }}
          >
            {salvando ? 'Salvando...' : 'Salvar alterações'}
          </button>
          <button
            onClick={handleCopiarLink}
            style={{ 
              backgroundColor: 'transparent', 
              color: copiado ? '#5CB88A' : '#C9A84C', 
              border: '1px solid rgba(201,168,76,0.3)', 
              borderRadius: '2px', 
              padding: '12px', 
              fontSize: '13px', 
              fontWeight: 500, 
              cursor: 'pointer', 
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {copiado ? '✓ Link copiado!' : '📋 Copiar link do site'}
          </button>
          <a
            href={`/corretor/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ 
              backgroundColor: 'transparent', 
              color: '#9B9690', 
              border: '1px solid rgba(155,150,144,0.2)', 
              borderRadius: '2px', 
              padding: '12px', 
              fontSize: '13px', 
              fontWeight: 500, 
              cursor: 'pointer', 
              width: '100%',
              textAlign: 'center',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            ↗ Abrir site em nova aba
          </a>
        </div>

        {/* Info */}
        <div style={{
          backgroundColor: 'rgba(201,168,76,0.04)',
          border: '1px solid rgba(201,168,76,0.1)',
          borderRadius: '2px',
          padding: '16px',
          marginTop: '8px',
        }}>
          <p style={{ fontSize: '12px', fontWeight: 600, color: '#C9A84C', margin: '0 0 8px' }}>
            Como funciona?
          </p>
          <ul style={{ fontSize: '12px', color: '#9B9690', margin: 0, paddingLeft: '16px', lineHeight: 1.6 }}>
            <li>Proprietários podem cadastrar imóveis pelo formulário</li>
            <li>Compradores podem enviar solicitações de busca</li>
            <li>Você recebe tudo na sua área de Solicitações e Imóveis</li>
            <li>Compartilhe o link nas redes sociais!</li>
          </ul>
        </div>
      </div>

      {/* PRÉVIA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <p style={{ fontSize: '11px', color: '#9B9690', letterSpacing: '0.05em', margin: 0 }}>
            Prévia do site
          </p>
          <span style={{ fontSize: '10px', color: '#C9A84C', backgroundColor: 'rgba(201,168,76,0.1)', padding: '4px 10px', borderRadius: '2px' }}>
            {MODELOS.find((m) => m.value === modelo)?.label}
          </span>
        </div>
        <div style={{
          flex: 1,
          border: '1px solid rgba(201,168,76,0.1)',
          borderRadius: '2px',
          overflow: 'hidden',
          position: 'relative',
          backgroundColor: '#0E0E0F',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            transform: 'scale(0.55)',
            transformOrigin: 'top left',
            width: '182%',
            height: '182%',
            overflowY: 'auto',
            pointerEvents: 'none',
          }}>
            <SiteCorretorPublico corretor={corretorPrevia} imoveis={imoveisPrevia} />
          </div>
        </div>
      </div>
    </div>
  )
}
