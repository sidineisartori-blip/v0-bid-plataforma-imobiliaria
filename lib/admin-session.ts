import { SignJWT, jwtVerify, type JWTPayload } from 'jose'

export interface AdminTokenPayload extends JWTPayload {
  id: string
  email: string
  role: string
  full_name: string
}

function getSecret(): Uint8Array {
  const key = process.env.ADMIN_JWT_SECRET
  if (!key) {
    throw new Error('ADMIN_JWT_SECRET não está definido nas variáveis de ambiente. Consulte o .env.example.')
  }
  return new TextEncoder().encode(key)
}

export async function createAdminToken(payload: Omit<AdminTokenPayload, 'iat' | 'exp'>): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(getSecret())
}

export async function verifyAdminToken(token: string): Promise<AdminTokenPayload> {
  const { payload } = await jwtVerify(token, getSecret())
  return payload as AdminTokenPayload
}
