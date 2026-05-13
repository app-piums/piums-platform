import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
        ],
      },
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      // fallback: only proxy to gateway if no Next.js route (static or dynamic) matched.
      // This ensures dynamic API routes like /api/catalog/services/[id] are handled by
      // Next.js before falling through to the K8s gateway.
      fallback: [
        {
          source: '/api/:path*',
          destination: `${process.env.GATEWAY_INTERNAL_URL || 'http://gateway:3000'}/api/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
