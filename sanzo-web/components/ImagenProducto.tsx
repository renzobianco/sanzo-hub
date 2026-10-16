"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

interface Props {
  src?: string;
  /** Varias fotos: van cambiando solas con un fundido (solo mientras se ven en pantalla). */
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
  /** Cada cuánto cambia la foto (ms). */
  intervalo?: number;
  /** Corrimiento para que las tarjetas vecinas no cambien todas a la vez (ms). */
  desfase?: number;
  /** Fija una foto (ej. la del color elegido) y deja de rotar. */
  fija?: number;
}

/**
 * Foto del producto con next/image: aparece con un fundido suave al cargar, dentro de un <Reveal>
 * se "destapa" al entrar en pantalla y, si tiene varias fotos, las va rotando con un zoom lento.
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
  intervalo = 3800,
  desfase = 0,
  fija,
}: Props) {
  const fotos = (srcs && srcs.length > 0 ? srcs : src ? [src] : []).filter(Boolean);
  const [activa, setActiva] = useState(0);
  const [cargadas, setCargadas] = useState<Record<number, boolean>>({});
  const cargadasRef = useRef(cargadas);
  cargadasRef.current = cargadas;
  const [fallo, setFallo] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (fija !== undefined) {
      setActiva(Math.min(fija, fotos.length - 1));
      return;
    }
    if (!el || fotos.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer: ReturnType<typeof setInterval> | undefined;
    let arranque: ReturnType<typeof setTimeout> | undefined;
    const io = new IntersectionObserver(([e]) => {
      clearInterval(timer);
      clearTimeout(arranque);
      if (!e.isIntersecting) return;
      arranque = setTimeout(() => {
        // Solo pasa a la siguiente si ya cargó: nunca queda un cuadro vacío.
        timer = setInterval(() => setActiva((a) => (cargadasRef.current[(a + 1) % fotos.length] ? (a + 1) % fotos.length : a)), intervalo);
      }, desfase);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      clearInterval(timer);
      clearTimeout(arranque);
    };
  }, [fotos.length, intervalo, desfase, fija]);

  return (
    <div ref={ref} className={`img-revelar relative overflow-hidden ${fondo} ${aspecto} ${className}`}>
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
              className={`object-cover transition-[opacity,filter,transform] duration-[1400ms] ease-suave ${
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
