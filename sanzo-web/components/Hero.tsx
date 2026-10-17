"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { sitio } from "@/data/products";
import { Palabras } from "./Palabras";

/**
 * Portada. Celu: foto a media pantalla con el título encima. PC: texto a la izquierda sobre
 * tinta y la foto a la derecha. Las fotos van cambiando con un fundido y zoom lento, y al
 * scrollear hay parallax tipo Apple (variable CSS --p, de 0 a 1).
 */
export function Hero() {
  const { titulo, imagenes } = sitio.hero;
  const ref = useRef<HTMLElement>(null);
  const [activa, setActiva] = useState(0);
  const [lista, setLista] = useState<Record<number, boolean>>({});
  const listaRef = useRef(lista);
  listaRef.current = lista;

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const actualizar = () => {
      frame = 0;
      const p = Math.min(1, Math.max(0, window.scrollY / el.offsetHeight));
      el.style.setProperty("--p", p.toFixed(4));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(actualizar);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    actualizar();
    // Rotación de fotos.
    // Solo pasa a la siguiente si ya cargó: nunca queda un cuadro vacío.
    const timer =
      imagenes.length > 1
        ? setInterval(() => setActiva((a) => (listaRef.current[(a + 1) % imagenes.length] ? (a + 1) % imagenes.length : a)), 6000)
        : undefined;
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
      clearInterval(timer);
    };
  }, [imagenes.length]);

  return (
    <section
      ref={ref}
      className="relative flex h-[50svh] min-h-[18rem] items-end overflow-hidden bg-tinta text-crema [--p:0] md:grid md:h-[calc(100svh-6rem)] md:min-h-[36rem] md:grid-cols-[1fr_1.05fr] md:items-stretch"
    >
      {/* Fotos */}
      <div className="absolute inset-0 md:relative md:order-2 md:overflow-hidden">
        <div
          className="absolute inset-0 will-change-transform"
          style={{ transform: "translate3d(0, calc(var(--p) * 18%), 0) scale(calc(1 + var(--p) * 0.1))" }}
        >
          {imagenes.map((src, i) => {
            const montar = i === 0 || i === activa || i === (activa + 1) % imagenes.length || lista[i];
            if (!montar) return null;
            return (
              <Image
                key={src}
                src={src}
                alt=""
                fill
                priority={i === 0}
                sizes="(min-width: 768px) 52vw, 100vw"
                onLoad={() => setLista((l) => ({ ...l, [i]: true }))}
                className={`object-cover object-[50%_30%] transition-[opacity,transform] duration-[1800ms] ease-suave ${
                  i === activa && (lista[i] || i === 0) ? "scale-100 opacity-100" : "scale-[1.08] opacity-0"
                } ${i === activa ? "animate-zoom-lento" : ""}`}
              />
            );
          })}
        </div>
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-tinta/80 via-tinta/20 to-transparent md:hidden" />
        {/* Puntitos de qué foto se ve */}
        {imagenes.length > 1 && (
          <div aria-hidden="true" className="absolute bottom-6 right-6 hidden gap-1.5 md:flex">
            {imagenes.map((src, i) => (
              <span key={src} className={`h-[3px] rounded-full bg-crema transition-all duration-700 ease-suave ${i === activa ? "w-6" : "w-2 opacity-50"}`} />
            ))}
          </div>
        )}
      </div>

      {/* Texto */}
      <div
        className="relative mx-auto w-full max-w-7xl px-4 pb-8 text-center will-change-transform md:order-1 md:flex md:flex-col md:justify-center md:px-14 md:pb-0 md:text-left lg:px-20"
        style={{ transform: "translate3d(0, calc(var(--p) * -90px), 0)", opacity: "calc(1 - var(--p) * 1.6)" }}
      >
        <h1 className="text-[2.15rem] font-light uppercase leading-[1.15] tracking-marca sm:text-5xl md:text-[3.4rem] lg:text-7xl">
          <Palabras texto={titulo} alCargar retraso={150} />
        </h1>
      </div>
    </section>
  );
}
