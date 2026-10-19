"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { sitio } from "@/data/products";
import { LineaNeon } from "./LineaNeon";
import { Palabras } from "./Palabras";

/**
 * Principio de la página: la frase grande arriba sobre el crema y abajo la foto de borde a borde
 * con el botón. Las fotos cambian solas con un fundido (sin deslizar).
 */
export function Hero() {
  const { titulo, cierre, bajada, boton, link, fotos } = sitio.hero;
  const [activa, setActiva] = useState(0);
  const [cargadas, setCargadas] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (fotos.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setActiva((a) => (a + 1) % fotos.length), 5000);
    return () => clearInterval(t);
  }, [fotos.length]);

  return (
    <section aria-labelledby="hero-titulo" className="px-4 pb-12">
      <div className="relative -mx-4">
      <a href={link} className="relative block aspect-[1/1] overflow-hidden bg-lino md:aspect-[16/7]">
        {fotos.map((src, i) => {
          // Se montan la actual, la siguiente y las ya cargadas: nunca queda un cuadro vacío.
          if (!(i === 0 || i === activa || i === (activa + 1) % fotos.length || cargadas[i])) return null;
          return (
            <Image
              key={src}
              src={src}
              alt=""
              fill
              priority={i === 0}
              sizes="100vw"
              onLoad={() => setCargadas((c) => ({ ...c, [i]: true }))}
              className={`object-cover object-[50%_35%] transition-opacity duration-[1200ms] ease-suave ${
                i === activa && (cargadas[i] || i === 0) ? "opacity-100" : "opacity-0"
              }`}
            />
          );
        })}
        {/* Sombra suave abajo para que la frase se lea sobre cualquier foto. */}
        <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-tinta/55 via-transparent to-transparent" />
        <span className="btn-claro absolute bottom-4 left-4 px-5 md:bottom-10 md:left-12 py-2.5 text-[11px]">{boton}</span>
      </a>
      {/* La frase va arriba de la foto, en crema; no tapa los toques del link. */}
      <h1 id="hero-titulo" className="pointer-events-none absolute bottom-[4.25rem] left-4 uppercase text-crema md:bottom-24 md:left-12">
        <span className="block text-[2.6rem] font-light md:text-[4.5rem] leading-none tracking-[0.12em]">
          <Palabras texto={titulo} alCargar retraso={100} />
        </span>
        <span className="mt-2.5 flex animate-entrada items-center gap-2.5 text-[0.8rem] font-normal tracking-[0.32em] [animation-delay:350ms]">
          <span aria-hidden="true" className="h-px w-7 shrink-0 bg-crema" />
          {cierre}
        </span>
      </h1>
      </div>
      {/* La frase va subrayada con la línea marrón, de borde a borde. */}
      {bajada && <p className="mt-5 text-center text-[15px] text-tinta/80">{bajada}</p>}
      <div className="-mx-4 mt-3">
        <LineaNeon suave />
      </div>
    </section>
  );
}
