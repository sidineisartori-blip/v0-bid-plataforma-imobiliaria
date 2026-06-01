'use client'

import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useChat } from '@/hooks/useChat'

interface Corretor {
  id: string
  full_name: string
  avatar_url: string | null
}

interface Parceria {
  id: string
  comissao_split: number | null
  corretor_proponente_id: string
  corretor_receptor_id: string
  match?: {
    imovel?: { titulo?: string; bairro?: string; cidade?: string }
    solicitacao?: { cliente_nome?: string }
  } | null
  proponente?: Corretor | null
  receptor?: Corretor | null
}

interface Negociacao {
  id: string
  coluna: string
  updated_at: string
  parceria?: Parceria | null
}

interface NaoLida {
  negociacao_id: string
}

interface ChatClientProps {
  negociacoes: Negociacao[]
  naoLidas: NaoLida[]
  corretorId: string
}

function iniciais(nome: string) {
  return nome
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
}

function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function Avatar({ nome, size = 32 }: { nome: string; size?: number }) {
  return (
    <div
      className="flex items-center justify-center flex-shrink-0 rounded-sm font-semibold"
      style={{
        width: size,
        height: size,
        backgroundColor: 'rgba(201,168,76,0.15)',
        color: 'var(--color-gold)',
        fontSize: size * 0.35,
      }}
    >
      {iniciais(nome)}
    </div>
  )
}

export default function ChatClient({ negociacoes, naoLidas, corretorId }: ChatClientProps) {
  const router = useRouter()
  const [negociacaoAtiva, setNegociacaoAtiva] = useState<Negociacao | null>(
    negociacoes[0] || null
  )
  const [texto, setTexto] = useState('')
  const [fixarInput, setFixarInput] = useState(false)
  const [combinadoTexto, setCombinadoTexto] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const parceria = negociacaoAtiva?.parceria || null
  const parceriaId = parceria?.id || ''

  const { mensagens, loading, enviar, fixar, endRef } = useChat(
    negociacaoAtiva?.id || null,
    corretorId
  )

  const naoLidasMap: Record<string, number> = {}
  for (const nl of naoLidas) {
    naoLidasMap[nl.negociacao_id] = (naoLidasMap[nl.negociacao_id] || 0) + 1
  }
  const totalNaoLidas = naoLidas.length

  function getParceiro(neg: Negociacao): Corretor | null {
    const p = neg.parceria
    if (!p) return null
    return p.corretor_proponente_id === corretorId ? p.receptor || null : p.proponente || null
  }

  function getDescricaoNeg(neg: Negociacao): string {
    const m = neg.parceria?.match
    if (m?.imovel?.titulo) return m.imovel.titulo
    if (m?.solicitacao?.cliente_nome) return `Solicitação — ${m.solicitacao.cliente_nome}`
    return `Negociação #${neg.id.slice(0, 6)}`
  }

  const mensagemFixada = mensagens.find((m) => m.fixada) || null

  async function handleEnviar() {
    if (!texto.trim() || !parceriaId) return
    await enviar(texto, parceriaId)
    setTexto('')
  }

  async function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') await handleEnviar()
  }

  async function handleFixarCombinado() {
    if (!combinadoTexto.trim()) return
    // Insere mensagem especial de combinado e fixa
    await enviar('[COMBINADO] ' + combinadoTexto, parceriaId)
    setCombinadoTexto('')
    setFixarInput(false)
  }

  useEffect(() => {
    inputRef.current?.focus()
  }, [negociacaoAtiva])

  const parceiro = negociacaoAtiva ? getParceiro(negociacaoAtiva) : null

  return (
    <div
      className="flex"
      style={{ height: 'calc(100vh - 112px)', color: 'var(--color-text)' }}
    >
      {/* Lista de conversas */}
      <aside
        className="flex flex-col border-r flex-shrink-0"
        style={{
          width: 220,
          backgroundColor: 'var(--color-dark-2)',
          borderColor: 'rgba(201,168,76,0.12)',
        }}
      >
        {/* Header lista */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b"
          style={{ borderColor: 'rgba(201,168,76,0.1)' }}
        >
          <span className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text)' }}>
            Conversas
          </span>
          {totalNaoLidas > 0 && (
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm"
              style={{ backgroundColor: 'var(--color-red)', color: '#fff' }}
            >
              {totalNaoLidas}
            </span>
          )}
        </div>

        {/* Itens */}
        <div className="flex-1 overflow-y-auto">
          {negociacoes.length === 0 ? (
            <p className="px-4 py-6 text-[12px]" style={{ color: 'var(--color-muted)' }}>
              Nenhuma negociação ativa.
            </p>
          ) : (
            negociacoes.map((neg) => {
              const parceirodaNeg = getParceiro(neg)
              const descricao = getDescricaoNeg(neg)
              const qtdNaoLidas = naoLidasMap[neg.id] || 0
              const ativo = negociacaoAtiva?.id === neg.id

              return (
                <button
                  key={neg.id}
                  onClick={() => setNegociacaoAtiva(neg)}
                  className="w-full text-left px-4 py-3 flex flex-col gap-0.5 border-b transition-colors"
                  style={{
                    backgroundColor: ativo ? 'rgba(201,168,76,0.07)' : 'transparent',
                    borderColor: 'rgba(201,168,76,0.07)',
                    borderLeft: ativo ? '2px solid var(--color-gold)' : '2px solid transparent',
                  }}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className="text-[12px] font-bold truncate"
                      style={{ color: 'var(--color-text)' }}
                    >
                      {parceirodaNeg?.full_name || 'Parceiro'}
                    </span>
                    {qtdNaoLidas > 0 && (
                      <span
                        className="text-[9px] font-bold px-1 py-0.5 rounded-sm flex-shrink-0"
                        style={{ backgroundColor: 'var(--color-red)', color: '#fff' }}
                      >
                        {qtdNaoLidas}
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] truncate" style={{ color: 'var(--color-muted)' }}>
                    {descricao}
                  </span>
                  <span className="text-[9px]" style={{ color: 'var(--color-dark-4)' }}>
                    {new Date(neg.updated_at).toLocaleDateString('pt-BR')}
                  </span>
                </button>
              )
            })
          )}
        </div>
      </aside>

      {/* Janela do chat */}
      {negociacaoAtiva && parceiro ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header chat */}
          <div
            className="flex items-center justify-between px-5 py-3 border-b flex-shrink-0"
            style={{
              backgroundColor: 'var(--color-dark-2)',
              borderColor: 'rgba(201,168,76,0.12)',
            }}
          >
            <div className="flex items-center gap-3">
              <Avatar nome={parceiro.full_name} size={36} />
              <div>
                <p className="text-[13px] font-semibold" style={{ color: 'var(--color-text)' }}>
                  {parceiro.full_name}
                </p>
                <p className="text-[11px]" style={{ color: 'var(--color-muted)' }}>
                  {getDescricaoNeg(negociacaoAtiva)} &middot; {negociacaoAtiva.coluna}
                </p>
              </div>
            </div>
            <button
              onClick={() => setFixarInput((v) => !v)}
              className="text-[11px] px-3 py-1.5 rounded-sm border transition-colors"
              style={{
                borderColor: fixarInput ? 'var(--color-gold)' : 'rgba(201,168,76,0.25)',
                color: fixarInput ? 'var(--color-gold)' : 'var(--color-muted)',
                backgroundColor: fixarInput ? 'rgba(201,168,76,0.07)' : 'transparent',
              }}
            >
              Fixar combinado
            </button>
          </div>

          {/* Input fixar combinado */}
          {fixarInput && (
            <div
              className="flex items-center gap-3 px-5 py-2.5 border-b"
              style={{
                backgroundColor: 'rgba(201,168,76,0.04)',
                borderColor: 'rgba(201,168,76,0.14)',
              }}
            >
              <input
                autoFocus
                value={combinadoTexto}
                onChange={(e) => setCombinadoTexto(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleFixarCombinado() }}
                placeholder="Digite o combinado que será fixado..."
                className="flex-1 bg-transparent outline-none text-[12px]"
                style={{ color: 'var(--color-text)' }}
              />
              <button
                onClick={handleFixarCombinado}
                className="text-[11px] px-3 py-1.5 rounded-sm font-medium"
                style={{ backgroundColor: 'var(--color-gold)', color: 'var(--color-dark)' }}
              >
                Fixar
              </button>
            </div>
          )}

          {/* Mensagem fixada */}
          {mensagemFixada && (
            <div
              className="flex items-start gap-2 px-5 py-2.5 border-b"
              style={{
                backgroundColor: 'rgba(201,168,76,0.07)',
                borderColor: 'rgba(201,168,76,0.14)',
              }}
            >
              <span className="text-[10px] font-bold mt-0.5" style={{ color: 'var(--color-gold)' }}>
                COMBINADO
              </span>
              <p className="text-[11px] leading-relaxed flex-1" style={{ color: 'var(--color-gold)' }}>
                {mensagemFixada.conteudo.replace('[COMBINADO] ', '')}
              </p>
              <button
                onClick={() => fixar(mensagemFixada.id, false)}
                className="text-[10px] flex-shrink-0"
                style={{ color: 'var(--color-muted)' }}
              >
                Remover
              </button>
            </div>
          )}

          {/* Área de mensagens */}
          <div
            className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3"
            style={{ backgroundColor: 'var(--color-dark)' }}
          >
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-[13px]" style={{ color: 'var(--color-muted)' }}>
                  Carregando mensagens...
                </p>
              </div>
            ) : mensagens.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-[13px]" style={{ color: 'var(--color-muted)' }}>
                  Nenhuma mensagem ainda. Diga olá!
                </p>
              </div>
            ) : (
              mensagens.map((msg) => {
                const isEnviada = msg.remetente_id === corretorId
                return (
                  <div
                    key={msg.id}
                    className="flex"
                    style={{ justifyContent: isEnviada ? 'flex-end' : 'flex-start' }}
                  >
                    <div style={{ maxWidth: '66%' }}>
                      <div
                        className="rounded-sm px-3 py-2 text-[13px] leading-relaxed"
                        style={{
                          backgroundColor: isEnviada
                            ? 'rgba(201,168,76,0.14)'
                            : 'var(--color-dark-3)',
                          color: isEnviada ? '#F5E9C8' : 'var(--color-text)',
                        }}
                      >
                        {msg.conteudo}
                      </div>
                      <div
                        className="flex items-center gap-1 mt-0.5"
                        style={{ justifyContent: isEnviada ? 'flex-end' : 'flex-start' }}
                      >
                        <span className="text-[9px]" style={{ color: 'var(--color-muted)' }}>
                          {formatHora(msg.created_at)}
                        </span>
                        {isEnviada && (
                          <span
                            className="text-[9px]"
                            style={{ color: msg.lida ? 'var(--color-blue)' : 'var(--color-muted)' }}
                          >
                            {msg.lida ? '✓✓' : '✓'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={endRef} />
          </div>

          {/* Input de envio */}
          <div
            className="flex items-center gap-3 px-5 py-3 border-t flex-shrink-0"
            style={{
              backgroundColor: 'var(--color-dark-2)',
              borderColor: 'rgba(201,168,76,0.12)',
            }}
          >
            <input
              ref={inputRef}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite uma mensagem... (Enter para enviar)"
              className="flex-1 rounded-sm px-3 py-2 text-[13px] outline-none"
              style={{
                backgroundColor: 'var(--color-dark-3)',
                border: '1px solid rgba(201,168,76,0.14)',
                color: 'var(--color-text)',
              }}
            />
            <button
              onClick={handleEnviar}
              disabled={!texto.trim()}
              className="px-4 py-2 rounded-sm text-[13px] font-semibold transition-opacity"
              style={{
                backgroundColor: 'var(--color-gold)',
                color: 'var(--color-dark)',
                opacity: texto.trim() ? 1 : 0.4,
              }}
            >
              Enviar
            </button>
          </div>
        </div>
      ) : (
        <div
          className="flex-1 flex flex-col items-center justify-center gap-4"
          style={{ backgroundColor: 'var(--color-dark)' }}
        >
          {negociacoes.length === 0 ? (
            <>
              <p className="text-[17px] font-medium" style={{ color: '#F0EDE6' }}>Nenhuma conversa ainda</p>
              <p className="text-[14px] text-center" style={{ color: 'var(--color-muted)', maxWidth: '320px', lineHeight: 1.6 }}>
                Aceite um match e proponha uma parceria para iniciar uma conversa com seu corretor parceiro.
              </p>
              <button
                onClick={() => router.push('/matches')}
                style={{
                  backgroundColor: '#C9A84C', color: '#0E0E0F',
                  border: 'none', borderRadius: '2px', padding: '10px 24px',
                  fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                }}
              >
                Ver Matches disponíveis
              </button>
            </>
          ) : (
            <p className="text-[14px]" style={{ color: 'var(--color-muted)' }}>
              Selecione uma conversa ao lado.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
