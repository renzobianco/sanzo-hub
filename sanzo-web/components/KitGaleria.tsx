"use client";

import { useRef, useState } from "react";
import { ConZoom } from "./ConZoom";
import { ImagenProducto } from "./ImagenProducto";

/** Galería del kit: se desliza con el dedo, con puntitos que muestran en qué foto estás. */
export function KitGaleria({ imagenes, nombre }: { imagenes: string[]; nombre: string }) {
  const [activa, setActiva] = useState(0);
  const pista = useRef<HTMLUListElement>(null);

  if (imagenes.length <= 1) {
    return (
      <ImagenProducto src={imagenes[0]} nombre={nombre} sizes="(min-width: 768px) 55vw, 100vw" aspecto="aspect-square" tamTexto="text-lg md:text-2xl" priority />
    );
  }

  const ir = (i: number) => {
    const el = pista.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <ul
        ref={pista}
        className="sin-scrollbar flex snap-x snap-mandatory overflow-x-auto"
        onScroll={(e) => {
          const el = e.currentTarget;
          setActiva(Math.round(el.scrollLeft / el.clientWidth));
        }}
        aria-label={`Fotos de ${nombre}`}
      >
        {imagenes.map((src, i) => (
          <li key={src} className="w-full shrink-0 snap-center">
            <ConZoom fotos={imagenes} nombre={nombre} inicial={i}>
              <ImagenProducto
                src={src}
                nombre={`${nombre}, foto ${i + 1}`}
                sizes="(min-width: 768px) 55vw, 100vw"
                aspecto="aspect-square"
                priority={i === 0}
              />
            </ConZoom>
          </li>
        ))}
      </ul>
      <p className="pointer-events-none absolute right-3 top-3 rounded-full bg-crema/85 px-2.5 py-1 text-[10px] tracking-[0.2em] backdrop-blur-sm">
        {activa + 1} / {imagenes.length}
      </p>
      <div className="mt-4 flex justify-center gap-2">
        {imagenes.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => ir(i)}
            aria-label={`Ver foto ${i + 1} de ${imagenes.length}`}
            aria-current={i === activa}
            className={`h-[3px] rounded-full transition-all duration-500 ${i === activa ? "w-7 bg-tinta" : "w-3 bg-tinta/25"}`}
          />
        ))}
      </div>
    </div>
  );
}
