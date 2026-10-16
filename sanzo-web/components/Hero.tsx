"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { sitio } from "@/data/products";
import { Palabras } from "./Palabras";

/**
 * Portada con parallax tipo Apple: al scrollear, la foto baja más lento y se agranda apenas,
 * y el texto sube y se desvanece. Se maneja con una variable CSS (--p, de 0 a 1).
 */
export function Hero() {
  const { titulo, subtitulo, boton, imagen } = sitio.hero;
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const actualizar = () => {
      frame = 0;
      const p = Math.min(1, Math.max(0, window.scrollY / el.offsetHeight));
      el.style.setProperty("--p", p.toFixed(4));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(actualizar);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    actualizar();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section ref={ref} className="relative flex h-[82svh] min-h-[30rem] items-end overflow-hidden bg-topo text-crema [--p:0]">
      <div
        className="absolute inset-0 will-change-transform"
        style={{ transform: "translate3d(0, calc(var(--p) * 22%), 0) scale(calc(1 + var(--p) * 0.12))" }}
      >
        {imagen ? (
          <Image src={imagen} alt="" fill priority sizes="100vw" className="animate-zoom-lento object-cover object-[50%_30%]" />
        ) : (
          // Placeholder: luz cálida tipo lino al sol, hasta que se cargue la foto.
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_75%_15%,rgb(var(--lino)/0.55),transparent_60%),radial-gradient(ellipse_70%_70%_at_10%_90%,rgb(var(--marron)/0.75),transparent_70%),linear-gradient(160deg,rgb(var(--topo)),rgb(var(--marron)))]"
          />
        )}
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-tinta/80 via-tinta/20 to-transparent"
        style={{ opacity: "calc(1 + var(--p) * 0.4)" }}
      />

      <div
        className="relative mx-auto w-full max-w-7xl px-4 pb-16 text-center will-change-transform md:px-8 md:pb-24"
        style={{ transform: "translate3d(0, calc(var(--p) * -90px), 0)", opacity: "calc(1 - var(--p) * 1.6)" }}
      >
        <h1 className="text-[2.15rem] font-light uppercase leading-[1.15] tracking-marca sm:text-5xl md:text-7xl">
          <Palabras texto={titulo} alCargar retraso={150} />
        </h1>
        <p className="mx-auto mt-4 max-w-md animate-entrada text-base font-light text-crema/90 [animation-delay:600ms] md:text-lg">
          {subtitulo}
        </p>
        <a href="#kit" className="btn-claro mt-8 animate-entrada [animation-delay:750ms]">
          {boton}
        </a>
      </div>

      {/* Indicador de scroll: una línea que baja. */}
      <span aria-hidden="true" className="absolute bottom-0 left-1/2 h-10 w-px -translate-x-1/2 overflow-hidden">
        <span className="block h-full w-full animate-bajar bg-crema/70" />
      </span>
    </section>
  );
}
