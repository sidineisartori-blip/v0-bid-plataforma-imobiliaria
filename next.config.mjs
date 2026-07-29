/** @type {import('next').NextConfig} */

if (!process.env.NEXT_PUBLIC_SUPABASE_HOSTNAME && process.env.NODE_ENV === 'production') {
  console.warn('[BID] ATENÇÃO: NEXT_PUBLIC_SUPABASE_HOSTNAME não definido. Upload e exibição de imagens do Supabase Storage não funcionará.')
}

const nextConfig = {
  experimental: {
    ppr: false,
  },
  images: {
    remotePatterns: [
      // Supabase Storage — wildcard cobre qualquer projeto
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      // Hostname explícito via env (retrocompatibilidade)
      ...(process.env.NEXT_PUBLIC_SUPABASE_HOSTNAME
        ? [{ protocol: 'https', hostname: process.env.NEXT_PUBLIC_SUPABASE_HOSTNAME, pathname: '/storage/v1/object/public/**' }]
        : []),
    ],
  },
}

export default nextConfig
