'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface Mensagem {
  id: string
  negociacao_id: string
  parceria_id: string
  remetente_id: string
  conteudo: string
  fixada: boolean
  lida: boolean
  lida_em: string | null
  created_at: string
  remetente?: {
    id: string
    full_name: string
    avatar_url: string | null
  }
}

export function useChat(negociacaoId: string | null, corretorId: string) {
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens])

  useEffect(() => {
    if (!negociacaoId) return
    setLoading(true)
    setMensagens([])

    const load = async () => {
      const { data } = await supabase
        .from('mensagens')
        .select('*, remetente:corretores(id, full_name, avatar_url)')
        .eq('negociacao_id', negociacaoId)
        .order('created_at', { ascending: true })

      setMensagens((data as Mensagem[]) || [])
      setLoading(false)

      await supabase
        .from('mensagens')
        .update({ lida: true, lida_em: new Date().toISOString() })
        .eq('negociacao_id', negociacaoId)
        .neq('remetente_id', corretorId)
        .eq('lida', false)
    }

    load()

    const channel = supabase
      .channel('chat:' + negociacaoId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensagens',
          filter: `negociacao_id=eq.${negociacaoId}`,
        },
        (payload) => {
          setMensagens((prev) => {
            // evitar duplicata do optimistic update
            const existe = prev.some((m) => m.id === payload.new.id)
            if (existe) return prev
            const isTempOptimistic = prev.some(
              (m) =>
                m.id.startsWith('temp-') &&
                m.remetente_id === payload.new.remetente_id &&
                m.conteudo === payload.new.conteudo
            )
            if (isTempOptimistic) {
              return prev.map((m) =>
                m.id.startsWith('temp-') &&
                m.remetente_id === payload.new.remetente_id &&
                m.conteudo === payload.new.conteudo
                  ? (payload.new as Mensagem)
                  : m
              )
            }
            return [...prev, payload.new as Mensagem]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [negociacaoId, corretorId])

  const enviar = useCallback(
    async (conteudo: string, parceriaId: string) => {
      if (!negociacaoId || !conteudo.trim()) return

      const tempId = 'temp-' + Date.now()
      const msg: Mensagem = {
        id: tempId,
        negociacao_id: negociacaoId,
        parceria_id: parceriaId,
        remetente_id: corretorId,
        conteudo: conteudo.trim(),
        fixada: false,
        lida: false,
        lida_em: null,
        created_at: new Date().toISOString(),
      }

      setMensagens((prev) => [...prev, msg])

      await supabase.from('mensagens').insert({
        negociacao_id: negociacaoId,
        parceria_id: parceriaId,
        remetente_id: corretorId,
        conteudo: conteudo.trim(),
      })
    },
    [negociacaoId, corretorId, supabase]
  )

  const fixar = useCallback(
    async (mensagemId: string, fixada: boolean) => {
      await supabase.from('mensagens').update({ fixada }).eq('id', mensagemId)
      setMensagens((prev) => prev.map((m) => (m.id === mensagemId ? { ...m, fixada } : m)))
    },
    [supabase]
  )

  return { mensagens, loading, enviar, fixar, endRef }
}
