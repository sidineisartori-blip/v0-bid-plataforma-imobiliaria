import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Definição estática dos canais (metadados que não mudam)
export const CANAIS_STATIC = [
  { key: 'zap',           nome: 'ZAP Imóveis',      cat: 'Portal',       plano: 'Pro',         ativo_default: true  },
  { key: 'olx',           nome: 'OLX',               cat: 'Portal',       plano: 'Pro',         ativo_default: true  },
  { key: 'viva_real',     nome: 'Viva Real',          cat: 'Portal',       plano: 'Pro',         ativo_default: false },
  { key: 'instagram',     nome: 'Instagram',          cat: 'Rede Social',  plano: 'Pro',         ativo_default: true  },
  { key: 'facebook',      nome: 'Facebook',           cat: 'Rede Social',  plano: 'Pro',         ativo_default: true  },
  { key: 'whatsapp',      nome: 'WhatsApp Business',  cat: 'Mensageria',   plano: 'Free',        ativo_default: true  },
  { key: 'site_corretor', nome: 'Site do Corretor',   cat: 'Site Próprio', plano: 'Pro',         ativo_default: true  },
  { key: 'api',           nome: 'API Imobiliária',    cat: 'API',          plano: 'Imobiliária', ativo_default: false },
]

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  // Busca preferências salvas
  const { data: prefs } = await supabase
    .from('hub_canais')
    .select('canal_key, ativo')
    .eq('corretor_id', user.id)

  // Conta leads do site próprio nos últimos 30 dias
  const desde30d = new Date(Date.now() - 30 * 86400000).toISOString()
  const { count: leadsDoSite } = await supabase
    .from('solicitacoes')
    .select('*', { count: 'exact', head: true })
    .eq('corretor_id', user.id)
    .gte('created_at', desde30d)

  // Mescla estático + prefs do DB
  const prefMap = Object.fromEntries((prefs || []).map((p) => [p.canal_key, p.ativo]))

  const canais = CANAIS_STATIC.map((c) => ({
    key: c.key,
    nome: c.nome,
    cat: c.cat,
    plano: c.plano,
    ativo: c.key in prefMap ? prefMap[c.key] : c.ativo_default,
    leads: c.key === 'site_corretor' ? (leadsDoSite || 0) : 0,
    rastreavel: c.key === 'site_corretor',
  }))

  return NextResponse.json(canais)
}
