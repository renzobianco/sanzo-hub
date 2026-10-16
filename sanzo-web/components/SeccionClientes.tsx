"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { clientes } from "@/data/products";
import { CarruselVivo } from "./CarruselVivo";
import { Reveal } from "./Reveal";

/**
 * "+150 clientes satisfechos · y sumando" + carrusel vertical tipo reels con videos de clientes
 * usando los productos. Mientras no haya video, se ve la foto con un zoom lento.
 */
export function SeccionClientes() {
  const ref = useRef<HTMLElement>(null);
  const objetivo = clientes.numero ?? 0;
  const [valor, setValor] = useState(objetivo);

  // El número cuenta hacia arriba la primera vez que aparece en pantalla.
  useEffect(() => {
    const el = ref.current;
    if (!el || !objetivo || !("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setValor(0);
    let frame = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const inicio = performance.now();
        const paso = (t: number) => {
          const p = Math.min(1, (t - inicio) / 1600);
          setValor(Math.round(objetivo * (1 - Math.pow(1 - p, 3))));
          if (p < 1) frame = requestAnimationFrame(paso);
        };
        frame = requestAnimationFrame(paso);
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [objetivo]);

  if (!clientes.numero) return null;

  return (
    <section ref={ref} id="clientes" aria-label={`Más de ${clientes.numero} ${clientes.texto}`} className="overflow-hidden bg-crema py-20 md:py-28">
      <div className="mx-auto max-w-xl px-4 text-center">
        <p aria-hidden="true" className="text-[4.5rem] font-extralight leading-none tracking-wide text-marron tabular-nums md:text-[7rem]">
          +{valor}
        </p>
        <p className="mt-3 text-[13px] uppercase tracking-amplio">{clientes.texto}</p>
        {clientes.sumando && (
          <p
            className={`mt-3 flex items-center justify-center gap-2 text-[12px] uppercase tracking-amplio text-tinta/70 transition-all duration-700 ${
              valor === objetivo ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-marron/60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-marron" />
            </span>
            {clientes.sumando}
          </p>
        )}
        <p className="mt-6 text-[16px] font-light text-tinta/80">{clientes.bajada}</p>
      </div>

      {clientes.videos.length > 0 && (
        <CarruselVivo className="sin-scrollbar mt-12 flex snap-x snap-mandatory gap-3 overflow-x-auto px-[19%] md:mx-auto md:mt-16 md:grid md:max-w-7xl md:grid-cols-6 md:gap-4 md:overflow-visible md:px-8">
          {clientes.videos.map((v, i) => (
            <li key={v.foto + i} className={`w-[62%] shrink-0 snap-center will-change-transform sm:w-[38%] md:w-auto ${i % 2 ? "md:translate-y-8" : ""}`}>
              <Reveal delay={Math.min(i, 4) * 80}>
                <Reel {...v} />
              </Reveal>
            </li>
          ))}
        </CarruselVivo>
      )}
    </section>
  );
}

/** Tarjeta vertical: video que se reproduce solo cuando está en pantalla, o foto con zoom lento. */
function Reel({ video, foto, perro }: { video: string; foto: string; perro: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()), { threshold: 0.5 });
    io.observe(v);
    return () => io.disconnect();
  }, []);

  return (
    <figure className="img-revelar relative aspect-[9/16] overflow-hidden rounded-[1.25rem] bg-lino shadow-[0_18px_40px_-18px_rgb(var(--tinta)/0.45)]">
      {video ? (
        <video ref={ref} src={video} poster={foto} muted loop playsInline preload="metadata" className="h-full w-full object-cover" />
      ) : (
        <Image src={foto} alt="" fill sizes="(min-width: 768px) 18rem, 62vw" className="animate-respirar object-cover" />
      )}
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-tinta/55 to-transparent" />
      {perro && <figcaption className="absolute bottom-4 left-4 text-[11px] uppercase tracking-marca text-crema">{perro}</figcaption>}
    </figure>
  );
}
