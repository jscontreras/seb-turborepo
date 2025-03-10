/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/docs/glinet-api",
        destination: "/api/glinet-api",
      },
    ];
  },
};

// Check if we're in a production environment
const isProduction = process.env.VERCEL_ENV === "production"

// If in production, set the assetPrefix
if (isProduction) {
  nextConfig.assetPrefix = "https://api.tc-vercel.dev"
}


export default nextConfig
