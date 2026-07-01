import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import HubClient from '@/components/hub/HubClient'
import { CANAIS_STATIC } from '@/app/api/hub/canais/route'

export default async function HubPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const desde30d = new Date(Date.now() - 30 * 86400000).toISOString()

  const [{ data: imoveis }, { data: prefs }, { count: leadsDoSite }] = await Promise.all([
    supabase
      .from('imoveis')
      .select('id, titulo, bairro, cidade, valor, quartos, banheiros, vagas, tipo_imovel, tipo_negocio, aceita_animal, area_total, lancamento, descricao')
      .eq('corretor_id', user.id)
      .eq('status', 'ativo')
      .order('created_at', { ascending: false }),

    supabase
      .from('hub_canais')
      .select('canal_key, ativo')
      .eq('corretor_id', user.id),

    supabase
      .from('solicitacoes')
      .select('*', { count: 'exact', head: true })
      .eq('corretor_id', user.id)
      .gte('created_at', desde30d),
  ])

  const prefMap = Object.fromEntries((prefs || []).map((p) => [p.canal_key, p.ativo]))

  const canaisIniciais = CANAIS_STATIC.map((c) => ({
    key: c.key,
    nome: c.nome,
    cat: c.cat,
    plano: c.plano,
    ativo: c.key in prefMap ? prefMap[c.key] : c.ativo_default,
    leads: c.key === 'site_corretor' ? (leadsDoSite || 0) : 0,
    rastreavel: c.key === 'site_corretor',
  }))

  return <HubClient imoveis={imoveis || []} canaisIniciais={canaisIniciais} />
}
