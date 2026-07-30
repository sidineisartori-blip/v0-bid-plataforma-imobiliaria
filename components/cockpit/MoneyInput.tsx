'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

function apenasDigitos(s: string) {
  return s.replace(/\D/g, '')
}

function centavosParaTexto(centavos: number) {
  return (centavos / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/**
 * Campo de dinheiro em real.
 *
 * Digita-se da direita para a esquerda em centavos — 1 5 0 0 0 vira 150,00 —
 * que é como se lança valor em sistema financeiro sem errar vírgula. O valor
 * exposto no onChange é número em reais, não string formatada.
 */
export function MoneyInput({
  value,
  onChange,
  className,
  id,
  name,
  placeholder = '0,00',
  disabled,
  required,
  'aria-describedby': ariaDescribedBy,
}: {
  /** Valor em reais. */
  value: number | null
  onChange: (valorEmReais: number | null) => void
  className?: string
  id?: string
  name?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
  'aria-describedby'?: string
}) {
  const texto = value === null || Number.isNaN(value)
    ? ''
    : centavosParaTexto(Math.round(value * 100))

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digitos = apenasDigitos(e.target.value)
    if (digitos === '') {
      onChange(null)
      return
    }
    // Limite defensivo: 15 dígitos passam do seguro em float.
    onChange(Number(digitos.slice(0, 15)) / 100)
  }

  return (
    <div className="relative">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
      >
        R$
      </span>
      <input
        id={id}
        name={name}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        aria-describedby={ariaDescribedBy}
        value={texto}
        onChange={handleChange}
        className={cn(
          'h-9 w-full rounded-md border border-input bg-card pl-9 pr-3 text-sm tabular-nums text-foreground shadow-xs transition-[color,box-shadow] outline-none',
          'placeholder:text-muted-foreground',
          'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
      />
    </div>
  )
}
