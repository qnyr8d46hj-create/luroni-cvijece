import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
