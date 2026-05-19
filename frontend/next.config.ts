import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.15'],
  rewrites: async () => {
    return {
      beforeFiles: [
        {
          source: '/api/:path*',
          destination: 'http://192.168.1.15:3001/:path*',
        },
      ],
    };
  },
};

export default nextConfig;
