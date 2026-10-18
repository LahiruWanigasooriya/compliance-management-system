import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_URL: process.env.AUTH_URL,
  },
  async redirects() {
    return [
      {
        source: "/register",
        destination: "/login",
        permanent: false,
      },
    ];
  },
  // Enable experimental server actions URL validation to trust forwarded headers
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "*.vesant.ai",
        "console-dev.vesant.ai",
        "console.vesant.ai",
      ],
    },
  },
  // Log headers for debugging (remove in production)
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default nextConfig;
