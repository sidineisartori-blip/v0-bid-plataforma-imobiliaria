'use client'

import React, { useEffect, useRef, useState } from 'react'
import type { Bairro } from '@/types/bid'

interface BairroComboboxProps {
  /** id da cidade canônica; null quando nenhuma cidade resolvida */
  cityId: string | null
  /** nome do bairro atualmente gravado no form */
  value: string
  /** grava SEMPRE o nome canônico (string) no form do pai */
  onChange: (name: string) => void
  /** surface de erro do modal pai (toast/erro já existente) */
  onError?: (msg: string) => void
  /**
   * true  -> sem cidade o campo fica desabilitado (ModalSolicitacao)
   * false -> sem cidade vira input de texto livre (ModalImovel via CEP)
   */
  disabledWhenNoCity?: boolean
  placeholder?: string
  inputStyle: React.CSSProperties
}

function normalizar(s: string) {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

export default function BairroCombobox({
  cityId,
  value,
  onChange,
  onError,
  disabledWhenNoCity = false,
  placeholder = 'Bairro',
  inputStyle,
}: BairroComboboxProps) {
  const [bairros, setBairros] = useState<Bairro[]>([])
  const [open, setOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Busca a lista de bairros sempre que a cidade muda
  useEffect(() => {
    let ativo = true
    if (!cityId) {
      setBairros([])
      return
    }
    fetch(`/api/localidades/bairros?city_id=${cityId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('falha'))))
      .then((json) => {
        if (ativo) setBairros(json.bairros ?? [])
      })
      .catch(() => {
        if (ativo) onError?.('Não foi possível carregar os bairros desta cidade.')
      })
    return () => {
      ativo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityId])

  const semCidade = !cityId

  // Sem cidade + modo "desabilitar" (ModalSolicitacao)
  if (semCidade && disabledWhenNoCity) {
    return (
      <input
        type="text"
        disabled
        style={{ ...inputStyle, opacity: 0.6, cursor: 'not-allowed' }}
        placeholder="Selecione a cidade primeiro"
      />
    )
  }

  // Sem cidade + modo texto livre (ModalImovel quando o CEP traz cidade fora da base canônica)
  if (semCidade) {
    return (
      <input
        type="text"
        style={inputStyle}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    )
  }

  const filtrados = value.trim()
    ? bairros.filter((b) => normalizar(b.name).includes(normalizar(value)))
    : bairros
  const existeExato = bairros.some((b) => normalizar(b.name) === normalizar(value))
  const podeAdicionar = value.trim().length > 0 && !existeExato && !adding

  async function adicionarBairro(nome: string) {
    if (!cityId || !nome.trim()) return
    setAdding(true)
    try {
      const res = await fetch('/api/localidades/bairros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city_id: cityId, name: nome }),
      })
      const json = await res.json()
      if (!res.ok) {
        onError?.(json.error || 'Erro ao adicionar bairro.')
        setAdding(false)
        return
      }
      const novo = json.bairro as Bairro
      // created=false (já existia) também cai aqui: apenas reaproveita.
      setBairros((prev) => (prev.some((b) => b.id === novo.id) ? prev : [...prev, novo]))
      onChange(novo.name)
      setOpen(false)
    } catch {
      onError?.('Falha na conexão ao adicionar bairro.')
    }
    setAdding(false)
  }

  function selecionar(b: Bairro) {
    onChange(b.name)
    setOpen(false)
  }

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <input
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        style={inputStyle}
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          // delay para permitir o clique numa opção antes de fechar
          blurTimer.current = setTimeout(() => setOpen(false), 150)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && podeAdicionar) {
            e.preventDefault()
            adicionarBairro(value)
          }
        }}
      />
      {open && (filtrados.length > 0 || podeAdicionar) && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 2px)',
            left: 0,
            right: 0,
            zIndex: 5,
            backgroundColor: '#232324',
            border: '1px solid #2E2E30',
            borderRadius: '2px',
            maxHeight: '180px',
            overflowY: 'auto',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}
          onMouseDown={() => {
            // cancela o fechamento por blur ao clicar dentro do dropdown
            if (blurTimer.current) clearTimeout(blurTimer.current)
          }}
        >
          {filtrados.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => selecionar(b)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '8px 12px',
                fontSize: '13px',
                color: '#F0EDE6',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2E2E30')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              {b.name}
            </button>
          ))}
          {podeAdicionar && (
            <button
              type="button"
              onClick={() => adicionarBairro(value)}
              disabled={adding}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '8px 12px',
                fontSize: '13px',
                color: '#C9A84C',
                background: 'none',
                border: 'none',
                borderTop: filtrados.length > 0 ? '1px solid #2E2E30' : 'none',
                cursor: adding ? 'default' : 'pointer',
              }}
            >
              {adding ? 'Adicionando...' : `+ Adicionar "${value.trim()}"`}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
