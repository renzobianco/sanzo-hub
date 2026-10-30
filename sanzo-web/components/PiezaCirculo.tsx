"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Producto } from "@/data/products";
import { detallesDe } from "@/data/detalles";
import { Detalles } from "./Detalles";

/** Cuánto hay que mantener apretado para abrir la pieza en grande (ms). */
const ESPERA = 420;

/**
 * Círculo con la foto de una pieza del kit o combo. Manteniéndolo apretado se abre en grande, con los
 * detalles señalados (las mismas flechas que en la ficha del individual). Soltar o tocar afuera lo cierra.
 */
export function PiezaCirculo({ pieza, sizes, className = "relative" }: { pieza: Producto; sizes: string; className?: string }) {
  const [grande, setGrande] = useState(false);
  const [montado, setMontado] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const foto = pieza.circulo ?? pieza.miniatura ?? pieza.imagenes[0];
  // Si el círculo tiene sus propios detalles ("<id>-circulo" en detalles.json), en grande se ve esa misma imagen.
  const idCirculo = `${pieza.id}-circulo`;
  const conDetallesCirculo = detallesDe(idCirculo).length > 0;
  const fotoGrande = conDetallesCirculo ? foto : pieza.imagenes[0] ?? foto;

  useEffect(() => setMontado(true), []);
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (!grande) return;
    const cerrar = (e: KeyboardEvent) => e.key === "Escape" && setGrande(false);
    window.addEventListener("keydown", cerrar);
    return () => window.removeEventListener("keydown", cerrar);
  }, [grande]);

  const apretar = () => {
    clearTimeout(timer.current);
    // Que mantener apretado no seleccione el texto de la página.
    document.getSelection()?.removeAllRanges();
    timer.current = setTimeout(() => {
      setGrande(true);
      navigator.vibrate?.(10);
    }, ESPERA);
  };
  const soltar = () => clearTimeout(timer.current);

  return (
    <>
      <span
        className={`block select-none overflow-hidden rounded-full bg-lino [-webkit-touch-callout:none] ${className}`}
        onPointerDown={apretar}
        onPointerUp={soltar}
        onPointerLeave={soltar}
        onPointerCancel={soltar}
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
      >
        {foto && (
          <Image
            src={foto}
            alt={pieza.nombre}
            fill
            sizes={sizes}
            draggable={false}
            className="pointer-events-none object-cover"
          />
        )}
      </span>

      {montado &&
        grande &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={pieza.nombre}
            className="fixed inset-0 z-[80] flex animate-pop items-center justify-center bg-tinta/55 p-6 backdrop-blur-[2px]"
            onClick={() => setGrande(false)}
          >
            <figure className="w-full max-w-sm">
              <div className="relative aspect-square overflow-hidden rounded-[1rem] bg-lino shadow-[0_20px_50px_-20px_rgb(var(--tinta)/0.6)]">
                {fotoGrande && <Image src={fotoGrande} alt={pieza.nombre} fill sizes="24rem" className="object-cover" />}
                <Detalles id={conDetallesCirculo ? idCirculo : pieza.id} visible />
              </div>
              <figcaption className="mt-3 text-center text-[12px] uppercase tracking-[0.16em] text-crema">{pieza.nombre}</figcaption>
            </figure>
          </div>,
          document.body,
        )}
    </>
  );
}
