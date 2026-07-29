import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

// POST — upload de foto/video pelo inquilino via portal
// FormData: file (Blob), chamado_id (string)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  // Validar token
  const { data: contrato } = await admin()
    .from('contratos')
    .select('id')
    .eq('portal_token', token)
    .single()

  if (!contrato) return NextResponse.json({ error: 'Link inválido' }, { status: 404 })

  const form = await req.formData()
  const file = form.get('file') as File | null
  const chamadoId = form.get('chamado_id') as string | null

  if (!file) return NextResponse.json({ error: 'Arquivo obrigatório' }, { status: 400 })

  // Verificar que chamado pertence ao contrato
  if (chamadoId) {
    const { data: chamado } = await admin()
      .from('chamados')
      .select('id')
      .eq('id', chamadoId)
      .eq('contrato_id', contrato.id)
      .single()
    if (!chamado) return NextResponse.json({ error: 'Chamado não encontrado' }, { status: 404 })
  }

  const ext = file.name.split('.').pop() || 'bin'
  const path = `${contrato.id}/${chamadoId || 'geral'}/${Date.now()}.${ext}`
  const bytes = await file.arrayBuffer()

  const { data, error } = await admin()
    .storage
    .from('chamados')
    .upload(path, bytes, { contentType: file.type, upsert: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: { publicUrl } } = admin().storage.from('chamados').getPublicUrl(data.path)
  return NextResponse.json({ url: publicUrl })
}
