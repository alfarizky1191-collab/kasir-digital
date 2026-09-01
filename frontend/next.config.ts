import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  rewrites: async () => {
    const backendUrl = (process.env.BACKEND_URL || 'http://localhost:3001').replace(/\/$/, '')

    return {
      beforeFiles: [
        {
          source: '/api/:path*',
          destination: `${backendUrl}/api/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
