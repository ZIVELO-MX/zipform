import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";

// Load environment variables from monorepo root .env
import { config } from "dotenv";
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../../.env") });

const monorepoRoot = fileURLToPath(new URL("../..", import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: monorepoRoot,
  outputFileTracingIncludes: {
    "/*": [
      "../../node_modules/.pnpm/@prisma+client@*/node_modules/.prisma/client/**/*"
    ]
  },
  transpilePackages: ["@zipform/data", "@zipform/types"],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        path: false,
        url: false,
        crypto: false,
        fs: false,
        child_process: false,
        module: false,
      };
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      }
    ]
  }
};

export default nextConfig;
