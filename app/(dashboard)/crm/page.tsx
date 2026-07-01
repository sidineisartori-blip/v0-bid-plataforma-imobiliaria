import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CRMTabs from '@/components/crm/CRMTabs'

export const dynamic = 'force-dynamic'

export default async function CRMPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: negociacoes }, { data: leads }] = await Promise.all([
    supabase
      .from('negociacoes')
      .select(
        `
        *,
        parceria:parcerias(
          id, comissao_split, status, dados_liberados,
          corretor_proponente_id, corretor_receptor_id,
          match:matches(
            score, tipo,
            imovel:imoveis(titulo, bairro, cidade, valor),
            solicitacao:solicitacoes(cliente_nome, cidade)
          )
        )
      `,
      )
      .eq('corretor_id', user.id)
      .order('updated_at', { ascending: false }),

    supabase
      .from('solicitacoes')
      .select(
        'id, cliente_nome, cliente_phone, cliente_email, tipo_negocio, tipo_imovel, cidade, bairro_desejado, valor_min, valor_max, status, kanban_coluna, created_at, updated_at',
      )
      .eq('corretor_id', user.id)
      .neq('status', 'cancelada')
      .order('created_at', { ascending: false }),
  ])

  return (
    <CRMTabs
      negociacoes={negociacoes || []}
      leads={leads || []}
      corretorId={user.id}
    />
  )
}
