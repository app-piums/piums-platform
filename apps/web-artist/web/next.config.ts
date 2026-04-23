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
    return [
      {
        // Proxy everything under /api/ to the gateway EXCEPT Next.js own API routes
        source: '/api/:path*',
        destination: `${process.env.GATEWAY_INTERNAL_URL || 'http://gateway:3000'}/api/:path*`,
        // Next.js API routes take priority over rewrites, so /api/auth/login,
        // /api/auth/firebase-google, /api/artist/*, etc. are served by Next.js directly.
      },
    ];
  },
};

export default nextConfig;
