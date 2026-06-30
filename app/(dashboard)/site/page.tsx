import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import SiteConfigClient from '@/components/site/SiteConfigClient'

export default async function SitePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: corretor } = await supabase
    .from('corretores')
    .select('id, full_name, creci, city, bio, avatar_url, nota_media, total_avaliacoes, deals_closed, plano, phone, site_ativo, site_boas_vindas, site_modelo, slug, instagram, linkedin, facebook')
    .eq('id', user.id)
    .single()

  if (!corretor) redirect('/dashboard')

  const { data: imoveisPrevia } = await supabase
    .from('imoveis')
    .select('id, titulo, bairro, cidade, valor, quartos, banheiros, vagas, area_total, tipo_imovel, tipo_negocio, image_urls, lancamento, aceita_animal')
    .eq('corretor_id', user.id)
    .eq('status', 'ativo')
    .eq('publico_no_site', true)
    .limit(4)

  return (
    <SiteConfigClient
      corretor={corretor}
      imoveisPrevia={imoveisPrevia || []}
    />
  )
}
