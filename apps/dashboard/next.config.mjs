/** @type {import('next').NextConfig} */
const nextConfig = {
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
