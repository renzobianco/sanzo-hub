"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { trackMeta, verContenido } from "@/lib/meta/cliente";

/**
 * PageView en cada página (la primera y cada cambio de ruta, sin repetir) y Contact al tocar cualquier
 * link de WhatsApp (botón flotante, footer, /gracias, personalizador). No muestra nada.
 * /vista-pedido no cuenta: es la vista interna que abre el Hub.
 */
export function EventosMeta() {
  const pathname = usePathname();
  const params = useSearchParams();
  const ultima = useRef("");

  useEffect(() => {
    if (pathname.startsWith("/vista-pedido")) return;
    const clave = `${pathname}?${params.toString()}`;
    if (clave === ultima.current) return;
    ultima.current = clave;
    trackMeta("PageView");
  }, [pathname, params]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href]");
      if (a && /^https:\/\/(wa\.me|api\.whatsapp\.com)\//.test(a.getAttribute("href") ?? "")) trackMeta("Contact");
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}

/** ViewContent cuando una sección de producto (ej. el kit) entra en pantalla. No muestra nada. */
export function VerContenidoAlMostrar({ productoId, seccion }: { productoId: string; seccion: string }) {
  useEffect(() => {
    const el = document.getElementById(seccion);
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        verContenido(productoId);
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [productoId, seccion]);
  return null;
}
