'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

interface ChamadoProprietario {
  id: string
  titulo: string
  descricao: string
  categoria: string
  urgencia: string
  status: string
  midia_urls: string[]
  created_at: string
  aberto_por: string
  aberto_por_nome: string | null
  contrato: {
    cliente_nome: string
    imovel: { titulo: string; cidade: string; bairro: string | null } | null
  } | null
}

const URGENCIA_COR: Record<string, string> = {
  baixa: '#5CB88A', media: '#C9A84C', alta: '#e07a2f', urgente: '#E05C5C',
}

const CAT_LABEL: Record<string, string> = {
  hidraulica: 'Hidráulica', eletrica: 'Elétrica', estrutural: 'Estrutural',
  pintura: 'Pintura', limpeza: 'Limpeza', outro: 'Outro',
}

const C = {
  bg: '#0E0E0F',
  card: '#181819',
  border: '#2E2E30',
  gold: '#C9A84C',
  text: '#F0EDE6',
  muted: '#9B9690',
}

export default function PortalProprietario() {
  const { token } = useParams() as { token: string }
  const [chamado, setChamado]   = useState<ChamadoProprietario | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading]   = useState(true)
  const [comentario, setComentario] = useState('')
  const [agindo, setAgindo]     = useState<'aprovar' | 'recusar' | null>(null)
  const [resultado, setResultado] = useState<{ tipo: 'ok' | 'erro'; msg: string; acao?: string } | null>(null)

  useEffect(() => {
    fetch(`/api/portal/proprietario/${token}/autorizar`)
      .then(async (r) => {
        if (!r.ok) { setNotFound(true); return }
        setChamado(await r.json())
      })
      .finally(() => setLoading(false))
  }, [token])

  async function executar(acao: 'aprovar' | 'recusar') {
    if (acao === 'recusar' && !comentario.trim()) {
      alert('Por favor, informe o motivo da recusa.')
      return
    }
    setAgindo(acao)
    const res = await fetch(`/api/portal/proprietario/${token}/autorizar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acao, comentario: comentario.trim() }),
    })
    if (res.ok) {
      setResultado({
        tipo: 'ok',
        acao,
        msg: acao === 'aprovar'
          ? 'Chamado autorizado! O corretor será notificado e iniciará o serviço.'
          : 'Chamado recusado. O corretor foi informado.',
      })
    } else {
      const e = await res.json()
      setResultado({ tipo: 'erro', msg: e.error || 'Erro ao processar.' })
    }
    setAgindo(null)
  }

  const INP: React.CSSProperties = {
    background: '#141415', border: `1px solid ${C.border}`, borderRadius: 4,
    padding: '10px 12px', fontSize: 13, color: C.text, width: '100%', outline: 'none', boxSizing: 'border-box',
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: C.muted }}>Carregando...</p>
    </div>
  )

  if (notFound) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <p style={{ fontSize: 40, marginBottom: 16 }}>🔗</p>
        <h1 style={{ color: C.text, fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Link inválido</h1>
        <p style={{ color: C.muted, fontSize: 14 }}>Este link não existe, já foi utilizado ou expirou.</p>
      </div>
    </div>
  )

  // Chamado já processado (status ≠ aprovado_corretor)
  if (chamado && chamado.status !== 'aprovado_corretor') {
    const jaAutorizado = chamado.status === 'aprovado_proprietario' || chamado.status === 'em_execucao' || chamado.status === 'concluido'
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 440 }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>{jaAutorizado ? '✅' : '❌'}</p>
          <h1 style={{ color: C.text, fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
            {jaAutorizado ? 'Chamado já autorizado' : 'Chamado já recusado'}
          </h1>
          <p style={{ color: C.muted, fontSize: 14 }}>
            {jaAutorizado
              ? 'Este chamado já foi autorizado. O corretor está cuidando do serviço.'
              : 'Este chamado foi recusado. Fale com seu corretor para mais informações.'}
          </p>
        </div>
      </div>
    )
  }

  // Resultado após ação
  if (resultado?.tipo === 'ok') {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 440 }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>{resultado.acao === 'aprovar' ? '✅' : '❌'}</p>
          <h1 style={{ color: C.text, fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
            {resultado.acao === 'aprovar' ? 'Autorizado com sucesso!' : 'Chamado recusado'}
          </h1>
          <p style={{ color: C.muted, fontSize: 14 }}>{resultado.msg}</p>
        </div>
      </div>
    )
  }

  const urgCor = URGENCIA_COR[chamado?.urgencia || 'media'] || C.muted

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 18, color: C.gold, letterSpacing: 2 }}>BID</div>
        <div style={{ width: 1, height: 20, background: C.border }} />
        <div style={{ fontSize: 13, color: C.muted }}>Autorização de Chamado</div>
      </div>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '32px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Info do imóvel */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: '20px' }}>
          <p style={{ fontSize: 11, color: C.gold, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Seu Imóvel</p>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 4 }}>
            {chamado?.contrato?.imovel?.titulo || 'Imóvel'}
          </h2>
          {chamado?.contrato?.imovel && (
            <p style={{ fontSize: 13, color: C.muted }}>
              {[chamado.contrato.imovel.bairro, chamado.contrato.imovel.cidade].filter(Boolean).join(' · ')}
            </p>
          )}
          {chamado?.contrato?.cliente_nome && (
            <p style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>Inquilino: {chamado.contrato.cliente_nome}</p>
          )}
        </div>

        {/* Detalhes do chamado */}
        <div style={{ background: C.card, border: `1px solid rgba(201,168,76,0.2)`, borderRadius: 8, padding: '20px' }}>
          <p style={{ fontSize: 11, color: C.gold, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Chamado de Serviço</p>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{chamado?.titulo}</span>
            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: `${urgCor}22`, color: urgCor, fontWeight: 600 }}>
              {chamado?.urgencia?.toUpperCase()}
            </span>
          </div>

          <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, marginBottom: 12 }}>{chamado?.descricao}</p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: C.muted }}>Categoria: {CAT_LABEL[chamado?.categoria || ''] || chamado?.categoria}</span>
            {chamado?.aberto_por_nome && (
              <span style={{ fontSize: 12, color: C.muted }}>Aberto por: {chamado.aberto_por_nome}</span>
            )}
            {chamado?.created_at && (
              <span style={{ fontSize: 12, color: C.muted }}>
                {new Date(chamado.created_at).toLocaleDateString('pt-BR')}
              </span>
            )}
          </div>

          {/* Fotos */}
          {chamado?.midia_urls && chamado.midia_urls.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
              {chamado.midia_urls.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                  <img src={url} alt="" style={{ width: 88, height: 88, objectFit: 'cover', borderRadius: 6, border: `1px solid ${C.border}` }} />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Ações */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Sua decisão</p>
          <p style={{ fontSize: 13, color: C.muted }}>Ao autorizar, o corretor poderá iniciar o serviço. Ao recusar, o corretor será informado e o chamado será encerrado.</p>

          <div>
            <label style={{ display: 'block', fontSize: 11, color: C.muted, marginBottom: 6 }}>COMENTÁRIO (obrigatório para recusar)</label>
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              rows={2}
              style={{ ...INP, resize: 'vertical' }}
              placeholder="Observações sobre a autorização ou motivo da recusa..."
            />
          </div>

          {resultado?.tipo === 'erro' && (
            <p style={{ fontSize: 12, color: '#E05C5C' }}>{resultado.msg}</p>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button
              onClick={() => executar('recusar')}
              disabled={!!agindo}
              style={{ background: 'rgba(224,92,92,0.1)', border: '1px solid rgba(224,92,92,0.3)', borderRadius: 6, padding: '13px', fontSize: 14, fontWeight: 600, color: '#E05C5C', cursor: agindo ? 'default' : 'pointer', opacity: agindo === 'aprovar' ? 0.4 : 1 }}
            >
              {agindo === 'recusar' ? 'Recusando...' : '✕ Recusar'}
            </button>
            <button
              onClick={() => executar('aprovar')}
              disabled={!!agindo}
              style={{ background: agindo ? 'rgba(92,184,138,0.5)' : '#5CB88A', border: 'none', borderRadius: 6, padding: '13px', fontSize: 14, fontWeight: 700, color: '#0E0E0F', cursor: agindo ? 'default' : 'pointer', opacity: agindo === 'recusar' ? 0.4 : 1 }}
            >
              {agindo === 'aprovar' ? 'Autorizando...' : '✓ Autorizar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
