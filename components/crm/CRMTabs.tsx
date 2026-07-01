'use client'

import { useState } from 'react'
import CRMClient from './CRMClient'
import LeadKanbanClient from './LeadKanbanClient'
import type { Lead } from './LeadKanbanClient'

interface Negociacao {
  id: string
  coluna: string
  titulo?: string | null
  detalhe?: string | null
  updated_at: string
  parceria?: {
    id?: string
    comissao_split?: string
    status?: string
    dados_liberados?: boolean
    corretor_proponente_id?: string
    corretor_receptor_id?: string
    match?: {
      score?: number
      tipo?: string
      imovel?: { titulo?: string; bairro?: string; cidade?: string; valor?: number }
      solicitacao?: { cliente_nome?: string; cidade?: string }
    }
  } | null
}

interface Props {
  negociacoes: Negociacao[]
  leads: Lead[]
  corretorId: string
}

const TABS = [
  { key: 'negociacoes', label: 'Negociações' },
  { key: 'leads',       label: 'Leads' },
] as const

type TabKey = typeof TABS[number]['key']

export default function CRMTabs({ negociacoes, leads, corretorId }: Props) {
  const [aba, setAba] = useState<TabKey>('negociacoes')

  return (
    <div>
      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: 0, borderBottom: '1px solid #232324',
        padding: '0 32px', background: 'var(--color-dark-2)',
      }}>
        {TABS.map((tab) => {
          const count = tab.key === 'negociacoes' ? negociacoes.length : leads.length
          const ativo = aba === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setAba(tab.key)}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: ativo ? '2px solid #C9A84C' : '2px solid transparent',
                padding: '14px 20px',
                fontSize: 13,
                fontWeight: ativo ? 600 : 400,
                color: ativo ? '#C9A84C' : '#9B9690',
                cursor: 'pointer',
                display: 'flex',
                gap: 7,
                alignItems: 'center',
                transition: 'color 0.15s',
              }}
            >
              {tab.label}
              {count > 0 && (
                <span style={{
                  fontSize: 10, background: ativo ? 'rgba(201,168,76,0.15)' : '#232324',
                  color: ativo ? '#C9A84C' : '#9B9690',
                  borderRadius: 9999, padding: '1px 6px', fontWeight: 600,
                }}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Content */}
      {aba === 'negociacoes' && (
        <CRMClient negociacoes={negociacoes} corretorId={corretorId} />
      )}
      {aba === 'leads' && (
        <LeadKanbanClient leads={leads} corretorId={corretorId} />
      )}
    </div>
  )
}
