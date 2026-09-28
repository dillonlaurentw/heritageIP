import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  // The demo "Switch" menu lives bottom-left; keep Next's dev badge out of its way.
  devIndicators: { position: "bottom-right" },
  // Pin the project root so a stray lockfile in a parent folder can't confuse Turbopack.
  turbopack: { root: __dirname },
};

export default nextConfig;
