// Helper de envio de mensagens via Evolution API (WhatsApp).
// Variaveis necessarias no ambiente:
//   EVOLUTION_API_URL   ex: https://sua-evolution.com
//   EVOLUTION_API_KEY   chave global ou da instancia
//   EVOLUTION_INSTANCE  nome da instancia conectada ao WhatsApp

type EnvioResultado =
  | { ok: true; id?: string }
  | { ok: false; error: string }

/**
 * Normaliza um telefone brasileiro para o formato esperado pela Evolution API.
 * Aceita numeros com 10 ou 11 digitos (DDD + numero) e prefixa o DDI 55.
 * Se ja vier com 12-13 digitos (com DDI), apenas remove caracteres nao numericos.
 */
export function normalizarTelefoneBR(telefone: string): string | null {
  const digitos = (telefone || '').replace(/\D/g, '')
  if (!digitos) return null

  // Ja inclui DDI 55 (12 ou 13 digitos)
  if ((digitos.length === 12 || digitos.length === 13) && digitos.startsWith('55')) {
    return digitos
  }
  // DDD + numero (10 ou 11 digitos) -> prefixa DDI
  if (digitos.length === 10 || digitos.length === 11) {
    return `55${digitos}`
  }
  return null
}

/**
 * Envia uma mensagem de texto via Evolution API.
 * Retorna { ok: false } sem lancar excecao, para nao quebrar fluxos chamadores.
 */
export async function enviarWhatsApp(
  telefone: string,
  mensagem: string
): Promise<EnvioResultado> {
  const baseUrl = process.env.EVOLUTION_API_URL
  const apiKey = process.env.EVOLUTION_API_KEY
  const instance = process.env.EVOLUTION_INSTANCE

  if (!baseUrl || !apiKey || !instance) {
    return { ok: false, error: 'Evolution API nao configurada (variaveis ausentes)' }
  }

  const numero = normalizarTelefoneBR(telefone)
  if (!numero) {
    return { ok: false, error: `Telefone invalido: ${telefone}` }
  }

  const url = `${baseUrl.replace(/\/$/, '')}/message/sendText/${encodeURIComponent(instance)}`

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: apiKey,
      },
      body: JSON.stringify({ number: numero, text: mensagem }),
    })

    if (!resp.ok) {
      const corpo = await resp.text().catch(() => '')
      return { ok: false, error: `Evolution API ${resp.status}: ${corpo.slice(0, 200)}` }
    }

    const data = await resp.json().catch(() => ({}))
    return { ok: true, id: data?.key?.id }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Falha de rede' }
  }
}
