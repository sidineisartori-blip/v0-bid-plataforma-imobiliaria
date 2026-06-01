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
      <div style={{ width: '340px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
        <div>
          <p style={{ fontFamily: 'var(--font-serif, serif)', fontSize: '18px', fontWeight: 700, color: '#F0EDE6', margin: '0 0 4px' }}>
            Configurar Site
          </p>
          <p style={{ fontSize: '12px', color: '#9B9690', margin: 0 }}>
            Personalize sua pagina publica de corretor.
          </p>
        </div>

        {/* Slug */}
        <div>
          <label style={labelStyle}>Link publico</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#9B9690', userSelect: 'none' }}>
              bid.app.br/corretor/
            </span>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              style={{ ...inputStyle, paddingLeft: '160px' }}
              placeholder="seu-nome"
            />
          </div>
          <p style={{ fontSize: '11px', color: '#9B9690', marginTop: '6px' }}>
            {linkPublico}
          </p>
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
          <label style={labelStyle}>Texto de boas-vindas</label>
          <textarea
            value={boasVindas}
            onChange={(e) => setBoasVindas(e.target.value)}
            rows={4}
            placeholder="Ola! Sou especialista em imoveis na sua regiao..."
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>

        {/* Status */}
        <div>
          <label style={labelStyle}>Status da pagina</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            <option value="Ativa">Ativa</option>
            <option value="Pausada">Pausada</option>
          </select>
        </div>

        {erro && (
          <p style={{ fontSize: '12px', color: '#E05C5C', backgroundColor: 'rgba(224,92,92,0.08)', padding: '8px 12px', borderRadius: '2px', margin: 0 }}>
            {erro}
          </p>
        )}

        {/* Botoes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={handleSalvar}
            disabled={salvando}
            style={{ backgroundColor: '#C9A84C', color: '#0E0E0F', border: 'none', borderRadius: '2px', padding: '11px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', width: '100%' }}
          >
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
          <button
            onClick={handleCopiarLink}
            style={{ backgroundColor: 'transparent', color: copiado ? '#5CB88A' : '#C9A84C', border: '1px solid rgba(201,168,76,0.3)', borderRadius: '2px', padding: '10px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', width: '100%' }}
          >
            {copiado ? 'Link copiado!' : 'Copiar link'}
          </button>
        </div>
      </div>

      {/* PREVIA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <p style={{ fontSize: '11px', color: '#9B9690', marginBottom: '12px', letterSpacing: '0.05em' }}>
          Previa — {MODELOS.find((m) => m.value === modelo)?.label}
        </p>
        <div style={{
          flex: 1,
          border: '1px solid rgba(201,168,76,0.1)',
          borderRadius: '2px',
          overflow: 'hidden',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            transform: 'scale(0.6)',
            transformOrigin: 'top left',
            width: '167%',
            height: '167%',
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
