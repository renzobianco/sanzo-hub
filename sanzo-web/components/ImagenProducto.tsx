"use client";

import Image from "next/image";
import { useState } from "react";

interface Props {
  src?: string;
  /** Segunda foto que aparece al pasar el mouse (si existe). */
  srcHover?: string;
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
}

/**
 * Foto del producto con next/image: aparece con un fundido suave al cargar y, dentro de un
 * <Reveal>, se "destapa" al entrar en pantalla. Si no hay foto o falla, placeholder con el nombre.
 */
export function ImagenProducto({
  src,
  srcHover,
  nombre,
  sizes,
  priority,
  aspecto = "aspect-[4/5]",
  className = "",
  tamTexto = "text-sm md:text-base",
  fondo = "bg-lino",
}: Props) {
  const [cargada, setCargada] = useState(false);
  const [fallo, setFallo] = useState(false);

  return (
    <div className={`img-revelar relative overflow-hidden ${fondo} ${aspecto} ${className}`}>
      {src && !fallo ? (
        <>
          <Image
            src={src}
            alt={nombre}
            fill
            sizes={sizes}
            priority={priority}
            onLoad={() => setCargada(true)}
            onError={() => setFallo(true)}
            className={`object-cover transition-[opacity,filter] duration-700 ${cargada ? "opacity-100 blur-0" : "opacity-0 blur-md"} ${
              srcHover ? "group-hover:opacity-0" : ""
            }`}
          />
          {srcHover && (
            <Image
              src={srcHover}
              alt=""
              fill
              sizes={sizes}
              className="object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100"
            />
          )}
        </>
      ) : (
        <div
          role="img"
          aria-label={nombre}
          className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(ellipse_at_30%_20%,rgb(var(--crema)/0.7),transparent_60%)] p-3 text-center"
        >
          <span className={`font-light uppercase tracking-marca text-tinta/60 ${tamTexto}`}>{nombre}</span>
        </div>
      )}
    </div>
  );
}
