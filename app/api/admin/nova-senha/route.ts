import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { createClient } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

function getSecret() {
  return new TextEncoder().encode(process.env.ADMIN_JWT_SECRET || 'bid-secret-fallback')
}

export async function POST(req: NextRequest) {
  const { token, senha } = await req.json()

  if (!token || !senha) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  if (senha.length < 6) return NextResponse.json({ error: 'Senha muito curta' }, { status: 400 })

  // Verifica o token de reset
  let payload: { adminId: string; type: string }
  try {
    const result = await jwtVerify(token, getSecret())
    payload = result.payload as { adminId: string; type: string }
  } catch {
    return NextResponse.json({ error: 'Link inválido ou expirado' }, { status: 400 })
  }

  if (payload.type !== 'reset') {
    return NextResponse.json({ error: 'Token inválido' }, { status: 400 })
  }

  const supabase = await createClient()
  const hash = await bcrypt.hash(senha, 12)

  const { error } = await supabase
    .from('admin_users')
    .update({ password_hash: hash, updated_at: new Date().toISOString() })
    .eq('id', payload.adminId)

  if (error) return NextResponse.json({ error: 'Erro ao salvar senha' }, { status: 500 })

  return NextResponse.json({ ok: true })
}
