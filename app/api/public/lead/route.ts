import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { sendEmail, emailNovoLead, emailConfirmacaoLead } from '@/lib/email'

// Rate limit em memoria (5 envios por IP por hora)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

// Notifica o corretor via WhatsApp (Evolution API) — falha silenciosa para não bloquear o fluxo
async function notificarCorretor(phone: string, mensagem: string) {
  const evolutionUrl = process.env.EVOLUTION_API_URL
  const evolutionKey = process.env.EVOLUTION_API_KEY
  const evolutionInstance = process.env.EVOLUTION_INSTANCE || 'bid'
  if (!evolutionUrl || !evolutionKey) return
  try {
    await fetch(`${evolutionUrl}/message/sendText/${evolutionInstance}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': evolutionKey },
      body: JSON.stringify({ number: phone.replace(/\D/g, ''), text: mensagem }),
      signal: AbortSignal.timeout(5000),
    })
  } catch {
    // Silencioso — WhatsApp é best-effort
  }
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 }) // 1 hora
    return true
  }
  
  if (entry.count >= 5) {
    return false
  }
  
  entry.count++
  return true
}

// Schemas de validacao
const baseSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  whatsapp: z.string().regex(/^\d{10,11}$/, 'WhatsApp deve ter 10 ou 11 digitos'),
  email: z.string().email('Email invalido').optional().or(z.literal('')),
  cidade: z.string().min(2, 'Cidade obrigatoria'),
})

const imovelSchema = baseSchema.extend({
  tipo_negocio: z.enum(['Venda', 'Locação']),
  tipo_imovel: z.string().min(2, 'Tipo de imovel obrigatorio'),
  bairro: z.string().optional(),
  valor: z.number().positive('Valor deve ser positivo'),
  observacoes: z.string().optional(),
})

const buscaSchema = baseSchema.extend({
  tipo_negocio: z.enum(['Comprar', 'Alugar']),
  tipo_imovel: z.string().min(2, 'Tipo de imovel obrigatorio'),
  bairro_desejado: z.string().optional(),
  valor_min: z.number().nonnegative().optional(),
  valor_max: z.number().positive('Valor maximo deve ser positivo').optional(),
  quartos: z.number().int().nonnegative().optional(),
  tem_animal: z.boolean().optional(),
})

const requestSchema = z.object({
  tipo: z.enum(['imovel', 'busca']),
  corretorId: z.string().uuid('ID de corretor invalido'),
  dados: z.record(z.unknown()),
})

export async function POST(request: NextRequest) {
  // Extrai IP do request
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || 'unknown'
  
  // Verifica rate limit
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Aguarde antes de enviar novamente.' },
      { status: 429 }
    )
  }
  
  // Cliente Supabase com service role para ignorar RLS
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  try {
    const body = await request.json()
    
    // Valida estrutura base do request
    const parsed = requestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados invalidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    
    const { tipo, corretorId, dados } = parsed.data
    
    // Verifica se o corretor existe e esta ativo
    const { data: corretor } = await supabase
      .from('corretores')
      .select('id, site_ativo, whatsapp, nome, email')
      .eq('id', corretorId)
      .single()
    
    if (!corretor) {
      return NextResponse.json({ error: 'Corretor nao encontrado' }, { status: 404 })
    }
    
    if (tipo === 'imovel') {
      // Valida dados do imovel
      const validado = imovelSchema.safeParse(dados)
      if (!validado.success) {
        return NextResponse.json(
          { error: 'Dados invalidos', details: validado.error.flatten().fieldErrors },
          { status: 400 }
        )
      }
      
      const d = validado.data
      
      // Insere captacao de imovel
      const { error } = await supabase.from('imoveis').insert({
        corretor_id: corretorId,
        titulo: `Captação - ${d.tipo_imovel} em ${d.cidade}`,
        status: 'aguardando_assinatura',
        matching_ativo: false,
        tipo_negocio: d.tipo_negocio,
        tipo_imovel: d.tipo_imovel,
        cidade: d.cidade,
        bairro: d.bairro || null,
        valor: d.valor,
        prop_nome: d.nome,
        prop_whatsapp: d.whatsapp,
        prop_email: d.email || null,
        quartos: 0,
        banheiros: 0,
        vagas: 0,
        publico_no_site: false,
      })
      
      if (error) {
        console.error('[v0] Erro ao inserir imovel:', error)
        return NextResponse.json({ error: 'Erro ao salvar dados' }, { status: 500 })
      }

      // Notifica o corretor via WhatsApp
      if (corretor.whatsapp) {
        notificarCorretor(corretor.whatsapp,
          `🏠 *Novo imóvel captado via BID!*\n\n` +
          `*Proprietário:* ${d.nome}\n` +
          `*WhatsApp:* ${d.whatsapp}\n` +
          `*Tipo:* ${d.tipo_imovel} para ${d.tipo_negocio}\n` +
          `*Cidade:* ${d.cidade}${d.bairro ? ` · ${d.bairro}` : ''}\n` +
          `*Valor:* R$ ${d.valor.toLocaleString('pt-BR')}\n\n` +
          `Acesse o BID para ver os detalhes.`
        )
      }

      return NextResponse.json({ ok: true, message: 'Imovel cadastrado com sucesso' })
    }
    
    if (tipo === 'busca') {
      // Valida dados da busca
      const validado = buscaSchema.safeParse(dados)
      if (!validado.success) {
        return NextResponse.json(
          { error: 'Dados invalidos', details: validado.error.flatten().fieldErrors },
          { status: 400 }
        )
      }
      
      const d = validado.data
      
      // Insere solicitacao de busca e retorna o id criado
      const { data: solCriada, error } = await supabase.from('solicitacoes').insert({
        corretor_id: corretorId,
        status: 'ativa',
        cliente_nome: d.nome,
        cliente_phone: d.whatsapp,
        cliente_email: d.email || null,
        tipo_negocio: d.tipo_negocio,
        tipo_imovel: d.tipo_imovel,
        cidade: d.cidade,
        bairro_desejado: d.bairro_desejado || null,
        valor_min: d.valor_min || null,
        valor_max: d.valor_max || null,
        quartos: d.quartos || null,
        tem_animal: d.tem_animal ?? false,
        prazo_fechar: '3 meses',
        vagas: 0,
      }).select('id').single()

      if (error) {
        console.error('[v0] Erro ao inserir solicitacao:', error)
        return NextResponse.json({ error: 'Erro ao salvar dados' }, { status: 500 })
      }

      if (solCriada) {
        // Agenda primeiro follow-up em 2 dias
        const em2dias = new Date()
        em2dias.setDate(em2dias.getDate() + 2)
        const { error: fuErr } = await supabase.from('follow_ups').insert({
          corretor_id: corretorId,
          solicitacao_id: solCriada.id,
          cliente_nome: d.nome,
          cliente_phone: d.whatsapp,
          tipo_negocio: d.tipo_negocio,
          cidade: d.cidade,
          agendado_para: em2dias.toISOString(),
          status: 'pendente',
          contador: 1,
        })
        if (fuErr) console.error('[v0] Erro ao agendar follow-up:', fuErr)

        // Notifica o corretor por email + WhatsApp
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://v0-bid-plataforma-imobiliaria.vercel.app'
        if (corretor.email) {
          sendEmail({
            to: corretor.email,
            subject: `🔔 Novo lead: ${d.nome} quer ${d.tipo_imovel} em ${d.cidade}`,
            html: emailNovoLead({ corretorNome: corretor.nome, clienteNome: d.nome, clientePhone: d.whatsapp, tipoNegocio: d.tipo_negocio, tipoImovel: d.tipo_imovel, cidade: d.cidade, valorMax: d.valor_max, quartos: d.quartos, appUrl }),
          })
        }
        if (d.email) {
          sendEmail({
            to: d.email,
            subject: 'Solicitação recebida — BID Imobiliário',
            html: emailConfirmacaoLead({ clienteNome: d.nome, corretorNome: corretor.nome ?? 'nosso corretor', tipoNegocio: d.tipo_negocio, tipoImovel: d.tipo_imovel, cidade: d.cidade }),
            replyTo: corretor.email,
          })
        }
        if (corretor.whatsapp) {
          notificarCorretor(corretor.whatsapp,
            `🔔 *Novo lead no BID!*\n\n` +
            `*Cliente:* ${d.nome}\n` +
            `*WhatsApp:* ${d.whatsapp}\n` +
            `*Busca:* ${d.tipo_imovel} para ${d.tipo_negocio}\n` +
            `*Cidade:* ${d.cidade}\n` +
            (d.valor_max ? `*Até:* R$ ${d.valor_max.toLocaleString('pt-BR')}\n` : '') +
            (d.quartos ? `*Quartos:* ${d.quartos}+\n` : '') +
            `\nAcesse o BID para contatar e agendar follow-up.`
          )
        }
      }

      return NextResponse.json({ ok: true, message: 'Solicitacao cadastrada com sucesso' })
    }
    
    return NextResponse.json({ error: 'Tipo de lead invalido' }, { status: 400 })
    
  } catch (err) {
    console.error('[v0] Erro na API de lead:', err)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
