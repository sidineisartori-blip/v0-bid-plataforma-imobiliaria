import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PrintTrigger, PrintButton } from './PrintClient'

export const dynamic = 'force-dynamic'

const ESTADO_LABEL: Record<string, string> = {
  otimo: 'Ótimo', bom: 'Bom', regular: 'Regular',
  ruim: 'Ruim', danificado: 'Danificado', nao_aplicavel: 'N/A',
}

const ESTADO_COR: Record<string, string> = {
  otimo: '#2d6a4f', bom: '#1a5276', regular: '#7d6608',
  ruim: '#943126', danificado: '#7b241c', nao_aplicavel: '#5d6d7e',
}

function fmtData(d: string | null) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')
}

interface Item {
  id: string
  vistoria_id: string
  ambiente: string
  item: string
  estado: string
  observacao: string | null
  foto_urls: string[]
}

export default async function VistoriaImprimirPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: vistoria },
    { data: itens },
    { data: corretor },
  ] = await Promise.all([
    supabase
      .from('vistorias')
      .select(`
        *,
        contrato:contratos(
          cliente_nome, cliente_cpf_cnpj, cliente_email, cliente_whatsapp,
          proprietario_nome, data_inicio, data_fim,
          imovel:imoveis(titulo, bairro, cidade, area_total, quartos, tipo_imovel)
        )
      `)
      .eq('id', id)
      .eq('corretor_id', user.id)
      .single(),
    supabase
      .from('vistoria_itens')
      .select('*')
      .eq('vistoria_id', id)
      .order('ambiente')
      .order('item'),
    supabase
      .from('corretores')
      .select('full_name, creci, phone, city')
      .eq('id', user.id)
      .single(),
  ])

  if (!vistoria) redirect('/erp')

  // Para vistoria de saída, carrega a entrada correspondente para comparativo
  let itensEntrada: Item[] | null = null
  if (vistoria.tipo === 'saida') {
    const { data: vEntrada } = await supabase
      .from('vistorias')
      .select('id')
      .eq('contrato_id', vistoria.contrato_id)
      .eq('tipo', 'entrada')
      .eq('status', 'finalizada')
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    if (vEntrada) {
      const { data: iE } = await supabase
        .from('vistoria_itens')
        .select('*')
        .eq('vistoria_id', vEntrada.id)
        .order('ambiente')
        .order('item')
      itensEntrada = iE || null
    }
  }

  const ambientes = [...new Set((itens || []).map((i: Item) => i.ambiente))]

  // Mapa dos itens de entrada para comparativo rápido
  const mapaEntrada: Record<string, string> = {}
  if (itensEntrada) {
    for (const it of itensEntrada) {
      mapaEntrada[`${it.ambiente}||${it.item}`] = it.estado
    }
  }

  const itensDiferentes = (itens || []).filter((it: Item) => {
    const chave = `${it.ambiente}||${it.item}`
    return mapaEntrada[chave] && mapaEntrada[chave] !== it.estado
  })

  const c = vistoria.contrato as {
    cliente_nome: string
    cliente_cpf_cnpj: string | null
    cliente_email: string | null
    cliente_whatsapp: string | null
    proprietario_nome: string | null
    data_inicio: string | null
    data_fim: string | null
    imovel: {
      titulo: string
      bairro: string | null
      cidade: string
      area_total: number | null
      quartos: number | null
      tipo_imovel: string | null
    } | null
  } | null

  const emissao = new Date().toLocaleDateString('pt-BR')

  return (
    <>
      <PrintTrigger />
      <PrintButton />

      <style>{`
        @page { size: A4; margin: 2cm 1.8cm; }
        * { box-sizing: border-box; }
        body { font-family: 'Georgia', serif; font-size: 11pt; color: #111; background: #fff; margin: 0; }
        h1 { font-size: 17pt; margin: 0; }
        h2 { font-size: 13pt; margin: 0 0 6px; }
        h3 { font-size: 11pt; margin: 0 0 4px; }
        p  { margin: 0 0 4px; }
        table { width: 100%; border-collapse: collapse; font-size: 10pt; }
        th, td { border: 1px solid #bbb; padding: 5px 8px; text-align: left; }
        th { background: #f0f0f0; font-weight: 700; }
        .header { text-align: center; border-bottom: 2px solid #111; padding-bottom: 12px; margin-bottom: 14px; }
        .logo { font-size: 22pt; font-weight: 900; letter-spacing: 4px; color: #a07c2b; }
        .subtitulo { font-size: 14pt; font-weight: 700; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px; }
        .emissao { font-size: 9pt; color: #555; margin-top: 4px; }
        .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px; }
        .box { border: 1px solid #ccc; border-radius: 3px; padding: 10px 12px; }
        .box-label { font-size: 8pt; color: #888; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; font-weight: 700; }
        .row-info { display: flex; gap: 4px; margin-bottom: 3px; }
        .info-label { color: #555; font-size: 10pt; min-width: 110px; }
        .info-val { font-weight: 600; font-size: 10pt; }
        .section-title { background: #111; color: #fff; padding: 5px 10px; font-size: 10pt; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; margin: 14px 0 0; }
        .ambiente-title { background: #f0f0f0; padding: 6px 10px; font-size: 11pt; font-weight: 700; border: 1px solid #ccc; margin: 8px 0 0; }
        .assinatura-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-top: 40px; }
        .assinatura-box { border-top: 1.5px solid #555; padding-top: 8px; font-size: 9pt; }
        .diff-piorou { background: #fff0f0; }
        .diff-melhorou { background: #f0fff4; }
        .badge { display: inline-block; padding: 1px 6px; border-radius: 3px; font-size: 9pt; font-weight: 700; }
        .obs-geral { border: 1px solid #ccc; border-radius: 3px; padding: 10px 12px; margin: 8px 0 14px; min-height: 40px; font-size: 10pt; color: #333; }
        @media print { .no-print { display: none !important; } }
        @media screen { body { background: #ddd; } #laudo { background: #fff; max-width: 21cm; margin: 20px auto; padding: 2cm 1.8cm; box-shadow: 0 0 20px rgba(0,0,0,0.2); } }
      `}</style>

      <div id="laudo">
        {/* Cabeçalho */}
        <div className="header">
          <div className="logo">BID</div>
          <div className="subtitulo">
            Laudo de Vistoria de {vistoria.tipo === 'entrada' ? 'Entrada' : 'Saída'}
          </div>
          <div className="emissao">Emitido em {emissao} · BID Imobiliário</div>
        </div>

        {/* Dados do Imóvel + Contrato */}
        <div className="grid2">
          <div className="box">
            <div className="box-label">Imóvel</div>
            <div className="row-info"><span className="info-label">Endereço:</span><span className="info-val">{c?.imovel?.titulo}</span></div>
            <div className="row-info"><span className="info-label">Bairro / Cidade:</span><span className="info-val">{[c?.imovel?.bairro, c?.imovel?.cidade].filter(Boolean).join(', ')}</span></div>
            {c?.imovel?.tipo_imovel && <div className="row-info"><span className="info-label">Tipo:</span><span className="info-val">{c.imovel.tipo_imovel}</span></div>}
            {c?.imovel?.area_total && <div className="row-info"><span className="info-label">Área Total:</span><span className="info-val">{c.imovel.area_total} m²</span></div>}
            {c?.imovel?.quartos && <div className="row-info"><span className="info-label">Quartos:</span><span className="info-val">{c.imovel.quartos}</span></div>}
          </div>
          <div className="box">
            <div className="box-label">Contrato de Locação</div>
            <div className="row-info"><span className="info-label">Inquilino:</span><span className="info-val">{c?.cliente_nome}</span></div>
            {c?.cliente_cpf_cnpj && <div className="row-info"><span className="info-label">CPF / CNPJ:</span><span className="info-val">{c.cliente_cpf_cnpj}</span></div>}
            {c?.proprietario_nome && <div className="row-info"><span className="info-label">Proprietário:</span><span className="info-val">{c.proprietario_nome}</span></div>}
            <div className="row-info"><span className="info-label">Início:</span><span className="info-val">{fmtData(c?.data_inicio || null)}</span></div>
            <div className="row-info"><span className="info-label">Término:</span><span className="info-val">{fmtData(c?.data_fim || null)}</span></div>
            <div className="row-info"><span className="info-label">Data da Vistoria:</span><span className="info-val">{fmtData(vistoria.data_vistoria)}</span></div>
          </div>
        </div>

        {/* Comparativo Entrada → Saída */}
        {vistoria.tipo === 'saida' && itensEntrada && itensDiferentes.length > 0 && (
          <>
            <div className="section-title">⚠ Comparativo — Itens Alterados (Entrada → Saída)</div>
            <table style={{ marginTop: 8 }}>
              <thead>
                <tr>
                  <th>Ambiente</th>
                  <th>Item</th>
                  <th>Estado na Entrada</th>
                  <th>Estado na Saída</th>
                </tr>
              </thead>
              <tbody>
                {itensDiferentes.map((it: Item) => {
                  const chave = `${it.ambiente}||${it.item}`
                  const estadoEntrada = mapaEntrada[chave] || ''
                  const ordemEstados = ['otimo', 'bom', 'regular', 'ruim', 'danificado', 'nao_aplicavel']
                  const piorou = ordemEstados.indexOf(it.estado) > ordemEstados.indexOf(estadoEntrada)
                  return (
                    <tr key={it.id} className={piorou ? 'diff-piorou' : 'diff-melhorou'}>
                      <td>{it.ambiente}</td>
                      <td>{it.item}</td>
                      <td>
                        <span className="badge" style={{ color: ESTADO_COR[estadoEntrada] || '#333', background: '#f5f5f5' }}>
                          {ESTADO_LABEL[estadoEntrada] || estadoEntrada}
                        </span>
                      </td>
                      <td>
                        <span className="badge" style={{ color: ESTADO_COR[it.estado] || '#333', background: piorou ? '#fde8e8' : '#e8fdf0' }}>
                          {ESTADO_LABEL[it.estado]} {piorou ? '▼' : '▲'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </>
        )}

        {vistoria.tipo === 'saida' && itensEntrada && itensDiferentes.length === 0 && (
          <p style={{ marginTop: 8, color: '#2d6a4f', fontWeight: 600, fontSize: '10pt' }}>
            ✓ Nenhuma diferença encontrada entre a vistoria de entrada e saída.
          </p>
        )}

        {/* Checklist por ambiente */}
        <div className="section-title">Checklist de Itens</div>

        {ambientes.map((amb) => {
          const ambItens = (itens || []).filter((i: Item) => i.ambiente === amb)
          const temProblema = ambItens.some((i: Item) => ['ruim', 'danificado'].includes(i.estado))
          return (
            <div key={amb} style={{ pageBreakInside: 'avoid' }}>
              <div className="ambiente-title">
                {amb} {temProblema ? '⚠' : ''}
              </div>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '28%' }}>Item</th>
                    <th style={{ width: '16%' }}>Estado</th>
                    <th>Observações</th>
                    {itensEntrada && <th style={{ width: '14%' }}>Entrada</th>}
                  </tr>
                </thead>
                <tbody>
                  {ambItens.map((it: Item) => {
                    const chave = `${it.ambiente}||${it.item}`
                    const estadoEntrada = mapaEntrada[chave]
                    const ordemEstados = ['otimo', 'bom', 'regular', 'ruim', 'danificado', 'nao_aplicavel']
                    const piorou = estadoEntrada && ordemEstados.indexOf(it.estado) > ordemEstados.indexOf(estadoEntrada)
                    return (
                      <tr key={it.id} style={{ background: piorou ? '#fff8f8' : 'transparent' }}>
                        <td>{it.item}</td>
                        <td>
                          <span style={{ color: ESTADO_COR[it.estado] || '#333', fontWeight: 700 }}>
                            {ESTADO_LABEL[it.estado] || it.estado}
                          </span>
                        </td>
                        <td style={{ color: '#444' }}>{it.observacao || '—'}</td>
                        {itensEntrada && (
                          <td style={{ color: estadoEntrada ? ESTADO_COR[estadoEntrada] : '#999', fontSize: '9pt' }}>
                            {estadoEntrada ? ESTADO_LABEL[estadoEntrada] : '—'}
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )
        })}

        {/* Observações gerais */}
        <div className="section-title" style={{ marginTop: 14 }}>Observações Gerais</div>
        <div className="obs-geral">
          {vistoria.observacoes_gerais || 'Nenhuma observação registrada.'}
        </div>

        {/* Fotos — URLs listadas */}
        {(itens || []).some((it: Item) => it.foto_urls.length > 0) && (
          <>
            <div className="section-title">Registro Fotográfico</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8, pageBreakBefore: 'always' }}>
              {(itens || [])
                .filter((it: Item) => it.foto_urls.length > 0)
                .map((it: Item) =>
                  it.foto_urls.map((url, idx) => (
                    <div key={`${it.id}-${idx}`} style={{ textAlign: 'center', width: 130 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={it.item} style={{ width: 130, height: 100, objectFit: 'cover', border: '1px solid #ccc', borderRadius: 2 }} />
                      <p style={{ fontSize: '8pt', color: '#555', marginTop: 3 }}>{it.ambiente} · {it.item}</p>
                    </div>
                  ))
                )}
            </div>
          </>
        )}

        {/* Assinaturas */}
        <div style={{ pageBreakInside: 'avoid', marginTop: 32 }}>
          <div className="section-title">Assinaturas</div>
          <div className="assinatura-grid">
            <div className="assinatura-box">
              <p style={{ marginBottom: 28 }}>&nbsp;</p>
              <p style={{ fontWeight: 700 }}>{corretor?.full_name || 'Corretor'}</p>
              <p>CRECI: {corretor?.creci || '—'}</p>
              <p>Corretor Responsável</p>
              {vistoria.assinado_por_corretor_em && (
                <p style={{ fontSize: '9pt', color: '#555', marginTop: 4 }}>
                  Assinado digitalmente em {new Date(vistoria.assinado_por_corretor_em).toLocaleDateString('pt-BR')}
                </p>
              )}
            </div>
            <div className="assinatura-box">
              <p style={{ marginBottom: 28 }}>&nbsp;</p>
              <p style={{ fontWeight: 700 }}>{c?.cliente_nome || 'Inquilino'}</p>
              {c?.cliente_cpf_cnpj && <p>CPF: {c.cliente_cpf_cnpj}</p>}
              <p>Inquilino</p>
              {vistoria.assinado_por_inquilino_em && (
                <p style={{ fontSize: '9pt', color: '#555', marginTop: 4 }}>
                  Assinado digitalmente em {new Date(vistoria.assinado_por_inquilino_em).toLocaleDateString('pt-BR')}
                </p>
              )}
            </div>
            <div className="assinatura-box">
              <p style={{ marginBottom: 28 }}>&nbsp;</p>
              <p style={{ fontWeight: 700 }}>{c?.proprietario_nome || 'Proprietário'}</p>
              <p>Proprietário</p>
            </div>
          </div>
          <p style={{ textAlign: 'center', fontSize: '8pt', color: '#aaa', marginTop: 24 }}>
            Laudo gerado pelo sistema BID — Balcão Imobiliário Digital · {emissao}
          </p>
        </div>
      </div>
    </>
  )
}
