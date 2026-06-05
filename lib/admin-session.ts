import { SignJWT, jwtVerify, type JWTPayload } from 'jose'

export interface AdminTokenPayload extends JWTPayload {
  id: string
  email: string
  role: string
  full_name: string
}

const secret = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET || 'fallback-secret-change-in-production')

export async function createAdminToken(payload: Omit<AdminTokenPayload, 'iat' | 'exp'>): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(secret)
}

export async function verifyAdminToken(token: string): Promise<AdminTokenPayload> {
  const { payload } = await jwtVerify(token, secret)
  return payload as AdminTokenPayload
}
