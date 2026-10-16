"use client";

import { useId } from "react";
import type { FormaPieza } from "@/data/products";

// Todas las formas viven en un lienzo de 200×120 para poder intercambiarlas sobre el arnés.
// `centro` = altura del texto; `ancho` / `anchoTel` = espacio disponible para nombre / teléfono.
const FORMAS: Record<FormaPieza, { centro: number; ancho: number; anchoTel: number }> = {
  hueso: { centro: 60, ancho: 122, anchoTel: 110 },
  corazon: { centro: 52, ancho: 88, anchoTel: 66 },
  placa: { centro: 60, ancho: 132, anchoTel: 116 },
};

function Silueta({ forma, ...props }: { forma: FormaPieza } & React.SVGProps<SVGGElement>) {
  return (
    <g {...props}>
      {forma === "hueso" && (
        <>
          <rect x="38" y="42" width="124" height="36" />
          <circle cx="34" cy="40" r="22" />
          <circle cx="34" cy="80" r="22" />
          <circle cx="166" cy="40" r="22" />
          <circle cx="166" cy="80" r="22" />
        </>
      )}
      {forma === "corazon" && (
        <path d="M100 112C46 80 26 56 36 32 46 10 82 8 100 34 118 8 154 10 164 32 174 56 154 80 100 112Z" />
      )}
      {forma === "placa" && <rect x="16" y="24" width="168" height="72" rx="36" />}
    </g>
  );
}

interface Props {
  forma: FormaPieza;
  nombre?: string;
  telefono?: string;
  /** Solo la forma, sin texto (para los botones de estilo). */
  sinTexto?: boolean;
  className?: string;
}

/** La pieza recortada con el nombre grabado. */
export function PiezaGrabada({ forma, nombre = "", telefono = "", sinTexto, className }: Props) {
  const gradiente = `brillo-${useId().replace(/:/g, "")}`;
  const f = FORMAS[forma];
  const vacio = !nombre.trim();
  const texto = (nombre.trim() || "Nombre").toUpperCase();
  const tel = telefono.trim();
  // Achica la letra para que entren nombres largos (Jost en mayúscula ≈ 0.78em por letra con el tracking).
  const tamNombre = Math.min(tel ? 21 : 27, f.ancho / (Math.max(texto.length, 3) * 0.78));
  const tamTel = Math.min(11, f.anchoTel / (Math.max(tel.length, 6) * 0.62));
  const yNombre = tel ? f.centro - 7 : f.centro;

  return (
    <svg viewBox="0 0 200 120" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={gradiente} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgb(var(--crema))" stopOpacity="0.45" />
          <stop offset="0.6" stopColor="rgb(var(--crema))" stopOpacity="0" />
        </linearGradient>
      </defs>
      <Silueta forma={forma} fill="rgb(var(--tinta))" fillOpacity="0.18" transform="translate(0 2.5)" />
      <Silueta forma={forma} fill="rgb(var(--topo))" />
      <Silueta forma={forma} fill={`url(#${gradiente})`} />
      {!sinTexto && (
        <g
          textAnchor="middle"
          dominantBaseline="central"
          fill="rgb(var(--tinta))"
          style={{ fontFamily: "var(--font-jost), sans-serif" }}
        >
          <text
            x="100"
            y={yNombre}
            fontSize={tamNombre}
            fontWeight={450}
            letterSpacing="0.08em"
            fillOpacity={vacio ? 0.3 : 0.85}
          >
            {texto}
          </text>
          {tel && (
            <text x="100" y={f.centro + 12} fontSize={tamTel} letterSpacing="0.06em" fillOpacity={0.8}>
              {tel}
            </text>
          )}
        </g>
      )}
    </svg>
  );
}
