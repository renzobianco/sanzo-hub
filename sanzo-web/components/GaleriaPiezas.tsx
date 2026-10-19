"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { Producto } from "@/data/products";
import { fotoDePieza, piezasDe } from "@/lib/combos";
import { ConZoom } from "./ConZoom";

interface Props {
  combo: Producto;
  /** Color elegido de cada pieza (id → color): la foto de esa pieza pasa a ese color. */
  colores: Record<string, string>;
  /** Pieza a la que se desliza sola (ej. al elegir su color). `n` cambia en cada aviso. */
  foco?: { pieza: string; n: number };
  /** Si el combo es el que se ve: recién ahí hace el amague de "deslizá". */
  visible: boolean;
}

const sinMovimiento = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Fotos de un combo, una por pieza: se pasan deslizando con el dedo. Cada foto lleva el nombre
 * de la pieza (y su color, si se eligió). Al entrar en pantalla hace un amague corto para que se
 * note que se desliza.
 */
export function GaleriaPiezas({ combo, colores, foco, visible }: Props) {
  const piezas = piezasDe(combo);
  const fotos = piezas.map((p) => fotoDePieza(combo, p, colores[p.id]) ?? "");
  const pista = useRef<HTMLDivElement>(null);
  const [activa, setActiva] = useState(0);
  const amagado = useRef(false);

  // Al elegir un color, se desliza hasta esa pieza para que se vea cómo queda.
  useEffect(() => {
    const el = pista.current;
    const i = foco ? piezas.findIndex((p) => p.id === foco.pieza) : -1;
    if (el && i >= 0) el.scrollTo({ left: i * el.clientWidth, behavior: sinMovimiento() ? "auto" : "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [foco]);

  // Amague: la primera vez que se ve, se corre un poquito y vuelve.
  useEffect(() => {
    const el = pista.current;
    if (!el || !visible || amagado.current || piezas.length < 2 || sinMovimiento()) return;
    let t: ReturnType<typeof setTimeout>;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || amagado.current) return;
        amagado.current = true;
        obs.disconnect();
        t = setTimeout(() => {
          el.scrollTo({ left: 56, behavior: "smooth" });
          t = setTimeout(() => el.scrollTo({ left: 0, behavior: "smooth" }), 450);
        }, 500);
      },
      { threshold: 0.6 },
    );
    obs.observe(el);
    return () => {
      obs.disconnect();
      clearTimeout(t);
    };
  }, [visible, piezas.length]);

  return (
    <div className="relative">
      <div
        ref={pista}
        onScroll={(e) => setActiva(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain bg-topo/35 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {piezas.map((p, i) => (
          <div key={p.id} className="relative w-full shrink-0 snap-center">
            <ConZoom fotos={fotos} nombre={combo.nombre} inicial={i}>
              <div className="relative aspect-[4/5] w-full">
                {fotos[i] && (
                  <Image
                    key={fotos[i]}
                    src={fotos[i]}
                    alt={`${p.nombre}${colores[p.id] ? ` ${colores[p.id]}` : ""}`}
                    fill
                    sizes="(min-width: 768px) 576px, 100vw"
                    className="animate-fundido object-cover motion-reduce:animate-none"
                  />
                )}
              </div>
            </ConZoom>
            <span className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-crema/90 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-tinta">
              {p.nombre}
              {colores[p.id] && <span className="text-marron"> · {colores[p.id]}</span>}
            </span>
          </div>
        ))}
      </div>
      {piezas.length > 1 && (
        <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-crema/90 px-2.5 py-1 text-[10px] tracking-[0.2em] text-tinta">
          {activa + 1} / {piezas.length}
        </span>
      )}
    </div>
  );
}
