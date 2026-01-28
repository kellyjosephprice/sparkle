import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/sparkle",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
