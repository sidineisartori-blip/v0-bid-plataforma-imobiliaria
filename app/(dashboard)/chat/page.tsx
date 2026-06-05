import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ChatClient from '@/components/chat/ChatClient'
import type { ChatNegociacao } from '@/types/bid'

export const dynamic = 'force-dynamic'

export default async function ChatPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Filtra negociações onde o corretor é proponente ou receptor
  const { data: negociacoes } = await supabase
    .from('negociacoes')
    .select(`
      id, coluna, updated_at,
      parceria:parcerias(
        id, comissao_split,
        corretor_proponente_id, corretor_receptor_id,
        match:matches(
          imovel:imoveis(titulo, bairro, cidade),
          solicitacao:solicitacoes(cliente_nome)
        ),
        proponente:corretores!parcerias_corretor_proponente_id_fkey(id, full_name, avatar_url),
        receptor:corretores!parcerias_corretor_receptor_id_fkey(id, full_name, avatar_url)
      )
    `)
    .eq('corretor_id', user.id)
    .order('updated_at', { ascending: false })

  const negIds = negociacoes?.map((n) => n.id) || []

  const { data: naoLidas } = negIds.length
    ? await supabase
        .from('mensagens')
        .select('negociacao_id')
        .in('negociacao_id', negIds)
        .eq('lida', false)
        .neq('remetente_id', user.id)
    : { data: [] }

  return (
    <ChatClient
      negociacoes={(negociacoes as ChatNegociacao[]) || []}
      naoLidas={naoLidas || []}
      corretorId={user.id}
    />
  )
}
