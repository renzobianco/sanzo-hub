"use client";

import { useEffect, useRef, useState } from "react";
import { sitio } from "@/data/products";
import { LineaNeon } from "./LineaNeon";

/**
 * Chips fijos arriba mientras se recorre la tienda (kit, combos, individuales).
 * Marcan en qué sección estás (scrollspy) con una píldora que se desliza, y llevan a cada una con un toque.
 */
export function NavTienda() {
  const secciones = sitio.secciones;
  const [activa, setActiva] = useState(secciones[0]?.id);
  const [pildora, setPildora] = useState<{ left: number; width: number } | null>(null);
  const botones = useRef<Record<string, HTMLAnchorElement | null>>({});

  // La sección activa es la que cruza una franja cerca de la parte de arriba de la pantalla.
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActiva(e.target.id);
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );
    for (const s of secciones) {
      const el = document.getElementById(s.id);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, [secciones]);

  useEffect(() => {
    const medir = () => {
      const b = activa ? botones.current[activa] : null;
      if (b) setPildora({ left: b.offsetLeft, width: b.offsetWidth });
    };
    medir();
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, [activa]);

  return (
    <nav aria-label="Tienda" className="sticky top-0 z-30 bg-crema/95">
      <div className="relative mx-auto flex w-max max-w-full gap-0.5 px-2 py-2.5">
        {pildora && (
          <span
            aria-hidden="true"
            className="absolute left-0 top-2.5 h-9 rounded-full bg-tinta transition-[transform,width] duration-500 ease-suave"
            style={{ width: pildora.width, transform: `translateX(${pildora.left}px)` }}
          />
        )}
        {secciones.map((s) => (
          <a
            key={s.id}
            ref={(el) => {
              botones.current[s.id] = el;
            }}
            href={`#${s.id}`}
            aria-current={activa === s.id ? "true" : undefined}
            className={`relative flex h-9 items-center whitespace-nowrap rounded-full px-3 text-[11px] uppercase tracking-marca transition-colors duration-500 active:scale-95 ${
              activa === s.id ? "text-crema" : "text-tinta/70"
            }`}
          >
            {s.label}
          </a>
        ))}
      </div>
      {/* Marca la frontera entre el principio y la tienda. */}
      <LineaNeon />
    </nav>
  );
}
