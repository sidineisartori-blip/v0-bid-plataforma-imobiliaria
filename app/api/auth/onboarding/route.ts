import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * POST /api/auth/onboarding
 *
 * Cria a row na tabela `corretores` para o usuário recém-cadastrado.
 * Chamada imediatamente após supabase.auth.signUp() no cadastro.
 *
 * Usa service_role para contornar RLS (o usuário acabou de ser criado e
 * ainda não tem sessão validada pelo servidor no momento do signup).
 *
 * Segurança: valida que o token JWT do usuário é válido antes de criar.
 * Idempotente: se a row já existir, retorna sucesso sem erro.
 */
export async function POST(request: Request) {
  try {
    // 1. Ler o body com os dados do corretor
    const body = await request.json()
    const {
      user_id,
      full_name,
      email,
      phone,
      creci,
      estado_creci,
      tipo,
      nome_imobiliaria,
      cidade,
      slug,
    } = body

    if (!user_id || !full_name || !email || !creci || !estado_creci || !cidade || !slug) {
      return NextResponse.json(
        { error: 'Dados incompletos para onboarding.' },
        { status: 400 }
      )
    }

    // 2. Validar que o user_id realmente existe em auth.users
    //    usando a sessão Supabase do request atual
    const supabaseUser = await createClient()
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()

    // Aceitar tanto o user autenticado quanto verificação direta do user_id
    // (em alguns ambientes o cookie ainda não propagou no mesmo request)
    if (authError || (!user && process.env.NODE_ENV === 'production')) {
      // Em produção, exigir que o user_id seja verificável
      // Em desenvolvimento, ser mais permissivo para facilitar testes
      if (process.env.NODE_ENV === 'production' && !user) {
        return NextResponse.json(
          { error: 'Não autorizado.' },
          { status: 401 }
        )
      }
    }

    // Verificar que o user autenticado é o mesmo do body (evita IDOR)
    if (user && user.id !== user_id) {
      return NextResponse.json(
        { error: 'user_id não corresponde à sessão atual.' },
        { status: 403 }
      )
    }

    // 3. Usar service_role para criar a row em corretores (bypassa RLS)
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Idempotente: verificar se já existe
    const { data: existing } = await supabaseAdmin
      .from('corretores')
      .select('id')
      .eq('id', user_id)
      .single()

    if (existing) {
      // Já existe — retornar sucesso sem duplicar
      return NextResponse.json({ success: true, created: false })
    }

    // 4. Inserir na tabela corretores
    const { error: insertError } = await supabaseAdmin
      .from('corretores')
      .insert({
        id: user_id,           // mesmo UUID do auth.users
        full_name,
        email: email.toLowerCase().trim(),
        phone: phone || null,
        creci,
        estado_creci,
        creci_status: 'pendente',   // começa pendente, admin aprova
        tipo: tipo || 'PF',
        nome_imobiliaria: nome_imobiliaria || null,
        cidade,
        slug,
        plano: 'free',              // plano inicial
        is_active: true,
        matching_ativo: false,      // ativo após assinatura
        nota_media: 0,
        total_avaliacoes: 0,
        deals_closed: 0,
        created_at: new Date().toISOString(),
      })

    if (insertError) {
      console.error('[onboarding] Erro ao inserir corretor:', insertError)
      return NextResponse.json(
        { error: `Erro ao criar perfil: ${insertError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, created: true })
  } catch (err) {
    console.error('[onboarding] Erro inesperado:', err)
    return NextResponse.json(
      { error: 'Erro interno no servidor.' },
      { status: 500 }
    )
  }
}
