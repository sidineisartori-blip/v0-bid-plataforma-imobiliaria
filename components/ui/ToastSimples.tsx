'use client'

import { useEffect, useState } from 'react'

export type ToastTipo = 'sucesso' | 'erro' | 'info' | 'aviso'

export interface ToastData {
  id: string
  tipo: ToastTipo
  titulo: string
  mensagem?: string
}

const CORES: Record<ToastTipo, { bg: string; borda: string; cor: string; icone: string }> = {
  sucesso: { bg: 'rgba(92,184,138,0.1)',  borda: 'rgba(92,184,138,0.35)',  cor: '#5CB88A', icone: '✓' },
  erro:    { bg: 'rgba(224,92,92,0.1)',   borda: 'rgba(224,92,92,0.35)',   cor: '#E05C5C', icone: '✕' },
  info:    { bg: 'rgba(92,155,224,0.1)',  borda: 'rgba(92,155,224,0.35)',  cor: '#5C9BE0', icone: 'i' },
  aviso:   { bg: 'rgba(201,168,76,0.1)',  borda: 'rgba(201,168,76,0.35)',  cor: '#C9A84C', icone: '!' },
}

interface Props {
  toasts: ToastData[]
  onRemover: (id: string) => void
}

export function ToastContainer({ toasts, onRemover }: Props) {
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 8,
      pointerEvents: 'none',
    }}>
      {toasts.map((t: ToastData): React.ReactElement => (
        <ToastItem key={t.id} toast={t} onRemover={onRemover} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onRemover }: { key?: React.Key; toast: ToastData; onRemover: (id: string) => void }) {
  const [saindo, setSaindo] = useState(false)
  const c = CORES[toast.tipo]

  useEffect(() => {
    const timer = setTimeout(() => {
      setSaindo(true)
      setTimeout(() => onRemover(toast.id), 300)
    }, 3500)
    return () => clearTimeout(timer)
  }, [toast.id, onRemover])

  return (
    <div
      onClick={() => { setSaindo(true); setTimeout(() => onRemover(toast.id), 300) }}
      style={{
        background: '#181819',
        border: `1px solid ${c.borda}`,
        borderLeft: `3px solid ${c.cor}`,
        borderRadius: 2,
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        minWidth: 280,
        maxWidth: 360,
        cursor: 'pointer',
        pointerEvents: 'all',
        opacity: saindo ? 0 : 1,
        transform: saindo ? 'translateX(20px)' : 'translateX(0)',
        transition: 'opacity 0.3s, transform 0.3s',
        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
      }}
    >
      <span style={{
        width: 20, height: 20, borderRadius: '50%',
        background: c.bg, border: `1px solid ${c.borda}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 700, color: c.cor, flexShrink: 0,
      }}>{c.icone}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#F0EDE6', marginBottom: toast.mensagem ? 2 : 0 }}>
          {toast.titulo}
        </p>
        {toast.mensagem && (
          <p style={{ fontSize: 12, color: '#9B9690', lineHeight: 1.4 }}>{toast.mensagem}</p>
        )}
      </div>
    </div>
  )
}

// Hook para usar em qualquer componente
let contadorId = 0
type AddToast = (tipo: ToastTipo, titulo: string, mensagem?: string) => void

export function useToastSimples(): [ToastData[], AddToast, (id: string) => void] {
  const [toasts, setToasts] = useState<ToastData[]>([])

  const add: AddToast = (tipo, titulo, mensagem) => {
    const id = String(++contadorId)
    setToasts((prev: ToastData[]) => [...prev, { id, tipo, titulo, mensagem }])
  }

  const remover = (id: string) => setToasts((prev: ToastData[]) => prev.filter((t: ToastData) => t.id !== id))

  return [toasts, add, remover]
}
