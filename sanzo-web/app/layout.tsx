import fs from "node:fs";
import path from "node:path";
import type { Metadata, Viewport } from "next";
import { Jost } from "next/font/google";
import "./globals.css";
import { CarritoProvider } from "@/components/carrito/CarritoProvider";
import { CarritoDrawer } from "@/components/carrito/CarritoDrawer";
import { BarraSuperior } from "@/components/BarraSuperior";
import { CartelBlackFriday } from "@/components/CartelBlackFriday";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BotonWhatsapp } from "@/components/BotonWhatsapp";
import Script from "next/script";
import { Suspense } from "react";
import { EventosMeta } from "@/components/meta/EventosMeta";
import { META_PIXEL_ID } from "@/lib/meta/datos";

// Código base del Pixel de Meta. NO dispara ningún PageView: el único es el de EventosMeta, con event_id
// (el mismo que va por el servidor, así Meta los junta).
// - disablePushState: sin esto, el Pixel manda solo un PageView sin id en cada cambio de ruta (pushState) y,
//   como ya vio esa URL, descarta el nuestro con id: quedaba el del servidor sin pareja.
// - allowDuplicatePageViews true: con disablePushState el Pixel no ve el cambio de URL y tomaba nuestro PageView
//   de la ruta nueva por "repetido" (no lo mandaba). Repetidos no hay: EventosMeta manda uno solo por ruta.
// - autoConfig false: sin SubscribedButtonClick ni lectura automática de la página.
// - external_id = la cookie sz_uid (la pone middleware.ts); el servidor manda el SHA-256 del mismo valor.
const codigoPixel = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq.disablePushState=true;
fbq.allowDuplicatePageViews=true;
fbq('set','autoConfig',false,${JSON.stringify(META_PIXEL_ID)});
var m=document.cookie.match(/(?:^|; )sz_uid=([^;]+)/);
fbq('init',${JSON.stringify(META_PIXEL_ID)},m?{external_id:decodeURIComponent(m[1])}:{});`;

const jost = Jost({ subsets: ["latin"], variable: "--font-jost", display: "swap" });

const urlSitio =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

const descripcion =
  "Arnés, correa, collar, moño, bandana y porta bolsitas. Todo lo que necesita para salir. Combinado.";

export const metadata: Metadata = {
  metadataBase: new URL(urlSitio),
  title: "sanzo — accesorios para mascotas",
  description: descripcion,
  openGraph: {
    title: "sanzo — accesorios para mascotas",
    description: descripcion,
    type: "website",
    locale: "es_AR",
    siteName: "sanzo",
  },
  twitter: { card: "summary_large_image" },
  // Verificación del dominio en Meta (va en el HTML inicial, no por JavaScript).
  other: { "facebook-domain-verification": "4o17gcmkl6350o6uku1fdiausajez6" },
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
          <CartelBlackFriday />
          <BarraSuperior />
          <Header hayLogo={hayLogo} />
          <main id="contenido">{children}</main>
          <Footer hayLogo={hayLogo} />
          <BotonWhatsapp />
          <CarritoDrawer />
        </CarritoProvider>
        {META_PIXEL_ID && (
          <>
            <Script id="meta-pixel" strategy="afterInteractive">
              {codigoPixel}
            </Script>
            <Suspense fallback={null}>
              <EventosMeta />
            </Suspense>
          </>
        )}
      </body>
    </html>
  );
}
