"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { sitio } from "@/data/products";

// Clases completas para que Tailwind las genere. Texto claro sobre los fondos oscuros.
const PANEL = {
  tinta: { fondo: "bg-tinta", texto: "text-crema", boton: "bg-crema text-tinta" },
  marron: { fondo: "bg-marron", texto: "text-crema", boton: "bg-crema text-tinta" },
  topo: { fondo: "bg-topo", texto: "text-tinta", boton: "bg-tinta text-crema" },
  lino: { fondo: "bg-lino", texto: "text-tinta", boton: "bg-tinta text-crema" },
};

/**
 * Principio de la página (estilo Puppis): un banner con bordes redondeados y margen a los costados.
 * Foto a la izquierda, panel de color con el texto a la derecha. Pasan solos con un fundido;
 * los puntitos de abajo marcan cuál se ve y se pueden tocar. Sin deslizar.
 */
export function Hero() {
  const banners = sitio.hero;
  const [activo, setActivo] = useState(0);
  const [pausa, setPausa] = useState(0);

  useEffect(() => {
    if (banners.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setActivo((a) => (a + 1) % banners.length), 5000);
    return () => clearInterval(t);
  }, [banners.length, pausa]);

  return (
    <section aria-label="Destacados" aria-roledescription="carrusel" className="px-4 pb-2 pt-4">
      <div className="grid overflow-hidden rounded-2xl shadow-[0_14px_30px_-20px_rgb(var(--tinta)/0.6)]">
        {banners.map((b, i) => {
          const p = PANEL[b.color];
          const visible = i === activo;
          return (
            <a
              key={b.titulo}
              href={b.link}
              aria-hidden={!visible}
              tabIndex={visible ? 0 : -1}
              aria-label={`${b.arriba}: ${b.titulo}`}
              className={`flex aspect-[16/10] transition-opacity duration-700 ease-suave [grid-area:1/1] ${p.fondo} ${
                visible ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
            >
              <span className="relative block w-[48%] shrink-0">
                <Image src={b.foto} alt="" fill priority={i === 0} sizes="48vw" className="object-cover" />
              </span>
              <span className={`flex flex-1 flex-col items-center justify-center px-3 text-center ${p.texto}`}>
                <span className="text-[10px] uppercase tracking-[0.24em] opacity-80">{b.arriba}</span>
                <span className="mt-2 text-[1.2rem] font-light uppercase leading-[1.2] tracking-[0.1em]">{b.titulo}</span>
                <span className={`mt-4 rounded-full px-4 py-2 text-[10px] uppercase tracking-[0.18em] ${p.boton}`}>{b.boton}</span>
              </span>
            </a>
          );
        })}
      </div>

      {banners.length > 1 && (
        <div className="mt-3 flex items-center justify-center gap-1">
          {banners.map((b, i) => (
            <button
              key={b.titulo}
              type="button"
              onClick={() => {
                setActivo(i);
                setPausa((n) => n + 1); // reinicia el contador para que no pase enseguida
              }}
              aria-label={`Ver ${b.arriba}`}
              aria-current={i === activo}
              className="flex h-6 items-center px-1"
            >
              <span className={`block h-1.5 rounded-full transition-all duration-500 ease-suave ${i === activo ? "w-6 bg-marron" : "w-1.5 bg-tinta/25"}`} />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
