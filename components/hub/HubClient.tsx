'use client'

import { useState } from 'react'

interface Imovel {
  id: string
  titulo: string
  bairro: string | null
  cidade: string
  valor: number
  quartos: number | null
  banheiros: number | null
  vagas: number | null
  tipo_imovel: string
  tipo_negocio: string
  aceita_animal: boolean | null
  area_total: number | null
  lancamento: boolean | null
  descricao: string | null
}

interface Canal {
  id: number
  nome: string
  cat: string
  ativo: boolean
  leads: number
  plano: string
}

function gerarPromptIA(imovel: Imovel): string {
  const valor = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    imovel.valor
  )
  return `Você é um copywriter especialista em mercado imobiliário com foco em storytelling e linguagem humana. Fuja completamente das frases clichês do setor imobiliário.

DADOS DO IMÓVEL:
- Tipo: ${imovel.tipo_negocio} de ${imovel.tipo_imovel}
- Localização: ${imovel.bairro ? imovel.bairro + ', ' : ''}${imovel.cidade}
- Quartos: ${imovel.quartos} | Banheiros: ${imovel.banheiros} | Vagas: ${imovel.vagas}
${imovel.area_total ? `- Área: ${imovel.area_total}m²` : ''}
- Valor: ${valor}
${imovel.aceita_animal ? '- Aceita pet' : ''}
${imovel.lancamento ? '- É um lançamento' : ''}
${imovel.descricao ? `- Descrição do corretor: ${imovel.descricao}` : ''}

GERE 3 VERSÕES DE COPY:

1. **POST PARA INSTAGRAM** (máx. 150 palavras)
   - Começa com uma frase impactante que NÃO seja "Venha morar em..." ou "Oportunidade imperdível"
   - Conta uma micro-história ou evoca uma sensação/estilo de vida
   - Usa emojis com moderação (máx. 5)
   - Termina com CTA criativo (não "Entre em contato")
   - Hashtags relevantes no final

2. **DESCRIÇÃO PARA PORTAL** (máx. 200 palavras)
   - Tom profissional mas humano
   - Destaca o que torna este imóvel único (não apenas liste características)
   - Menciona o bairro/região de forma contextualizada
   - CTA direto no final

3. **MENSAGEM PARA WHATSAPP** (máx. 60 palavras)
   - Muito direta e pessoal
   - Como se estivesse contando para um amigo
   - Sem formatações excessivas
   - CTA com senso de urgência natural (não fake)

REGRAS ABSOLUTAS:
❌ Nunca use: "oportunidade imperdível", "venha realizar seu sonho", "localização privilegiada", "imóvel dos sonhos", "não perca essa chance", "acabamento de qualidade", "amplos ambientes"
✅ Sempre use linguagem que uma pessoa real usaria numa conversa
✅ Conecte o imóvel a um estilo de vida específico e real
✅ Seja específico — detalhes concretos vencem generalidades`
}

function Toggle({ ativo, onChange }: { ativo: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      role="switch"
      aria-checked={ativo}
      style={{
        width: 34,
        height: 18,
        borderRadius: 9,
        backgroundColor: ativo ? 'rgba(201,168,76,0.28)' : 'var(--color-dark-4)',
        position: 'relative',
        flexShrink: 0,
        border: ativo ? '1px solid rgba(201,168,76,0.5)' : '1px solid rgba(255,255,255,0.08)',
        transition: 'background-color 0.2s',
        cursor: 'pointer',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 2,
          left: ativo ? 17 : 2,
          width: 13,
          height: 13,
          borderRadius: '50%',
          backgroundColor: ativo ? 'var(--color-gold)' : 'var(--color-muted)',
          transition: 'left 0.2s',
        }}
      />
    </button>
  )
}

const CAT_ORDEM = ['Portal', 'Rede Social', 'Mensageria', 'Site Próprio', 'API']

export default function HubClient({ imoveis }: { imoveis: Imovel[] }) {
  const [canais, setCanais] = useState<Canal[]>([
    { id: 1, nome: 'ZAP Imóveis',      cat: 'Portal',      ativo: true,  leads: 12, plano: 'Pro' },
    { id: 2, nome: 'OLX',              cat: 'Portal',      ativo: true,  leads: 8,  plano: 'Pro' },
    { id: 3, nome: 'Viva Real',         cat: 'Portal',      ativo: false, leads: 0,  plano: 'Pro' },
    { id: 4, nome: 'Instagram',         cat: 'Rede Social', ativo: true,  leads: 21, plano: 'Pro' },
    { id: 5, nome: 'Facebook',          cat: 'Rede Social', ativo: true,  leads: 9,  plano: 'Pro' },
    { id: 6, nome: 'WhatsApp Business', cat: 'Mensageria',  ativo: true,  leads: 34, plano: 'Free' },
    { id: 7, nome: 'Site do Corretor',  cat: 'Site Próprio',ativo: true,  leads: 7,  plano: 'Pro' },
    { id: 8, nome: 'API Imobiliária',   cat: 'API',         ativo: false, leads: 0,  plano: 'Imobiliária' },
  ])

  const [imovelSelecionado, setImovelSelecionado] = useState<string>('')
  const [copied, setCopied] = useState(false)

  const toggleCanal = (id: number) => {
    setCanais((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ativo: !c.ativo } : c))
    )
  }

  const imovel = imoveis.find((i) => i.id === imovelSelecionado) || null
  const promptGerado = imovel ? gerarPromptIA(imovel) : ''

  const handleCopiar = () => {
    if (!promptGerado) return
    navigator.clipboard.writeText(promptGerado)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Métricas
  const leadsTotal = canais.filter((c) => c.ativo).reduce((acc, c) => acc + c.leads, 0)
  const canaisAtivos = canais.filter((c) => c.ativo).length
  const canalTop = [...canais].sort((a, b) => b.leads - a.leads)[0]

  const canaisPorCat = CAT_ORDEM.map((cat) => ({
    cat,
    items: canais.filter((c) => c.cat === cat),
  })).filter((g) => g.items.length > 0)

  return (
    <div className="p-8" style={{ color: 'var(--color-text)' }}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
          Hub de Publicação
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted)' }}>
          Gerencie a distribuição dos seus imóveis e gere copy com IA.
        </p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Leads Totais (30d)', valor: leadsTotal, cor: 'var(--color-gold)' },
          { label: 'Canal Mais Eficiente', valor: canalTop?.nome || '—', cor: 'var(--color-green)' },
          { label: 'Canais Ativos', valor: canaisAtivos, cor: 'var(--color-blue)' },
        ].map((m) => (
          <div
            key={m.label}
            className="rounded-sm border p-4"
            style={{
              backgroundColor: 'var(--color-dark-2)',
              borderColor: 'rgba(201,168,76,0.12)',
            }}
          >
            <p className="text-[11px] uppercase tracking-wider mb-1" style={{ color: 'var(--color-muted)' }}>
              {m.label}
            </p>
            <p className="font-serif text-xl font-bold" style={{ color: m.cor }}>
              {m.valor}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Canais de Distribuição */}
        <div
          className="rounded-sm border p-5"
          style={{
            backgroundColor: 'var(--color-dark-2)',
            borderColor: 'rgba(201,168,76,0.12)',
          }}
        >
          <h2 className="font-serif text-base font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
            Canais de Distribuição
          </h2>

          <div className="flex flex-col gap-5">
            {canaisPorCat.map(({ cat, items }) => (
              <div key={cat}>
                <p
                  className="text-[10px] uppercase tracking-widest mb-2"
                  style={{ color: 'var(--color-muted)' }}
                >
                  {cat}
                </p>
                <div className="flex flex-col gap-2">
                  {items.map((canal) => (
                    <div
                      key={canal.id}
                      className="flex items-center justify-between rounded-sm px-3 py-2.5"
                      style={{
                        backgroundColor: 'var(--color-dark-3)',
                        border: '1px solid rgba(201,168,76,0.07)',
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex flex-col min-w-0">
                          <span className="text-[13px] font-medium" style={{ color: 'var(--color-text)' }}>
                            {canal.nome}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded-sm"
                              style={{
                                backgroundColor: 'rgba(201,168,76,0.08)',
                                color: 'var(--color-muted)',
                              }}
                            >
                              {canal.plano}
                            </span>
                            {canal.ativo && canal.leads > 0 && (
                              <span className="text-[10px]" style={{ color: 'var(--color-green)' }}>
                                {canal.leads} leads
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Toggle ativo={canal.ativo} onChange={() => toggleCanal(canal.id)} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gerador de Copy com IA */}
        <div
          className="rounded-sm border p-5 flex flex-col"
          style={{
            backgroundColor: 'var(--color-dark-2)',
            borderColor: 'rgba(201,168,76,0.12)',
          }}
        >
          <h2 className="font-serif text-base font-semibold" style={{ color: 'var(--color-text)' }}>
            Gerador de Copy com IA
          </h2>
          <p className="text-[12px] mt-1 mb-4 leading-relaxed" style={{ color: 'var(--color-muted)' }}>
            Gere o prompt perfeito para criar uma copy única no Claude — sem as legendas manjadas do mercado.
          </p>

          {/* Select imóvel */}
          <div className="mb-4">
            <label className="text-[11px] uppercase tracking-wider block mb-1.5" style={{ color: 'var(--color-muted)' }}>
              Selecionar Imóvel
            </label>
            <select
              value={imovelSelecionado}
              onChange={(e) => setImovelSelecionado(e.target.value)}
              className="w-full rounded-sm px-3 py-2 text-[13px] outline-none"
              style={{
                backgroundColor: 'var(--color-dark-3)',
                border: '1px solid rgba(201,168,76,0.2)',
                color: imovelSelecionado ? 'var(--color-text)' : 'var(--color-muted)',
              }}
            >
              <option value="">Escolha um imóvel ativo...</option>
              {imoveis.map((im) => (
                <option key={im.id} value={im.id}>
                  {im.titulo} — {im.bairro ? im.bairro + ', ' : ''}{im.cidade}
                </option>
              ))}
            </select>
          </div>

          {/* Prompt gerado */}
          {imovel && (
            <div className="flex flex-col gap-3 flex-1">
              <div
                className="rounded-sm border overflow-hidden"
                style={{ borderColor: 'rgba(201,168,76,0.2)' }}
              >
                {/* Card header */}
                <div
                  className="flex items-center gap-2 px-4 py-2.5 border-b"
                  style={{
                    backgroundColor: 'rgba(201,168,76,0.07)',
                    borderColor: 'rgba(201,168,76,0.14)',
                  }}
                >
                  <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-gold)' }}>
                    Prompt Gerado para o Claude
                  </span>
                  <span className="text-[10px]" style={{ color: 'var(--color-muted)' }}>
                    — {imovel.titulo}
                    {imovel.bairro ? ', ' + imovel.bairro : ''}
                  </span>
                </div>

                {/* Textarea readonly */}
                <textarea
                  readOnly
                  value={promptGerado}
                  className="w-full resize-none text-[12px] leading-relaxed px-4 py-3 outline-none"
                  style={{
                    height: 280,
                    backgroundColor: 'var(--color-dark-4)',
                    color: 'var(--color-text)',
                    fontFamily: 'inherit',
                    borderBottom: '1px solid rgba(201,168,76,0.12)',
                  }}
                />

                {/* Botões */}
                <div
                  className="flex items-center gap-3 px-4 py-3"
                  style={{ backgroundColor: 'var(--color-dark-3)' }}
                >
                  <button
                    onClick={handleCopiar}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-sm text-[12px] font-semibold transition-colors"
                    style={{
                      backgroundColor: copied ? 'var(--color-green)' : 'var(--color-gold)',
                      color: 'var(--color-dark)',
                    }}
                  >
                    {copied ? 'Copiado!' : 'Copiar Prompt'}
                  </button>
                  <button
                    onClick={() => window.open('https://claude.ai', '_blank')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-sm text-[12px] font-medium border transition-colors"
                    style={{
                      borderColor: 'rgba(201,168,76,0.3)',
                      color: 'var(--color-gold)',
                      backgroundColor: 'transparent',
                    }}
                  >
                    Abrir Claude.ai
                  </button>
                </div>
              </div>

              {/* Instrucoes */}
              <div
                className="rounded-sm border p-3"
                style={{
                  backgroundColor: 'rgba(92,155,224,0.07)',
                  borderColor: 'rgba(92,155,224,0.2)',
                }}
              >
                <p className="text-[11px] font-semibold mb-2" style={{ color: 'var(--color-blue)' }}>
                  Como usar:
                </p>
                <ol className="flex flex-col gap-1">
                  {[
                    'Clique em "Copiar Prompt" acima',
                    'Acesse o Claude.ai (botão ao lado)',
                    'Cole o prompt no chat (Ctrl+V)',
                    'O Claude vai gerar 3 versões de copy para Instagram, Portal e WhatsApp',
                    'Escolha a que mais combina com o imóvel e publique!',
                  ].map((passo, i) => (
                    <li key={i} className="text-[11px] leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                      {i + 1}. {passo}
                    </li>
                  ))}
                </ol>
              </div>

              {/* Dica */}
              <p
                className="text-[11px] leading-relaxed px-3 py-2 rounded-sm border"
                style={{
                  backgroundColor: 'rgba(201,168,76,0.04)',
                  borderColor: 'rgba(201,168,76,0.12)',
                  color: 'var(--color-muted)',
                }}
              >
                <span style={{ color: 'var(--color-gold)' }}>Dica:</span> Quanto mais detalhes você adicionar na descrição do imóvel ao cadastrá-lo, melhor será a copy gerada.
              </p>
            </div>
          )}

          {!imovel && (
            <div
              className="flex-1 flex items-center justify-center rounded-sm border"
              style={{
                minHeight: 200,
                borderColor: 'rgba(201,168,76,0.1)',
                backgroundColor: 'var(--color-dark-3)',
              }}
            >
              <p className="text-[13px]" style={{ color: 'var(--color-muted)' }}>
                Selecione um imóvel para gerar o prompt.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
