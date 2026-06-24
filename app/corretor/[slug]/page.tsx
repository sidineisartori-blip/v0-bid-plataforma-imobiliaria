import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import SiteCorretorPublico from '@/components/site/SiteCorretorPublico'

export const dynamic = 'force-dynamic'

export default async function SiteCorretorPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: corretor } = await supabase
    .from('corretores')
    .select('id, full_name, creci, city, bio, avatar_url, nota_media, total_avaliacoes, deals_closed, plano, site_ativo, site_boas_vindas, site_modelo, phone')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!corretor || !corretor.site_ativo) notFound()

  const { data: imoveis } = await supabase
    .from('imoveis')
    .select('id, titulo, bairro, cidade, valor, quartos, banheiros, vagas, area_total, tipo_imovel, tipo_negocio, image_urls, lancamento, aceita_animal')
    .eq('corretor_id', corretor.id)
    .in('status', ['ativo', 'disponivel'])
    .eq('publico_no_site', true)
    .order('lancamento', { ascending: false })
    .order('created_at', { ascending: false })

  // JSON-LD: schema Person para SEO avançado (rich results)
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'http://localhost:3000')

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: corretor.full_name,
    url: `${baseUrl}/corretor/${slug}`,
    ...(corretor.avatar_url ? { image: corretor.avatar_url } : {}),
    ...(corretor.bio ? { description: corretor.bio } : {}),
    ...(corretor.phone ? { telephone: corretor.phone } : {}),
    jobTitle: 'Corretor de Imóveis',
    ...(corretor.creci ? { identifier: { '@type': 'PropertyValue', name: 'CRECI', value: corretor.creci } } : {}),
    ...(corretor.city
      ? { address: { '@type': 'PostalAddress', addressLocality: corretor.city, addressCountry: 'BR' } }
      : {}),
    worksFor: { '@type': 'Organization', name: 'BID', url: baseUrl },
    ...(corretor.total_avaliacoes && corretor.total_avaliacoes > 0 && corretor.nota_media
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: Number(corretor.nota_media).toFixed(1),
            reviewCount: corretor.total_avaliacoes,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteCorretorPublico
        corretor={corretor}
        imoveis={imoveis || []}
      />
    </>
  )
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
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
