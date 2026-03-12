import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/adapter-pg", "pg"],
  allowedDevOrigins: ["*.ngrok-free.app"],
};

export default nextConfig;
