/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@zipform/data", "@zipform/types"],
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
