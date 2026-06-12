import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Vercel Cron chama com Authorization: Bearer CRON_SECRET
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Busca follow-ups vencidos (agendado_para <= agora) ainda pendentes
  const { data: vencidos, error } = await admin
    .from('follow_ups')
    .select('id, corretor_id, solicitacao_id, cliente_nome, cliente_phone, tipo_negocio, cidade, contador')
    .eq('status', 'pendente')
    .lte('agendado_para', new Date().toISOString())
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!vencidos?.length) return NextResponse.json({ processados: 0 })

  let processados = 0

  for (const fu of vencidos) {
    // Verifica se a solicitação ainda está ativa
    const { data: sol } = await admin
      .from('solicitacoes')
      .select('status')
      .eq('id', fu.solicitacao_id)
      .single()

    // Se a solicitação foi fechada/cancelada, encerra o follow-up
    if (!sol || sol.status === 'fechada' || sol.status === 'cancelada') {
      await admin.from('follow_ups').update({ status: 'encerrado' }).eq('id', fu.id)
      continue
    }

    // Cria notificação para o corretor
    const diasContador = fu.contador * 2
    await admin.from('notificacoes').insert({
      corretor_id: fu.corretor_id,
      tipo: 'follow_up',
      titulo: `Retorne para ${fu.cliente_nome || 'cliente'}`,
      mensagem: `Já faz ${diasContador} dias desde que ${fu.cliente_nome || 'um cliente'} solicitou um imóvel (${fu.tipo_negocio || ''} em ${fu.cidade || ''}). Faça um contato de acompanhamento.`,
      lida: false,
      metadata: {
        solicitacao_id: fu.solicitacao_id,
        cliente_nome: fu.cliente_nome,
        cliente_phone: fu.cliente_phone,
        contador: fu.contador,
      },
    })

    // Marca este como enviado e agenda o próximo (+ 2 dias)
    const proximo = new Date()
    proximo.setDate(proximo.getDate() + 2)

    await Promise.all([
      admin.from('follow_ups').update({ status: 'enviado' }).eq('id', fu.id),
      admin.from('follow_ups').insert({
        corretor_id: fu.corretor_id,
        solicitacao_id: fu.solicitacao_id,
        cliente_nome: fu.cliente_nome,
        cliente_phone: fu.cliente_phone,
        tipo_negocio: fu.tipo_negocio,
        cidade: fu.cidade,
        agendado_para: proximo.toISOString(),
        status: 'pendente',
        contador: fu.contador + 1,
      }),
    ])

    processados++
  }

  return NextResponse.json({ processados, total: vencidos.length })
}
