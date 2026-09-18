import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["sharp"],
  experimental: { serverActions: { bodySizeLimit: "40mb" } }, // venue photo uploads
};

export default nextConfig;
