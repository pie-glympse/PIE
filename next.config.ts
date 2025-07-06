import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
    eslint: {
    ignoreDuringBuilds: true, // ⬅️ ignore ESLint sur build Vercel
  },
};

export default nextConfig;
