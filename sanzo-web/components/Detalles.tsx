"use client";

import type { Producto } from "@/data/products";

type Punto = NonNullable<Producto["detalles"]>[number];

/**
 * Detalles señalados sobre la foto (estilo ficha técnica): un puntito en la pieza, una línea negra
 * que se dibuja sola y una etiqueta corta al final. No toma toques: tocar la foto sigue abriendo el zoom.
 * Coordenadas en % de la foto tal como se ve en la ficha (cuadrada).
 */
export function Detalles({ puntos, visible }: { puntos: Punto[]; visible: boolean }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {/* La foto es cuadrada: el dibujo escala parejo y la línea mantiene su grosor. */}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        {puntos.map((p, i) => (
          <line
            key={p.texto}
            x1={p.x}
            y1={p.y}
            x2={p.tx}
            y2={p.ty}
            pathLength={1}
            stroke="rgb(var(--tinta))"
            strokeWidth={0.38}
            strokeDasharray="1"
            style={{
              strokeDashoffset: visible ? 0 : 1,
              transition: `stroke-dashoffset 700ms cubic-bezier(0.16, 1, 0.3, 1) ${450 + i * 180}ms`,
            }}
          />
        ))}
      </svg>

      {puntos.map((p, i) => (
        <span key={p.texto}>
          {/* Puntito con un latido suave. */}
          <span
            className="absolute flex h-3 w-3 -translate-x-1/2 -translate-y-1/2 items-center justify-center transition-opacity duration-500"
            style={{ left: `${p.x}%`, top: `${p.y}%`, opacity: visible ? 1 : 0, transitionDelay: `${350 + i * 180}ms` }}
          >
            <span className="absolute inset-0 animate-ping rounded-full bg-crema/70 [animation-duration:2.4s]" />
            <span className="relative h-2 w-2 rounded-full bg-tinta ring-2 ring-crema" />
          </span>
          {/* Etiqueta al final de la línea. */}
          <span
            className="absolute whitespace-nowrap rounded-full bg-crema/90 px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-tinta shadow-[0_4px_14px_-6px_rgb(var(--tinta)/0.5)] transition-[opacity,transform] duration-500 ease-suave"
            style={{
              left: `${p.tx}%`,
              top: `${p.ty}%`,
              opacity: visible ? 1 : 0,
              transform: `translate(${p.alinear === "izq" ? "-100%" : "0"}, ${visible ? "-50%" : "-20%"})`,
              transitionDelay: `${800 + i * 180}ms`,
            }}
          >
            {p.texto}
          </span>
        </span>
      ))}
    </div>
  );
}
