'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'

interface ContratoPortal {
  id: string
  tipo: string
  status: string
  cliente_nome: string
  valor_aluguel: number | null
  dia_vencimento: number | null
  data_inicio: string | null
  data_fim: string | null
  imovel: { titulo: string; bairro: string | null; cidade: string; area_total: number | null; quartos: number | null } | null
}

interface ChamadoPortal {
  id: string
  titulo: string
  descricao: string
  categoria: string
  urgencia: string
  status: string
  midia_urls: string[]
  aberto_por: string
  created_at: string
}

interface VistoriaPortal {
  id: string
  tipo: 'entrada' | 'saida'
  status: string
  data_vistoria: string | null
  assinado_por_corretor_em: string | null
  assinado_por_inquilino_em: string | null
  created_at: string
}

const STATUS_MAP: Record<string, { label: string; cor: string }> = {
  aberto:                { label: 'Aguardando análise',     cor: '#C9A84C' },
  aprovado_corretor:     { label: 'Ag. proprietário',       cor: '#60a5fa' },
  aprovado_proprietario: { label: 'Autorizado',             cor: '#5CB88A' },
  em_execucao:           { label: 'Em execução',            cor: '#a78bfa' },
  concluido:             { label: 'Concluído',              cor: '#9B9690' },
  recusado:              { label: 'Recusado',               cor: '#E05C5C' },
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

export default function PortalInquilino() {
  const { token } = useParams() as { token: string }
  const [contrato, setContrato]   = useState<ContratoPortal | null>(null)
  const [chamados, setChamados]   = useState<ChamadoPortal[]>([])
  const [vistorias, setVistorias] = useState<VistoriaPortal[]>([])
  const [assinando, setAssinando] = useState<string | null>(null)
  const [notFound, setNotFound]   = useState(false)
  const [loading, setLoading]     = useState(true)
  const [abrindo, setAbrindo]     = useState(false)
  const [formulario, setFormulario] = useState(false)
  const [form, setForm] = useState({ titulo: '', descricao: '', categoria: 'outro', urgencia: 'media' })
  const [midiaUrls, setMidiaUrls] = useState<string[]>([])
  const [enviando, setEnviando]   = useState(false)
  const [msg, setMsg]             = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function init() {
      const [r1, r2, r3] = await Promise.all([
        fetch(`/api/portal/inquilino/${token}`),
        fetch(`/api/portal/inquilino/${token}/chamados`),
        fetch(`/api/portal/inquilino/${token}/vistorias`),
      ])
      if (!r1.ok) { setNotFound(true); setLoading(false); return }
      setContrato(await r1.json())
      if (r2.ok) setChamados(await r2.json())
      if (r3.ok) setVistorias(await r3.json())
      setLoading(false)
    }
    init()
  }, [token])

  async function assinarVistoria(vid: string) {
    setAssinando(vid)
    const res = await fetch(`/api/portal/inquilino/${token}/vistorias/${vid}/assinar`, { method: 'POST' })
    if (res.ok) {
      setVistorias((prev) => prev.map((v) => v.id === vid ? { ...v, assinado_por_inquilino_em: new Date().toISOString() } : v))
      setMsg({ tipo: 'ok', texto: 'Vistoria assinada com sucesso!' })
    } else {
      const e = await res.json()
      setMsg({ tipo: 'erro', texto: e.error || 'Erro ao assinar.' })
    }
    setAssinando(null)
  }

  async function uploadFotos(files: FileList) {
    setUploading(true)
    for (const file of Array.from(files)) {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`/api/portal/inquilino/${token}/upload`, { method: 'POST', body: fd })
      if (res.ok) {
        const { url } = await res.json()
        setMidiaUrls((p) => [...p, url])
      }
    }
    setUploading(false)
  }

  async function enviarChamado() {
    if (!form.titulo.trim() || !form.descricao.trim()) {
      setMsg({ tipo: 'erro', texto: 'Título e descrição são obrigatórios.' })
      return
    }
    setEnviando(true)
    const res = await fetch(`/api/portal/inquilino/${token}/chamados`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, midia_urls: midiaUrls }),
    })
    if (res.ok) {
      const novo = await res.json()
      setChamados((p) => [novo, ...p])
      setForm({ titulo: '', descricao: '', categoria: 'outro', urgencia: 'media' })
      setMidiaUrls([])
      setFormulario(false)
      setMsg({ tipo: 'ok', texto: 'Chamado enviado! O corretor será notificado.' })
    } else {
      const e = await res.json()
      setMsg({ tipo: 'erro', texto: e.error || 'Erro ao enviar.' })
    }
    setEnviando(false)
  }

  const INP: React.CSSProperties = { background: '#141415', border: `1px solid ${C.border}`, borderRadius: 4, padding: '10px 12px', fontSize: 13, color: C.text, width: '100%', outline: 'none', boxSizing: 'border-box' }
  const BTN: React.CSSProperties = { background: C.gold, color: '#0E0E0F', border: 'none', borderRadius: 4, padding: '12px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer', width: '100%' }

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
        <p style={{ color: C.muted, fontSize: 14 }}>Este link não existe ou expirou. Entre em contato com seu corretor para obter um novo link.</p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 18, color: C.gold, letterSpacing: 2 }}>BID</div>
        <div style={{ width: 1, height: 20, background: C.border }} />
        <div style={{ fontSize: 13, color: C.muted }}>Portal do Inquilino</div>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Mensagem de feedback */}
        {msg && (
          <div style={{ background: msg.tipo === 'ok' ? 'rgba(92,184,138,0.12)' : 'rgba(224,92,92,0.12)', border: `1px solid ${msg.tipo === 'ok' ? 'rgba(92,184,138,0.3)' : 'rgba(224,92,92,0.3)'}`, borderRadius: 4, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: 13, color: msg.tipo === 'ok' ? '#5CB88A' : '#E05C5C', margin: 0 }}>{msg.texto}</p>
            <button onClick={() => setMsg(null)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 16 }}>×</button>
          </div>
        )}

        {/* Dados do contrato */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: '20px' }}>
          <p style={{ fontSize: 11, color: C.gold, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Seu Contrato</p>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 4 }}>
            {contrato?.imovel?.titulo || 'Imóvel'}
          </h2>
          {contrato?.imovel && (
            <p style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>
              {[contrato.imovel.bairro, contrato.imovel.cidade].filter(Boolean).join(' · ')}
              {contrato.imovel.quartos ? ` · ${contrato.imovel.quartos} quartos` : ''}
              {contrato.imovel.area_total ? ` · ${contrato.imovel.area_total}m²` : ''}
            </p>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {contrato?.valor_aluguel && (
              <div style={{ background: '#141415', borderRadius: 4, padding: '10px 14px' }}>
                <p style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Aluguel</p>
                <p style={{ fontSize: 16, fontWeight: 700, color: C.gold }}>
                  R$ {contrato.valor_aluguel.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            )}
            {contrato?.dia_vencimento && (
              <div style={{ background: '#141415', borderRadius: 4, padding: '10px 14px' }}>
                <p style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Vencimento</p>
                <p style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Dia {contrato.dia_vencimento}</p>
              </div>
            )}
            {contrato?.data_inicio && (
              <div style={{ background: '#141415', borderRadius: 4, padding: '10px 14px' }}>
                <p style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Início</p>
                <p style={{ fontSize: 14, color: C.text }}>{new Date(contrato.data_inicio + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
              </div>
            )}
            {contrato?.data_fim && (
              <div style={{ background: '#141415', borderRadius: 4, padding: '10px 14px' }}>
                <p style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Encerramento</p>
                <p style={{ fontSize: 14, color: C.text }}>{new Date(contrato.data_fim + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Botão abrir chamado */}
        {!formulario && (
          <button
            onClick={() => { setFormulario(true); setAbrindo(true) }}
            style={{ ...BTN, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            🔧 Abrir Chamado de Serviço
          </button>
        )}

        {/* Formulário de novo chamado */}
        {formulario && (
          <div style={{ background: C.card, border: `1px solid rgba(201,168,76,0.25)`, borderRadius: 8, padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Novo Chamado de Serviço</p>
              <button onClick={() => setFormulario(false)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 20 }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: C.muted, marginBottom: 5 }}>TÍTULO *</label>
                <input value={form.titulo} onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))} style={INP} placeholder="Ex: Vazamento na torneira" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: C.muted, marginBottom: 5 }}>DESCRIÇÃO *</label>
                <textarea value={form.descricao} onChange={(e) => setForm((p) => ({ ...p, descricao: e.target.value }))} rows={3} style={{ ...INP, resize: 'vertical' }} placeholder="Descreva o problema com detalhes..." />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: C.muted, marginBottom: 5 }}>CATEGORIA</label>
                  <select value={form.categoria} onChange={(e) => setForm((p) => ({ ...p, categoria: e.target.value }))} style={INP}>
                    {Object.entries(CAT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: C.muted, marginBottom: 5 }}>URGÊNCIA</label>
                  <select value={form.urgencia} onChange={(e) => setForm((p) => ({ ...p, urgencia: e.target.value }))} style={INP}>
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>
              </div>
              {/* Upload fotos */}
              <div>
                <label style={{ display: 'block', fontSize: 11, color: C.muted, marginBottom: 8 }}>FOTOS / VÍDEOS</label>
                <input ref={fileRef} type="file" multiple accept="image/*,video/*" style={{ display: 'none' }} onChange={(e) => e.target.files && uploadFotos(e.target.files)} />
                <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{ background: 'rgba(201,168,76,0.08)', border: '1px dashed rgba(201,168,76,0.3)', borderRadius: 4, padding: '10px 16px', fontSize: 13, color: C.gold, cursor: 'pointer', width: '100%' }}>
                  {uploading ? 'Enviando...' : '📷 Adicionar fotos ou vídeos'}
                </button>
                {midiaUrls.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                    {midiaUrls.map((url, i) => (
                      <div key={i} style={{ position: 'relative' }}>
                        <img src={url} alt="" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 4, border: `1px solid ${C.border}` }} />
                        <button onClick={() => setMidiaUrls((p) => p.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: 2, right: 2, background: '#0E0E0F', color: '#E05C5C', border: 'none', borderRadius: 9999, width: 18, height: 18, fontSize: 10, cursor: 'pointer', lineHeight: 1 }}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={enviarChamado} disabled={enviando} style={{ ...BTN, opacity: enviando ? 0.6 : 1, cursor: enviando ? 'default' : 'pointer' }}>
                {enviando ? 'Enviando...' : 'Enviar Chamado'}
              </button>
            </div>
          </div>
        )}

        {/* Vistorias para assinar */}
        {vistorias.length > 0 && (
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 10 }}>
              Vistorias do Imóvel
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {vistorias.map((v) => {
                const tipoMap = { entrada: { label: 'Vistoria de Entrada', cor: '#5CB88A' }, saida: { label: 'Vistoria de Saída', cor: '#E05C5C' } }
                const tm = tipoMap[v.tipo] || { label: v.tipo, cor: C.muted }
                const jaAssinada = !!v.assinado_por_inquilino_em
                const pendente = v.assinado_por_corretor_em && !jaAssinada
                return (
                  <div key={v.id} style={{ background: C.card, border: `1px solid ${pendente ? 'rgba(201,168,76,0.35)' : C.border}`, borderRadius: 8, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: tm.cor }}>{tm.label}</span>
                          {v.data_vistoria && (
                            <span style={{ fontSize: 11, color: C.muted }}>
                              {new Date(v.data_vistoria + 'T00:00:00').toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                          {jaAssinada ? (
                            <span style={{ fontSize: 12, color: '#5CB88A' }}>✓ Assinado por você em {new Date(v.assinado_por_inquilino_em!).toLocaleDateString('pt-BR')}</span>
                          ) : pendente ? (
                            <span style={{ fontSize: 12, color: '#C9A84C' }}>⏳ Aguarda sua assinatura</span>
                          ) : (
                            <span style={{ fontSize: 12, color: C.muted }}>Aguarda finalização pelo corretor</span>
                          )}
                        </div>
                      </div>
                      {pendente && (
                        <button
                          onClick={() => assinarVistoria(v.id)}
                          disabled={assinando === v.id}
                          style={{ background: '#5CB88A', color: '#0E0E0F', border: 'none', borderRadius: 6, padding: '9px 16px', fontSize: 13, fontWeight: 700, cursor: assinando === v.id ? 'default' : 'pointer', whiteSpace: 'nowrap' }}
                        >
                          {assinando === v.id ? 'Assinando...' : '✓ Assinar Vistoria'}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Lista de chamados */}
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 10 }}>
            Meus Chamados {chamados.length > 0 && `(${chamados.length})`}
          </p>
          {chamados.length === 0 ? (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: '32px 20px', textAlign: 'center' }}>
              <p style={{ color: C.muted, fontSize: 13 }}>Nenhum chamado registrado ainda.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {chamados.map((c) => {
                const sm = STATUS_MAP[c.status] || { label: c.status, cor: C.muted }
                return (
                  <div key={c.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6, gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{c.titulo}</span>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'rgba(0,0,0,0.3)', color: sm.cor, fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {sm.label}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: C.muted, marginBottom: 6, lineHeight: 1.5 }}>{c.descricao}</p>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, color: C.muted }}>{CAT_LABEL[c.categoria] || c.categoria}</span>
                      <span style={{ fontSize: 11, color: C.muted }}>{new Date(c.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                    {c.midia_urls.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                        {c.midia_urls.map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                            <img src={url} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 4, border: `1px solid ${C.border}` }} />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
