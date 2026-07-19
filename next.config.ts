import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The home directory has its own package-lock.json, which confuses
  // Turbopack's workspace-root detection — pin it to this project.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
