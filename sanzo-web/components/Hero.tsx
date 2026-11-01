"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { clientes, sitio } from "@/data/products";
import { LineaNeon } from "./LineaNeon";
import { Palabras } from "./Palabras";

/**
 * Principio de la página: la frase grande arriba sobre el crema y abajo la foto de borde a borde
 * con el botón. Las fotos cambian solas con un fundido (sin deslizar).
 */
export function Hero() {
  const { titulo, cierre, bajada, boton, link, fotos, estrellas } = sitio.hero;
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
        <span className={`btn-claro absolute left-4 px-5 py-2.5 text-[11px] md:left-12 ${estrellas ? "bottom-10 md:bottom-[4.5rem]" : "bottom-4 md:bottom-10"}`}>{boton}</span>
        {estrellas > 0 && (
          // Valoración debajo del botón: estrellas + "+150 clientes satisfechos".
          <span className="absolute bottom-4 left-4 flex items-center gap-2 text-crema md:bottom-10 md:left-12">
            <span aria-label={`${String(estrellas).replace(".", ",")} de 5 estrellas`} className="flex gap-0.5">
              {[0, 1, 2, 3, 4].map((i) => (
                // Estrella apagada de fondo y la llena encima, recortada según cuánto le toca (permite medias).
                <span key={i} aria-hidden="true" className="relative h-[13px] w-[13px]">
                  <Estrella className="absolute inset-0 opacity-35" />
                  <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${Math.min(1, Math.max(0, estrellas - i)) * 100}%` }}>
                    <Estrella className="h-[13px] w-[13px] max-w-none" />
                  </span>
                </span>
              ))}
            </span>
            {clientes.numero && (
              <span className="text-[10px] uppercase tracking-[0.18em]">
                +{clientes.numero} {clientes.texto}
              </span>
            )}
          </span>
        )}
      </a>
      {/* La frase va arriba de la foto, en crema; no tapa los toques del link. */}
      <h1
        id="hero-titulo"
        className={`pointer-events-none absolute left-4 uppercase text-crema md:left-12 ${estrellas ? "bottom-[6.5rem] md:bottom-[8.5rem]" : "bottom-[4.25rem] md:bottom-24"}`}
      >
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

function Estrella({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={13} height={13} fill="currentColor" className={className}>
      <path d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z" />
    </svg>
  );
}
