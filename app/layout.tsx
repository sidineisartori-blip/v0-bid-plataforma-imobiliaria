import type { Metadata } from 'next'
import { Playfair_Display, DM_Sans } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
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
        : 'http://localhost:3000')
  ),
  title: 'BID — Plataforma Imobiliária',
  description: 'Plataforma de matching imobiliário para corretores.',
  generator: 'v0.app',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'BID',
    title: 'BID — Plataforma Imobiliária',
    description: 'Plataforma de matching imobiliário para corretores.',
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
    title: 'BID — Plataforma Imobiliária',
    description: 'Plataforma de matching imobiliário para corretores.',
    images: ['/og-image.png'],
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
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
