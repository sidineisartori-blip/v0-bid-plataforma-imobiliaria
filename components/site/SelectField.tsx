'use client'

import React, { useState, useRef, useEffect, useId } from 'react'

export interface SelectOption {
  value: string
  label: string
}

interface Props {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  ariaLabel?: string
}

/**
 * Dropdown customizado no tema BID (dark/gold).
 * Substitui o <select> nativo, cujas <option> herdam o tema claro do
 * navegador e ficam ilegíveis sobre o fundo escuro do site.
 * Acessível: teclado (setas, Enter, Esc, Home/End), aria-* e foco visível.
 */
export default function SelectField({ value, onChange, options, placeholder = 'Selecione...', ariaLabel }: Props) {
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const wrapRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const listboxId = useId()

  const selectedIndex = options.findIndex((o) => o.value === value)
  const selected = selectedIndex >= 0 ? options[selectedIndex] : null

  // Fecha ao clicar fora
  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  // Ao abrir, destaca a opção atualmente selecionada
  useEffect(() => {
    if (open) setHighlight(selectedIndex >= 0 ? selectedIndex : 0)
  }, [open, selectedIndex])

  // Mantém a opção destacada visível no scroll
  useEffect(() => {
    if (!open || !listRef.current) return
    const el = listRef.current.children[highlight] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }, [open, highlight])

  function commit(index: number) {
    const opt = options[index]
    if (opt) onChange(opt.value)
    setOpen(false)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault()
        setOpen(true)
      }
      return
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlight((h) => Math.min(h + 1, options.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlight((h) => Math.max(h - 1, 0))
        break
      case 'Home':
        e.preventDefault()
        setHighlight(0)
        break
      case 'End':
        e.preventDefault()
        setHighlight(options.length - 1)
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        commit(highlight)
        break
      case 'Escape':
        e.preventDefault()
        setOpen(false)
        break
      case 'Tab':
        setOpen(false)
        break
    }
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      {/* Trigger */}
      <button
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKeyDown}
        style={{
          width: '100%',
          backgroundColor: 'rgba(255,255,255,0.03)',
          border: `1px solid ${open ? 'rgba(201,168,76,0.5)' : 'rgba(201,168,76,0.12)'}`,
          borderRadius: '2px',
          padding: '14px 16px',
          fontSize: '14px',
          color: selected ? '#F0EDE6' : '#6b6862',
          outline: 'none',
          boxSizing: 'border-box',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          textAlign: 'left',
          transition: 'border-color 0.2s, background-color 0.2s',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected ? selected.label : placeholder}
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#C9A84C"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          style={{
            flexShrink: 0,
            transition: 'transform 0.2s ease',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel}
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 60,
            margin: 0,
            padding: '4px',
            listStyle: 'none',
            maxHeight: '240px',
            overflowY: 'auto',
            backgroundColor: '#181819',
            border: '1px solid rgba(201,168,76,0.25)',
            borderRadius: '2px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
            animation: 'bidSelectIn 0.16s ease',
          }}
        >
          {options.map((opt, i) => {
            const isSelected = opt.value === value
            const isHighlight = i === highlight
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setHighlight(i)}
                onClick={() => commit(i)}
                style={{
                  padding: '11px 14px',
                  fontSize: '14px',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  color: isSelected ? '#C9A84C' : '#F0EDE6',
                  backgroundColor: isHighlight ? 'rgba(201,168,76,0.12)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  transition: 'background-color 0.12s',
                }}
              >
                <span>{opt.label}</span>
                {isSelected && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <style>{`
        @keyframes bidSelectIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
