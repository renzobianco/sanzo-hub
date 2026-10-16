"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { clientes } from "@/data/products";

/** "+150 clientes satisfechos": el número cuenta hacia arriba cuando aparece en pantalla. */
export function SeccionClientes() {
  const ref = useRef<HTMLElement>(null);
  const objetivo = clientes.numero ?? 0;
  const [valor, setValor] = useState(objetivo);

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
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [objetivo]);

  if (!clientes.numero) return null;

  return (
    <section ref={ref} aria-label={`Más de ${clientes.numero} ${clientes.texto}`} className="bg-crema py-20 text-center md:py-28">
      <div className="mx-auto max-w-xl px-4">
        <ul className="flex justify-center" aria-hidden="true">
          {clientes.fotos.map((src, i) => (
            <li key={src} className={`relative h-14 w-14 overflow-hidden rounded-full border-2 border-crema ${i > 0 ? "-ml-3" : ""}`}>
              <Image src={src} alt="" fill sizes="56px" className="object-cover" />
            </li>
          ))}
        </ul>
        <p aria-hidden="true" className="mt-7 text-[4.5rem] font-extralight leading-none tracking-wide text-marron tabular-nums md:text-[6rem]">
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
        <div aria-hidden="true" className="mx-auto mt-6 h-px w-10 bg-tinta/25" />
        <p className="mt-6 text-[16px] font-light text-tinta/80">{clientes.bajada}</p>
      </div>
    </section>
  );
}
