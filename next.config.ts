import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: [
    "@node-rs/argon2",
    "pino",
    "pino-pretty",
    "better-sqlite3",
  ],
  images: {
    remotePatterns: [],
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 31536000, // 1 year
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
    serverActions: {
      bodySizeLimit: "10mb", // Increase limit for file uploads
    },
  },
  compress: true,
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
