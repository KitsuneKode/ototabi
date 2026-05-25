/** @type {import('next').NextConfig} */
const apiOrigin = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

const nextConfig = {
  transpilePackages: ["@ototabi/ui", "@ototabi/auth", "@ototabi/trpc", "@ototabi/store"],
  logging: {
    level: "verbose",
    fullUrl: true,
  },
  serverExternalPackages: ["@prisma/client"],
  async rewrites() {
    return [
      {
        source: "/api/auth/:path*",
        destination: `${apiOrigin}/api/auth/:path*`,
      },
      {
        source: "/api/trpc/:path*",
        destination: `${apiOrigin}/api/trpc/:path*`,
      },
      {
        source: "/api/guest-auth/:path*",
        destination: `${apiOrigin}/api/guest-auth/:path*`,
      },
      {
        source: "/api/token",
        destination: `${apiOrigin}/api/token`,
      },
      {
        source: "/api/polar-webhook/:path*",
        destination: `${apiOrigin}/api/polar-webhook/:path*`,
      },
    ];
  },
};

export default nextConfig;
