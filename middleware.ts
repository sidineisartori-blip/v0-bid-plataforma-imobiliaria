import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const pathname = request.nextUrl.pathname

  // Rotas do admin usam JWT proprio — nao requerem sessao Supabase
  if (pathname.startsWith('/admin')) {
    return supabaseResponse
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Rotas protegidas do dashboard (requerem sessao Supabase)
  const protectedRoutes = [
    '/dashboard',
    '/imoveis',
    '/solicitacoes',
    '/matches',
    '/crm',
    '/chat',
    '/plano',
    '/hub',
    '/site',
    '/avaliacoes',
    '/notificacoes',
    '/credenciamento',
    '/matching',
    '/erp',
    '/negociacoes',
    '/contratos',
    '/leads',
    '/perfil',
    '/relatorios',
  ]

  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route))

  if (!user && isProtected) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redireciona usuario autenticado que tenta acessar login/cadastro
  if (user && (pathname === '/login' || pathname === '/cadastro')) {
    const dashboardUrl = new URL('/dashboard', request.url)
    return NextResponse.redirect(dashboardUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
