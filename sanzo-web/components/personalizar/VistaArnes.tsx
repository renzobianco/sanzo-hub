"use client";

import Image from "next/image";
import { personalizacion, type EstiloParche } from "@/data/products";

/** Mismo `sizes` en la vista y en las miniaturas: así el navegador baja una sola versión de cada foto. */
export const SIZES_FOTO = "(min-width: 768px) 520px, 100vw";

/** El nombre (y teléfono) escrito sobre el parche, en píxeles de la foto. */
function TextoGrabado({ estilo, nombre, telefono }: { estilo: EstiloParche; nombre: string; telefono: string }) {
  const { x, y, ancho, alto } = estilo.texto;
  const vacio = !nombre.trim();
  const texto = (nombre.trim() || "Nombre").toUpperCase();
  const tel = telefono.trim();
  // Achica la letra para que entren nombres largos (Jost en mayúscula ≈ 0.78em por letra con el tracking).
  const tamNombre = Math.min(alto * (tel ? 0.5 : 0.66), ancho / (Math.max(texto.length, 3) * 0.78));
  const tamTel = Math.min(alto * 0.3, ancho / (Math.max(tel.length, 6) * 0.62));

  return (
    <g
      textAnchor="middle"
      dominantBaseline="central"
      fill="rgb(var(--tinta))"
      style={{ fontFamily: "var(--font-jost), sans-serif", mixBlendMode: "multiply" }}
    >
      <text
        x={x}
        y={tel ? y - alto * 0.17 : y}
        fontSize={tamNombre}
        fontWeight={450}
        letterSpacing="0.08em"
        fillOpacity={vacio ? 0.28 : 0.78}
      >
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

interface Props {
  estilo?: EstiloParche;
  nombre: string;
  telefono?: string;
}

/** El arnés de frente con el parche elegido y el nombre encima, en vivo. */
export function VistaArnes({ estilo, nombre, telefono = "" }: Props) {
  const { imagenArnes, estilos, tamFoto, zoom } = personalizacion;
  const base = imagenArnes || estilos[0]?.imagen;

  return (
    <div role="img" aria-label="Vista previa del arnés de frente" className="relative aspect-[4/5] w-full overflow-hidden bg-lino">
      {/* bg-lino acá adentro: el multiply de las fotos se mezcla con este fondo (el scale crea un grupo aparte). */}
      <div className="absolute inset-0 bg-lino" style={{ transform: `scale(${zoom})` }}>
        {/* Todas las fotos apiladas: cambiar de estilo es instantáneo. */}
        {base && (
          <Image
            src={base}
            alt=""
            fill
            sizes={SIZES_FOTO}
            priority
            className={`object-contain transition-opacity duration-300 ${estilo ? "opacity-0" : ""}`}
          />
        )}
        {estilos.map((e) => (
          <Image
            key={e.id}
            src={e.imagen}
            alt=""
            fill
            sizes={SIZES_FOTO}
            className={`object-cover mix-blend-multiply transition-opacity duration-300 ${
              estilo?.id === e.id ? "" : "opacity-0"
            }`}
          />
        ))}
        {estilo && (
          <svg
            viewBox={`0 0 ${tamFoto.ancho} ${tamFoto.alto}`}
            preserveAspectRatio="xMidYMid slice"
            className="absolute inset-0 h-full w-full"
            aria-hidden="true"
          >
            <TextoGrabado estilo={estilo} nombre={nombre} telefono={telefono} />
          </svg>
        )}
      </div>
      {!estilo && (
        <p className="absolute inset-x-0 bottom-4 text-center text-[11px] uppercase tracking-amplio text-tinta/60">
          Elegí un parche
        </p>
      )}
    </div>
  );
}

/** Recorte de la foto centrado en el parche, para los botones de estilo. */
export function MiniParche({ estilo }: { estilo: EstiloParche }) {
  const { tamFoto } = personalizacion;
  const ancho = estilo.texto.ancho * 1.6;
  const alto = ancho / 2;
  const x = estilo.texto.x - ancho / 2;
  const y = estilo.texto.y - alto / 2;
  return (
    <span className="relative block aspect-[2/1] w-full overflow-hidden bg-lino">
      <Image
        src={estilo.imagen}
        alt=""
        width={tamFoto.ancho}
        height={tamFoto.alto}
        sizes={SIZES_FOTO}
        className="absolute left-0 top-0 max-w-none mix-blend-multiply"
        style={{
          width: `${(tamFoto.ancho / ancho) * 100}%`,
          transform: `translate(${(-x / tamFoto.ancho) * 100}%, ${(-y / tamFoto.alto) * 100}%)`,
        }}
      />
    </span>
  );
}
