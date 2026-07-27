import type { NextConfig } from 'next';

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  transpilePackages: ['@athena/ui', '@athena/shared'],
  compress: true,
  poweredByHeader: false,
  // Do NOT use optimizePackageImports on workspace packages — breaks webpack
  // module factories in Next 15.1.x monorepo + turbopack/webpack hybrid edge cases.
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  async redirects() {
    return [
      {
        source: '/app/students',
        destination: '/app/alunos',
        permanent: true,
      },
      {
        source: '/app/students/new',
        destination: '/app/alunos/novo',
        permanent: true,
      },
      {
        source: '/app/students/enroll',
        destination: '/app/alunos/matricula',
        permanent: true,
      },
      {
        source: '/app/students/:id',
        destination: '/app/alunos/:id',
        permanent: true,
      },
    ];
  },
  async headers() {
    // NEVER set immutable cache on /_next/static in development — browsers keep
    // stale webpack chunks and throw: Cannot read properties of undefined (reading 'call')
    if (!isProd) return [];

    return [
      {
        source: '/:all*(svg|jpg|jpeg|png|webp|avif|gif|ico|woff2)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
