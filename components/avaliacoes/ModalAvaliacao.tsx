'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Props {
  corretorId: string
  avaliadoId: string
  avaliadoNome: string
  contexto?: string
  onClose: () => void
}

const CRITERIOS = [
  { key: 'nota_agilidade', label: 'Agilidade' },
  { key: 'nota_profissionalismo', label: 'Profissionalismo' },
  { key: 'nota_organizacao', label: 'Organizacao' },
  { key: 'nota_comprometimento', label: 'Comprometimento' },
  { key: 'nota_comunicacao', label: 'Comunicacao' },
] as const

type CriterioKey = typeof CRITERIOS[number]['key']

function EstrelasInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <span style={{ display: 'inline-flex', gap: '4px' }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px',
            fontSize: '20px',
            color: i <= (hover || value) ? '#C9A84C' : '#2E2E30',
            transition: 'color 0.1s',
          }}
        >
          ★
        </button>
      ))}
    </span>
  )
}

export default function ModalAvaliacao({ corretorId, avaliadoId, avaliadoNome, contexto, onClose }: Props) {
  const supabase = createClient()
  const router = useRouter()

  const [notas, setNotas] = useState<Record<CriterioKey, number>>({
    nota_agilidade: 0,
    nota_profissionalismo: 0,
    nota_organizacao: 0,
    nota_comprometimento: 0,
    nota_comunicacao: 0,
  })
  const [comentario, setComentario] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  const todosPreenchidos = Object.values(notas).every((n) => n > 0)
  const notaFinal = todosPreenchidos
    ? Object.values(notas).reduce((a, b) => a + b, 0) / 5
    : 0

  function setNota(key: CriterioKey, value: number) {
    setNotas((prev) => ({ ...prev, [key]: value }))
  }

  async function handleEnviar(e: React.FormEvent) {
    e.preventDefault()
    if (!todosPreenchidos) return
    setEnviando(true)
    setErro('')

    const { error } = await supabase.from('avaliacoes').insert({
      avaliado_id: avaliadoId,
      avaliador_id: corretorId,
      nota_agilidade: notas.nota_agilidade,
      nota_profissionalismo: notas.nota_profissionalismo,
      nota_organizacao: notas.nota_organizacao,
      nota_comprometimento: notas.nota_comprometimento,
      nota_comunicacao: notas.nota_comunicacao,
      nota_final: Number(notaFinal.toFixed(2)),
      comentario: comentario || null,
      anonima: true,
    })

    if (error) {
      setErro('Erro ao enviar: ' + error.message)
      setEnviando(false)
      return
    }

    // Recalcular nota_media do avaliado
    const { data: todasAvals } = await supabase
      .from('avaliacoes')
      .select('nota_final')
      .eq('avaliado_id', avaliadoId)

    if (todasAvals && todasAvals.length > 0) {
      const novaMedia = todasAvals.reduce((a, r) => a + Number(r.nota_final), 0) / todasAvals.length
      await supabase.from('corretores').update({
        nota_media: Number(novaMedia.toFixed(2)),
        total_avaliacoes: todasAvals.length,
      }).eq('id', avaliadoId)
    }

    setEnviando(false)
    router.refresh()
    onClose()
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ backgroundColor: '#181819', border: '1px solid rgba(201,168,76,0.15)', borderRadius: '2px', width: '100%', maxWidth: '440px', maxHeight: '90vh', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #232324', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ fontFamily: 'var(--font-serif, serif)', fontSize: '17px', fontWeight: 700, color: '#F0EDE6', margin: '0 0 4px' }}>
              Avaliar Parceiro
            </p>
            <p style={{ fontSize: '12px', color: '#9B9690', margin: 0 }}>
              {contexto || `Avaliando: ${avaliadoNome}`} · Avaliacao anonima e obrigatoria para arquivar.
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9B9690', cursor: 'pointer', fontSize: '18px', padding: '0', flexShrink: 0, marginLeft: '12px' }}>
            ✕
          </button>
        </div>

        <form onSubmit={handleEnviar}>
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Criterios */}
            {CRITERIOS.map(({ key, label }) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', color: '#F0EDE6' }}>{label}</span>
                <EstrelasInput value={notas[key]} onChange={(v) => setNota(key, v)} />
              </div>
            ))}

            {/* Nota final */}
            {todosPreenchidos && (
              <div style={{
                backgroundColor: '#232324',
                borderRadius: '2px',
                padding: '16px',
                textAlign: 'center',
                border: '1px solid rgba(201,168,76,0.1)',
              }}>
                <p style={{ fontSize: '11px', color: '#9B9690', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 4px' }}>
                  Nota Final
                </p>
                <p style={{ fontFamily: 'var(--font-serif, serif)', fontSize: '30px', fontWeight: 700, color: '#C9A84C', margin: 0 }}>
                  {notaFinal.toFixed(1)}
                </p>
              </div>
            )}

            {/* Comentario */}
            <div>
              <label style={{ fontSize: '11px', color: '#9B9690', letterSpacing: '0.05em', textTransform: 'uppercase' as const, display: 'block', marginBottom: '6px' }}>
                Comentario (opcional)
              </label>
              <textarea
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                rows={3}
                placeholder="Descreva sua experiencia com este parceiro..."
                style={{
                  width: '100%',
                  backgroundColor: '#232324',
                  border: '1px solid #2E2E30',
                  borderRadius: '2px',
                  padding: '9px 12px',
                  fontSize: '13px',
                  color: '#F0EDE6',
                  outline: 'none',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {erro && (
              <p style={{ fontSize: '12px', color: '#E05C5C', backgroundColor: 'rgba(224,92,92,0.08)', padding: '8px 12px', borderRadius: '2px', margin: 0 }}>
                {erro}
              </p>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: '16px 24px', borderTop: '1px solid #232324' }}>
            <button
              type="submit"
              disabled={!todosPreenchidos || enviando}
              style={{
                width: '100%',
                backgroundColor: todosPreenchidos ? '#C9A84C' : '#232324',
                color: todosPreenchidos ? '#0E0E0F' : '#9B9690',
                border: 'none',
                borderRadius: '2px',
                padding: '11px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: todosPreenchidos ? 'pointer' : 'not-allowed',
                transition: 'background-color 0.15s',
              }}
            >
              {enviando ? 'Enviando...' : 'Enviar Avaliacao'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
