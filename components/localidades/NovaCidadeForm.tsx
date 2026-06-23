'use client'

import React, { useState } from 'react'
import type { Cidade } from '@/types/bid'

interface NovaCidadeFormProps {
  /** recebe a cidade criada OU a já existente (dedup) */
  onCreated: (cidade: Cidade) => void
  onError?: (msg: string) => void
  onCancel: () => void
  inputStyle: React.CSSProperties
}

export default function NovaCidadeForm({ onCreated, onError, onCancel, inputStyle }: NovaCidadeFormProps) {
  const [nome, setNome] = useState('')
  const [uf, setUf] = useState('')
  const [salvando, setSalvando] = useState(false)

  async function adicionar() {
    if (!nome.trim() || salvando) return
    setSalvando(true)
    try {
      const res = await fetch('/api/localidades/cidades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nome, state: uf }),
      })
      const json = await res.json()
      if (!res.ok) {
        onError?.(json.error || 'Erro ao adicionar cidade.')
        setSalvando(false)
        return
      }
      // created=false (já existia) também cai aqui: apenas reaproveita.
      onCreated(json.cidade as Cidade)
    } catch {
      onError?.('Falha na conexão ao adicionar cidade.')
    }
    setSalvando(false)
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        marginTop: '6px',
        padding: '10px',
        backgroundColor: '#232324',
        border: '1px solid #2E2E30',
        borderRadius: '2px',
      }}
    >
      <input
        type="text"
        autoFocus
        style={{ ...inputStyle, flex: 1 }}
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        placeholder="Nome da cidade"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            adicionar()
          }
        }}
      />
      <input
        type="text"
        maxLength={2}
        style={{ ...inputStyle, width: '60px', textTransform: 'uppercase' }}
        value={uf}
        onChange={(e) => setUf(e.target.value.toUpperCase())}
        placeholder="UF"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            adicionar()
          }
        }}
      />
      <button
        type="button"
        onClick={adicionar}
        disabled={salvando || !nome.trim()}
        style={{
          padding: '9px 14px',
          borderRadius: '2px',
          border: '1px solid #C9A84C',
          backgroundColor: 'transparent',
          color: '#C9A84C',
          fontSize: '12px',
          fontWeight: 600,
          cursor: salvando || !nome.trim() ? 'default' : 'pointer',
          whiteSpace: 'nowrap',
          opacity: salvando || !nome.trim() ? 0.6 : 1,
        }}
      >
        {salvando ? 'Salvando...' : 'Adicionar'}
      </button>
      <button
        type="button"
        onClick={onCancel}
        style={{
          padding: '9px 10px',
          borderRadius: '2px',
          border: '1px solid rgba(201,168,76,0.2)',
          backgroundColor: 'transparent',
          color: '#9B9690',
          fontSize: '12px',
          cursor: 'pointer',
        }}
      >
        Cancelar
      </button>
    </div>
  )
}
