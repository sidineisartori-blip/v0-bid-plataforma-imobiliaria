import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminClient from '@/components/admin/AdminClient'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: corretor } = await supabase
    .from('corretores')
    .select('role')
    .eq('id', user.id)
    .single()

  if (corretor?.role !== 'admin' && corretor?.role !== 'admin_completo') {
    redirect('/dashboard')
  }

  const [
    { data: corretores },
    { data: denuncias },
    { count: corretoresAtivos },
    { count: corretoresPendentes },
    { count: denunciasAbertas },
    { count: negociosFechados },
    { count: matchesHoje },
  ] = await Promise.all([
    supabase
      .from('corretores')
      .select('id, full_name, creci, creci_status, plano, nota_media, created_at')
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('denuncias')
      .select('id, denunciante_id, denunciado_id, motivo, status, created_at, denunciante:corretores!denuncias_denunciante_id_fkey(full_name), denunciado:corretores!denuncias_denunciado_id_fkey(full_name)')
      .eq('status', 'aberta')
      .order('created_at', { ascending: false }),
    supabase.from('corretores').select('*', { count: 'exact', head: true }).eq('creci_status', 'ativo').eq('is_active', true),
    supabase.from('corretores').select('*', { count: 'exact', head: true }).eq('creci_status', 'pendente'),
    supabase.from('denuncias').select('*', { count: 'exact', head: true }).eq('status', 'aberta'),
    supabase.from('imoveis').select('*', { count: 'exact', head: true }).eq('status', 'concluido'),
    supabase.from('matches').select('*', { count: 'exact', head: true }).gte('created_at', new Date().toISOString().split('T')[0]),
  ])

  return (
    <AdminClient
      adminId={user.id}
      corretores={(corretores as any[]) || []}
      denuncias={(denuncias as any[]) || []}
      metricas={{
        corretoresAtivos: corretoresAtivos || 0,
        corretoresPendentes: corretoresPendentes || 0,
        denunciasAbertas: denunciasAbertas || 0,
        negociosFechados: negociosFechados || 0,
        matchesHoje: matchesHoje || 0,
      }}
    />
  )
}
