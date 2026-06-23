// Helpers de normalização para cidades e bairros.
// O slug é a CHAVE ANTI-DUPLICATA: "Jacarezinho", "jacarezinho ", "Jacarézinho"
// e "JACAREZINHO" colapsam todos para o mesmo slug "jacarezinho", garantindo que
// a mesma cidade não seja cadastrada duas vezes com grafias diferentes.
//
// IMPORTANTE: a comparação do matching é por igualdade EXATA de string em
// solicitacoes.cidade vs imoveis.cidade (.eq no banco). Por isso o `name`
// armazenado deve ser sempre a grafia canônica (a do dropdown / a do ViaCEP).

/**
 * Gera o slug normalizado usado para deduplicação.
 * - remove acentos
 * - minúsculas
 * - colapsa espaços
 * - remove caracteres não alfanuméricos
 * - troca espaços por hífen
 */
export function slugLocalidade(input: string): string {
  return (input || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacríticos (acentos)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // só letras/números/espaço/hífen
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\s/g, '-')
    .replace(/-+/g, '-')
}

/** Normaliza a UF para 2 letras maiúsculas. */
export function normalizarUF(input: string): string {
  return (input || '').trim().toUpperCase().slice(0, 2)
}

/**
 * Limpa o nome para armazenamento: tira espaços nas pontas e colapsa
 * espaços internos, preservando a grafia/acentuação que o usuário digitou.
 */
export function limparNome(input: string): string {
  return (input || '').trim().replace(/\s+/g, ' ')
}

/** Valida UF brasileira (27 unidades federativas). */
const UFS_VALIDAS = new Set([
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
  'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
  'SP', 'SE', 'TO',
])

export function ufValida(uf: string): boolean {
  return UFS_VALIDAS.has(normalizarUF(uf))
}
