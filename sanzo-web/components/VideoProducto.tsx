"use client";

import { useEffect, useRef } from "react";

/** Tapa del video: el .jpg con el mismo nombre que el .mp4. */
export const tapaDe = (video: string) => video.replace(/\.mp4$/, ".jpg");

/**
 * Video vertical de cómo viene, como última "foto" de una galería.
 * Mientras no le toca (`activo` en false) no se baja: solo se ve la tapa. Cuando le toca, arranca solo,
 * sin sonido y en loop. Con `controles` (en la vista grande) se puede pausar y subir el sonido.
 */
export function VideoProducto({
  src,
  activo,
  controles = false,
  ajuste = "cover",
  className = "",
}: {
  src: string;
  activo: boolean;
  controles?: boolean;
  ajuste?: "cover" | "contain";
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (activo) {
      v.play().catch(() => {}); // si el navegador no deja, queda la tapa con el botón de play
    } else {
      v.pause();
    }
  }, [activo]);

  return (
    <video
      ref={ref}
      src={src}
      poster={tapaDe(src)}
      muted={!controles}
      loop
      playsInline
      controls={controles}
      preload={activo ? "auto" : "none"}
      aria-label="Video: así llega el pedido"
      className={`h-full w-full ${ajuste === "contain" ? "object-contain" : "object-cover"} ${className}`}
    />
  );
}
