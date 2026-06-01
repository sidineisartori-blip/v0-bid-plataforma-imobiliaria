'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CRMClient from '@/components/crm/CRMClient'

export default async function CRMPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: negociacoes } = await supabase
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
    `
    )
    .order('updated_at', { ascending: false })

  return <CRMClient negociacoes={negociacoes || []} corretorId={user.id} />
}
