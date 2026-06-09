'use client'

import { useState } from 'react'

type PtsOpcao = 0 | 10 | 20 | 15

const BtnPts = ({
  valor,
  ativo,
  onClick,
}: {
  valor: PtsOpcao
  ativo: boolean
  onClick: () => void
}) => (
  <button
    onClick={onClick}
    style={{
      padding: '4px 10px', fontSize: 12, borderRadius: 2, cursor: 'pointer',
      border: ativo ? '1px solid rgba(201,168,76,0.5)' : '1px solid #2E2E30',
      background: ativo ? 'rgba(201,168,76,0.15)' : '#2E2E30',
      color: ativo ? '#C9A84C' : '#9B9690',
      fontWeight: ativo ? 600 : 400,
      transition: 'all 0.15s',
    }}
  >
    {valor === 0 ? '0 pts' : `+${valor} pts`}
  </button>
)

const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
  <button
    onClick={onChange}
    style={{
      width: 34, height: 18, borderRadius: 9, border: 'none', cursor: 'pointer',
      background: value ? '#C9A84C' : '#2E2E30',
      position: 'relative', transition: 'background 0.2s', flexShrink: 0,
    }}
  >
    <span style={{
      position: 'absolute', top: 2,
      left: value ? 18 : 2,
      width: 14, height: 14, borderRadius: '50%',
      background: value ? '#0E0E0F' : '#9B9690',
      transition: 'left 0.2s',
    }} />
  </button>
)

const variáveis = [
  { id: 'q', label: 'Quartos',    opcoes: [0, 10, 20] as PtsOpcao[] },
  { id: 'b', label: 'Banheiros',  opcoes: [0, 10, 20] as PtsOpcao[] },
  { id: 'v', label: 'Vagas',      opcoes: [0, 10, 20] as PtsOpcao[] },
  { id: 'p', label: 'Preco',      opcoes: [0, 15, 20] as PtsOpcao[] },
]

export default function MatchingPage() {
  const [pts, setPts] = useState<Record<string, PtsOpcao>>({ q: 20, b: 20, v: 20, p: 20 })
  const [bairro, setBairro] = useState(false)
  const [animal, setAnimal] = useState(false)

  const base  = Object.values(pts).reduce((a: number, b: number) => a + b, 0)
  const bonus = (bairro ? 10 : 0) + (animal ? 10 : 0)
  const max   = 80 + (bairro ? 10 : 0) + (animal ? 10 : 0)
  const total = base + bonus
  const pct   = max > 0 ? Math.round((total / max) * 100) : 0
  const aprovado = pct >= 70

  const scoreColor    = aprovado ? '#C9A84C' : '#E05C5C'
  const barColor      = aprovado ? '#C9A84C' : '#E05C5C'
  const barraWidth    = `${Math.min(pct, 100)}%`

  const detalheColor = (v: PtsOpcao) =>
    v === 20 ? '#5CB88A' : v > 0 ? '#C9A84C' : '#9B9690'

  return (
    <div style={{ padding: '32px 40px', maxWidth: 900, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, color: '#F0EDE6', fontWeight: 700, marginBottom: 6 }}>
          Motor de Matching — Como o Score e Calculado
        </h1>
        <p style={{ fontSize: 13, color: '#9B9690', lineHeight: 1.6 }}>
          Entenda como o algoritmo calcula a compatibilidade entre imoveis e solicitacoes.
          Ajuste os pesos abaixo para simular diferentes cenarios.
        </p>
      </div>

      {/* Grid 2 colunas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>

        {/* Coluna esquerda — Controles */}
        <div style={{
          background: '#181819', border: '1px solid #232324',
          borderRadius: 2, padding: '24px',
        }}>
          <p style={{ fontSize: 10, letterSpacing: '0.1em', color: '#9B9690', textTransform: 'uppercase', marginBottom: 20 }}>
            Pontuacao por Variavel
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {variáveis.map(({ id, label, opcoes }) => (
              <div key={id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: '#F0EDE6', width: 90 }}>{label}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {opcoes.map(o => (
                    <BtnPts
                      key={o}
                      valor={o}
                      ativo={pts[id] === o}
                      onClick={() => setPts((prev: Record<string, PtsOpcao>) => ({ ...prev, [id]: o }))}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid #232324', marginTop: 20, paddingTop: 20 }}>
            <p style={{ fontSize: 10, letterSpacing: '0.1em', color: '#9B9690', textTransform: 'uppercase', marginBottom: 16 }}>
              Bonus
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: 13, color: '#F0EDE6' }}>Bairro coincide</span>
                  <span style={{ fontSize: 11, color: '#5CB88A', marginLeft: 6 }}>+10 pts</span>
                </div>
                <Toggle value={bairro} onChange={() => setBairro(b => !b)} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: 13, color: '#F0EDE6' }}>Animal aceito</span>
                  <span style={{ fontSize: 11, color: '#5CB88A', marginLeft: 6 }}>+10 pts</span>
                </div>
                <Toggle value={animal} onChange={() => setAnimal(a => !a)} />
              </div>
            </div>
          </div>
        </div>

        {/* Coluna direita — Resultado */}
        <div style={{
          background: '#181819', border: '1px solid #232324',
          borderRadius: 2, padding: '24px', display: 'flex', flexDirection: 'column', gap: 20,
        }}>
          <p style={{ fontSize: 10, letterSpacing: '0.1em', color: '#9B9690', textTransform: 'uppercase' }}>
            Resultado
          </p>

          {/* Score grande */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 72, fontWeight: 700, color: scoreColor, lineHeight: 1 }}>
              {pct}%
            </div>
            <div style={{ fontSize: 13, color: '#9B9690', marginTop: 6 }}>
              {total} pts / {max} pts
            </div>
          </div>

          {/* Badge resultado */}
          <div style={{ textAlign: 'center' }}>
            <span style={{
              display: 'inline-block',
              background: aprovado ? 'rgba(92,184,138,0.12)' : 'rgba(224,92,92,0.12)',
              border: `1px solid ${aprovado ? 'rgba(92,184,138,0.3)' : 'rgba(224,92,92,0.3)'}`,
              color: aprovado ? '#5CB88A' : '#E05C5C',
              borderRadius: 2, padding: '8px 20px', fontSize: 13, fontWeight: 600,
            }}>
              {aprovado ? 'Match Gerado' : 'Arquivado Silenciosamente'}
            </span>
          </div>

          {/* Barra de progresso */}
          <div>
            <div style={{ position: 'relative', marginBottom: 24 }}>
              {/* Marcador 70% */}
              <div style={{
                position: 'absolute', left: '70%', top: -20,
                transform: 'translateX(-50%)',
                fontSize: 10, color: '#C9A84C', whiteSpace: 'nowrap',
              }}>
                70% minimo
              </div>
              <div style={{ height: 8, background: '#232324', borderRadius: 2, overflow: 'visible', position: 'relative', marginTop: 22 }}>
                <div style={{
                  height: '100%', width: barraWidth,
                  background: barColor, borderRadius: 2,
                  transition: 'width 0.3s ease, background 0.3s ease',
                }} />
                {/* Linha pontilhada 70% */}
                <div style={{
                  position: 'absolute', left: '70%', top: -4, bottom: -4,
                  width: 1,
                  borderLeft: '1px dashed rgba(201,168,76,0.5)',
                }} />
              </div>
            </div>

            {/* Detalhe por variavel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {variáveis.map(({ id, label }: { id: string; label: string }) => {
                const v = pts[id]
                const maxV = id === 'p' ? 20 : 20
                const fillPct = Math.round((v / maxV) * 100)
                return (
                  <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 12, color: '#9B9690', width: 74 }}>{label}</span>
                    <div style={{ flex: 1, height: 4, background: '#232324', borderRadius: 2 }}>
                      <div style={{ width: `${fillPct}%`, height: '100%', background: detalheColor(v), borderRadius: 2, transition: 'width 0.3s' }} />
                    </div>
                    <span style={{ fontSize: 12, color: detalheColor(v), width: 38, textAlign: 'right', fontWeight: 500 }}>
                      {v} pts
                    </span>
                  </div>
                )
              })}
              {bairro && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, color: '#9B9690', width: 74 }}>+ Bairro</span>
                  <div style={{ flex: 1, height: 4, background: '#232324', borderRadius: 2 }}>
                    <div style={{ width: '100%', height: '100%', background: '#5CB88A', borderRadius: 2 }} />
                  </div>
                  <span style={{ fontSize: 12, color: '#5CB88A', width: 38, textAlign: 'right', fontWeight: 500 }}>+10 pts</span>
                </div>
              )}
              {animal && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, color: '#9B9690', width: 74 }}>+ Animal</span>
                  <div style={{ flex: 1, height: 4, background: '#232324', borderRadius: 2 }}>
                    <div style={{ width: '100%', height: '100%', background: '#5CB88A', borderRadius: 2 }} />
                  </div>
                  <span style={{ fontSize: 12, color: '#5CB88A', width: 38, textAlign: 'right', fontWeight: 500 }}>+10 pts</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Alerta cidade */}
      <div style={{
        marginTop: 24,
        background: 'rgba(224,92,92,0.06)', border: '1px solid rgba(224,92,92,0.2)',
        borderRadius: 2, padding: '14px 20px',
        display: 'flex', gap: 12, alignItems: 'flex-start',
      }}>
        <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>⚠️</span>
        <div>
          <div style={{ fontSize: 13, color: '#E05C5C', fontWeight: 600, marginBottom: 4 }}>
            Cidade e filtro eliminatorio absoluto
          </div>
          <div style={{ fontSize: 12, color: '#9B9690', lineHeight: 1.6 }}>
            Imoveis de cidades diferentes <strong style={{ color: '#F0EDE6' }}>NUNCA aparecem no matching</strong>,
            independentemente do score calculado acima. O algoritmo so avalia variaveis de imoveis na mesma cidade da solicitacao.
          </div>
        </div>
      </div>
    </div>
  )
}
