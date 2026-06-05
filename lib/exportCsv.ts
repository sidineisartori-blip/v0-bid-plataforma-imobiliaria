/**
 * Exportação CSV/XLS client-side.
 * Padrão do Superlógica: botões no rodapé de cada listagem.
 */

type Row = Record<string, string | number | boolean | null | undefined>

export function exportarCSV(dados: Row[], nomeArquivo: string) {
  if (dados.length === 0) return
  const cabecalho = Object.keys(dados[0])
  const linhas = dados.map((row) =>
    cabecalho.map((col) => {
      const val = row[col]
      if (val === null || val === undefined) return ''
      const str = String(val)
      // Escapar aspas e células com vírgula/quebra
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }).join(',')
  )
  const conteudo = [cabecalho.join(','), ...linhas].join('\n')
  const blob = new Blob(['\uFEFF' + conteudo], { type: 'text/csv;charset=utf-8;' })
  downloadBlob(blob, nomeArquivo + '.csv')
}

export function exportarXLS(dados: Row[], nomeArquivo: string) {
  if (dados.length === 0) return
  const cabecalho = Object.keys(dados[0])
  const linhas = [cabecalho, ...dados.map((row) => cabecalho.map((col) => row[col] ?? ''))]
  // Formato XML simples compatível com Excel (SpreadsheetML)
  const xml = `<?xml version="1.0"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="Dados">
    <Table>
      ${linhas.map((linha) => `
      <Row>
        ${linha.map((cel) => {
          const isNum = typeof cel === 'number' || (typeof cel === 'string' && !isNaN(Number(cel)) && cel !== '')
          return `<Cell><Data ss:Type="${isNum ? 'Number' : 'String'}">${String(cel).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</Data></Cell>`
        }).join('')}
      </Row>`).join('')}
    </Table>
  </Worksheet>
</Workbook>`
  const blob = new Blob([xml], { type: 'application/vnd.ms-excel' })
  downloadBlob(blob, nomeArquivo + '.xls')
}

function downloadBlob(blob: Blob, nome: string) {
  const url  = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href  = url
  link.setAttribute('download', nome)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/** Helper: converter lista de contratos em linhas exportáveis */
export function contratosParaExport(contratos: {
  cliente_nome: string; tipo: string; status: string; valor_contrato: number;
  data_inicio: string | null; data_fim: string | null; imovel?: { titulo?: string; cidade?: string } | null
}[]) {
  return contratos.map((c) => ({
    Cliente:          c.cliente_nome,
    Tipo:             c.tipo,
    Status:           c.status,
    'Valor (R$)':     c.valor_contrato,
    Início:           c.data_inicio || '',
    Fim:              c.data_fim || '',
    Imóvel:           c.imovel?.titulo || '',
    Cidade:           c.imovel?.cidade || '',
  }))
}

export function imoveisParaExport(imoveis: {
  titulo: string; tipo_imovel: string; tipo_negocio: string; status: string;
  cidade: string; bairro: string | null; valor: number; quartos: number; area_total: number | null
}[]) {
  return imoveis.map((i) => ({
    Título:         i.titulo,
    'Tipo Imóvel':  i.tipo_imovel,
    Negócio:        i.tipo_negocio,
    Status:         i.status,
    Cidade:         i.cidade,
    Bairro:         i.bairro || '',
    'Valor (R$)':   i.valor,
    Quartos:        i.quartos,
    'Área (m²)':    i.area_total || '',
  }))
}

export function solicitacoesParaExport(sols: {
  cliente_nome: string; tipo_negocio: string; status: string;
  cidade: string; valor_min: number | null; valor_max: number | null; created_at: string
}[]) {
  return sols.map((s) => ({
    Cliente:        s.cliente_nome,
    Tipo:           s.tipo_negocio,
    Status:         s.status,
    Cidade:         s.cidade,
    'Valor mín':    s.valor_min || '',
    'Valor máx':    s.valor_max || '',
    Cadastrado:     new Date(s.created_at).toLocaleDateString('pt-BR'),
  }))
}
