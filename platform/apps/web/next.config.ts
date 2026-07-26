import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@athena/ui', '@athena/shared'],
};

export default nextConfig;
