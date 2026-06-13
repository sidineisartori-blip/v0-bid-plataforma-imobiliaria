'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Imovel, Cidade } from '@/types/bid'
import { TIPO_IMOVEL_OPTIONS } from '@/lib/format'

interface ModalImovelProps {
  imovel?: Imovel | null
  corretorId: string
  corretorNome?: string
  corretorCreci?: string
  cidades: Cidade[]
  onClose: () => void
}

interface ViaCepResponse {
  cep: string
  logradouro: string
  bairro: string
  localidade: string
  uf: string
  erro?: boolean
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: '#232324',
  border: '1px solid #2E2E30',
  borderRadius: '2px',
  padding: '9px 12px',
  fontSize: '13px',
  color: '#F0EDE6',
  outline: 'none',
}

const labelStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#9B9690',
  marginBottom: '4px',
  display: 'block',
}

const sectionTitleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-serif)',
  fontSize: '13px',
  color: '#C9A84C',
  marginBottom: '12px',
  paddingBottom: '8px',
  borderBottom: '1px solid #232324',
}

type FormData = {
  tipo_negocio: 'Venda' | 'Locação'
  tipo_imovel: string
  titulo: string
  descricao: string
  cep: string
  cidade: string
  estado: string
  bairro: string
  logradouro: string
  numero: string
  complemento: string
  quartos: number
  banheiros: number
  vagas: number
  area_total: string
  valor: string
  aceita_animal: boolean
  lancamento: boolean
  publico_no_site: boolean
  // Proprietário
  prop_nome: string
  prop_cpf_cnpj: string
  prop_nacionalidade: string
  prop_estado_civil: string
  prop_profissao: string
  prop_rg: string
  prop_whatsapp: string
  prop_email: string
  // Cônjuge (condicional)
  prop_conjuge_nome: string
  prop_conjuge_cpf: string
  prop_conjuge_whatsapp: string
  // Imóvel
  prop_matricula: string
  cartorio_registro: string
  // Condições financeiras
  percentual_comissao: string
  formas_pagamento: string[]
  aceita_negociacao: string
  // Prazo
  validade_autorizacao: string
  exclusividade: string
}

const MIN_FOTOS = 5
const MAX_FOTOS = 30

export default function ModalImovel({ imovel, corretorId, corretorNome = 'Corretor', corretorCreci = '', cidades, onClose }: ModalImovelProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [cepLoading, setCepLoading] = useState(false)
  const [cepError, setCepError] = useState('')
  const [cepOk, setCepOk] = useState(false)
  const [activeTab, setActiveTab] = useState<'dados' | 'compativeis'>('dados')
  const [compativeis, setCompativeis] = useState<Record<string, unknown>[]>([])
  const [compativeisLoading, setCompativeisLoading] = useState(false)
  const [matchLoading, setMatchLoading] = useState<string | null>(null)
  const [matchFeito, setMatchFeito] = useState<Set<string>>(new Set())

  // Fotos
  const [fotos, setFotos] = useState<File[]>([])
  const [fotosExistentes, setFotosExistentes] = useState<string[]>(imovel?.image_urls || [])
  const [fotosUploadando, setFotosUploadando] = useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<FormData>({
    tipo_negocio: imovel?.tipo_negocio || 'Venda',
    tipo_imovel: imovel?.tipo_imovel || 'Apartamento',
    titulo: imovel?.titulo || '',
    descricao: imovel?.descricao || '',
    cep: imovel?.cep ? imovel.cep.replace(/(\d{5})(\d{3})/, '$1-$2') : '',
    cidade: imovel?.cidade || '',
    estado: imovel?.estado || '',
    bairro: imovel?.bairro || '',
    logradouro: imovel?.logradouro || '',
    numero: imovel?.numero || '',
    complemento: imovel?.complemento || '',
    quartos: imovel?.quartos || 0,
    banheiros: imovel?.banheiros || 0,
    vagas: imovel?.vagas || 0,
    area_total: imovel?.area_total?.toString() || '',
    valor: imovel?.valor?.toString() || '',
    aceita_animal: imovel?.aceita_animal || false,
    lancamento: imovel?.lancamento || false,
    publico_no_site: imovel?.publico_no_site || false,
    prop_nome: imovel?.prop_nome || '',
    prop_cpf_cnpj: imovel?.prop_cpf_cnpj || '',
    prop_nacionalidade: imovel?.prop_nacionalidade || '',
    prop_estado_civil: imovel?.prop_estado_civil || '',
    prop_profissao: imovel?.prop_profissao || '',
    prop_rg: imovel?.prop_rg || '',
    prop_whatsapp: imovel?.prop_whatsapp || '',
    prop_email: imovel?.prop_email || '',
    prop_conjuge_nome: imovel?.prop_conjuge_nome || '',
    prop_conjuge_cpf: imovel?.prop_conjuge_cpf || '',
    prop_conjuge_whatsapp: imovel?.prop_conjuge_whatsapp || '',
    prop_matricula: imovel?.prop_matricula || '',
    cartorio_registro: imovel?.cartorio_registro || '',
    percentual_comissao: imovel?.percentual_comissao || '',
    formas_pagamento: imovel?.formas_pagamento || [],
    aceita_negociacao: imovel?.aceita_negociacao || '',
    validade_autorizacao: imovel?.validade_autorizacao || '',
    exclusividade: imovel?.exclusividade || '',
  })

  const mostrarConjuge = form.prop_estado_civil === 'Casado(a)' || form.prop_estado_civil === 'União Estável'

  function toggleFormaPagamento(forma: string) {
    setForm((prev) => {
      const atual = prev.formas_pagamento
      return {
        ...prev,
        formas_pagamento: atual.includes(forma)
          ? atual.filter((f) => f !== forma)
          : [...atual, forma],
      }
    })
  }

  async function buscarCep(cepRaw: string) {
    const cep = cepRaw.replace(/\D/g, '')
    if (cep.length !== 8) return
    setCepLoading(true)
    setCepError('')
    setCepOk(false)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data: ViaCepResponse = await res.json()
      if (data.erro) {
        setCepError('CEP não encontrado. Verifique o número e tente novamente.')
        setCepLoading(false)
        return
      }
      setForm((prev) => ({
        ...prev,
        cidade: data.localidade,
        estado: data.uf,
        bairro: data.bairro || prev.bairro,
        logradouro: data.logradouro || '',
      }))
      setCepOk(true)
    } catch {
      setCepError('Erro ao consultar CEP. Verifique sua conexão.')
    }
    setCepLoading(false)
  }

  function handleCepChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 8)
    const formatted = raw.length > 5 ? `${raw.slice(0, 5)}-${raw.slice(5)}` : raw
    set('cep', formatted)
    if (raw.length === 8) buscarCep(raw)
  }

  const set = (field: keyof FormData, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  function handleFotosChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    const total = fotos.length + fotosExistentes.length + files.length
    if (total > MAX_FOTOS) {
      alert(`Máximo de ${MAX_FOTOS} fotos permitido.`)
      return
    }
    setFotos((prev) => [...prev, ...files])
    // Limpa o input para permitir selecionar os mesmos arquivos novamente
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function removerFotoNova(index: number) {
    setFotos((prev) => prev.filter((_, i) => i !== index))
  }

  function removerFotoExistente(url: string) {
    setFotosExistentes((prev) => prev.filter((u) => u !== url))
  }

  async function uploadFotos(imovelId: string): Promise<string[]> {
    if (fotos.length === 0) return fotosExistentes
    setFotosUploadando(true)
    const urls: string[] = [...fotosExistentes]
    for (const file of fotos) {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const path = `${corretorId}/${imovelId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('imoveis')
        .upload(path, file, { upsert: true })
      if (!uploadErr) {
        const { data } = supabase.storage.from('imoveis').getPublicUrl(path)
        urls.push(data.publicUrl)
      }
    }
    setFotosUploadando(false)
    return urls
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!form.cidade) {
      setError('Informe um CEP válido para preencher a cidade automaticamente.')
      setLoading(false)
      return
    }

    const payload: Record<string, unknown> = {
      corretor_id: corretorId,
      tipo_negocio: form.tipo_negocio,
      tipo_imovel: form.tipo_imovel,
      titulo: form.titulo,
      descricao: form.descricao || null,
      cep: form.cep.replace(/\D/g, '') || null,
      cidade: form.cidade,
      estado: form.estado || null,
      bairro: form.bairro || null,
      logradouro: form.logradouro || null,
      numero: form.numero || null,
      complemento: form.complemento || null,
      quartos: form.quartos,
      banheiros: form.banheiros,
      vagas: form.vagas,
      area_total: form.area_total ? parseFloat(form.area_total) : null,
      valor: parseFloat(form.valor || '0'),
      aceita_animal: form.aceita_animal,
      lancamento: form.lancamento,
      publico_no_site: form.publico_no_site,
      matching_ativo: imovel?.matching_ativo ?? false,
      status: imovel?.status || 'aguardando_assinatura',
      // Proprietário
      prop_nome: form.prop_nome || null,
      prop_cpf_cnpj: form.prop_cpf_cnpj || null,
      prop_nacionalidade: form.prop_nacionalidade || null,
      prop_estado_civil: form.prop_estado_civil || null,
      prop_profissao: form.prop_profissao || null,
      prop_rg: form.prop_rg || null,
      prop_whatsapp: form.prop_whatsapp || null,
      prop_email: form.prop_email || null,
      prop_conjuge_nome: mostrarConjuge ? (form.prop_conjuge_nome || null) : null,
      prop_conjuge_cpf: mostrarConjuge ? (form.prop_conjuge_cpf || null) : null,
      prop_conjuge_whatsapp: mostrarConjuge ? (form.prop_conjuge_whatsapp || null) : null,
      // Imóvel
      prop_matricula: form.prop_matricula || null,
      cartorio_registro: form.cartorio_registro || null,
      // Condições financeiras
      percentual_comissao: form.percentual_comissao || null,
      formas_pagamento: form.formas_pagamento.length > 0 ? form.formas_pagamento : null,
      aceita_negociacao: form.aceita_negociacao || null,
      // Prazo
      validade_autorizacao: form.validade_autorizacao || null,
      exclusividade: form.exclusividade || null,
    }

    if (imovel?.id) payload.id = imovel.id

    // Primeiro upsert para obter o id do imóvel
    const { data: imovelSalvo, error: err } = await supabase
      .from('imoveis')
      .upsert(payload)
      .select('id')
      .single()

    if (err || !imovelSalvo) {
      setError(err?.message || 'Erro ao salvar imóvel.')
      setLoading(false)
      return
    }

    // Upload das fotos e atualiza image_urls
    if (fotos.length > 0 || fotosExistentes.length !== (imovel?.image_urls?.length ?? 0)) {
      const imageUrls = await uploadFotos(imovelSalvo.id)
      await supabase
        .from('imoveis')
        .update({ image_urls: imageUrls })
        .eq('id', imovelSalvo.id)
    }

    router.refresh()

    // Envio de autorização via WhatsApp se proprietário tiver telefone
    if (form.prop_whatsapp && form.prop_nome) {
      const dataHoje = new Date().toLocaleDateString('pt-BR', { 
        day: '2-digit', month: 'long', year: 'numeric' 
      })
      const diasValidade = form.validade_autorizacao === '30 dias' ? 30
        : form.validade_autorizacao === '60 dias' ? 60
        : form.validade_autorizacao === '180 dias' ? 180
        : 90
      const dataVencimento = new Date(Date.now() + diasValidade * 24 * 60 * 60 * 1000)
        .toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

      const contrato = `AUTORIZAÇÃO DE ${form.tipo_negocio.toUpperCase()} DE IMÓVEL
Plataforma BID — ${dataHoje}

━━━━━━━━━━━━━━━━━━━━━━━━━
1. QUALIFICAÇÃO DAS PARTES
━━━━━━━━━━━━━━━━━━━━━━━━━

PROPRIETÁRIO(A):
Nome: ${form.prop_nome}
CPF: ${form.prop_cpf_cnpj || 'A confirmar'}
WhatsApp: ${form.prop_whatsapp}

INTERMEDIÁRIO:
Corretor: ${corretorNome}
CRECI: ${corretorCreci || 'A informar'}
Plataforma: BID — Negócios Imobiliários

━━━━━━━━━━━━━━━━━━━━━━━━━
2. DADOS DO IMÓVEL
━━━━━━━━━━━━━━━━━━━━━━━━━

Tipo: ${form.tipo_imovel}
Endereço: ${form.logradouro || ''}, ${form.numero || 's/n'}, ${form.bairro}
Cidade/UF: ${form.cidade}/${form.estado || ''}
CEP: ${form.cep || 'A informar'}
Matrícula: ${form.prop_matricula || 'A informar'}
Cartório: ${form.cartorio_registro || 'A informar'}
Área total: ${form.area_total || 'A informar'} m²
Quartos: ${form.quartos} | Banheiros: ${form.banheiros} | Vagas: ${form.vagas}

━━━━━━━━━━━━━━━━━━━━━━━━━
3. CONDIÇÕES FINANCEIRAS
━━━━━━━━━━━━━━━━━━━━━━━━━

Preço de ${form.tipo_negocio}: R$ ${Number(form.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
Comissão do corretor: ${form.percentual_comissao || '6%'} sobre o valor de venda
Pagamento da comissão: Na assinatura do contrato definitivo
Formas de pagamento: ${form.formas_pagamento.length > 0 ? form.formas_pagamento.join(', ') : 'A combinar'}

━━━━━━━━━━━━━━━━━━━━━━━━━
4. PRAZO E CONDIÇÕES
━━━━━━━━━━━━━━━━━━━━━━━━━

Vigência: ${dataHoje} até ${dataVencimento}
Exclusividade: ${form.exclusividade || 'Não exclusiva'}
Autorização de publicidade: Sim — portais, redes sociais e plataforma BID

━━━━━━━━━━━━━━━━━━━━━━━━━
5. AUTORIZAÇÃO
━━━━━━━━━━━━━━━━━━━━━━━━━

Ao responder *AUTORIZO* nesta mensagem, o(a) proprietário(a) declara que:

✅ É o legítimo proprietário do imóvel acima descrito
✅ Autoriza o corretor a divulgar e intermediar a negociação
✅ Concorda com as condições financeiras e prazo estabelecidos
✅ Autoriza a publicação em portais, redes sociais e plataforma BID

Esta autorização tem validade jurídica conforme Art. 722 do Código Civil Brasileiro.

━━━━━━━━━━━━━━━━━━━━━━━━━

Para AUTORIZAR responda: *AUTORIZO*
Para RECUSAR responda: *RECUSO*
Dúvidas: responda nesta conversa

Plataforma BID | bid.app.br`

      const telefone = form.prop_whatsapp.replace(/\D/g, '')
      const url = `https://wa.me/55${telefone}?text=${encodeURIComponent(contrato)}`
      window.open(url, '_blank')

      setToast('Imóvel salvo! WhatsApp aberto para enviar autorização ao proprietário.')
      setLoading(false)
      setTimeout(() => {
        setToast('')
        onClose()
      }, 3500)
      return
    }

    onClose()
  }

  const totalFotos = fotos.length + fotosExistentes.length
  async function fetchCompativeis() {
    if (!imovel?.id) return
    setCompativeisLoading(true)
    try {
      const res = await fetch(`/api/matching/preview?imovelId=${imovel.id}`)
      const json = await res.json()
      setCompativeis(json.compativeis || [])
      const jaFeitos = new Set<string>(
        (json.compativeis || []).filter((c: Record<string, unknown>) => c.jaTemMatch).map((c: Record<string, unknown>) => c.id as string)
      )
      setMatchFeito(jaFeitos)
    } catch {
      // silencioso
    }
    setCompativeisLoading(false)
  }

  async function proporParceria(solicitacaoId: string) {
    setMatchLoading(solicitacaoId)
    try {
      const res = await fetch('/api/matching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imovelId: imovel?.id, solicitacaoId }),
      })
      if (res.ok) {
        setMatchFeito((prev) => new Set(prev).add(solicitacaoId))
      }
    } catch {
      // silencioso
    }
    setMatchLoading(null)
  }

  const loadingGeral = loading || fotosUploadando

  // Fecha ao pressionar Esc
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.75)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          backgroundColor: '#181819',
          border: '1px solid #232324',
          borderRadius: '2px',
          width: '100%',
          maxWidth: '640px',
          maxHeight: '90vh',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #232324',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            backgroundColor: '#181819',
            zIndex: 1,
          }}
        >
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', color: '#F0EDE6' }}>
            {imovel ? 'Editar Imóvel' : 'Cadastrar Imóvel'}
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#9B9690', cursor: 'pointer', fontSize: '20px', lineHeight: 1 }}
          >
            &times;
          </button>
        </div>

        {/* Tabs — só exibe quando editando um imóvel existente */}
        {imovel?.id && (
          <div style={{ display: 'flex', borderBottom: '1px solid #232324', backgroundColor: '#181819', position: 'sticky', top: '61px', zIndex: 1 }}>
            {(['dados', 'compativeis'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setActiveTab(tab)
                  if (tab === 'compativeis' && compativeis.length === 0) fetchCompativeis()
                }}
                style={{
                  padding: '10px 20px',
                  fontSize: '13px',
                  fontWeight: 600,
                  border: 'none',
                  borderBottom: activeTab === tab ? '2px solid #C9A84C' : '2px solid transparent',
                  backgroundColor: 'transparent',
                  color: activeTab === tab ? '#C9A84C' : '#9B9690',
                  cursor: 'pointer',
                  transition: 'color 0.15s',
                }}
              >
                {tab === 'dados' ? 'Dados' : 'Compatíveis'}
              </button>
            ))}
          </div>
        )}

        {/* Aba Compatíveis */}
        {imovel?.id && activeTab === 'compativeis' && (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {compativeisLoading && (
              <p style={{ fontSize: '13px', color: '#9B9690', textAlign: 'center' }}>Calculando compatibilidades...</p>
            )}
            {!compativeisLoading && compativeis.length === 0 && (
              <p style={{ fontSize: '13px', color: '#9B9690', textAlign: 'center' }}>Nenhuma solicitação compatível encontrada (score ≥ 70).</p>
            )}
            {compativeis.map((sol) => {
              const id = sol.id as string
              const jaFeito = matchFeito.has(id)
              return (
                <div key={id} style={{ backgroundColor: '#232324', border: '1px solid #2E2E30', borderRadius: '2px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#F0EDE6' }}>{sol.cliente_nome as string}</span>
                      <span style={{ fontSize: '11px', backgroundColor: 'rgba(201,168,76,0.15)', color: '#C9A84C', padding: '2px 6px', borderRadius: '2px' }}>Score {sol.score as number}%</span>
                      {!!(sol.corretor as Record<string, unknown>)?.nome && (
                        <span style={{ fontSize: '11px', color: '#6b6860' }}>via {(sol.corretor as Record<string, unknown>).nome as string}</span>
                      )}
                    </div>
                    <p style={{ fontSize: '12px', color: '#9B9690', margin: 0 }}>
                      {sol.tipo_imovel as string} · {sol.tipo_negocio as string} · {sol.cidade as string}
                      {sol.valor_max ? ` · até R$ ${(sol.valor_max as number).toLocaleString('pt-BR')}` : ''}
                      {sol.quartos ? ` · ${sol.quartos as number}q` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={jaFeito || matchLoading === id}
                    onClick={() => proporParceria(id)}
                    style={{
                      padding: '7px 14px',
                      fontSize: '12px',
                      fontWeight: 600,
                      borderRadius: '2px',
                      border: jaFeito ? '1px solid #3d5a3e' : '1px solid #C9A84C',
                      backgroundColor: jaFeito ? 'rgba(92,184,138,0.1)' : 'transparent',
                      color: jaFeito ? '#5CB88A' : '#C9A84C',
                      cursor: jaFeito ? 'default' : 'pointer',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    {matchLoading === id ? 'Enviando...' : jaFeito ? '✓ Parceria proposta' : 'Propor parceria'}
                  </button>
                </div>
              )
            })}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ padding: '24px', display: activeTab === 'dados' ? 'flex' : 'none', flexDirection: 'column', gap: '20px' }}>

          {/* Toast de sucesso (WhatsApp) */}
          {toast && (
            <div style={{
              backgroundColor: 'rgba(92,184,138,0.1)',
              border: '1px solid rgba(92,184,138,0.3)',
              borderRadius: '2px',
              padding: '14px 16px',
              fontSize: '13px',
              color: '#5CB88A',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              <span style={{ fontSize: '16px' }}>✓</span>
              {toast}
            </div>
          )}

          {/* Erro */}
          {error && (
            <div style={{
              backgroundColor: 'rgba(224,92,92,0.1)',
              border: '1px solid rgba(224,92,92,0.3)',
              borderRadius: '2px',
              padding: '14px 16px',
              fontSize: '13px',
              color: '#E05C5C',
            }}>
              {error}
            </div>
          )}

          {/* Tipo de Negocio + Tipo de Imovel */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Tipo de Negócio</label>
              <select style={inputStyle} value={form.tipo_negocio} onChange={(e) => set('tipo_negocio', e.target.value)}>
                <option value="Venda">Venda</option>
                <option value="Locação">Locação</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Tipo de Imóvel</label>
              <select style={inputStyle} value={form.tipo_imovel} onChange={(e) => set('tipo_imovel', e.target.value)}>
                {TIPO_IMOVEL_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Titulo */}
          <div>
            <label style={labelStyle}>Nome / Título do Imóvel *</label>
            <input
              required
              type="text"
              style={inputStyle}
              value={form.titulo}
              onChange={(e) => set('titulo', e.target.value)}
              placeholder="Ex: Apartamento Jardim America"
            />
          </div>

          {/* Descricao */}
          <div>
            <label style={labelStyle}>Descrição</label>
            <textarea
              style={{ ...inputStyle, minHeight: '72px', resize: 'vertical' }}
              value={form.descricao}
              onChange={(e) => set('descricao', e.target.value)}
              placeholder="Descrição do imóvel..."
            />
          </div>

          {/* Fotos */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={labelStyle}>
                Fotos do Imóvel
                <span style={{ color: '#9B9690', fontWeight: 400 }}> (mín. {MIN_FOTOS}, máx. {MAX_FOTOS})</span>
              </label>
              <span style={{
                fontSize: '11px',
                color: totalFotos >= MIN_FOTOS ? '#5CB88A' : '#9B9690',
              }}>
                {totalFotos} {totalFotos === 1 ? 'foto selecionada' : 'fotos selecionadas'}
              </span>
            </div>

            {/* Área de drop / clique */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: '100%',
                padding: '20px',
                border: `1px dashed ${totalFotos >= MIN_FOTOS ? 'rgba(92,184,138,0.4)' : 'rgba(201,168,76,0.3)'}`,
                borderRadius: '2px',
                backgroundColor: 'rgba(201,168,76,0.03)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                marginBottom: totalFotos > 0 ? '12px' : '0',
              }}
            >
              <span style={{ fontSize: '20px', color: '#C9A84C' }}>+</span>
              <span style={{ fontSize: '12px', color: '#9B9690' }}>
                Clique para adicionar fotos
              </span>
              <span style={{ fontSize: '11px', color: '#9B9690', opacity: 0.7 }}>
                JPG, PNG, WEBP · Restam {MAX_FOTOS - totalFotos} slots
              </span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={handleFotosChange}
            />

            {/* Grid de previews */}
            {totalFotos > 0 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                gap: '8px',
              }}>
                {/* Fotos já salvas */}
                {fotosExistentes.map((url) => (
                  <div key={url} style={{ position: 'relative' }}>
                    <img
                      src={url}
                      alt="Foto do imóvel"
                      style={{
                        width: '100%',
                        height: '80px',
                        objectFit: 'cover',
                        borderRadius: '2px',
                        border: '1px solid #2E2E30',
                        display: 'block',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => removerFotoExistente(url)}
                      style={{
                        position: 'absolute',
                        top: '3px',
                        right: '3px',
                        width: '18px',
                        height: '18px',
                        borderRadius: '2px',
                        backgroundColor: 'rgba(14,14,15,0.85)',
                        border: 'none',
                        color: '#E05C5C',
                        fontSize: '11px',
                        lineHeight: '18px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0,
                      }}
                    >
                      &times;
                    </button>
                  </div>
                ))}
                {/* Novas fotos (preview local) */}
                {fotos.map((file, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      style={{
                        width: '100%',
                        height: '80px',
                        objectFit: 'cover',
                        borderRadius: '2px',
                        border: '1px solid rgba(201,168,76,0.3)',
                        display: 'block',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => removerFotoNova(i)}
                      style={{
                        position: 'absolute',
                        top: '3px',
                        right: '3px',
                        width: '18px',
                        height: '18px',
                        borderRadius: '2px',
                        backgroundColor: 'rgba(14,14,15,0.85)',
                        border: 'none',
                        color: '#E05C5C',
                        fontSize: '11px',
                        lineHeight: '18px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0,
                      }}
                    >
                      &times;
                    </button>
                    {/* Badge "novo" */}
                    <span style={{
                      position: 'absolute',
                      bottom: '3px',
                      left: '3px',
                      fontSize: '9px',
                      backgroundColor: 'rgba(201,168,76,0.85)',
                      color: '#0E0E0F',
                      padding: '1px 4px',
                      borderRadius: '1px',
                      fontWeight: 600,
                      letterSpacing: '0.03em',
                    }}>
                      NOVO
                    </span>
                  </div>
                ))}
              </div>
            )}

            {totalFotos > 0 && totalFotos < MIN_FOTOS && (
              <p style={{ fontSize: '11px', color: '#E8C96A', marginTop: '8px' }}>
                Adicione mais {MIN_FOTOS - totalFotos} foto(s) para atingir o mínimo recomendado.
              </p>
            )}
          </div>

          {/* CEP */}
          <div>
            <label style={labelStyle}>CEP *</label>
            <div style={{ position: 'relative' }}>
              <input
                required
                type="text"
                inputMode="numeric"
                maxLength={9}
                style={{
                  ...inputStyle,
                  paddingRight: '40px',
                  borderColor: cepOk ? 'rgba(92,184,138,0.5)' : cepError ? 'rgba(224,92,92,0.5)' : '#2E2E30',
                }}
                value={form.cep}
                onChange={handleCepChange}
                placeholder="00000-000"
              />
              <span style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '13px',
                color: cepLoading ? '#9B9690' : cepOk ? '#5CB88A' : '#2E2E30',
              }}>
                {cepLoading ? '...' : cepOk ? '✓' : ''}
              </span>
            </div>
            {cepError && (
              <p style={{ fontSize: '11px', color: '#E05C5C', marginTop: '4px' }}>{cepError}</p>
            )}
          </div>

          {/* Cidade + Estado (preenchidos automaticamente) */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Cidade *</label>
              <input
                required
                type="text"
                style={{
                  ...inputStyle,
                  backgroundColor: cepOk ? '#1a2a20' : '#1c1c1d',
                  color: cepOk ? '#5CB88A' : '#9B9690',
                  cursor: 'default',
                }}
                value={form.cidade}
                readOnly
                placeholder="Preenchido automaticamente via CEP"
              />
            </div>
            <div>
              <label style={labelStyle}>Estado</label>
              <input
                type="text"
                style={{
                  ...inputStyle,
                  backgroundColor: cepOk ? '#1a2a20' : '#1c1c1d',
                  color: cepOk ? '#5CB88A' : '#9B9690',
                  cursor: 'default',
                }}
                value={form.estado}
                readOnly
                placeholder="UF"
              />
            </div>
          </div>

          {/* Bairro + Logradouro */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Bairro</label>
              <input
                type="text"
                style={inputStyle}
                value={form.bairro}
                onChange={(e) => set('bairro', e.target.value)}
                placeholder="Bairro (auto ou manual)"
              />
            </div>
            <div>
              <label style={labelStyle}>Logradouro</label>
              <input
                type="text"
                style={inputStyle}
                value={form.logradouro}
                onChange={(e) => set('logradouro', e.target.value)}
                placeholder="Rua, Av. (auto ou manual)"
              />
            </div>
          </div>

          {/* Quartos / Banheiros / Vagas */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            {(['quartos', 'banheiros', 'vagas'] as const).map((field) => (
              <div key={field}>
                <label style={labelStyle}>{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                <select style={inputStyle} value={form[field]} onChange={(e) => set(field, parseInt(e.target.value))}>
                  {[0, 1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>{n === 6 ? '6+' : n}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Area + Valor */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Área Total (m²)</label>
              <input
                type="number"
                style={inputStyle}
                value={form.area_total}
                onChange={(e) => set('area_total', e.target.value)}
                placeholder="0"
                min="0"
              />
            </div>
            <div>
              <label style={labelStyle}>Valor (R$) *</label>
              <input
                required
                type="number"
                style={inputStyle}
                value={form.valor}
                onChange={(e) => set('valor', e.target.value)}
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          {/* Flags */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Aceita Animal?</label>
              <select style={inputStyle} value={form.aceita_animal ? 'true' : 'false'} onChange={(e) => set('aceita_animal', e.target.value === 'true')}>
                <option value="false">Não</option>
                <option value="true">Sim</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Lançamento?</label>
              <select style={inputStyle} value={form.lancamento ? 'true' : 'false'} onChange={(e) => set('lancamento', e.target.value === 'true')}>
                <option value="false">Não</option>
                <option value="true">Sim</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Visível no Site?</label>
              <select style={inputStyle} value={form.publico_no_site ? 'true' : 'false'} onChange={(e) => set('publico_no_site', e.target.value === 'true')}>
                <option value="false">Não</option>
                <option value="true">Sim</option>
              </select>
            </div>
          </div>

          {/* ── BLOCO: DADOS DO PROPRIETÁRIO ─────────────────── */}
          <div>
            <p style={sectionTitleStyle}>Dados do Proprietário (Privados)</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

              {/* Nome + CPF/CNPJ */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Nome Completo *</label>
                  <input required type="text" style={inputStyle} value={form.prop_nome}
                    onChange={(e) => set('prop_nome', e.target.value)} placeholder="Nome do proprietário" />
                </div>
                <div>
                  <label style={labelStyle}>CPF / CNPJ *</label>
                  <input required type="text" style={inputStyle} value={form.prop_cpf_cnpj}
                    onChange={(e) => set('prop_cpf_cnpj', e.target.value)} placeholder="000.000.000-00" />
                </div>
              </div>

              {/* Nacionalidade + Estado Civil */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Nacionalidade *</label>
                  <input required type="text" style={inputStyle} value={form.prop_nacionalidade}
                    onChange={(e) => set('prop_nacionalidade', e.target.value)} placeholder="Brasileiro(a)" />
                </div>
                <div>
                  <label style={labelStyle}>Estado Civil *</label>
                  <select required style={inputStyle} value={form.prop_estado_civil}
                    onChange={(e) => set('prop_estado_civil', e.target.value)}>
                    <option value="">Selecione...</option>
                    <option>Solteiro(a)</option>
                    <option>Casado(a)</option>
                    <option>Divorciado(a)</option>
                    <option>{'Viúvo(a)'}</option>
                    <option>União Estável</option>
                  </select>
                </div>
              </div>

              {/* Profissão + RG */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Profissão *</label>
                  <input required type="text" style={inputStyle} value={form.prop_profissao}
                    onChange={(e) => set('prop_profissao', e.target.value)} placeholder="Ex: Médico, Comerciante" />
                </div>
                <div>
                  <label style={labelStyle}>RG *</label>
                  <input required type="text" style={inputStyle} value={form.prop_rg}
                    onChange={(e) => set('prop_rg', e.target.value)} placeholder="0.000.000-0" />
                </div>
              </div>

              {/* WhatsApp + E-mail */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>WhatsApp *</label>
                  <input required type="text" style={inputStyle} value={form.prop_whatsapp}
                    onChange={(e) => set('prop_whatsapp', e.target.value)} placeholder="(00) 00000-0000" />
                </div>
                <div>
                  <label style={labelStyle}>E-mail</label>
                  <input type="email" style={inputStyle} value={form.prop_email}
                    onChange={(e) => set('prop_email', e.target.value)} placeholder="proprietario@email.com" />
                </div>
              </div>
            </div>
          </div>

          {/* ── BLOCO: CÔNJUGE (condicional) ──────────────────── */}
          {mostrarConjuge && (
            <div>
              <p style={sectionTitleStyle}>
                Dados do Cônjuge / Companheiro(a)
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Nome do Cônjuge *</label>
                  <input required type="text" style={inputStyle} value={form.prop_conjuge_nome}
                    onChange={(e) => set('prop_conjuge_nome', e.target.value)} placeholder="Nome completo" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>CPF do Cônjuge *</label>
                    <input required type="text" style={inputStyle} value={form.prop_conjuge_cpf}
                      onChange={(e) => set('prop_conjuge_cpf', e.target.value)} placeholder="000.000.000-00" />
                  </div>
                  <div>
                    <label style={labelStyle}>WhatsApp do Cônjuge *</label>
                    <input required type="text" style={inputStyle} value={form.prop_conjuge_whatsapp}
                      onChange={(e) => set('prop_conjuge_whatsapp', e.target.value)} placeholder="(00) 00000-0000" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── BLOCO: DADOS DO IMÓVEL ────────────────────────── */}
          <div>
            <p style={sectionTitleStyle}>Dados Registrais do Imóvel</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Número / Compl.</label>
                  <input type="text" style={inputStyle} value={form.numero}
                    onChange={(e) => set('numero', e.target.value)} placeholder="123 / Apto 4B" />
                </div>
                <div>
                  <label style={labelStyle}>Matrícula do Imóvel *</label>
                  <input required type="text" style={inputStyle} value={form.prop_matricula}
                    onChange={(e) => set('prop_matricula', e.target.value)} placeholder="Ex: 12345" />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Cartório de Registro *</label>
                <input required type="text" style={inputStyle} value={form.cartorio_registro}
                  onChange={(e) => set('cartorio_registro', e.target.value)}
                  placeholder="Ex: 1º Cartório de Registro de Imóveis de Jacarezinho" />
              </div>
            </div>
          </div>

          {/* ── BLOCO: CONDIÇÕES FINANCEIRAS ──────────────────── */}
          <div>
            <p style={sectionTitleStyle}>Condições Financeiras</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

              {/* Comissão + Aceita negociação */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Percentual de Comissão *</label>
                  <select required style={inputStyle} value={form.percentual_comissao}
                    onChange={(e) => set('percentual_comissao', e.target.value)}>
                    <option value="">Selecione...</option>
                    <option value="6%">6%</option>
                    <option value="7%">7%</option>
                    <option value="8%">8%</option>
                    <option value="A combinar">A combinar</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Aceita Negociação de Preço?</label>
                  <select style={inputStyle} value={form.aceita_negociacao}
                    onChange={(e) => set('aceita_negociacao', e.target.value)}>
                    <option value="">Selecione...</option>
                    <option value="Sim">Sim</option>
                    <option value="Não">Não</option>
                    <option value="Consultar">Consultar</option>
                  </select>
                </div>
              </div>

              {/* Formas de pagamento */}
              <div>
                <label style={labelStyle}>Formas de Pagamento Aceitas *</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                  {[
                    'À vista',
                    'Financiamento bancário',
                    'FGTS',
                    'Permuta',
                    'Parcelado direto com proprietário',
                  ].map((forma) => (
                    <label
                      key={forma}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        color: '#F0EDE6',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={form.formas_pagamento.includes(forma)}
                        onChange={() => toggleFormaPagamento(forma)}
                        style={{
                          width: '14px',
                          height: '14px',
                          accentColor: '#C9A84C',
                          cursor: 'pointer',
                        }}
                      />
                      {forma}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── BLOCO: PRAZO DA AUTORIZAÇÃO ───────────────────── */}
          <div>
            <p style={sectionTitleStyle}>Prazo da Autorização</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Validade da Autorização *</label>
                <select required style={inputStyle} value={form.validade_autorizacao}
                  onChange={(e) => set('validade_autorizacao', e.target.value)}>
                  <option value="">Selecione...</option>
                  <option value="30 dias">30 dias</option>
                  <option value="60 dias">60 dias</option>
                  <option value="90 dias">90 dias</option>
                  <option value="180 dias">180 dias</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Exclusividade *</label>
                <select required style={inputStyle} value={form.exclusividade}
                  onChange={(e) => set('exclusividade', e.target.value)}>
                  <option value="">Selecione...</option>
                  <option value="Não exclusiva">Não exclusiva</option>
                  <option value="Exclusiva">Exclusiva</option>
                </select>
              </div>
            </div>
          </div>

          {/* Nota */}
          <p
            style={{
              fontSize: '11px',
              color: '#9B9690',
              backgroundColor: '#232324',
              padding: '10px 12px',
              borderRadius: '2px',
              borderLeft: '2px solid #C9A84C',
            }}
          >
            Após salvar, o termo de autorização será enviado ao proprietário via Certisign para assinatura digital.
          </p>

          {/* Botoes */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 20px',
                borderRadius: '2px',
                border: '1px solid rgba(201,168,76,0.2)',
                backgroundColor: 'transparent',
                color: '#9B9690',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loadingGeral}
              style={{
                padding: '9px 20px',
                borderRadius: '2px',
                border: 'none',
                backgroundColor: loadingGeral ? '#a08840' : '#C9A84C',
                color: '#0E0E0F',
                fontSize: '13px',
                fontWeight: 600,
                cursor: loadingGeral ? 'not-allowed' : 'pointer',
              }}
            >
              {fotosUploadando
                ? `Enviando fotos...`
                : loading
                ? 'Salvando...'
                : 'Salvar e Enviar Termo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
