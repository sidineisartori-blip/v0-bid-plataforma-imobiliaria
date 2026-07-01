'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Contrato } from './ERPClient'

interface ModalContratoProps {
  contrato: Contrato | null
  imoveis: { id: string; titulo: string; cidade: string; bairro: string | null }[]
  corretorId: string
  onClose: () => void
  onSucesso?: (mensagem: string) => void
}

const INPUT = {
  background: 'var(--color-dark-3)',
  border: '1px solid var(--color-dark-4)',
  borderRadius: 2,
  padding: '8px 12px',
  fontSize: 13,
  color: 'var(--color-text)',
  width: '100%',
  outline: 'none',
} as React.CSSProperties

const LABEL = {
  display: 'block',
  fontSize: 11,
  color: 'var(--color-muted)',
  marginBottom: 5,
  letterSpacing: '0.03em',
  textTransform: 'uppercase' as const,
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={LABEL}>{label}</label>
      {children}
    </div>
  )
}

export default function ModalContrato({ contrato, imoveis, corretorId, onClose, onSucesso }: ModalContratoProps) {
  const router = useRouter()
  const supabase = createClient()
  const isEdicao = !!contrato

  const [tipo, setTipo]                       = useState<'locacao' | 'venda'>(contrato?.tipo || 'locacao')
  const [status, setStatus]                   = useState(contrato?.status || 'rascunho')
  const [imovelId, setImovelId]               = useState(contrato?.imovel_id || '')
  const [clienteNome, setClienteNome]         = useState(contrato?.cliente_nome || '')
  const [clienteCpf, setClienteCpf]           = useState(contrato?.cliente_cpf_cnpj || '')
  const [clienteEmail, setClienteEmail]       = useState(contrato?.cliente_email || '')
  const [clienteWhats, setClienteWhats]       = useState(contrato?.cliente_whatsapp || '')
  const [valorContrato, setValorContrato]     = useState(String(contrato?.valor_contrato || ''))
  const [valorComissao, setValorComissao]     = useState(String(contrato?.valor_comissao || ''))
  const [percComissao, setPercComissao]       = useState(String(contrato?.percentual_comissao || ''))
  const [formaPagamento, setFormaPagamento]   = useState(contrato?.forma_pagamento || '')
  const [dataInicio, setDataInicio]           = useState(contrato?.data_inicio || '')
  const [dataFim, setDataFim]                 = useState(contrato?.data_fim || '')
  const [dataAssinatura, setDataAssinatura]   = useState(contrato?.data_assinatura || '')
  const [valorAluguel, setValorAluguel]       = useState(String(contrato?.valor_aluguel || ''))
  const [diaVencimento, setDiaVencimento]     = useState(String(contrato?.dia_vencimento || ''))
  const [indiceReajuste, setIndiceReajuste]   = useState(contrato?.indice_reajuste || 'IGPM')
  const [garantia, setGarantia]               = useState(contrato?.garantia || '')
  const [observacoes, setObservacoes]         = useState(contrato?.observacoes || '')
  const [propNome, setPropNome]               = useState(contrato?.proprietario_nome || '')
  const [propEmail, setPropEmail]             = useState(contrato?.proprietario_email || '')
  const [propPhone, setPropPhone]             = useState(contrato?.proprietario_phone || '')
  const [loading, setLoading]                 = useState(false)
  const [error, setError]                     = useState<string | null>(null)

  async function handleSalvar() {
    if (!clienteNome.trim()) { setError('Nome do cliente é obrigatório.'); return }
    if (!valorContrato || isNaN(Number(valorContrato))) { setError('Valor do contrato inválido.'); return }

    setLoading(true)
    setError(null)

    const payload = {
      corretor_id: corretorId,
      imovel_id: imovelId || null,
      tipo,
      status,
      cliente_nome: clienteNome.trim(),
      cliente_cpf_cnpj: clienteCpf || null,
      cliente_email: clienteEmail || null,
      cliente_whatsapp: clienteWhats || null,
      valor_contrato: Number(valorContrato),
      valor_comissao: valorComissao ? Number(valorComissao) : null,
      percentual_comissao: percComissao ? Number(percComissao) : null,
      forma_pagamento: formaPagamento || null,
      data_inicio: dataInicio || null,
      data_fim: dataFim || null,
      data_assinatura: dataAssinatura || null,
      valor_aluguel: tipo === 'locacao' && valorAluguel ? Number(valorAluguel) : null,
      dia_vencimento: tipo === 'locacao' && diaVencimento ? Number(diaVencimento) : null,
      indice_reajuste: tipo === 'locacao' ? indiceReajuste : null,
      garantia: tipo === 'locacao' ? (garantia || null) : null,
      observacoes: observacoes || null,
      proprietario_nome: propNome || null,
      proprietario_email: propEmail || null,
      proprietario_phone: propPhone || null,
    }

    try {
      if (isEdicao) {
        const { error: e } = await supabase
          .from('contratos')
          .update(payload)
          .eq('id', contrato!.id)
          .eq('corretor_id', corretorId)
        if (e) throw e
      } else {
        const { error: e } = await supabase.from('contratos').insert(payload)
        if (e) throw e
      }
      router.refresh()
      onSucesso?.(isEdicao ? 'Contrato atualizado com sucesso!' : 'Contrato criado com sucesso!')
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar contrato.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
      onClick={(e: React.MouseEvent<HTMLDivElement>) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: 'var(--color-dark-2)',
          border: '1px solid rgba(201,168,76,0.2)',
          borderRadius: 2,
          width: '100%',
          maxWidth: 620,
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '28px 28px',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 700, color: 'var(--color-text)' }}>
            {isEdicao ? 'Editar Contrato' : 'Novo Contrato'}
          </h2>
          <button onClick={onClose} style={{ color: 'var(--color-muted)', fontSize: 20, background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        {/* Tipo + Status */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Tipo">
            <select value={tipo} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setTipo(e.target.value as 'locacao' | 'venda')} style={INPUT}>
              <option value="locacao">Locação</option>
              <option value="venda">Venda</option>
            </select>
          </Field>
          <Field label="Status">
            <select value={status} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setStatus(e.target.value as 'ativo' | 'aguardando_assinatura' | 'rascunho' | 'encerrado' | 'cancelado')} style={INPUT}>
              <option value="rascunho">Rascunho</option>
              <option value="aguardando_assinatura">Ag. Assinatura</option>
              <option value="ativo">Ativo</option>
              <option value="encerrado">Encerrado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </Field>
        </div>

        {/* Imóvel */}
        <Field label="Imóvel (opcional)">
          <select value={imovelId} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setImovelId(e.target.value)} style={INPUT}>
            <option value="">— Selecionar imóvel —</option>
            {imoveis.map((im) => (
              <option key={im.id} value={im.id}>
                {im.titulo} · {[im.bairro, im.cidade].filter(Boolean).join(', ')}
              </option>
            ))}
          </select>
        </Field>

        {/* Divider */}
        <div style={{ borderTop: '1px solid rgba(201,168,76,0.1)', paddingTop: 4 }}>
          <p style={{ fontSize: 11, color: 'var(--color-gold)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
            Dados do Cliente
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Nome *">
              <input value={clienteNome} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setClienteNome(e.target.value)} style={INPUT} placeholder="Nome completo" />
            </Field>
            <Field label="CPF / CNPJ">
              <input value={clienteCpf} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setClienteCpf(e.target.value)} style={INPUT} placeholder="000.000.000-00" />
            </Field>
            <Field label="E-mail">
              <input type="email" value={clienteEmail} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setClienteEmail(e.target.value)} style={INPUT} placeholder="email@exemplo.com" />
            </Field>
            <Field label="WhatsApp">
              <input value={clienteWhats} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setClienteWhats(e.target.value)} style={INPUT} placeholder="(11) 99999-9999" />
            </Field>
          </div>
        </div>

        {/* Valores */}
        <div style={{ borderTop: '1px solid rgba(201,168,76,0.1)', paddingTop: 4 }}>
          <p style={{ fontSize: 11, color: 'var(--color-gold)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
            Valores & Comissão
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <Field label={tipo === 'locacao' ? 'Valor Total (R$) *' : 'Valor de Venda (R$) *'}>
              <input type="number" value={valorContrato} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setValorContrato(e.target.value)} style={INPUT} placeholder="0,00" />
            </Field>
            <Field label="Comissão (R$)">
              <input type="number" value={valorComissao} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setValorComissao(e.target.value)} style={INPUT} placeholder="0,00" />
            </Field>
            <Field label="Comissão (%)">
              <input type="number" value={percComissao} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setPercComissao(e.target.value)} style={INPUT} placeholder="6" />
            </Field>
          </div>
          <div style={{ marginTop: 12 }}>
            <Field label="Forma de Pagamento">
              <select value={formaPagamento} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setFormaPagamento(e.target.value)} style={INPUT}>
                <option value="">— Selecionar —</option>
                <option>À vista</option>
                <option>Financiamento bancário</option>
                <option>FGTS</option>
                <option>Permuta</option>
                <option>Parcelado</option>
              </select>
            </Field>
          </div>
        </div>

        {/* Datas */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <Field label="Início do Contrato">
            <input type="date" value={dataInicio} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setDataInicio(e.target.value)} style={INPUT} />
          </Field>
          {tipo === 'locacao' && (
            <Field label="Fim do Contrato">
              <input type="date" value={dataFim} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setDataFim(e.target.value)} style={INPUT} />
            </Field>
          )}
          <Field label="Data de Assinatura">
            <input type="date" value={dataAssinatura} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setDataAssinatura(e.target.value)} style={INPUT} />
          </Field>
        </div>

        {/* Locação: campos específicos */}
        {tipo === 'locacao' && (
          <div style={{ borderTop: '1px solid rgba(201,168,76,0.1)', paddingTop: 4 }}>
            <p style={{ fontSize: 11, color: 'var(--color-gold)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
              Dados da Locação
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
              <Field label="Aluguel (R$/mês)">
                <input type="number" value={valorAluguel} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setValorAluguel(e.target.value)} style={INPUT} placeholder="0,00" />
              </Field>
              <Field label="Dia Vencimento">
                <input type="number" min="1" max="31" value={diaVencimento} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setDiaVencimento(e.target.value)} style={INPUT} placeholder="5" />
              </Field>
              <Field label="Índice Reajuste">
                <select value={indiceReajuste} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setIndiceReajuste(e.target.value)} style={INPUT}>
                  <option>IGPM</option>
                  <option>IPCA</option>
                  <option>INPC</option>
                  <option>IGP-DI</option>
                </select>
              </Field>
              <Field label="Garantia">
                <select value={garantia} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setGarantia(e.target.value)} style={INPUT}>
                  <option value="">—</option>
                  <option>Caução</option>
                  <option>Fiador</option>
                  <option>Seguro Fiança</option>
                  <option>Título de Capitalização</option>
                </select>
              </Field>
            </div>
          </div>
        )}

        {/* Dados do Proprietário (para notificações de chamados de locação) */}
        {tipo === 'locacao' && (
          <div style={{ borderTop: '1px solid rgba(201,168,76,0.1)', paddingTop: 4 }}>
            <p style={{ fontSize: 11, color: 'var(--color-gold)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
              Proprietário <span style={{ fontSize: 10, color: 'var(--color-muted)', textTransform: 'none', letterSpacing: 0 }}>(para notificações de chamados)</span>
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <Field label="Nome">
                <input value={propNome} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setPropNome(e.target.value)} style={INPUT} placeholder="Nome do proprietário" />
              </Field>
              <Field label="WhatsApp">
                <input value={propPhone} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setPropPhone(e.target.value)} style={INPUT} placeholder="(11) 99999-9999" />
              </Field>
              <Field label="E-mail">
                <input type="email" value={propEmail} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setPropEmail(e.target.value)} style={INPUT} placeholder="email@proprietario.com" />
              </Field>
            </div>
          </div>
        )}

        {/* Observações */}
        <Field label="Observações">
          <textarea
            value={observacoes}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setObservacoes(e.target.value)}
            rows={3}
            style={{ ...INPUT, resize: 'vertical' }}
            placeholder="Combinados, notas adicionais..."
          />
        </Field>

        {error && <p style={{ fontSize: 12, color: '#ef4444' }}>{error}</p>}

        {/* Footer */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: '1px solid var(--color-dark-4)',
              borderRadius: 2,
              padding: '9px 18px',
              fontSize: 13,
              color: 'var(--color-muted)',
              cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSalvar}
            disabled={loading}
            style={{
              background: loading ? 'rgba(201,168,76,0.5)' : 'var(--color-gold)',
              border: 'none',
              borderRadius: 2,
              padding: '9px 22px',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--color-dark)',
              cursor: loading ? 'default' : 'pointer',
            }}
          >
            {loading ? 'Salvando...' : isEdicao ? 'Salvar Alterações' : 'Criar Contrato'}
          </button>
        </div>
      </div>
    </div>
  )
}
