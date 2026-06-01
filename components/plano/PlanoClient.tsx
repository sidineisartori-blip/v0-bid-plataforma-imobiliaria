'use client'

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
  valor: number
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
    periodo: 'para sempre',
    limite_imoveis: 2,
    limite_solicitacoes: 1,
    features: [
      '2 imoveis ativos',
      '1 solicitacao ativa',
      'Matching basico',
      'CRM Kanban',
      'Landing simples',
    ],
    destaque: false,
  },
  {
    id: 'pro',
    nome: 'Pro',
    preco: 'R$97',
    periodo: '/mes',
    limite_imoveis: 20,
    limite_solicitacoes: 5,
    features: [
      '20 imoveis ativos',
      '5 solicitacoes ativas',
      'Hub com 3 canais',
      'Site com portfolio',
      'WhatsApp alerts',
      'Relatorio basico',
    ],
    destaque: false,
  },
  {
    id: 'premium',
    nome: 'Premium',
    preco: 'R$197',
    periodo: '/mes',
    limite_imoveis: 999,
    limite_solicitacoes: 999,
    features: [
      'Imoveis ilimitados',
      'Solicitacoes ilimitadas',
      'Todos os canais',
      'Site completo + lancamentos',
      'IA completa',
      'Gestao anuncios pagos',
      'Relatorio avancado',
    ],
    destaque: true,
  },
  {
    id: 'imobiliaria',
    nome: 'Imobiliaria',
    preco: 'R$497',
    periodo: '/mes',
    limite_imoveis: 999,
    limite_solicitacoes: 999,
    features: [
      'Ate 10 usuarios',
      'Painel gestor equipe',
      'Relatorios consolidados',
      'Tudo do Premium',
      'API aberta',
      'Suporte prioritario',
    ],
    destaque: false,
  },
]

const historicoExemplo = [
  { data: '01/05/2025', plano: 'Pro', valor: 'R$97,00', status: 'Pago' },
  { data: '01/04/2025', plano: 'Pro', valor: 'R$97,00', status: 'Pago' },
  { data: '01/03/2025', plano: 'Pro', valor: 'R$97,00', status: 'Pago' },
]

export default function PlanoClient({ corretor, assinatura, imoveisUsados, solicitacoesUsadas }: Props) {
  const planoAtual = corretor?.plano || 'free'
  const planoAtualInfo = planos.find(p => p.id === planoAtual) || planos[0]
  const limiteImoveis = planoAtualInfo.limite_imoveis
  const pctImoveis = limiteImoveis < 999 ? Math.min((imoveisUsados / limiteImoveis) * 100, 100) : 0

  const dataInicio = corretor?.created_at
    ? new Date(corretor.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    : '—'

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1060, minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, color: '#F0EDE6', fontWeight: 700, marginBottom: 6 }}>
          Meu Plano
        </h1>
        <p style={{ fontSize: 13, color: '#9B9690' }}>
          Gerencie sua assinatura e compare os planos disponíveis.
        </p>
      </div>

      {/* Card plano atual */}
      <div style={{
        background: '#181819', border: '1px solid rgba(201,168,76,0.2)',
        borderRadius: 2, padding: '24px 28px', marginBottom: 32,
      }}>
        <p style={{ fontSize: 10, letterSpacing: '0.1em', color: '#9B9690', textTransform: 'uppercase', marginBottom: 10 }}>
          Seu Plano Atual
        </p>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 28, color: '#C9A84C', fontWeight: 700, marginBottom: 6 }}>
              {planoAtualInfo.nome}
            </div>
            <div style={{ fontSize: 12, color: '#9B9690' }}>
              Ativo desde {dataInicio}
              {limiteImoveis < 999 && (
                <> · {Math.max(0, limiteImoveis - imoveisUsados)} imoveis restantes</>
              )}
              {limiteImoveis >= 999 && <> · Imoveis ilimitados</>}
            </div>
          </div>
          {assinatura && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#5CB88A', fontWeight: 600 }}>Ativa</div>
              <div style={{ fontSize: 11, color: '#9B9690', marginTop: 2 }}>
                Renovacao mensal
              </div>
            </div>
          )}
        </div>

        {/* Barra de uso */}
        {limiteImoveis < 999 && (
          <div style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: '#9B9690' }}>Uso de imoveis</span>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {planos.map(p => {
          const isAtual = p.id === planoAtual
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
              {/* Badge Recomendado */}
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

              {/* Nome e preco */}
              <div style={{ marginBottom: 12, marginTop: p.destaque ? 8 : 0 }}>
                <div style={{ fontSize: 11, letterSpacing: '0.08em', color: '#9B9690', textTransform: 'uppercase', marginBottom: 6 }}>
                  {p.nome}
                </div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: isAtual ? '#C9A84C' : '#F0EDE6', fontWeight: 700 }}>
                  {p.preco}
                </div>
                <div style={{ fontSize: 11, color: '#9B9690' }}>{p.periodo}</div>
              </div>

              {/* Features */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                {p.features.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 12, color: '#9B9690' }}>
                    <span style={{ color: '#5CB88A', flexShrink: 0, marginTop: 1 }}>✓</span>
                    {f}
                  </div>
                ))}
              </div>

              {/* Botao */}
              {isAtual ? (
                <div style={{
                  textAlign: 'center', fontSize: 12, color: '#C9A84C',
                  border: '1px solid rgba(201,168,76,0.3)', borderRadius: 2,
                  padding: '8px', fontWeight: 600,
                }}>
                  Plano Atual
                </div>
              ) : (
                <button
                  onClick={() => alert('Em breve: integracao com gateway de pagamento.')}
                  style={{
                    background: 'none',
                    border: p.destaque ? '1px solid #C9A84C' : '1px solid #2E2E30',
                    borderRadius: 2, color: p.destaque ? '#C9A84C' : '#9B9690',
                    fontSize: 12, padding: '8px', cursor: 'pointer',
                    fontWeight: p.destaque ? 600 : 400, transition: 'all 0.15s',
                    width: '100%',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#C9A84C'; (e.currentTarget as HTMLButtonElement).style.color = '#C9A84C' }}
                  onMouseLeave={e => {
                    if (!p.destaque) { (e.currentTarget as HTMLButtonElement).style.borderColor = '#2E2E30'; (e.currentTarget as HTMLButtonElement).style.color = '#9B9690' }
                  }}
                >
                  Assinar
                </button>
              )}
            </div>
          )
        })}
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

      {/* Historico de faturamento */}
      <div>
        <p style={{ fontSize: 10, letterSpacing: '0.1em', color: '#9B9690', textTransform: 'uppercase', marginBottom: 16 }}>
          Historico de Faturamento
        </p>
        <div style={{ background: '#181819', border: '1px solid #232324', borderRadius: 2, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #232324' }}>
                {['Data', 'Plano', 'Valor', 'Status'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: '#9B9690', fontWeight: 500, letterSpacing: '0.05em' }}>
                    {h.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {historicoExemplo.map((row, i) => (
                <tr key={i} style={{ borderBottom: i < historicoExemplo.length - 1 ? '1px solid #232324' : 'none' }}>
                  <td style={{ padding: '12px 16px', color: '#9B9690' }}>{row.data}</td>
                  <td style={{ padding: '12px 16px', color: '#F0EDE6' }}>{row.plano}</td>
                  <td style={{ padding: '12px 16px', color: '#F0EDE6' }}>{row.valor}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ color: '#5CB88A', fontSize: 12 }}>{row.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
