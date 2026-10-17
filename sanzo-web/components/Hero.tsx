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
  const { titulo, bajada, boton, link, fotos } = sitio.hero;
  const [activa, setActiva] = useState(0);
  const [cargadas, setCargadas] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (fotos.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setActiva((a) => (a + 1) % fotos.length), 5000);
    return () => clearInterval(t);
  }, [fotos.length]);

  return (
    <section aria-labelledby="hero-titulo" className="px-4 pb-6 pt-5">
      <h1 id="hero-titulo" className="text-[2.1rem] font-extralight uppercase leading-[1.12] tracking-[0.12em] [text-wrap:balance]">
        <Palabras texto={titulo} alCargar retraso={100} />
      </h1>
      {bajada && <p className="mt-3 animate-entrada text-[15px] text-tinta/75 [animation-delay:400ms]">{bajada}</p>}

      <a
        href={link}
        className="relative mt-5 block aspect-[16/10] overflow-hidden rounded-2xl bg-lino shadow-[0_14px_30px_-20px_rgb(var(--tinta)/0.6)]"
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
    </section>
  );
}
