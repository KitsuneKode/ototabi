/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@ototabi/ui", "@ototabi/auth", "@ototabi/trpc", "@ototabi/store"],
  optimizePackageImports: ["@tabler/icons-react", "date-fns"],
  logging: {
    level: "verbose",
    fullUrl: true,
  },
  serverExternalPackages: ["@prisma/client"],
};

export default nextConfig;
