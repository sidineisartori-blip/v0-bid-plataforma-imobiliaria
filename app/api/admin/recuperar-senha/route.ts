import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SignJWT } from 'jose'
import { sendEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

function getSecret() {
  return new TextEncoder().encode(process.env.ADMIN_JWT_SECRET || 'bid-secret-fallback')
}

export async function POST(req: NextRequest) {
  const { email } = await req.json()

  if (!email) return NextResponse.json({ error: 'E-mail obrigatório' }, { status: 400 })

  const supabase = await createClient()

  // Verifica se o email existe na tabela admin_users
  const { data: admin } = await supabase
    .from('admin_users')
    .select('id, email, full_name, is_active')
    .eq('email', email.toLowerCase().trim())
    .single()

  // Responde sempre com sucesso para não vazar quais emails existem
  if (!admin || !admin.is_active) {
    return NextResponse.json({ ok: true })
  }

  // Gera token de reset válido por 1 hora
  const token = await new SignJWT({ adminId: admin.id, email: admin.email, type: 'reset' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(getSecret())

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://v0-bid-plataforma-imobiliaria.vercel.app'
  const resetUrl = `${appUrl}/admin/nova-senha?token=${token}`

  await sendEmail({
    to: admin.email,
    subject: 'BID — Redefinição de senha Master',
    html: `
      <!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#0f0f10;font-family:-apple-system,sans-serif">
      <div style="max-width:480px;margin:32px auto;background:#1a1a1c;border:1px solid #2a2a2c;border-radius:8px;overflow:hidden">
        <div style="background:#181715;padding:24px 32px;text-align:center;border-bottom:1px solid #2a2a2c">
          <div style="font-size:22px;font-weight:700;color:#c9a84c;letter-spacing:2px">BID</div>
          <div style="font-size:10px;color:#6b6860;letter-spacing:3px;text-transform:uppercase;margin-top:2px">Balcão Imobiliário Digital</div>
        </div>
        <div style="padding:32px">
          <h2 style="color:#f0ede6;font-size:18px;margin:0 0 16px">Redefinir senha Master</h2>
          <p style="color:#9b9690;font-size:14px;line-height:1.6;margin:0 0 24px">
            Olá, <strong style="color:#f0ede6">${admin.full_name}</strong>!<br>
            Recebemos uma solicitação para redefinir a senha da conta Master BID.
          </p>
          <a href="${resetUrl}" style="display:inline-block;background:#c9a84c;color:#0f0f10;font-weight:700;font-size:14px;padding:14px 32px;border-radius:4px;text-decoration:none">
            Redefinir Senha
          </a>
          <p style="color:#6b6860;font-size:12px;margin:24px 0 0;line-height:1.6">
            Este link expira em <strong>1 hora</strong>. Se você não solicitou a redefinição, ignore este e-mail.
          </p>
        </div>
      </div>
      </body></html>
    `,
  })

  return NextResponse.json({ ok: true })
}
