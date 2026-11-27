"use client";

import { useEffect } from "react";

/**
 * Si se entra con un ancla (ej. /kit → /#kit-titulo desde los anuncios), vuelve a acomodar la pantalla en ese
 * lugar cuando termina de cargar: el cartel de Black Friday y otras cosas que aparecen después empujan la página
 * y la dejaban corrida. Solo si la persona todavía no scrolleó por su cuenta.
 */
export function ReAnclar() {
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;
    let ultimo = window.scrollY;
    const acomodar = () => {
      const el = document.getElementById(id);
      if (!el || Math.abs(window.scrollY - ultimo) > 40) return; // ya se movió: no lo tocamos
      el.scrollIntoView({ block: "start" });
      ultimo = window.scrollY;
    };
    const t = [150, 600, 1400].map((ms) => window.setTimeout(acomodar, ms));
    return () => t.forEach(window.clearTimeout);
  }, []);
  return null;
}
