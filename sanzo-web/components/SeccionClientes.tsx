"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { clientes } from "@/data/products";

/**
 * "+150 clientes satisfechos · y sumando" + tira tipo reels (fotos/videos de clientes) que corre sola de izquierda a derecha
 * usando los productos. Mientras no haya video, se ve la foto con un zoom lento.
 */
export function SeccionClientes() {
  const ref = useRef<HTMLElement>(null);
  // La tira solo se mueve mientras se ve: fuera de pantalla no gasta (scroll más fluido).
  const [enPantalla, setEnPantalla] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return setEnPantalla(true);
    const io = new IntersectionObserver(([e]) => setEnPantalla(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);
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
    <section ref={ref} id="clientes" aria-label={`Más de ${clientes.numero} ${clientes.texto}`} className="overflow-hidden bg-lino py-20 md:py-28">
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
        // Tira sin fin que corre de izquierda a derecha (contenido duplicado para que no tenga corte).
        // Se frena mientras la tocás; con "reducir movimiento" queda quieta y se desliza a mano.
        <div className="sin-scrollbar mt-12 overflow-hidden motion-reduce:overflow-x-auto md:mt-16">
          <ul
            className={`flex w-max animate-cinta-derecha gap-3${enPantalla ? "" : " [animation-play-state:paused]"} px-1.5 pb-6 hover:[animation-play-state:paused] active:[animation-play-state:paused] motion-reduce:animate-none md:gap-4`}
          >
            {[...clientes.videos, ...clientes.videos].map((v, i) => {
              const copia = i >= clientes.videos.length;
              return (
                <li key={v.foto + i} aria-hidden={copia} className={`w-[9.5rem] shrink-0 md:w-[13rem] ${i % 2 ? "translate-y-5" : ""}`}>
                  <Reel {...v} />
                </li>
              );
            })}
          </ul>
        </div>
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
    <figure className="relative aspect-[9/16] overflow-hidden rounded-[1.25rem] bg-lino shadow-[0_18px_40px_-18px_rgb(var(--tinta)/0.45)]">
      {video ? (
        <video ref={ref} src={video} poster={foto} muted loop playsInline preload="metadata" className="h-full w-full object-cover" />
      ) : (
        <Image src={foto} alt="" fill sizes="(min-width: 768px) 13rem, 9.5rem" className="object-cover" />
      )}
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-tinta/55 to-transparent" />
      {perro && <figcaption className="absolute bottom-4 left-4 text-[11px] uppercase tracking-marca text-crema">{perro}</figcaption>}
    </figure>
  );
}
