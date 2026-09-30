import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  // The demo "Switch" menu lives bottom-left; keep Next's dev badge out of its way.
  devIndicators: { position: "bottom-right" },
  // Pin the project root so a stray lockfile in a parent folder can't confuse Turbopack.
  turbopack: { root: __dirname },
  // Let a phone on the same Wi-Fi open the dev server by the Mac's address
  // (private network ranges and Bonjour names only; development only).
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*", "*.local"],
  // The phone app's web preview (built from mobile/ into public/app): every
  // /app/* path that isn't a real file opens the app, which routes itself.
  async rewrites() {
    return [
      { source: "/app", destination: "/app/index.html" },
      { source: "/app/:path*", destination: "/app/index.html" },
    ];
  },
};

export default nextConfig;
