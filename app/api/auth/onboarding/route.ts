import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

/**
   * POST /api/auth/onboarding
   *
   * Atualiza a row em `corretores` criada pelo trigger on_auth_user_created
   * com os dados profissionais (CRECI, cidade, telefone etc).
   *
   * Usa service_role para bypass de RLS e verifica user_id via admin API.
   * Seguro: nao depende de session cookies (que nao existem logo apos signUp).
   */
export async function POST(request: Request) {
    try {
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

      const supabaseAdmin = createServerClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.SUPABASE_SERVICE_ROLE_KEY!
            )

      // Verificar que o user_id realmente existe em auth.users via admin API
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(user_id)
          if (authError || !authData?.user) {
                  return NextResponse.json(
                    { error: 'user_id invalido ou nao encontrado.' },
                    { status: 401 }
                          )
          }

      // Upsert: trigger ja criou a row, aqui atualizamos os dados profissionais
      const { error: upsertError } = await supabaseAdmin
            .from('corretores')
            .upsert(
              {
                          id: user_id,
                          full_name,
                          email: email.toLowerCase().trim(),
                          phone: phone || null,
                          slug,
                          creci,
                          creci_estado: estado_creci,
                          creci_tipo: tipo || 'PF',
                          creci_status: 'pendente',
                          city: cidade,
                          plano: 'free',
                          is_active: true,
              },
              { onConflict: 'id' }
                    )

      if (upsertError) {
              console.error('[onboarding] Erro ao upsert corretor:', upsertError)
              return NextResponse.json(
                { error: `Erro ao salvar perfil: ${upsertError.message}` },
                { status: 500 }
                      )
      }

      return NextResponse.json({ success: true })
    } catch (err) {
          console.error('[onboarding] Erro inesperado:', err)
          return NextResponse.json(
            { error: 'Erro interno do servidor.' },
            { status: 500 }
                )
    }
}
