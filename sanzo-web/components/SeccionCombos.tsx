"use client";

import { useState } from "react";
import { Palabras } from "./Palabras";
import { combos } from "@/data/products";
import { formatearPrecio } from "@/lib/formato";
import { AgregarAlCarrito } from "./AgregarAlCarrito";
import { KitGaleria } from "./KitGaleria";
import { MiniPiezas } from "./MiniPiezas";
import { Reveal } from "./Reveal";

/**
 * Combos con solapas arriba (se ven los 4 nombres de entrada) y, abajo, una sola tarjeta
 * grande con la foto, el detalle y "Agregar" del combo elegido. Al tocar una solapa cambia
 * el contenido entero (sin medir alto a mano): cada combo es una tarjeta nueva y corta.
 */
export function SeccionCombos() {
  const [activo, setActivo] = useState(0);
  const combo = combos[activo];

  return (
    <section id="combos" aria-labelledby="combos-titulo" className="bg-lino py-12 md:py-16">
      <div className="mx-auto max-w-md px-4">
        <Reveal className="mb-6 text-center">
          <p className="eyebrow">Armados para combinar</p>
          <h2 id="combos-titulo" className="mt-2 text-lg font-light uppercase tracking-marca">
            <Palabras texto="Combos" />
          </h2>
        </Reveal>

        <Reveal>
          {/* Solapas: los 4 combos a la vista, no hace falta adivinar que hay más. */}
          <div role="tablist" aria-label="Combos" className="sin-scrollbar mb-3 flex justify-center gap-1.5 overflow-x-auto pb-1">
            {combos.map((c, i) => (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={i === activo}
                onClick={() => setActivo(i)}
                className={`shrink-0 rounded-full px-3.5 py-2 text-[10.5px] font-normal uppercase tracking-[0.12em] transition-colors duration-300 ease-suave ${
                  i === activo ? "bg-tinta text-crema" : "bg-crema text-tinta/65 hover:text-tinta"
                }`}
              >
                {c.nombre.replace(/^Combo /, "")}
              </button>
            ))}
          </div>

          <article key={combo.id} className="animate-entrada overflow-hidden rounded-[0.85rem] bg-crema">
            <div className="relative">
              <KitGaleria key={combo.id} imagenes={combo.imagenes} nombre={combo.nombre} aspecto="aspect-[4/3]" />
              {combo.etiqueta && (
                <p className="pointer-events-none absolute left-2.5 top-2.5 flex items-center gap-1.5 rounded-full bg-tinta px-2.5 py-1 text-[9px] uppercase tracking-[0.18em] text-crema">
                  <span aria-hidden="true" className="text-marron">★</span>
                  {combo.etiqueta}
                </p>
              )}
            </div>
            <div className="p-4">
              <h3 className="text-base font-normal uppercase tracking-[0.12em]">{combo.nombre}</h3>
              <p className="mt-1.5 text-[13px] text-tinta/75">{combo.descripcion}</p>
              <div className="mt-3.5">
                <MiniPiezas incluye={combo.incluye} />
              </div>
              {combo.precio !== null && <p className="mt-3.5 text-[1.3rem] font-light leading-none tracking-wide">{formatearPrecio(combo.precio)}</p>}
              <div className="pt-4">
                <AgregarAlCarrito producto={combo} acento="medio" />
              </div>
            </div>
          </article>
        </Reveal>
      </div>
    </section>
  );
}
