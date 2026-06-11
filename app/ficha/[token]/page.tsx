import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import FichaCadastralForm from '@/components/ficha/FichaCadastralForm'

export const metadata: Metadata = {
  title: 'Ficha Cadastral',
  robots: { index: false, follow: false },
}

export default async function FichaPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
    || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000')

  const res = await fetch(`${baseUrl}/api/ficha/${token}`, { cache: 'no-store' })

  if (res.status === 404) notFound()

  const data = await res.json()

  if (data.preenchido) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F8F7F5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 480 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>✓</div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 26, color: '#1A1A1A', marginBottom: 10 }}>Ficha já enviada</h1>
          <p style={{ color: '#6B6560', fontSize: 15, lineHeight: 1.7 }}>
            Seus dados já foram enviados com sucesso. O corretor entrará em contato em breve.
          </p>
        </div>
      </div>
    )
  }

  return <FichaCadastralForm token={token} ficha={data.ficha} />
}
