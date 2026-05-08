import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname, '../..'),
  transpilePackages: [
    '@onestopsgtaxi/shared',
    '@onestopsgtaxi/pricing',
    '@onestopsgtaxi/operators',
  ],
  typedRoutes: true,
};

export default nextConfig;
