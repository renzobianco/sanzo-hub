import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pixel de Meta: vale cargarlo en Vercel como NEXT_PUBLIC_META_PIXEL_ID o como META_PIXEL_ID.
  // Se mete en el código al compilar (navegador, servidor y middleware), así que después de cambiarlo hay que hacer Redeploy.
  env: {
    NEXT_PUBLIC_META_PIXEL_ID: (process.env.NEXT_PUBLIC_META_PIXEL_ID || process.env.META_PIXEL_ID || "").trim(),
  },
  images: {
    formats: ["image/avif", "image/webp"],
    // Web solo para celu: con 1920 de máximo alcanza (un iPhone pide ~1170). Sin esto se generan
    // versiones de 3840 px que pesan mucho y tiran abajo el servidor local.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  },
};

export default nextConfig;
