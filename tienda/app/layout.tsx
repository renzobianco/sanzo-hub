import fs from "node:fs";
import path from "node:path";
import type { Metadata, Viewport } from "next";
import { Jost } from "next/font/google";
import "./globals.css";
import { CarritoProvider } from "@/components/carrito/CarritoProvider";
import { CarritoDrawer } from "@/components/carrito/CarritoDrawer";
import { BarraSuperior } from "@/components/BarraSuperior";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const jost = Jost({ subsets: ["latin"], variable: "--font-jost", display: "swap" });

const urlSitio =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

const descripcion =
  "Arnés, correa, collar, moño, bandana y porta bolsitas. Todo lo que necesita para salir. Combinado. Envío gratis en el kit completo.";

export const metadata: Metadata = {
  metadataBase: new URL(urlSitio),
  title: "sanzo — accesorios para perros",
  description: descripcion,
  openGraph: {
    title: "sanzo — accesorios para perros",
    description: descripcion,
    type: "website",
    locale: "es_AR",
    siteName: "sanzo",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#F4EDE3",
};

// El logo se muestra como imagen apenas exista /public/logo-sanzo.png; si no, texto.
const hayLogo = fs.existsSync(path.join(process.cwd(), "public", "logo-sanzo.png"));

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR" className={jost.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body className="font-sans">
        <CarritoProvider>
          <a
            href="#contenido"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:bg-crema focus:px-4 focus:py-2"
          >
            Saltar al contenido
          </a>
          <BarraSuperior />
          <Header hayLogo={hayLogo} />
          <main id="contenido">{children}</main>
          <Footer hayLogo={hayLogo} />
          <CarritoDrawer />
        </CarritoProvider>
      </body>
    </html>
  );
}
