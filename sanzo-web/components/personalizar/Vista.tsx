"use client";

import Image from "next/image";
import type { EstiloParche, PiezaPersonalizable } from "@/data/products";

/** Zona del parche donde va el grabado: centro (x, y), ancho y alto, en píxeles de la foto. */
type Zona = { x: number; y: number; ancho: number; alto: number };

/** El nombre (y teléfono) grabado sobre el parche. */
function TextoGrabado({ zona, nombre, telefono }: { zona: Zona; nombre: string; telefono: string }) {
  const { x, y, ancho, alto } = zona;
  const vacio = !nombre.trim();
  const texto = (nombre.trim() || "Nombre").toUpperCase();
  const tel = telefono.trim();
  // Achica la letra para que entren nombres largos (Jost en mayúscula ≈ 0.78em por letra con el tracking).
  const tamNombre = Math.min(alto * (tel ? 0.5 : 0.66), ancho / (Math.max(texto.length, 3) * 0.78));
  const tamTel = Math.min(alto * 0.3, ancho / (Math.max(tel.length, 6) * 0.62));

  return (
    <g textAnchor="middle" dominantBaseline="central" fill="rgb(var(--tinta))" style={{ fontFamily: "var(--font-jost), sans-serif", mixBlendMode: "multiply" }}>
      <text x={x} y={tel ? y - alto * 0.17 : y} fontSize={tamNombre} fontWeight={450} letterSpacing="0.08em" fillOpacity={vacio ? 0.28 : 0.78}>
        {texto}
      </text>
      {tel && (
        <text x={x} y={y + alto * 0.27} fontSize={tamTel} letterSpacing="0.06em" fillOpacity={0.72}>
          {tel}
        </text>
      )}
    </g>
  );
}

/** Versión optimizada de una foto de /public (la misma que arma next/image). */
const optimizada = (src: string) => `/_next/image?url=${encodeURIComponent(src)}&w=1080&q=75`;

interface Props {
  pieza: PiezaPersonalizable;
  nombrePieza: string;
  estilo?: EstiloParche;
  /** Parte del espacio máximo que ocupa el parche (1 = lo más grande que entra en la pieza). */
  escala: number;
  nombre: string;
  telefono?: string;
  /** Imagen propia ya pasada a "grabado láser" (data URL). Si está, va en lugar del nombre. */
  imagen?: string;
}

/**
 * Vista previa de una pieza: la foto del artículo con el parche elegido encima, en su lugar y del
 * tamaño elegido, con el nombre o la imagen grabada. Todo en un SVG con las medidas de la foto.
 */
export function VistaPieza({ pieza, nombrePieza, estilo, escala, nombre, telefono = "", imagen }: Props) {
  const { imagen: foto, tam, recorte, fondoBlanco, parche } = pieza;
  const vista = recorte ?? [0, 0, tam.ancho, tam.alto];
  const ancho = parche.ancho * escala;
  // Un poco más alto que las etiquetas lisas de las fotos, así el parche las tapa.
  const alto = ancho * 0.5;
  const zona = { x: parche.x, y: parche.y, ancho: ancho * 0.7, alto: alto * 0.62 };

  return (
    <div role="img" aria-label={`Vista previa: ${nombrePieza}`} className="relative aspect-[4/5] w-full overflow-hidden bg-lino">
      <svg viewBox={vista.join(" ")} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden="true">
        {/* Fondo lino dentro del SVG: el multiply de la foto se mezcla con esto y el blanco desaparece. */}
        <rect x={-tam.ancho} y={-tam.alto} width={tam.ancho * 3} height={tam.alto * 3} fill="rgb(var(--lino))" />
        <image
          href={optimizada(foto)}
          width={tam.ancho}
          height={tam.alto}
          style={fondoBlanco ? { mixBlendMode: "multiply", filter: "brightness(1.1) contrast(1.05)" } : undefined}
        />
        {estilo && (
          <g transform={`rotate(${parche.giro ?? 0} ${parche.x} ${parche.y})`}>
            {/* key: al cambiar de parche aparece de nuevo con un pequeño rebote. */}
            <g key={estilo.id} className="parche-aparece" style={{ transformOrigin: `${parche.x}px ${parche.y}px` }}>
              {/* El tamaño cambia con una transición suave. */}
              <g style={{ transform: `scale(${escala})`, transformOrigin: `${parche.x}px ${parche.y}px`, transition: "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)" }}>
                <image
                  href={estilo.parche}
                  x={parche.x - parche.ancho / 2}
                  y={parche.y - (parche.ancho * 0.5) / 2}
                  width={parche.ancho}
                  height={parche.ancho * 0.5}
                  preserveAspectRatio="xMidYMid meet"
                  style={{ filter: "drop-shadow(0 2px 3px rgb(37 29 22 / 0.3))" }}
                />
              </g>
              {imagen ? (
                // Grabado láser: se "quema" sobre el parche (multiply con el color del parche).
                <image
                  href={imagen}
                  x={zona.x - zona.ancho / 2}
                  y={zona.y - zona.alto * 0.62}
                  width={zona.ancho}
                  height={zona.alto * 1.24}
                  preserveAspectRatio="xMidYMid meet"
                  style={{ mixBlendMode: "multiply" }}
                />
              ) : (
                <TextoGrabado zona={zona} nombre={nombre} telefono={telefono} />
              )}
            </g>
          </g>
        )}
      </svg>
      {!estilo && <p className="absolute inset-x-0 bottom-4 text-center text-[11px] uppercase tracking-amplio text-tinta/60">Elegí un parche</p>}
    </div>
  );
}

/** El parche solo (sin fondo), para los botones de estilo. */
export function MiniParche({ estilo }: { estilo: EstiloParche }) {
  return (
    <span className="relative block aspect-[2/1] w-full">
      <Image src={estilo.parche} alt="" fill sizes="160px" className="object-contain p-2 drop-shadow-[0_2px_3px_rgb(var(--tinta)/0.25)]" />
    </span>
  );
}
