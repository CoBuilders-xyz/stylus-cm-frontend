import type { NextConfig } from 'next';

// Optional same-origin dev proxy. Set NEXT_PUBLIC_BACKEND_PROXY_TARGET in
// .env.local to a backend URL (e.g. the staging nginx) and API calls hitting
// /api-proxy/* on this server will be forwarded there. Lets local dev talk to
// a deployed backend without tripping its CORS allowlist. In any environment
// where the var is unset (CI, production), this is a no-op.
const proxyTarget = process.env.NEXT_PUBLIC_BACKEND_PROXY_TARGET;

const nextConfig: NextConfig = {
  async rewrites() {
    if (!proxyTarget) return [];
    return [
      {
        source: '/api-proxy/:path*',
        destination: `${proxyTarget}/:path*`,
      },
    ];
  },
};

export default nextConfig;
