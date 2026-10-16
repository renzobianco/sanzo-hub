"use client";

import Image from "next/image";
import { personalizacion, type FormaPieza } from "@/data/products";
import { PiezaGrabada } from "./PiezaGrabada";

/** Dibujo de referencia del arnés de frente, hasta que se cargue la foto (`personalizacion.imagenArnes`). */
function DibujoArnes() {
  return (
    <svg
      viewBox="0 0 400 500"
      className="absolute inset-0 h-full w-full"
      fill="none"
      stroke="rgb(var(--marron))"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M118 150C130 70 270 70 282 150" strokeWidth="30" />
      <path d="M128 165C150 215 175 240 200 255M272 165C250 215 225 240 200 255" strokeWidth="26" />
      <path d="M200 255V430" strokeWidth="30" />
      <path d="M80 395C140 430 260 430 320 395" strokeWidth="30" />
      <circle cx="200" cy="255" r="15" stroke="rgb(var(--tinta))" strokeOpacity="0.45" strokeWidth="5" />
    </svg>
  );
}

interface Props {
  estilo?: FormaPieza;
  nombre: string;
  telefono?: string;
}

/** El arnés de frente con la pieza elegida encima, en vivo. */
export function VistaArnes({ estilo, nombre, telefono }: Props) {
  const { imagenArnes, posicion } = personalizacion;
  return (
    <div role="img" aria-label="Vista previa del arnés de frente" className="relative aspect-[4/5] w-full overflow-hidden bg-lino">
      {imagenArnes ? (
        <Image src={imagenArnes} alt="" fill sizes="(min-width: 768px) 360px, 80vw" className="object-cover" priority />
      ) : (
        <DibujoArnes />
      )}
      {estilo ? (
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${posicion.x}%`, top: `${posicion.y}%`, width: `${posicion.ancho}%` }}
        >
          <div key={estilo} className="animate-entrada">
            <PiezaGrabada forma={estilo} nombre={nombre} telefono={telefono} className="w-full" />
          </div>
        </div>
      ) : (
        <p className="absolute inset-x-0 bottom-4 text-center text-[11px] uppercase tracking-amplio text-tinta/60">
          Elegí un estilo
        </p>
      )}
    </div>
  );
}
