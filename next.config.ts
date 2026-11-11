import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/v0/b/**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/cvjecarna/rijeka',
        destination: '/dostava-cvijeca-rijeka',
        permanent: true,
      },
    ]
  },
};

export default nextConfig;
