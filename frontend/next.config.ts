import type { NextConfig } from "next";

// In Docker: backend resolves via Docker DNS to the backend container
// In local dev (outside Docker): falls back to localhost:5001
const BACKEND_URL = process.env.INTERNAL_API_URL ?? "http://localhost:5001/api/v1";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: { ignoreBuildErrors: true },
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${BACKEND_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;
