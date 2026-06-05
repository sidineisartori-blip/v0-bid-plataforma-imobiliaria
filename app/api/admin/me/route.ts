import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAdminToken } from '@/lib/admin-session'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('admin_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Nao autenticado.' }, { status: 401 })
    }

    const payload = await verifyAdminToken(token)

    return NextResponse.json({
      id: payload.id,
      email: payload.email,
      role: payload.role,
      full_name: payload.full_name,
    })
  } catch {
    return NextResponse.json({ error: 'Token invalido ou expirado.' }, { status: 401 })
  }
}
