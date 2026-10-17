"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { sitio } from "@/data/products";
import { Palabras } from "./Palabras";

/**
 * Principio de la página: la frase grande arriba sobre el crema y abajo la foto con bordes
 * redondeados y el botón. Las fotos cambian solas con un fundido (sin deslizar).
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
    <section aria-labelledby="hero-titulo" className="px-4 pb-6 pt-5">
      <h1 id="hero-titulo" className="uppercase">
        <span className="block text-[4.4rem] font-light leading-[0.95] tracking-[0.06em]">
          <Palabras texto={titulo} alCargar retraso={100} />
        </span>
        <span className="mt-3 flex animate-entrada items-center gap-3 text-[1.05rem] font-normal tracking-[0.32em] text-marron [animation-delay:350ms]">
          <span aria-hidden="true" className="h-px w-10 shrink-0 bg-marron" />
          {cierre}
        </span>
      </h1>

      <a
        href={link}
        className="relative mt-6 block aspect-[10/9] overflow-hidden rounded-2xl bg-lino shadow-[0_14px_30px_-20px_rgb(var(--tinta)/0.6)]"
      >
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
        <span className="btn-claro absolute bottom-3 right-3 px-5 py-2.5 text-[11px]">{boton}</span>
      </a>
      {bajada && <p className="mt-4 text-center text-[15px] text-tinta/75">{bajada}</p>}
    </section>
  );
}
