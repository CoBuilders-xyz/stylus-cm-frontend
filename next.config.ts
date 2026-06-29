import type { NextConfig } from 'next';

// Optional same-origin dev proxy. Set BACKEND_PROXY_TARGET in .env.local to a
// backend URL (e.g. the staging nginx) and API calls hitting /api-proxy/* on
// this server will be forwarded there. Lets local dev talk to a deployed
// backend without tripping its CORS allowlist. Gated on NODE_ENV ===
// 'development' AND a server-only env var (no NEXT_PUBLIC_ prefix) so the
// proxy can't be turned on by accident in a preview / production deployment.
const proxyTarget = process.env.BACKEND_PROXY_TARGET;

const nextConfig: NextConfig = {
  async rewrites() {
    if (process.env.NODE_ENV !== 'development' || !proxyTarget) return [];
    return [
      {
        source: '/api-proxy/:path*',
        destination: `${proxyTarget}/:path*`,
      },
    ];
  },
};

export default nextConfig;
