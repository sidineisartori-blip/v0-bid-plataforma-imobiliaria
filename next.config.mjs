/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    ppr: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'glybcgawwsmztrkrnajx.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

export default nextConfig
