'use client'
import { useState, useEffect } from 'react'

type OpcaoItem = { id: string; valor: string; label: string; sistema: boolean }

// Cache de módulo — persiste enquanto a aba está aberta
const cache: Record<string, OpcaoItem[]> = {}
const inFlight: Record<string, Promise<OpcaoItem[]>> = {}

async function fetchOpcoes(categoria: string): Promise<OpcaoItem[]> {
  if (cache[categoria]) return cache[categoria]
  if (!inFlight[categoria]) {
    inFlight[categoria] = fetch(`/api/opcoes/${categoria}`)
      .then((r) => r.json())
      .then((data) => {
        cache[categoria] = Array.isArray(data) ? data : []
        delete inFlight[categoria]
        return cache[categoria]
      })
      .catch(() => {
        delete inFlight[categoria]
        return []
      })
  }
  return inFlight[categoria]
}

export function useOpcoes(categoria: string, defaults: string[] = []) {
  const [opcoes, setOpcoes] = useState<OpcaoItem[]>(
    defaults.map((v, i) => ({ id: `default-${i}`, valor: v, label: v, sistema: true }))
  )

  useEffect(() => {
    fetchOpcoes(categoria).then((data) => {
      if (data.length > 0) setOpcoes(data)
    })
  }, [categoria])

  async function adicionarOpcao(label: string): Promise<OpcaoItem | null> {
    const res = await fetch(`/api/opcoes/${categoria}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label }),
    })
    if (!res.ok) return null
    const nova: OpcaoItem = await res.json()
    const atualizado = [...opcoes, nova]
    cache[categoria] = atualizado
    setOpcoes(atualizado)
    return nova
  }

  async function removerOpcao(id: string): Promise<boolean> {
    const res = await fetch(`/api/opcoes/${categoria}/${id}`, { method: 'DELETE' })
    if (!res.ok) return false
    const atualizado = opcoes.filter((o) => o.id !== id)
    cache[categoria] = atualizado
    setOpcoes(atualizado)
    return true
  }

  return { opcoes, adicionarOpcao, removerOpcao }
}

export function invalidarCacheOpcoes(categoria?: string) {
  if (categoria) {
    delete cache[categoria]
  } else {
    Object.keys(cache).forEach((k) => delete cache[k])
  }
}
