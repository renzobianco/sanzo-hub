import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    // Web solo para celu: con 1920 de máximo alcanza (un iPhone pide ~1170). Sin esto se generan
    // versiones de 3840 px que pesan mucho y tiran abajo el servidor local.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  },
};

export default nextConfig;
