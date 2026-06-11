import type { Metadata } from 'next'
import { Playfair_Display, DM_Sans } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import CookieBanner from '@/components/legal/CookieBanner'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
})
const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : 'https://v0-bid-plataforma-imobiliaria.vercel.app')
  ),
  title: {
    default: 'BID — Balcão Imobiliário Digital',
    template: '%s | BID',
  },
  description: 'Plataforma de matching imobiliário para corretores. Conecte imóveis a compradores, gerencie sua carteira e feche mais negócios.',
  keywords: ['corretor de imóveis', 'matching imobiliário', 'BID', 'balcão imobiliário', 'plataforma imobiliária', 'CRECI', 'imóveis'],
  generator: 'v0.app',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'BID — Balcão Imobiliário Digital',
    title: 'BID — Balcão Imobiliário Digital',
    description: 'Plataforma de matching imobiliário para corretores credenciados.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'BID — Plataforma Imobiliária Inteligente',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BID — Balcão Imobiliário Digital',
    description: 'Matching imobiliário inteligente para corretores.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`${playfair.variable} ${dmSans.variable}`} style={{ backgroundColor: '#0E0E0F' }}>
      <body className="font-sans antialiased" style={{ backgroundColor: '#0E0E0F', color: '#F0EDE6' }}>
        {children}
        <CookieBanner />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
