import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET — retorna opções sistema + do próprio corretor para a categoria
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ categoria: string }> }
) {
  const { categoria } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { data, error } = await supabase
    .from('bid_opcoes')
    .select('id, valor, label, ordem, sistema, corretor_id')
    .eq('categoria', categoria)
    .eq('ativo', true)
    .or(`corretor_id.is.null,corretor_id.eq.${user.id}`)
    .order('ordem', { ascending: true })
    .order('label', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

// POST — corretor adiciona opção personalizada
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ categoria: string }> }
) {
  const { categoria } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { label } = await req.json()
  if (!label?.trim()) return NextResponse.json({ error: 'Label obrigatório' }, { status: 400 })

  const valor = label.trim()

  const { data, error } = await supabase
    .from('bid_opcoes')
    .insert({
      corretor_id: user.id,
      categoria,
      valor,
      label: valor,
      sistema: false,
    })
    .select('id, valor, label, ordem, sistema')
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Esta opção já existe' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}
