import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

// Rate limit em memoria (5 envios por IP por hora)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

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
      .select('id, site_ativo')
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

      // Agenda primeiro follow-up em 2 dias
      if (solCriada) {
        const em2dias = new Date()
        em2dias.setDate(em2dias.getDate() + 2)
        await supabase.from('follow_ups').insert({
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
      }

      return NextResponse.json({ ok: true, message: 'Solicitacao cadastrada com sucesso' })
    }
    
    return NextResponse.json({ error: 'Tipo de lead invalido' }, { status: 400 })
    
  } catch (err) {
    console.error('[v0] Erro na API de lead:', err)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
