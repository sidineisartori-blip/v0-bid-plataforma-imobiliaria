'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Vistoria } from './ERPVistorias'

interface VistoriaItem {
  id: string
  vistoria_id: string
  ambiente: string
  item: string
  estado: 'otimo' | 'bom' | 'regular' | 'ruim' | 'danificado' | 'nao_aplicavel'
  observacao: string | null
  foto_urls: string[]
}

interface Props {
  vistoria: Vistoria
  onClose: () => void
  onSucesso: (msg: string) => void
}

const ESTADO_MAP: Record<string, { label: string; cor: string; bg: string }> = {
  otimo:        { label: 'Ótimo',        cor: '#5CB88A', bg: 'rgba(92,184,138,0.2)' },
  bom:          { label: 'Bom',          cor: '#60a5fa', bg: 'rgba(96,165,250,0.2)' },
  regular:      { label: 'Regular',      cor: '#C9A84C', bg: 'rgba(201,168,76,0.2)' },
  ruim:         { label: 'Ruim',         cor: '#e07a2f', bg: 'rgba(224,122,47,0.2)' },
  danificado:   { label: 'Danificado',   cor: '#E05C5C', bg: 'rgba(224,92,92,0.2)' },
  nao_aplicavel:{ label: 'N/A',          cor: '#9B9690', bg: 'rgba(155,150,144,0.15)' },
}

const INPUT: React.CSSProperties = {
  background: '#1a1a1c',
  border: '1px solid #2E2E30',
  borderRadius: 2,
  padding: '6px 10px',
  fontSize: 12,
  color: '#F0EDE6',
  width: '100%',
  outline: 'none',
}

export default function ModalVistoria({ vistoria, onClose, onSucesso }: Props) {
  const supabase = createClient()
  const [itens, setItens]             = useState<VistoriaItem[]>([])
  const [carregando, setCarregando]   = useState(true)
  const [salvando, setSalvando]       = useState(false)
  const [finalizando, setFinalizando] = useState(false)
  const [obsGeral, setObsGeral]       = useState(vistoria.observacoes_gerais || '')
  const [dataVistoria, setDataVistoria] = useState(vistoria.data_vistoria || '')
  const [ambienteAberto, setAmbienteAberto] = useState<string | null>(null)
  const [uploadingItem, setUploadingItem] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const uploadTargetRef = useRef<string | null>(null)

  useEffect(() => {
    async function carregar() {
      const res = await fetch(`/api/erp/vistorias/${vistoria.id}`)
      if (res.ok) {
        const data = await res.json()
        setItens(data.itens || [])
        if (data.data_vistoria) setDataVistoria(data.data_vistoria)
        if (data.observacoes_gerais) setObsGeral(data.observacoes_gerais)
      }
      setCarregando(false)
    }
    carregar()
  }, [vistoria.id])

  const ambientes = [...new Set(itens.map((i) => i.ambiente))]

  function atualizarItem(id: string, campo: keyof VistoriaItem, valor: unknown) {
    setItens((prev) => prev.map((it) => it.id === id ? { ...it, [campo]: valor } : it))
  }

  async function handleUploadFoto(files: FileList, itemId: string) {
    setUploadingItem(itemId)
    const urls: string[] = []
    for (const file of Array.from(files)) {
      const path = `${vistoria.id}/${itemId}/${Date.now()}-${file.name.replace(/\s/g, '_')}`
      const { data, error } = await supabase.storage.from('vistorias').upload(path, file)
      if (!error && data) {
        const { data: { publicUrl } } = supabase.storage.from('vistorias').getPublicUrl(data.path)
        urls.push(publicUrl)
      }
    }
    atualizarItem(itemId, 'foto_urls', [
      ...(itens.find((i) => i.id === itemId)?.foto_urls || []),
      ...urls,
    ])
    setUploadingItem(null)
  }

  async function salvar() {
    setSalvando(true)

    // Salvar itens em batch
    await fetch(`/api/erp/vistorias/${vistoria.id}/itens`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itens }),
    })

    // Salvar cabeçalho
    await fetch(`/api/erp/vistorias/${vistoria.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data_vistoria: dataVistoria || null, observacoes_gerais: obsGeral || null }),
    })

    onSucesso('Vistoria salva!')
    setSalvando(false)
  }

  async function finalizar() {
    setFinalizando(true)
    await fetch(`/api/erp/vistorias/${vistoria.id}/itens`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itens }),
    })
    await fetch(`/api/erp/vistorias/${vistoria.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'finalizada',
        data_vistoria: dataVistoria || null,
        observacoes_gerais: obsGeral || null,
        assinado_por_corretor_em: new Date().toISOString(),
      }),
    })
    onSucesso('Vistoria finalizada e assinada!')
    setFinalizando(false)
    onClose()
  }

  const tipoMap = { entrada: { label: 'Entrada', cor: '#5CB88A' }, saida: { label: 'Saída', cor: '#E05C5C' } }
  const tm = tipoMap[vistoria.tipo]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: '#181819',
        border: '1px solid rgba(201,168,76,0.2)',
        borderRadius: 2,
        width: '100%',
        maxWidth: 720,
        maxHeight: '92vh',
        overflowY: 'auto',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 2, fontWeight: 700, background: 'rgba(92,184,138,0.12)', color: tm.cor }}>
                Vistoria de {tm.label}
              </span>
              {vistoria.status === 'finalizada' && (
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 2, background: 'rgba(92,184,138,0.12)', color: '#5CB88A' }}>✓ Finalizada</span>
              )}
            </div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 700, color: '#F0EDE6', margin: 0 }}>
              {vistoria.contrato?.cliente_nome || 'Contrato'}
            </h2>
            {vistoria.contrato?.imovel && (
              <p style={{ fontSize: 12, color: '#9B9690', margin: '4px 0 0' }}>
                {vistoria.contrato.imovel.titulo} — {vistoria.contrato.imovel.cidade}
              </p>
            )}
          </div>
          <button onClick={onClose} style={{ color: '#9B9690', fontSize: 22, background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        {/* Data + Obs Geral */}
        <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: '#9B9690', marginBottom: 5 }}>DATA DA VISTORIA</label>
            <input type="date" value={dataVistoria} onChange={(e) => setDataVistoria(e.target.value)} style={INPUT} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: '#9B9690', marginBottom: 5 }}>OBSERVAÇÕES GERAIS</label>
            <input value={obsGeral} onChange={(e) => setObsGeral(e.target.value)} style={INPUT} placeholder="Condição geral do imóvel..." />
          </div>
        </div>

        {carregando ? (
          <p style={{ color: '#9B9690', fontSize: 13 }}>Carregando checklist...</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* input de arquivo oculto, reutilizado */}
            <input
              ref={fileRef}
              type="file"
              multiple
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files && uploadTargetRef.current) {
                  handleUploadFoto(e.target.files, uploadTargetRef.current)
                }
              }}
            />

            {ambientes.map((amb) => {
              const ambItens = itens.filter((i) => i.ambiente === amb)
              const isAberto = ambienteAberto === amb
              const temProblema = ambItens.some((i) => ['ruim', 'danificado'].includes(i.estado))

              return (
                <div key={amb} style={{ border: `1px solid ${temProblema ? 'rgba(224,92,92,0.3)' : '#2E2E30'}`, borderRadius: 2, overflow: 'hidden' }}>
                  {/* Cabeçalho do ambiente */}
                  <button
                    onClick={() => setAmbienteAberto(isAberto ? null : amb)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      background: isAberto ? 'rgba(201,168,76,0.06)' : '#1a1a1c',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#F0EDE6',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{amb}</span>
                      {temProblema && <span style={{ fontSize: 10, color: '#E05C5C' }}>⚠ Problemas</span>}
                      <span style={{ fontSize: 11, color: '#9B9690' }}>{ambItens.length} itens</span>
                    </div>
                    <span style={{ color: '#9B9690' }}>{isAberto ? '▲' : '▼'}</span>
                  </button>

                  {/* Itens do ambiente */}
                  {isAberto && (
                    <div style={{ padding: '8px 14px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {ambItens.map((it) => {
                        const est = ESTADO_MAP[it.estado]
                        return (
                          <div key={it.id} style={{ background: '#141415', borderRadius: 2, padding: '10px 12px', border: `1px solid ${est.bg}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                              <span style={{ fontSize: 13, color: '#F0EDE6', fontWeight: 500 }}>{it.item}</span>
                              <select
                                value={it.estado}
                                onChange={(e) => atualizarItem(it.id, 'estado', e.target.value)}
                                style={{ background: est.bg, border: 'none', borderRadius: 2, padding: '4px 8px', fontSize: 11, color: est.cor, fontWeight: 600, cursor: 'pointer', outline: 'none' }}
                              >
                                {Object.entries(ESTADO_MAP).map(([k, v]) => (
                                  <option key={k} value={k}>{v.label}</option>
                                ))}
                              </select>
                            </div>
                            <input
                              value={it.observacao || ''}
                              onChange={(e) => atualizarItem(it.id, 'observacao', e.target.value)}
                              placeholder="Observação (opcional)..."
                              style={{ ...INPUT, marginBottom: it.foto_urls.length > 0 ? 8 : 0 }}
                            />
                            {/* Fotos */}
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8, alignItems: 'center' }}>
                              {it.foto_urls.map((url, idx) => (
                                <div key={idx} style={{ position: 'relative' }}>
                                  <a href={url} target="_blank" rel="noopener noreferrer">
                                    <img src={url} alt="" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 2, border: '1px solid #2E2E30' }} />
                                  </a>
                                  <button
                                    onClick={() => atualizarItem(it.id, 'foto_urls', it.foto_urls.filter((_, fi) => fi !== idx))}
                                    style={{ position: 'absolute', top: 1, right: 1, background: '#0E0E0F', color: '#E05C5C', border: 'none', borderRadius: 9999, width: 16, height: 16, fontSize: 9, cursor: 'pointer', lineHeight: 1 }}
                                  >×</button>
                                </div>
                              ))}
                              <button
                                onClick={() => { uploadTargetRef.current = it.id; fileRef.current?.click() }}
                                disabled={uploadingItem === it.id}
                                style={{ background: 'rgba(201,168,76,0.06)', border: '1px dashed rgba(201,168,76,0.2)', borderRadius: 2, padding: '4px 8px', fontSize: 10, color: '#C9A84C', cursor: 'pointer' }}
                              >
                                {uploadingItem === it.id ? '...' : '📷'}
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap', paddingTop: 4, borderTop: '1px solid #2E2E30' }}>
          <button onClick={onClose} style={{ background: 'none', border: '1px solid #2E2E30', borderRadius: 2, padding: '9px 18px', fontSize: 13, color: '#9B9690', cursor: 'pointer' }}>
            Fechar
          </button>
          {vistoria.status === 'finalizada' && (
            <button
              onClick={() => window.open(`/imprimir/vistoria/${vistoria.id}`, '_blank')}
              style={{ background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.3)', borderRadius: 2, padding: '9px 16px', fontSize: 13, color: '#60a5fa', cursor: 'pointer' }}
            >
              🖨 Imprimir / PDF
            </button>
          )}
          <button onClick={salvar} disabled={salvando} style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 2, padding: '9px 18px', fontSize: 13, color: '#C9A84C', cursor: salvando ? 'default' : 'pointer' }}>
            {salvando ? 'Salvando...' : 'Salvar Rascunho'}
          </button>
          {vistoria.status !== 'finalizada' && (
            <button
              onClick={finalizar}
              disabled={finalizando}
              style={{ background: finalizando ? 'rgba(92,184,138,0.5)' : '#5CB88A', border: 'none', borderRadius: 2, padding: '9px 20px', fontSize: 13, fontWeight: 600, color: '#0E0E0F', cursor: finalizando ? 'default' : 'pointer' }}
            >
              {finalizando ? 'Finalizando...' : '✓ Finalizar e Assinar'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
