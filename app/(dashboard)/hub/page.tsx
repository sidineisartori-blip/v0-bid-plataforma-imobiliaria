import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import HubClient from '@/components/hub/HubClient'

export default async function HubPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: imoveis } = await supabase
    .from('imoveis')
    .select(
      'id, titulo, bairro, cidade, valor, quartos, banheiros, vagas, tipo_imovel, tipo_negocio, aceita_animal, area_total, lancamento, descricao, image_urls'
    )
    .eq('corretor_id', user.id)
    .eq('status', 'ativo')
    .order('created_at', { ascending: false })

  return <HubClient imoveis={imoveis || []} />
}
