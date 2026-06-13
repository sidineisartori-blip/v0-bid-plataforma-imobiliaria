import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail, emailFollowUpAlerta } from '@/lib/email'
import { enviarWhatsApp } from '@/lib/whatsapp'

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

  // Busca follow-ups vencidos + dados do corretor para notificações
  const { data: vencidos, error } = await admin
    .from('follow_ups')
    .select('id, corretor_id, solicitacao_id, cliente_nome, cliente_phone, tipo_negocio, cidade, contador, corretor:corretores(nome, email, whatsapp)')
    .eq('status', 'pendente')
    .lte('agendado_para', new Date().toISOString())
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!vencidos?.length) return NextResponse.json({ processados: 0, whatsappEnviados: 0 })

  let processados = 0
  let whatsappEnviados = 0

  for (const fu of vencidos) {
    // Verifica se a solicitação ainda está ativa
    const { data: sol } = await admin
      .from('solicitacoes')
      .select('status')
      .eq('id', fu.solicitacao_id)
      .single()

    if (!sol || sol.status === 'fechada' || sol.status === 'cancelada') {
      await admin.from('follow_ups').update({ status: 'encerrado' }).eq('id', fu.id)
      continue
    }

    const diasContador = fu.contador * 2
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://v0-bid-plataforma-imobiliaria.vercel.app'
    const corretor = fu.corretor as { nome?: string; email?: string; whatsapp?: string } | null
    const nomeCorretor = corretor?.nome ?? 'seu corretor'

    // Email ao CORRETOR alertando para fazer contato
    if (corretor?.email) {
      sendEmail({
        to: corretor.email,
        subject: `⏰ Follow-up: ligue para ${fu.cliente_nome ?? 'cliente'} hoje`,
        html: emailFollowUpAlerta({
          corretorNome: nomeCorretor,
          clienteNome: fu.cliente_nome ?? '',
          clientePhone: fu.cliente_phone ?? '',
          tipoNegocio: fu.tipo_negocio ?? '',
          cidade: fu.cidade ?? '',
          diasDesde: diasContador,
          appUrl,
        }),
      })
    }

    // Notificação in-app para o corretor
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

    // WhatsApp ao CLIENTE em nome do corretor
    if (fu.cliente_phone) {
      const primeiroNome = (fu.cliente_nome || '').split(' ')[0] || 'Olá'
      const negocio = (fu.tipo_negocio || '').toLowerCase()
      const acao = negocio === 'alugar' || negocio === 'locação' ? 'alugar' : 'comprar'
      const cidadeTxt = fu.cidade ? ` em ${fu.cidade}` : ''

      const mensagem =
        `Olá ${primeiroNome}! Aqui é ${nomeCorretor}. ` +
        `Notei que você procura um imóvel para ${acao}${cidadeTxt} e queria saber se ainda está na busca. ` +
        `Posso te ajudar a encontrar boas opções. Quando puder, me responda por aqui! 🏡`

      const envio = await enviarWhatsApp(fu.cliente_phone, mensagem)
      if (envio.ok) whatsappEnviados++
      else console.error('[cron] Falha WhatsApp follow-up:', envio.error)
    }

    // Marca como enviado e agenda próximo (+2 dias)
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

  return NextResponse.json({ processados, whatsappEnviados, total: vencidos.length })
}
