import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import RelatoriosCorretorClient from '@/components/relatorios/RelatoriosCorretorClient'

export const dynamic = 'force-dynamic'

const PLANOS_PERMITIDOS = ['pro', 'premium', 'enterprise']

export default async function RelatoriosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: corretor } = await supabase
    .from('corretores')
    .select('plano, full_name')
    .eq('id', user.id)
    .single()

  const plano = corretor?.plano || 'free'
  const temAcesso = PLANOS_PERMITIDOS.includes(plano)

  return (
    <RelatoriosCorretorClient
      planoAtual={plano}
      temAcesso={temAcesso}
    />
  )
}
