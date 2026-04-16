import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  htmlLimitedBots: /.*/,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
