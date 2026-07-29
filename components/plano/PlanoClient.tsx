'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

interface Corretor {
  plano: string | null
  created_at: string
  deals_closed?: number
  nota_media?: number
  total_avaliacoes?: number
}

interface Assinatura {
  id: string
  plano: string
  status: string
  created_at: string
  valor?: number | null
  mp_subscription_id?: string | null
  mp_status?: string | null
}

interface Props {
  corretor: Corretor | null
  assinatura: Assinatura | null
  imoveisUsados: number
  solicitacoesUsadas: number
}

const planos = [
  {
    id: 'free',
    nome: 'Free',
    preco: 'R$0',
    valor: 0,
    periodo: 'para sempre',
    limite_imoveis: 2,
    limite_solicitacoes: 1,
    features: [
      '2 imóveis ativos',
      '1 solicitação ativa',
      'Matching básico',
      'CRM Kanban',
      'Landing simples',
    ],
    destaque: false,
  },
  {
    id: 'pro',
    nome: 'Pro',
    preco: 'R$97',
    valor: 97,
    periodo: '/mês',
    limite_imoveis: 20,
    limite_solicitacoes: 5,
    features: [
      '20 imóveis ativos',
      '5 solicitações ativas',
      'Hub com 3 canais',
      'Site com portfólio',
      'WhatsApp alerts',
      'Relatório básico',
    ],
    destaque: false,
  },
  {
    id: 'premium',
    nome: 'Premium',
    preco: 'R$197',
    valor: 197,
    periodo: '/mês',
    limite_imoveis: 999,
    limite_solicitacoes: 999,
    features: [
      'Imóveis ilimitados',
      'Solicitações ilimitadas',
      'Todos os canais',
      'Site completo + lançamentos',
      'IA completa',
      'Gestão anúncios pagos',
      'Relatório avançado',
    ],
    destaque: true,
  },
  {
    id: 'imobiliaria',
    nome: 'Imobiliaria',
    preco: 'R$497',
    valor: 497,
    periodo: '/mês',
    limite_imoveis: 999,
    limite_solicitacoes: 999,
    features: [
      'Até 10 usuários',
      'Painel gestor de equipe',
      'Relatórios consolidados',
      'Tudo do Premium',
      'API aberta',
      'Suporte prioritário',
    ],
    destaque: false,
  },
]

export default function PlanoClient({ corretor, assinatura, imoveisUsados, solicitacoesUsadas }: Props) {
  void solicitacoesUsadas
  const searchParams = useSearchParams()
  const [assinando, setAssinando] = useState<string | null>(null)
  const [cancelando, setCancelando] = useState(false)
  const [msgSucesso, setMsgSucesso] = useState<string | null>(null)
  const [msgErro, setMsgErro] = useState<string | null>(null)
  const [confirmarCancel, setConfirmarCancel] = useState(false)

  // Detect MP redirect back
  useEffect(() => {
    const status = searchParams.get('preapproval_id') ? 'pending'
      : searchParams.get('status') || null
    if (status === 'approved' || status === 'authorized') {
      setMsgSucesso('Assinatura aprovada! Seu plano será ativado em instantes.')
    } else if (status === 'pending') {
      setMsgSucesso('Pagamento pendente. Você receberá a confirmação por email.')
    }
  }, [searchParams])

  async function handleAssinar(planoId: string) {
    if (planoId === 'free') return
    setAssinando(planoId)
    setMsgErro(null)
    try {
      const res = await fetch('/api/plano/assinar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plano: planoId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao criar assinatura')
      window.location.href = data.checkout_url
    } catch (err: unknown) {
      setMsgErro(err instanceof Error ? err.message : 'Erro inesperado')
    } finally {
      setAssinando(null)
    }
  }

  async function handleCancelar() {
    setCancelando(true)
    try {
      const res = await fetch('/api/plano/cancelar', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao cancelar')
      setMsgSucesso('Assinatura cancelada. Você continuará no plano até o fim do período.')
      setConfirmarCancel(false)
    } catch (err: unknown) {
      setMsgErro(err instanceof Error ? err.message : 'Erro ao cancelar')
    } finally {
      setCancelando(false)
    }
  }

  const planoAtual = corretor?.plano || 'free'
  const planoAtualInfo = planos.find((p) => p.id === planoAtual) || planos[0]
  const limiteImoveis = planoAtualInfo.limite_imoveis
  const pctImoveis = limiteImoveis < 999 ? Math.min((imoveisUsados / limiteImoveis) * 100, 100) : 0

  const ativoDesdeTxt = (() => {
    if (assinatura?.created_at) {
      return new Date(assinatura.created_at).toLocaleDateString('pt-BR', {
        day: '2-digit', month: 'long', year: 'numeric',
      })
    }
    if (corretor?.created_at) {
      return `Desde ${new Date(corretor.created_at).toLocaleDateString('pt-BR', {
        month: 'long', year: 'numeric',
      })}`
    }
    return 'Plano ativo'
  })()

  const assinaturaAtiva = assinatura?.mp_status === 'authorized' || assinatura?.status === 'ativo'

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1060, minHeight: '100vh' }}>
      <style>{`
        .bid-planos-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 32px;
        }
        @media (max-width: 1024px) {
          .bid-planos-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 560px) {
          .bid-planos-grid { grid-template-columns: 1fr; }
        }
        .bid-fatura-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .bid-fatura-scroll table { min-width: 480px; }
      `}</style>

      {/* Modal cancelar */}
      {confirmarCancel && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setConfirmarCancel(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#181819', border: '1px solid rgba(224,92,92,0.3)', borderRadius: 4, padding: '28px 32px', maxWidth: 380, width: '90%' }}>
            <h2 style={{ color: '#E05C5C', fontSize: 18, marginBottom: 10 }}>Cancelar assinatura?</h2>
            <p style={{ fontSize: 13, color: '#9B9690', lineHeight: 1.6, marginBottom: 20 }}>
              Você perderá acesso aos recursos do plano {planoAtualInfo.nome} ao final do período pago. Seu plano voltará para Free.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleCancelar} disabled={cancelando}
                style={{ flex: 1, padding: '9px', background: '#E05C5C', border: 'none', borderRadius: 2, color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                {cancelando ? 'Cancelando...' : 'Sim, cancelar'}
              </button>
              <button onClick={() => setConfirmarCancel(false)}
                style={{ flex: 1, padding: '9px', background: 'none', border: '1px solid #2E2E30', borderRadius: 2, color: '#9B9690', fontSize: 13, cursor: 'pointer' }}>
                Manter plano
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, color: '#F0EDE6', fontWeight: 700, marginBottom: 6 }}>
          Meu Plano
        </h1>
        <p style={{ fontSize: 13, color: '#9B9690' }}>
          Gerencie sua assinatura e compare os planos disponíveis.
        </p>
      </div>

      {/* Mensagens */}
      {msgSucesso && (
        <div style={{ background: 'rgba(92,184,138,0.1)', border: '1px solid rgba(92,184,138,0.3)', borderRadius: 2, padding: '12px 16px', marginBottom: 20, color: '#5CB88A', fontSize: 13 }}>
          ✓ {msgSucesso}
        </div>
      )}
      {msgErro && (
        <div style={{ background: 'rgba(224,92,92,0.1)', border: '1px solid rgba(224,92,92,0.3)', borderRadius: 2, padding: '12px 16px', marginBottom: 20, color: '#E05C5C', fontSize: 13 }}>
          ✗ {msgErro}
        </div>
      )}

      {/* Card plano atual */}
      <div style={{
        background: '#181819', border: '1px solid rgba(201,168,76,0.2)',
        borderRadius: 2, padding: '24px 28px', marginBottom: 32,
      }}>
        <p style={{ fontSize: 10, letterSpacing: '0.1em', color: '#9B9690', textTransform: 'uppercase', marginBottom: 10 }}>
          Seu Plano Atual
        </p>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 28, color: '#C9A84C', fontWeight: 700, marginBottom: 6 }}>
              {planoAtualInfo.nome}
            </div>
            <div style={{ fontSize: 12, color: '#9B9690' }}>
              {ativoDesdeTxt}
              {limiteImoveis < 999 && (
                <> · {Math.max(0, limiteImoveis - imoveisUsados)} imóveis restantes</>
              )}
              {limiteImoveis >= 999 && <> · Imóveis ilimitados</>}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            {assinaturaAtiva ? (
              <>
                <div style={{ fontSize: 11, color: '#5CB88A', fontWeight: 600 }}>● Ativa</div>
                <div style={{ fontSize: 11, color: '#9B9690', marginTop: 2 }}>Cobrança mensal automática</div>
                {planoAtual !== 'free' && (
                  <button
                    onClick={() => setConfirmarCancel(true)}
                    style={{ marginTop: 8, fontSize: 11, color: '#E05C5C', background: 'none', border: '1px solid rgba(224,92,92,0.2)', borderRadius: 2, padding: '4px 10px', cursor: 'pointer' }}
                  >
                    Cancelar assinatura
                  </button>
                )}
              </>
            ) : assinatura?.status === 'pendente' ? (
              <div style={{ fontSize: 11, color: '#C9A84C' }}>⏳ Aguardando pagamento</div>
            ) : null}
          </div>
        </div>

        {/* Barra de uso */}
        {limiteImoveis < 999 && (
          <div style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: '#9B9690' }}>Uso de imóveis</span>
              <span style={{ fontSize: 11, color: '#9B9690' }}>{imoveisUsados} / {limiteImoveis}</span>
            </div>
            <div style={{ height: 6, background: '#232324', borderRadius: 2 }}>
              <div style={{
                width: `${pctImoveis}%`, height: '100%', borderRadius: 2,
                background: pctImoveis >= 90 ? '#E05C5C' : '#C9A84C',
                transition: 'width 0.3s',
              }} />
            </div>
          </div>
        )}
      </div>

      {/* Grid de planos */}
      <div className="bid-planos-grid">
        {planos.map((p) => {
          const isAtual = p.id === planoAtual
          const carregando = assinando === p.id
          return (
            <div
              key={p.id}
              style={{
                background: '#181819',
                border: isAtual
                  ? '1px solid rgba(201,168,76,0.4)'
                  : p.destaque
                  ? '1px solid #C9A84C'
                  : '1px solid #232324',
                borderRadius: 2, padding: '20px',
                display: 'flex', flexDirection: 'column',
                position: 'relative',
              }}
            >
              {p.destaque && (
                <div style={{
                  position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                  background: '#C9A84C', color: '#0E0E0F',
                  fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 2,
                  whiteSpace: 'nowrap', letterSpacing: '0.05em',
                }}>
                  RECOMENDADO
                </div>
              )}

              <div style={{ marginBottom: 12, marginTop: p.destaque ? 8 : 0 }}>
                <div style={{ fontSize: 11, letterSpacing: '0.08em', color: '#9B9690', textTransform: 'uppercase', marginBottom: 6 }}>
                  {p.nome}
                </div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: isAtual ? '#C9A84C' : '#F0EDE6', fontWeight: 700 }}>
                  {p.preco}
                </div>
                <div style={{ fontSize: 11, color: '#9B9690' }}>{p.periodo}</div>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                {p.features.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 12, color: '#9B9690' }}>
                    <span style={{ color: '#5CB88A', flexShrink: 0, marginTop: 1 }}>✓</span>
                    {f}
                  </div>
                ))}
              </div>

              {isAtual ? (
                <div style={{
                  textAlign: 'center', fontSize: 12, color: '#C9A84C',
                  border: '1px solid rgba(201,168,76,0.3)', borderRadius: 2,
                  padding: '8px', fontWeight: 600,
                }}>
                  Plano Atual
                </div>
              ) : p.id === 'free' ? (
                <div style={{
                  textAlign: 'center', fontSize: 12, color: '#9B9690',
                  border: '1px solid #2E2E30', borderRadius: 2, padding: '8px',
                }}>
                  Gratuito
                </div>
              ) : (
                <button
                  onClick={() => handleAssinar(p.id)}
                  disabled={!!assinando}
                  style={{
                    background: carregando ? 'rgba(201,168,76,0.5)' : 'none',
                    border: p.destaque ? '1px solid #C9A84C' : '1px solid #2E2E30',
                    borderRadius: 2, color: p.destaque ? '#C9A84C' : '#9B9690',
                    fontSize: 12, padding: '8px', cursor: carregando ? 'default' : 'pointer',
                    fontWeight: p.destaque ? 600 : 400, width: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}
                >
                  {carregando ? 'Redirecionando…' : (
                    <>
                      <span>Assinar com</span>
                      <span style={{ color: '#009ee3', fontWeight: 700 }}>MercadoPago</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Info MercadoPago */}
      <div style={{
        background: 'rgba(0,158,227,0.04)', border: '1px solid rgba(0,158,227,0.15)',
        borderRadius: 2, padding: '14px 20px', marginBottom: 32,
        display: 'flex', gap: 12, alignItems: 'flex-start',
      }}>
        <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>🔒</span>
        <div style={{ fontSize: 12, color: '#9B9690', lineHeight: 1.7 }}>
          <strong style={{ color: '#009ee3' }}>Pagamento seguro via MercadoPago.</strong>{' '}
          Cobrança recorrente mensal automática. Cancele a qualquer momento sem multa.
          Aceitamos cartão de crédito, Pix e boleto.
        </div>
      </div>

      {/* Nota efeito de rede */}
      <div style={{
        background: 'rgba(201,168,76,0.04)', border: '1px solid rgba(201,168,76,0.15)',
        borderRadius: 2, padding: '14px 20px', marginBottom: 32,
        display: 'flex', gap: 12, alignItems: 'flex-start',
      }}>
        <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>💡</span>
        <div style={{ fontSize: 12, color: '#9B9690', lineHeight: 1.7 }}>
          <strong style={{ color: '#C9A84C' }}>Efeito de rede:</strong>{' '}
          Corretores Free geram matches com corretores pagos. O parceiro precisa se cadastrar para acessar os dados —
          expandindo organicamente a rede BID pelo Brasil.
        </div>
      </div>

      {/* Histórico de faturamento */}
      {assinatura && (
        <div>
          <p style={{ fontSize: 10, letterSpacing: '0.1em', color: '#9B9690', textTransform: 'uppercase', marginBottom: 16 }}>
            Assinatura Atual
          </p>
          <div style={{ background: '#181819', border: '1px solid #232324', borderRadius: 2, padding: '16px 20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
              {[
                ['Plano', assinatura.plano?.toUpperCase()],
                ['Valor', assinatura.valor ? `R$${assinatura.valor}/mês` : '—'],
                ['Status MP', assinatura.mp_status || assinatura.status],
                ['ID Assinatura', assinatura.mp_subscription_id ? `${assinatura.mp_subscription_id.slice(0, 12)}…` : 'Manual'],
              ].map(([label, value]) => (
                <div key={label}>
                  <p style={{ fontSize: 10, color: '#9B9690', marginBottom: 4 }}>{label}</p>
                  <p style={{ fontSize: 13, color: '#F0EDE6' }}>{value || '—'}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
