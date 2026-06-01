import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ImoveisClient from '@/components/imoveis/ImoveisClient'

export default async function ImoveisPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: imoveis }, { data: cidades }] = await Promise.all([
    supabase
      .from('imoveis')
      .select('*')
      .eq('corretor_id', user.id)
      .order('created_at', { ascending: false }),
    supabase.from('cities').select('id, name, state').eq('active', true).order('name'),
  ])

  return (
    <ImoveisClient
      imoveis={imoveis || []}
      cidades={cidades || []}
      corretorId={user.id}
    />
  )
}
