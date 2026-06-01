import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import SiteCorretorPublico from '@/components/site/SiteCorretorPublico'

export const dynamic = 'force-dynamic'

export default async function SiteCorretorPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createServerSupabaseClient()

  const { data: corretor } = await supabase
    .from('corretores')
    .select('id, full_name, creci, city, bio, avatar_url, nota_media, total_avaliacoes, deals_closed, plano, site_ativo, site_boas_vindas, site_modelo, phone')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!corretor || !corretor.site_ativo) notFound()

  const { data: imoveis } = await supabase
    .from('imoveis')
    .select('id, titulo, bairro, cidade, valor, quartos, banheiros, vagas, tipo_imovel, tipo_negocio, image_urls, lancamento, aceita_animal')
    .eq('corretor_id', corretor.id)
    .eq('status', 'ativo')
    .eq('publico_no_site', true)
    .order('lancamento', { ascending: false })
    .order('created_at', { ascending: false })

  return (
    <SiteCorretorPublico
      corretor={corretor}
      imoveis={imoveis || []}
    />
  )
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createServerSupabaseClient()
  const { data: corretor } = await supabase
    .from('corretores')
    .select('full_name, city, bio')
    .eq('slug', slug)
    .single()

  return {
    title: corretor
      ? `${corretor.full_name} — Corretor de Imoveis | BID`
      : 'Corretor | BID',
    description:
      corretor?.bio ||
      `Corretor de imoveis em ${corretor?.city}. Encontre o imovel ideal.`,
  }
}
