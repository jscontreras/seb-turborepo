/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@repo/ui"],
  images: {
    remotePatterns: [new URL('https://xefbf5ydcrobj1vo.public.blob.vercel-storage.com/**'), new URL('https://oaidalleapiprodscus.blob.core.windows.net/**')]
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '4mb',
    },
    ppr: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

export default nextConfig
