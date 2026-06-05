import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Site do Corretor | BID',
  description: 'Encontre o imóvel ideal com um corretor verificado pela plataforma BID.',
}

export default function CorretorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
