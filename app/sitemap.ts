import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://v0-bid-plataforma-imobiliaria.vercel.app'

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ]

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data: corretores } = await supabase
      .from('corretores')
      .select('slug, updated_at')
      .eq('site_ativo', true)
      .not('slug', 'is', null)

    const corretorPages: MetadataRoute.Sitemap = (corretores || []).map(c => ({
      url: `${base}/corretor/${c.slug}`,
      lastModified: c.updated_at ? new Date(c.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

    return [...staticPages, ...corretorPages]
  } catch {
    return staticPages
  }
}
