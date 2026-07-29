import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CANAIS_STATIC } from '../route'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { key } = await params
  if (!CANAIS_STATIC.find((c) => c.key === key)) {
    return NextResponse.json({ error: 'Canal inválido' }, { status: 400 })
  }

  const { ativo } = await req.json()
  if (typeof ativo !== 'boolean') {
    return NextResponse.json({ error: 'Campo ativo deve ser boolean' }, { status: 400 })
  }

  const { error } = await supabase
    .from('hub_canais')
    .upsert(
      { corretor_id: user.id, canal_key: key, ativo, updated_at: new Date().toISOString() },
      { onConflict: 'corretor_id,canal_key' },
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
