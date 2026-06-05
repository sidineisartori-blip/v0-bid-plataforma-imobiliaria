import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ERPClient from '@/components/erp/ERPClient'

export const dynamic = 'force-dynamic'

export default async function ERPPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: contratos }, { data: imoveis }] = await Promise.all([
    supabase
      .from('contratos')
      .select(`
        *,
        imovel:imoveis(titulo, cidade, bairro)
      `)
      .eq('corretor_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('imoveis')
      .select('id, titulo, cidade, bairro')
      .eq('corretor_id', user.id)
      .order('titulo'),
  ])

  return (
    <ERPClient
      contratos={contratos || []}
      imoveis={imoveis || []}
      corretorId={user.id}
    />
  )
}
