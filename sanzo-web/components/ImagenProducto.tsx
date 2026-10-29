"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

interface Props {
  src?: string;
  /** Varias fotos: se ve la primera (o la `fija`); el resto, en la ficha o la galería. */
  srcs?: string[];
  nombre: string;
  sizes: string;
  priority?: boolean;
  /** Clase de proporción. Por defecto 4:5. */
  aspecto?: string;
  className?: string;
  /** Tamaño del texto del placeholder. */
  tamTexto?: string;
  /** Fondo del placeholder (para que no se pierda sobre secciones lino). */
  fondo?: string;
  /** Muestra otra foto en vez de la primera (ej. la del color elegido). */
  fija?: number;
  /** "contain": la foto entra entera (piezas sin fondo, ej. la chapita en el carrito). */
  ajuste?: "cover" | "contain";
}

/**
 * Foto del producto con next/image: aparece con un fundido suave al cargar, dentro de un <Reveal>
 * se "destapa" al entrar en pantalla. Con varias fotos no cambian solas: solo con `fija`.
 * Sin foto (o si falla), placeholder con el nombre.
 */
export function ImagenProducto({
  src,
  srcs,
  nombre,
  sizes,
  priority,
  aspecto = "aspect-[4/5]",
  className = "",
  tamTexto = "text-sm md:text-base",
  fondo = "bg-lino",
  fija,
  ajuste = "cover",
}: Props) {
  const fotos = (srcs && srcs.length > 0 ? srcs : src ? [src] : []).filter(Boolean);
  const [activa, setActiva] = useState(0);
  const [cargadas, setCargadas] = useState<Record<number, boolean>>({});
  const [fallo, setFallo] = useState(false);

  useEffect(() => {
    setActiva(fija === undefined ? 0 : Math.min(fija, fotos.length - 1));
  }, [fija, fotos.length]);

  return (
    <div className={`img-revelar relative overflow-hidden ${fondo} ${aspecto} ${className}`}>
      {fotos.length > 0 && !fallo ? (
        fotos.map((f, i) => {
          // Solo se pide la foto actual y la siguiente: el resto se baja cuando le toca.
          const montar = i === 0 || i === activa || i === (activa + 1) % fotos.length || cargadas[i];
          if (!montar) return null;
          const visible = i === activa && cargadas[i];
          return (
            <Image
              key={f}
              src={f}
              alt={i === 0 ? nombre : ""}
              fill
              sizes={sizes}
              priority={priority && i === 0}
              onLoad={() => setCargadas((c) => ({ ...c, [i]: true }))}
              onError={() => i === 0 && setFallo(true)}
              className={`${ajuste === "contain" ? "object-contain p-1.5" : "object-cover"} transition-[opacity,filter,transform] duration-[1400ms] ease-suave ${
                visible ? "scale-100 opacity-100 blur-0" : i === activa ? "opacity-0 blur-md" : "scale-[1.06] opacity-0"
              }`}
            />
          );
        })
      ) : (
        <div
          role="img"
          aria-label={nombre}
          className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(ellipse_at_30%_20%,rgb(var(--crema)/0.7),transparent_60%)] p-3 text-center"
        >
          <span className={`font-light uppercase tracking-marca text-tinta/60 ${tamTexto}`}>{nombre}</span>
        </div>
      )}
      {fotos.length > 1 && (
        <div aria-hidden="true" className="pointer-events-none absolute bottom-2.5 left-1/2 flex -translate-x-1/2 gap-1">
          {fotos.map((f, i) => (
            <span key={f} className={`h-[3px] rounded-full bg-crema transition-all duration-700 ease-suave ${i === activa ? "w-4 opacity-100" : "w-1.5 opacity-60"}`} />
          ))}
        </div>
      )}
    </div>
  );
}
