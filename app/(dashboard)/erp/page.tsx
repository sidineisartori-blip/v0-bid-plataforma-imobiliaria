import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ERPClient from '@/components/erp/ERPClient'
import type { MovimentacaoExtrato } from '@/components/erp/ERPExtrato'

export const dynamic = 'force-dynamic'

export default async function ERPPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: contratos },
    { data: imoveis },
    { data: cobrancas },
    { data: repasses },
  ] = await Promise.all([
    supabase
      .from('contratos')
      .select('*, imovel:imoveis(titulo,cidade,bairro)')
      .eq('corretor_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('imoveis')
      .select('id,titulo,cidade,bairro')
      .eq('corretor_id', user.id)
      .order('titulo'),
    // Cobranças (parcelas) com dados do contrato
    supabase
      .from('contrato_parcelas')
      .select(`
        *,
        contrato:contratos(
          cliente_nome, tipo, valor_aluguel,
          imovel:imoveis(titulo, cidade)
        )
      `)
      .eq('corretor_id', user.id)
      .order('competencia', { ascending: false }),
    // Repasses — tabela pode ainda não existir, usar try
    supabase
      .from('repasses')
      .select(`
        *,
        contrato:contratos(
          cliente_nome,
          imovel:imoveis(titulo, cidade)
        )
      `)
      .eq('corretor_id', user.id)
      .order('competencia', { ascending: false }),
  ])

  // Montar movimentações do extrato a partir de cobranças e repasses
  const movimentacoes: MovimentacaoExtrato[] = []

  for (const c of (cobrancas || [])) {
    if (c.status === 'pago' && c.data_pagamento) {
      movimentacoes.push({
        id: `cob-${c.id}`,
        data: c.data_pagamento,
        tipo: 'entrada',
        descricao: `Cobrança — ${(c.contrato as any)?.cliente_nome || ''}`,
        valor: c.valor,
        origem: 'cobranca',
        referencia: c.id,
      })
    }
  }

  for (const r of (repasses || [])) {
    if (r.status === 'realizado' && r.data_repasse) {
      movimentacoes.push({
        id: `rep-${r.id}`,
        data: r.data_repasse,
        tipo: 'saida',
        descricao: `Repasse — ${(r.contrato as any)?.cliente_nome || ''}`,
        valor: r.valor_liquido,
        origem: 'repasse',
        referencia: r.id,
      })
    }
  }

  return (
    <ERPClient
      contratos={contratos || []}
      cobrancas={(cobrancas || []) as any}
      repasses={(repasses || []) as any}
      movimentacoes={movimentacoes}
      saldoAnterior={0}
      imoveis={imoveis || []}
      corretorId={user.id}
    />
  )
}
