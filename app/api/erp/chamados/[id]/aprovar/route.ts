import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email'
import { emailChamadoProprietario, emailChamadoResolvido } from '@/lib/email'

// Notifica via Evolution API (WhatsApp)
async function notificarWA(phone: string, mensagem: string) {
  const url = process.env.EVOLUTION_API_URL
  const key = process.env.EVOLUTION_API_KEY
  const inst = process.env.EVOLUTION_INSTANCE || 'bid'
  if (!url || !key) return
  try {
    await fetch(`${url}/message/sendText/${inst}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: key },
      body: JSON.stringify({ number: phone.replace(/\D/g, ''), text: mensagem }),
      signal: AbortSignal.timeout(5000),
    })
  } catch { /* silencioso */ }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { acao, comentario } = await req.json()
  // acao: 'aprovar' | 'recusar' | 'iniciar' | 'concluir'

  const { data: chamado } = await supabase
    .from('chamados')
    .select(`
      *,
      contrato:contratos(
        cliente_nome, proprietario_nome, proprietario_phone, proprietario_email,
        imovel:imoveis(titulo, cidade)
      )
    `)
    .eq('id', id)
    .eq('corretor_id', user.id)
    .single()

  if (!chamado) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` || 'http://localhost:3000'

  let novoStatus: string | null = null
  let historico = ''

  if (acao === 'aprovar') {
    novoStatus = 'aprovado_corretor'
    historico = 'Corretor aprovou o chamado'

    // Notificar proprietário
    const prop = chamado.contrato
    const propPhone = prop?.proprietario_phone
    const propEmail = prop?.proprietario_email
    const propNome = prop?.proprietario_nome || 'Proprietário'
    const imovel = prop?.imovel?.titulo || 'Imóvel'
    const cidade = prop?.imovel?.cidade || ''
    const linkAutorizar = `${baseUrl}/portal/proprietario/${chamado.proprietario_token}`

    if (propPhone) {
      await notificarWA(propPhone,
        `*BID Imobiliário — Chamado de Serviço*\n\n` +
        `Olá, ${propNome}!\n\n` +
        `Um chamado de serviço foi aberto para o imóvel *${imovel}${cidade ? ` — ${cidade}` : ''}*:\n\n` +
        `*${chamado.titulo}*\n${chamado.descricao}\n\n` +
        `Urgência: ${chamado.urgencia.toUpperCase()}\n\n` +
        `Clique para autorizar ou recusar:\n${linkAutorizar}`
      )
    }

    if (propEmail) {
      await sendEmail({
        to: propEmail,
        subject: `[BID] Chamado de serviço aguarda sua autorização — ${chamado.titulo}`,
        html: emailChamadoProprietario({
          propNome,
          imovelNome: imovel,
          cidade,
          titulo: chamado.titulo,
          descricao: chamado.descricao,
          urgencia: chamado.urgencia,
          linkAutorizar,
        }),
      })
    }
  } else if (acao === 'recusar') {
    novoStatus = 'recusado'
    historico = comentario?.trim() || 'Chamado recusado pelo corretor'
  } else if (acao === 'iniciar') {
    if (chamado.status !== 'aprovado_proprietario' && chamado.status !== 'aprovado_corretor') {
      return NextResponse.json({ error: 'Chamado não está aprovado' }, { status: 400 })
    }
    novoStatus = 'em_execucao'
    historico = 'Execução iniciada pelo corretor'
  } else if (acao === 'concluir') {
    if (chamado.status !== 'em_execucao') {
      return NextResponse.json({ error: 'Chamado não está em execução' }, { status: 400 })
    }
    novoStatus = 'concluido'
    historico = comentario?.trim() || 'Serviço concluído'

    // Notificar inquilino (se tiver email no contrato)
    const inquilinoEmail = chamado.contrato?.cliente_email
    if (inquilinoEmail) {
      await sendEmail({
        to: inquilinoEmail,
        subject: `[BID] Chamado resolvido — ${chamado.titulo}`,
        html: emailChamadoResolvido({
          inquilinoNome: chamado.contrato?.cliente_nome || 'Inquilino',
          titulo: chamado.titulo,
          comentario: comentario?.trim() || '',
        }),
      })
    }
  } else {
    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
  }

  const extra: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (novoStatus === 'aprovado_corretor') extra.aprovado_corretor_em = new Date().toISOString()
  if (novoStatus === 'concluido') extra.concluido_em = new Date().toISOString()
  if (novoStatus === 'recusado') extra.comentario_recusa = comentario?.trim() || null

  const { data: updated, error } = await admin
    .from('chamados')
    .update({ status: novoStatus, ...extra })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await admin.from('chamado_historico').insert({
    chamado_id: id,
    status_anterior: chamado.status,
    status_novo: novoStatus,
    comentario: historico,
    autor: 'corretor',
  })

  return NextResponse.json(updated)
}
