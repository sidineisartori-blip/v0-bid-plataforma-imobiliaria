'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Chamado } from './ERPChamados'
import type { Contrato } from './ERPClient'

interface Props {
  chamado: Chamado | null
  contratos: Contrato[]
  onClose: () => void
  onSucesso: (msg: string) => void
}

const INPUT: React.CSSProperties = {
  background: 'var(--color-dark-3, #1e1e20)',
  border: '1px solid var(--color-dark-4, #2E2E30)',
  borderRadius: 2,
  padding: '8px 12px',
  fontSize: 13,
  color: '#F0EDE6',
  width: '100%',
  outline: 'none',
}

const LABEL: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  color: '#9B9690',
  marginBottom: 5,
  letterSpacing: '0.03em',
  textTransform: 'uppercase',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={LABEL}>{label}</label>
      {children}
    </div>
  )
}

export default function ModalChamado({ chamado, contratos, onClose, onSucesso }: Props) {
  const supabase = createClient()
  const isEdicao = !!chamado

  const [contratoId, setContratoId]   = useState(chamado?.contrato_id || '')
  const [titulo, setTitulo]           = useState(chamado?.titulo || '')
  const [descricao, setDescricao]     = useState(chamado?.descricao || '')
  const [categoria, setCategoria]     = useState(chamado?.categoria || 'outro')
  const [urgencia, setUrgencia]       = useState(chamado?.urgencia || 'media')
  const [midiaUrls, setMidiaUrls]     = useState<string[]>(chamado?.midia_urls || [])
  const [loading, setLoading]         = useState(false)
  const [erro, setErro]               = useState<string | null>(null)
  const [uploading, setUploading]     = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const contratoLocacao = contratos.filter((c) => c.tipo === 'locacao')

  async function handleUpload(files: FileList) {
    setUploading(true)
    const urls: string[] = []
    for (const file of Array.from(files)) {
      const path = `${contratoId || 'geral'}/${Date.now()}-${file.name.replace(/\s/g, '_')}`
      const { data, error } = await supabase.storage.from('chamados').upload(path, file)
      if (!error && data) {
        const { data: { publicUrl } } = supabase.storage.from('chamados').getPublicUrl(data.path)
        urls.push(publicUrl)
      }
    }
    setMidiaUrls((prev) => [...prev, ...urls])
    setUploading(false)
  }

  async function handleSalvar() {
    if (!contratoId) { setErro('Selecione o contrato.'); return }
    if (!titulo.trim()) { setErro('Título é obrigatório.'); return }
    if (!descricao.trim()) { setErro('Descrição é obrigatória.'); return }

    setLoading(true)
    setErro(null)

    const url = isEdicao ? `/api/erp/chamados/${chamado.id}` : '/api/erp/chamados'
    const method = isEdicao ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contrato_id: contratoId,
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        categoria,
        urgencia,
        midia_urls: midiaUrls,
      }),
    })

    if (res.ok) {
      onSucesso(isEdicao ? 'Chamado atualizado!' : 'Chamado criado!')
      onClose()
    } else {
      const e = await res.json()
      setErro(e.error || 'Erro ao salvar.')
    }
    setLoading(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: '#181819',
        border: '1px solid rgba(201,168,76,0.2)',
        borderRadius: 2,
        width: '100%',
        maxWidth: 560,
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '28px',
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 700, color: '#F0EDE6' }}>
            {isEdicao ? 'Editar Chamado' : 'Novo Chamado'}
          </h2>
          <button onClick={onClose} style={{ color: '#9B9690', fontSize: 22, background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        {/* Contrato */}
        <Field label="Contrato *">
          <select value={contratoId} onChange={(e) => setContratoId(e.target.value)} style={INPUT} disabled={isEdicao}>
            <option value="">— Selecionar contrato —</option>
            {contratoLocacao.map((c) => (
              <option key={c.id} value={c.id}>
                {c.cliente_nome}{c.imovel ? ` — ${c.imovel.titulo}` : ''}
              </option>
            ))}
          </select>
        </Field>

        {/* Título */}
        <Field label="Título *">
          <input value={titulo} onChange={(e) => setTitulo(e.target.value)} style={INPUT} placeholder="Ex: Vazamento na torneira da cozinha" />
        </Field>

        {/* Descrição */}
        <Field label="Descrição *">
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={3}
            style={{ ...INPUT, resize: 'vertical' }}
            placeholder="Descreva o problema com detalhes..."
          />
        </Field>

        {/* Categoria + Urgência */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Categoria">
            <select value={categoria} onChange={(e) => setCategoria(e.target.value)} style={INPUT}>
              <option value="hidraulica">Hidráulica</option>
              <option value="eletrica">Elétrica</option>
              <option value="estrutural">Estrutural</option>
              <option value="pintura">Pintura</option>
              <option value="limpeza">Limpeza</option>
              <option value="outro">Outro</option>
            </select>
          </Field>
          <Field label="Urgência">
            <select value={urgencia} onChange={(e) => setUrgencia(e.target.value as 'urgente' | 'alta' | 'media' | 'baixa')} style={INPUT}>
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
              <option value="urgente">Urgente</option>
            </select>
          </Field>
        </div>

        {/* Upload de fotos */}
        <Field label="Fotos / Vídeos">
          <div>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept="image/*,video/*"
              style={{ display: 'none' }}
              onChange={(e) => e.target.files && handleUpload(e.target.files)}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 2, padding: '8px 16px', fontSize: 12, color: '#C9A84C', cursor: 'pointer', marginBottom: 10 }}
            >
              {uploading ? 'Enviando...' : '📷 Adicionar fotos/vídeos'}
            </button>
            {midiaUrls.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {midiaUrls.map((url, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <img src={url} alt="" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 2, border: '1px solid #2E2E30' }} />
                    <button
                      onClick={() => setMidiaUrls((prev) => prev.filter((_, idx) => idx !== i))}
                      style={{ position: 'absolute', top: 2, right: 2, background: '#0E0E0F', color: '#E05C5C', border: 'none', borderRadius: 9999, width: 18, height: 18, fontSize: 10, cursor: 'pointer', lineHeight: 1 }}
                    >×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Field>

        {erro && <p style={{ fontSize: 12, color: '#ef4444' }}>{erro}</p>}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ background: 'none', border: '1px solid #2E2E30', borderRadius: 2, padding: '9px 18px', fontSize: 13, color: '#9B9690', cursor: 'pointer' }}>
            Cancelar
          </button>
          <button
            onClick={handleSalvar}
            disabled={loading}
            style={{ background: loading ? 'rgba(201,168,76,0.5)' : '#C9A84C', border: 'none', borderRadius: 2, padding: '9px 22px', fontSize: 13, fontWeight: 600, color: '#0E0E0F', cursor: loading ? 'default' : 'pointer' }}
          >
            {loading ? 'Salvando...' : isEdicao ? 'Salvar' : 'Criar Chamado'}
          </button>
        </div>
      </div>
    </div>
  )
}
