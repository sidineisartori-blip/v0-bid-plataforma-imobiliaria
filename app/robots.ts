import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/corretor/'],
        disallow: ['/dashboard', '/api/', '/admin'],
      },
    ],
    sitemap: 'https://v0-bid-plataforma-imobiliaria.vercel.app/sitemap.xml',
  }
}
