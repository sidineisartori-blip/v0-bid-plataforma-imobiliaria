'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

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
  { value: '01', label: 'Noir Luxo' },
  { value: '02', label: 'Branco Premium' },
  { value: '03', label: 'Urbano Bold' },
]

export default function SiteConfigClient({
  corretor: corretorInicial,
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
  const [copiado, setCopiado] = useState<string | null>(null)
  const [erro, setErro] = useState('')
  const [abaAtiva, setAbaAtiva] = useState<'config' | 'share' | 'embed'>('config')

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bid.app.br'
  const linkPublico = `${baseUrl}/corretor/${slug}`
  const embedCode = `<iframe src="${linkPublico}?embed=true" width="100%" height="600" frameborder="0" style="border-radius:8px;"></iframe>`

  async function handleSalvar() {
    if (!slug.trim()) { setErro('O slug não pode ser vazio.'); return }
    if (!/^[a-z0-9-]{3,50}$/.test(slug)) {
      setErro('O slug deve ter entre 3 e 50 caracteres e conter apenas letras minúsculas, números e hífens.')
      return
    }
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

  function handleCopiar(texto: string, tipo: string) {
    navigator.clipboard.writeText(texto)
    setCopiado(tipo)
    setTimeout(() => setCopiado(null), 2500)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: '#181819',
    border: '1px solid #2E2E30',
    borderRadius: '2px',
    padding: '12px 14px',
    fontSize: '14px',
    color: '#F0EDE6',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#9B9690',
    letterSpacing: '0.04em',
    textTransform: 'uppercase' as const,
    marginBottom: '8px',
    display: 'block',
    fontWeight: 500,
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '12px 8px',
    backgroundColor: active ? 'rgba(201,168,76,0.1)' : 'transparent',
    border: 'none',
    borderBottom: active ? '2px solid #C9A84C' : '2px solid transparent',
    color: active ? '#C9A84C' : '#9B9690',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    letterSpacing: '0.03em',
  })

  return (
    <div style={{ 
      padding: '16px', 
      minHeight: '100%',
      maxWidth: '600px',
      margin: '0 auto',
    }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ 
          fontFamily: 'var(--font-serif, serif)', 
          fontSize: '22px', 
          fontWeight: 700, 
          color: '#F0EDE6', 
          margin: '0 0 6px' 
        }}>
          Meu Site
        </h1>
        <p style={{ fontSize: '13px', color: '#9B9690', margin: 0, lineHeight: 1.5 }}>
          Configure e compartilhe sua pagina publica de corretor.
        </p>
      </div>

      {/* Status Card */}
      <div style={{
        backgroundColor: status === 'Ativa' ? 'rgba(92,184,138,0.08)' : 'rgba(224,92,92,0.08)',
        border: `1px solid ${status === 'Ativa' ? 'rgba(92,184,138,0.25)' : 'rgba(224,92,92,0.25)'}`,
        borderRadius: '2px',
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '10px', height: '10px', borderRadius: '50%',
            backgroundColor: status === 'Ativa' ? '#5CB88A' : '#E05C5C',
          }} />
          <div>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#F0EDE6', margin: 0 }}>
              {status === 'Ativa' ? 'Site ativo' : 'Site pausado'}
            </p>
          </div>
        </div>
        <a
          href={`/corretor/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: '12px',
            color: '#C9A84C',
            textDecoration: 'none',
            fontWeight: 500,
          }}
        >
          Visualizar
        </a>
      </div>

      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        borderBottom: '1px solid #232324',
        marginBottom: '20px',
      }}>
        <button style={tabStyle(abaAtiva === 'config')} onClick={() => setAbaAtiva('config')}>
          Configuracoes
        </button>
        <button style={tabStyle(abaAtiva === 'share')} onClick={() => setAbaAtiva('share')}>
          Compartilhar
        </button>
        <button style={tabStyle(abaAtiva === 'embed')} onClick={() => setAbaAtiva('embed')}>
          Incorporar
        </button>
      </div>

      {/* Tab: Configuracoes */}
      {abaAtiva === 'config' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Slug */}
          <div>
            <label style={labelStyle}>Link publico</label>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center',
              backgroundColor: '#181819',
              border: '1px solid #2E2E30',
              borderRadius: '2px',
              overflow: 'hidden',
            }}>
              <span style={{ 
                padding: '12px', 
                fontSize: '13px', 
                color: '#9B9690', 
                backgroundColor: '#141415',
                borderRight: '1px solid #2E2E30',
                whiteSpace: 'nowrap',
              }}>
                ${baseUrl.replace('https://','')}/corretor/
              </span>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                style={{ 
                  ...inputStyle, 
                  border: 'none',
                  borderRadius: 0,
                }}
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
            <label style={labelStyle}>Texto de apresentacao</label>
            <textarea
              value={boasVindas}
              onChange={(e) => setBoasVindas(e.target.value)}
              rows={4}
              placeholder="Ex: Ola! Sou especialista em imoveis de alto padrao na regiao..."
              style={{ ...inputStyle, resize: 'vertical', minHeight: '100px' }}
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
              <option value="Ativa">Ativa - visivel para todos</option>
              <option value="Pausada">Pausada - apenas previa</option>
            </select>
          </div>

          {erro && (
            <p style={{ 
              fontSize: '13px', 
              color: '#E05C5C', 
              backgroundColor: 'rgba(224,92,92,0.08)', 
              padding: '12px 14px', 
              borderRadius: '2px', 
              margin: 0 
            }}>
              {erro}
            </p>
          )}

          {/* Botao Salvar */}
          <button
            onClick={handleSalvar}
            disabled={salvando}
            style={{ 
              backgroundColor: salvando ? '#a08840' : '#C9A84C', 
              color: '#0E0E0F', 
              border: 'none', 
              borderRadius: '2px', 
              padding: '14px', 
              fontSize: '14px', 
              fontWeight: 600, 
              cursor: salvando ? 'not-allowed' : 'pointer', 
              width: '100%',
              marginTop: '8px',
            }}
          >
            {salvando ? 'Salvando...' : 'Salvar alteracoes'}
          </button>
        </div>
      )}

      {/* Tab: Compartilhar */}
      {abaAtiva === 'share' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Link */}
          <div>
            <label style={labelStyle}>Link do seu site</label>
            <div style={{ 
              display: 'flex', 
              gap: '8px',
              flexDirection: 'column',
            }}>
              <input
                value={linkPublico}
                readOnly
                style={{ ...inputStyle, backgroundColor: '#141415', color: '#9B9690' }}
              />
              <button
                onClick={() => handleCopiar(linkPublico, 'link')}
                style={{ 
                  backgroundColor: copiado === 'link' ? 'rgba(92,184,138,0.15)' : 'rgba(201,168,76,0.1)', 
                  color: copiado === 'link' ? '#5CB88A' : '#C9A84C', 
                  border: `1px solid ${copiado === 'link' ? 'rgba(92,184,138,0.3)' : 'rgba(201,168,76,0.3)'}`, 
                  borderRadius: '2px', 
                  padding: '12px', 
                  fontSize: '13px', 
                  fontWeight: 600, 
                  cursor: 'pointer', 
                  width: '100%',
                }}
              >
                {copiado === 'link' ? 'Link copiado!' : 'Copiar link'}
              </button>
            </div>
          </div>

          {/* QR Code placeholder */}
          <div style={{
            backgroundColor: '#141415',
            border: '1px solid #232324',
            borderRadius: '2px',
            padding: '24px',
            textAlign: 'center',
          }}>
            <div style={{
              width: '140px',
              height: '140px',
              backgroundColor: '#F0EDE6',
              margin: '0 auto 16px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              color: '#0E0E0F',
              fontWeight: 600,
            }}>
              QR CODE
            </div>
            <p style={{ fontSize: '12px', color: '#9B9690', margin: 0 }}>
              Escaneie para acessar seu site
            </p>
          </div>

          {/* Redes Sociais */}
          <div>
            <label style={labelStyle}>Compartilhar nas redes</label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {[
                { nome: 'WhatsApp', cor: '#25D366', url: `https://wa.me/?text=${encodeURIComponent(`Confira meu catalogo de imoveis: ${linkPublico}`)}` },
                { nome: 'Facebook', cor: '#1877F2', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(linkPublico)}` },
                { nome: 'LinkedIn', cor: '#0A66C2', url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(linkPublico)}` },
                { nome: 'X', cor: '#000000', url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(linkPublico)}&text=${encodeURIComponent('Confira meu catalogo de imoveis!')}` },
              ].map((rede) => (
                <a
                  key={rede.nome}
                  href={rede.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: '1 1 calc(50% - 5px)',
                    minWidth: '120px',
                    padding: '12px',
                    backgroundColor: rede.cor,
                    color: '#fff',
                    borderRadius: '2px',
                    fontSize: '13px',
                    fontWeight: 600,
                    textAlign: 'center',
                    textDecoration: 'none',
                  }}
                >
                  {rede.nome}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Incorporar */}
      {abaAtiva === 'embed' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{
            backgroundColor: 'rgba(201,168,76,0.05)',
            border: '1px solid rgba(201,168,76,0.15)',
            borderRadius: '2px',
            padding: '14px 16px',
          }}>
            <p style={{ fontSize: '13px', color: '#F0EDE6', margin: '0 0 4px', fontWeight: 500 }}>
              Incorpore seu catalogo em outros sites
            </p>
            <p style={{ fontSize: '12px', color: '#9B9690', margin: 0, lineHeight: 1.5 }}>
              Cole o codigo abaixo no HTML de qualquer pagina para exibir seu catalogo de imoveis.
            </p>
          </div>

          {/* Codigo iframe */}
          <div>
            <label style={labelStyle}>Codigo HTML (iframe)</label>
            <textarea
              value={embedCode}
              readOnly
              rows={4}
              style={{ 
                ...inputStyle, 
                backgroundColor: '#141415', 
                color: '#9B9690',
                fontFamily: 'monospace',
                fontSize: '12px',
                lineHeight: 1.5,
              }}
            />
            <button
              onClick={() => handleCopiar(embedCode, 'iframe')}
              style={{ 
                backgroundColor: copiado === 'iframe' ? 'rgba(92,184,138,0.15)' : 'rgba(201,168,76,0.1)', 
                color: copiado === 'iframe' ? '#5CB88A' : '#C9A84C', 
                border: `1px solid ${copiado === 'iframe' ? 'rgba(92,184,138,0.3)' : 'rgba(201,168,76,0.3)'}`, 
                borderRadius: '2px', 
                padding: '12px', 
                fontSize: '13px', 
                fontWeight: 600, 
                cursor: 'pointer', 
                width: '100%',
                marginTop: '10px',
              }}
            >
              {copiado === 'iframe' ? 'Codigo copiado!' : 'Copiar codigo'}
            </button>
          </div>

          {/* Link direto */}
          <div>
            <label style={labelStyle}>Link direto para catalogo</label>
            <input
              value={`${linkPublico}?embed=true`}
              readOnly
              style={{ ...inputStyle, backgroundColor: '#141415', color: '#9B9690', fontSize: '13px' }}
            />
            <button
              onClick={() => handleCopiar(`${linkPublico}?embed=true`, 'embedlink')}
              style={{ 
                backgroundColor: copiado === 'embedlink' ? 'rgba(92,184,138,0.15)' : 'transparent', 
                color: copiado === 'embedlink' ? '#5CB88A' : '#9B9690', 
                border: '1px solid rgba(155,150,144,0.2)', 
                borderRadius: '2px', 
                padding: '12px', 
                fontSize: '13px', 
                fontWeight: 500, 
                cursor: 'pointer', 
                width: '100%',
                marginTop: '10px',
              }}
            >
              {copiado === 'embedlink' ? 'Link copiado!' : 'Copiar link'}
            </button>
          </div>

          {/* Instrucoes */}
          <div style={{
            backgroundColor: '#141415',
            border: '1px solid #232324',
            borderRadius: '2px',
            padding: '16px',
          }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: '#C9A84C', margin: '0 0 10px' }}>
              Como usar
            </p>
            <ol style={{ 
              fontSize: '12px', 
              color: '#9B9690', 
              margin: 0, 
              paddingLeft: '18px', 
              lineHeight: 1.7 
            }}>
              <li>Copie o codigo HTML acima</li>
              <li>Cole no editor HTML do seu site ou landing page</li>
              <li>Ajuste width e height conforme necessario</li>
              <li>Publique e pronto!</li>
            </ol>
          </div>
        </div>
      )}

      {/* Rodape Info */}
      <div style={{
        backgroundColor: 'rgba(201,168,76,0.04)',
        border: '1px solid rgba(201,168,76,0.1)',
        borderRadius: '2px',
        padding: '16px',
        marginTop: '28px',
      }}>
        <p style={{ fontSize: '12px', fontWeight: 600, color: '#C9A84C', margin: '0 0 10px' }}>
          O que os visitantes podem fazer?
        </p>
        <ul style={{ fontSize: '12px', color: '#9B9690', margin: 0, paddingLeft: '16px', lineHeight: 1.7 }}>
          <li>Ver seu catalogo completo de imoveis</li>
          <li>Enviar solicitacoes de busca personalizadas</li>
          <li>Proprietarios podem cadastrar imoveis para voce vender</li>
          <li>Contato direto via WhatsApp</li>
        </ul>
      </div>
    </div>
  )
}
