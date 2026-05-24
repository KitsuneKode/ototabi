/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@ototabi/ui", "@ototabi/auth", "@ototabi/trpc", "@ototabi/store"],
  optimizePackageImports: [
    "lucide-react",
    "@radix-ui/react-accordion",
    "@radix-ui/react-label",
    "@radix-ui/react-slot",
    "date-fns",
  ],
  logging: {
    level: "verbose",
    fullUrl: true,
  },
  serverExternalPackages: ["@prisma/client"],
};

export default nextConfig;
