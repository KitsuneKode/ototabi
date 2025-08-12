/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@ototabi/ui'],
  logging: {
    level: 'verbose', // or 'error', 'warn', 'info'
    fullUrl: true,
  },
}

export default nextConfig
