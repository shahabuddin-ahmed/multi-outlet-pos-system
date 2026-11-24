import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NextConfig } from 'next';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // The Docker image sets NEXT_OUTPUT=standalone for a small server; local `yarn start` keeps the normal build
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
  typedRoutes: true,
  turbopack: {
    root: projectRoot
  },
  outputFileTracingRoot: projectRoot
};

export default nextConfig;
