import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const ETAPAS = [
  { label: 'Cadastro na plataforma', descricao: 'Conta criada e email verificado.' },
  { label: 'Informacoes pessoais', descricao: 'Nome, telefone e cidade preenchidos.' },
  { label: 'Registro do CRECI', descricao: 'CRECI e estado informados.' },
  { label: 'Validacao automatica', descricao: 'Verificacao via API COFECI.' },
  { label: 'Revisao manual', descricao: 'Analise pela equipe BID (ate 2 dias uteis).' },
  { label: 'Credenciamento ativo', descricao: 'Acesso completo liberado.' },
]

function getStatusBadge(status: string): { label: string; bg: string; color: string } {
  if (status === 'ativo')     return { label: 'Ativo',     bg: 'rgba(92,184,138,0.12)',  color: '#5CB88A' }
  if (status === 'pendente')  return { label: 'Pendente',  bg: 'rgba(201,168,76,0.12)',  color: '#C9A84C' }
  if (status === 'suspenso')  return { label: 'Suspenso',  bg: 'rgba(224,92,92,0.12)',   color: '#E05C5C' }
  if (status === 'bloqueado') return { label: 'Bloqueado', bg: 'rgba(224,92,92,0.12)',   color: '#E05C5C' }
  return { label: status, bg: '#232324', color: '#9B9690' }
}

function getEtapaAtual(status: string): number {
  if (status === 'ativo') return 6
  if (status === 'pendente') return 3
  if (status === 'suspenso' || status === 'bloqueado') return 4
  return 2
}

export default async function CredenciamentoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: corretor } = await supabase
    .from('corretores')
    .select('creci, creci_estado, creci_status, creci_validado_em, plano')
    .eq('id', user.id)
    .single()

  const status = corretor?.creci_status || 'pendente'
  const badge = getStatusBadge(status)
  const etapaAtual = getEtapaAtual(status)

  return (
    <div style={{ padding: '32px', maxWidth: '600px' }}>

      {/* Titulo */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'var(--font-serif, serif)', fontSize: '22px', fontWeight: 700, color: '#F0EDE6', margin: '0 0 4px' }}>
          Credenciamento CRECI
        </h1>
        <p style={{ fontSize: '13px', color: '#9B9690', margin: 0 }}>
          Acompanhe o status do seu credenciamento na plataforma BID.
        </p>
      </div>

      {/* Card status */}
      <div style={{
        backgroundColor: '#181819',
        border: '1px solid rgba(201,168,76,0.1)',
        borderRadius: '2px',
        padding: '24px',
        marginBottom: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '11px', color: '#9B9690', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
            Status atual
          </span>
          <span style={{ fontSize: '12px', padding: '3px 12px', borderRadius: '2px', backgroundColor: badge.bg, color: badge.color, fontWeight: 600 }}>
            {badge.label}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <p style={{ fontSize: '10px', color: '#9B9690', letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 4px' }}>CRECI</p>
            <p style={{ fontSize: '14px', color: '#F0EDE6', fontWeight: 500, margin: 0 }}>
              {corretor?.creci || '—'}
            </p>
          </div>
          <div>
            <p style={{ fontSize: '10px', color: '#9B9690', letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 4px' }}>Estado</p>
            <p style={{ fontSize: '14px', color: '#F0EDE6', fontWeight: 500, margin: 0 }}>
              {corretor?.creci_estado || '—'}
            </p>
          </div>
          <div>
            <p style={{ fontSize: '10px', color: '#9B9690', letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 4px' }}>Plano</p>
            <p style={{ fontSize: '14px', color: '#C9A84C', fontWeight: 500, margin: 0, textTransform: 'capitalize' }}>
              {corretor?.plano || 'free'}
            </p>
          </div>
          {corretor?.creci_validado_em && (
            <div>
              <p style={{ fontSize: '10px', color: '#9B9690', letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 4px' }}>Validado em</p>
              <p style={{ fontSize: '14px', color: '#F0EDE6', fontWeight: 500, margin: 0 }}>
                {new Date(corretor.creci_validado_em).toLocaleDateString('pt-BR')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Stepper */}
      <div style={{ backgroundColor: '#181819', border: '1px solid rgba(201,168,76,0.1)', borderRadius: '2px', padding: '24px' }}>
        <p style={{ fontSize: '11px', color: '#9B9690', letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 20px' }}>
          Etapas do credenciamento
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {ETAPAS.map((etapa, i) => {
            const concluida = i < etapaAtual
            const atual = i === etapaAtual - 1

            return (
              <div key={i} style={{ display: 'flex', gap: '16px', paddingBottom: i < ETAPAS.length - 1 ? '20px' : '0' }}>
                {/* Indicador */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '50%',
                    backgroundColor: concluida ? '#C9A84C' : atual ? 'rgba(201,168,76,0.15)' : '#232324',
                    border: atual ? '2px solid #C9A84C' : concluida ? '2px solid #C9A84C' : '2px solid #2E2E30',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', color: concluida ? '#0E0E0F' : atual ? '#C9A84C' : '#2E2E30',
                    fontWeight: 700, flexShrink: 0,
                  }}>
                    {concluida ? '✓' : i + 1}
                  </div>
                  {i < ETAPAS.length - 1 && (
                    <div style={{ width: '2px', flex: 1, minHeight: '20px', backgroundColor: concluida ? '#C9A84C' : '#232324', marginTop: '4px' }} />
                  )}
                </div>

                {/* Conteudo */}
                <div style={{ paddingTop: '3px', flex: 1 }}>
                  <p style={{ fontSize: '13px', color: concluida || atual ? '#F0EDE6' : '#9B9690', fontWeight: atual ? 600 : 400, margin: '0 0 2px' }}>
                    {etapa.label}
                  </p>
                  <p style={{ fontSize: '12px', color: '#9B9690', margin: 0, lineHeight: 1.5 }}>
                    {etapa.descricao}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Nota */}
      <div style={{ marginTop: '16px', padding: '12px 16px', backgroundColor: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.12)', borderRadius: '2px' }}>
        <p style={{ fontSize: '12px', color: '#9B9690', margin: 0, lineHeight: 1.6 }}>
          Revalidacao automatica mensal via API COFECI. CRECI inativo suspende a conta automaticamente.
        </p>
      </div>
    </div>
  )
}
