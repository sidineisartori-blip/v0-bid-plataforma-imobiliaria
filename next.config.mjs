/** @type {import('next').NextConfig} */

if (!process.env.NEXT_PUBLIC_SUPABASE_HOSTNAME && process.env.NODE_ENV === 'production') {
  throw new Error('NEXT_PUBLIC_SUPABASE_HOSTNAME não está definido. Consulte o .env.example.')
}

const nextConfig = {
  experimental: {
    ppr: false,
  },
  images: {
    remotePatterns: process.env.NEXT_PUBLIC_SUPABASE_HOSTNAME
      ? [
          {
            protocol: 'https',
            hostname: process.env.NEXT_PUBLIC_SUPABASE_HOSTNAME,
            pathname: '/storage/v1/object/public/**',
          },
        ]
      : [],
  },
}

export default nextConfig
