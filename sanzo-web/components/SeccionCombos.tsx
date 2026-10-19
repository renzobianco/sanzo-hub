"use client";

import { useState } from "react";
import { Palabras } from "./Palabras";
import { combos } from "@/data/products";
import { formatearPrecio } from "@/lib/formato";
import { AgregarAlCarrito } from "./AgregarAlCarrito";
import { GaleriaPiezas } from "./GaleriaPiezas";
import { IconoFlecha } from "./Iconos";
import { MiniPiezas } from "./MiniPiezas";
import { Reveal } from "./Reveal";

/**
 * Combos de a uno, a todo el ancho. De combo a combo se pasa con las flechas; adentro de cada
 * uno, la foto se desliza pieza por pieza (`GaleriaPiezas`).
 * Todos quedan montados y apilados en la misma celda: así no se pierde el talle elegido
 * y el cambio es un fundido sin saltos de alto.
 */
export function SeccionCombos() {
  const [activo, setActivo] = useState(0);
  const total = combos.length;
  const ir = (paso: number) => setActivo((a) => (a + paso + total) % total);
  // Colores elegidos por combo (para la foto de cada pieza) y a qué pieza deslizar.
  const [colores, setColores] = useState<Record<string, Record<string, string>>>({});
  const [foco, setFoco] = useState<Record<string, { pieza: string; n: number }>>({});

  return (
    <section id="combos" aria-labelledby="combos-titulo" className="bg-lino py-20 md:py-28">
      <div className="mx-auto max-w-xl px-4">
        <Reveal className="mb-10 text-center md:mb-14">
          <p className="eyebrow">Armados para combinar</p>
          <h2 id="combos-titulo" className="titulo-seccion mt-3">
            <Palabras texto="Combos" />
          </h2>
        </Reveal>

        <Reveal className="relative">
          <div className="grid" aria-live="polite">
            {combos.map((c, i) => {
              const visible = i === activo;
              return (
                <article
                  key={c.id}
                  aria-hidden={!visible}
                  inert={!visible}
                  aria-label={`${c.nombre}, ${i + 1} de ${total}`}
                  className={`flex flex-col overflow-hidden rounded-[1rem] bg-crema transition-opacity duration-500 ease-suave [grid-area:1/1] ${
                    visible ? "opacity-100" : "pointer-events-none opacity-0"
                  }`}
                >
                  <GaleriaPiezas combo={c} colores={colores[c.id] ?? {}} foco={foco[c.id]} visible={visible} />
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="text-2xl font-light uppercase tracking-marca">{c.nombre}</h3>
                    <p className="mt-2 text-[15px] text-tinta/80">{c.descripcion}</p>
                    <div className="mt-6">
                      <MiniPiezas incluye={c.incluye} />
                    </div>
                    {c.precio !== null && <p className="mt-6 text-[1.9rem] font-light leading-none tracking-wide">{formatearPrecio(c.precio)}</p>}
                    <div className="mt-auto pt-6">
                      <AgregarAlCarrito
                        producto={c}
                        onColores={(col, pieza) => {
                          setColores((t) => ({ ...t, [c.id]: col }));
                          setFoco((f) => ({ ...f, [c.id]: { pieza, n: (f[c.id]?.n ?? 0) + 1 } }));
                        }}
                      />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Flechas a los costados, a la altura del medio de la foto. */}
          {total > 1 && (
            <div className="pointer-events-none absolute inset-x-0 top-0 flex aspect-[4/5] items-center justify-between px-2.5">
              <button
                type="button"
                onClick={() => ir(-1)}
                aria-label="Combo anterior"
                className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-crema/90 text-tinta shadow-[0_6px_18px_-8px_rgb(var(--tinta)/0.6)] backdrop-blur-sm transition-transform active:scale-90"
              >
                <IconoFlecha className="rotate-180" />
              </button>
              <button
                type="button"
                onClick={() => ir(1)}
                aria-label="Combo siguiente"
                className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-crema/90 text-tinta shadow-[0_6px_18px_-8px_rgb(var(--tinta)/0.6)] backdrop-blur-sm transition-transform active:scale-90"
              >
                <IconoFlecha />
              </button>
            </div>
          )}

          {total > 1 && (
            <div className="mt-5 flex items-center justify-center gap-3">
              {combos.map((c, i) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActivo(i)}
                  aria-label={`Ver ${c.nombre}`}
                  aria-current={i === activo}
                  className="flex h-6 items-center"
                >
                  <span className={`block h-[3px] rounded-full transition-all duration-500 ${i === activo ? "w-7 bg-tinta" : "w-3 bg-tinta/25"}`} />
                </button>
              ))}
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
}
