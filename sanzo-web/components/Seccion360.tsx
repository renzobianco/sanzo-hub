"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { vista360 } from "@/data/products";
import { IconoGirar } from "./Iconos";
import { Palabras } from "./Palabras";
import { Reveal } from "./Reveal";

/**
 * Vista 360° del arnés. Se gira arrastrando (dedo o mouse).
 * - Con `cuadros` (fotos de la vuelta completa): cambia de cuadro según cuánto arrastrás.
 * - Sin cuadros: tarjeta 3D frente/espalda que sigue al dedo y al soltar se acomoda.
 * Mientras nadie la toca, se balancea apenas para invitar a girarla.
 */
export function Seccion360() {
  const { activo, eyebrow, titulo, texto, frente, espalda, cuadros } = vista360;
  const conCuadros = cuadros.length >= 8;
  const [angulo, setAngulo] = useState(0);
  const [animando, setAnimando] = useState(false);
  const tocado = useRef(false);
  const arrastre = useRef<{ x: number; inicio: number } | null>(null);
  const zona = useRef<HTMLDivElement>(null);

  // Balanceo suave hasta la primera interacción (y solo si está en pantalla).
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    let visible = false;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    if (zona.current) io.observe(zona.current);
    const t0 = performance.now();
    const paso = (t: number) => {
      if (!tocado.current && visible) setAngulo(Math.sin((t - t0) / 1100) * (conCuadros ? 40 : 22));
      if (!tocado.current) frame = requestAnimationFrame(paso);
    };
    frame = requestAnimationFrame(paso);
    return () => {
      cancelAnimationFrame(frame);
      io.disconnect();
    };
  }, [conCuadros]);

  const tomar = () => {
    tocado.current = true;
  };

  const onDown = (e: React.PointerEvent) => {
    tomar();
    setAnimando(false);
    arrastre.current = { x: e.clientX, inicio: angulo };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!arrastre.current) return;
    setAngulo(arrastre.current.inicio + (e.clientX - arrastre.current.x) * 0.6);
  };
  const soltar = useCallback(() => {
    if (!arrastre.current) return;
    arrastre.current = null;
    if (!conCuadros) {
      // Se acomoda en la cara más cercana (frente o espalda).
      setAnimando(true);
      setAngulo((a) => Math.round(a / 180) * 180);
    }
  }, [conCuadros]);

  const ir = (destino: number) => {
    tomar();
    setAnimando(true);
    setAngulo((a) => {
      // Gira por el camino más corto hasta el destino (0 frente, 180 espalda).
      const base = Math.round((a - destino) / 360) * 360;
      return base + destino;
    });
  };
  const vuelta = () => {
    tomar();
    setAnimando(true);
    setAngulo((a) => Math.round(a / 180) * 180 + 360);
  };

  if (!activo) return null;

  const norm = ((angulo % 360) + 360) % 360;
  const mostrandoEspalda = norm > 90 && norm < 270;
  const cuadro = conCuadros ? Math.round((norm / 360) * cuadros.length) % cuadros.length : 0;
  // Sombra y brillo que acompañan el giro.
  const ancho = Math.abs(Math.cos((angulo * Math.PI) / 180));

  return (
    <section id="vista-360" aria-labelledby="v360-titulo" className="overflow-hidden bg-lino py-20 md:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 md:grid-cols-[1fr_1.1fr] md:gap-16 md:px-8">
        <Reveal className="text-center md:text-left">
          <p className="eyebrow text-marron">{eyebrow}</p>
          <h2 id="v360-titulo" className="titulo-seccion mt-3">
            <Palabras texto={titulo} />
          </h2>
          <p className="mt-4 text-[16px] font-light text-tinta/80">{texto}</p>
          {!conCuadros && (
            <div className="mt-8 flex justify-center gap-2 md:justify-start">
              {[
                ["Frente", 0],
                ["Espalda", 180],
              ].map(([t, d]) => {
                const activoBoton = (d === 0) !== mostrandoEspalda;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => ir(d as number)}
                    aria-pressed={activoBoton}
                    className="h-10 rounded-full border border-tinta/25 px-5 text-[11px] uppercase tracking-marca transition-colors duration-300 aria-pressed:border-tinta aria-pressed:bg-tinta aria-pressed:text-crema"
                  >
                    {t}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={vuelta}
                className="flex h-10 items-center gap-2 rounded-full border border-tinta/25 px-5 text-[11px] uppercase tracking-marca transition-transform duration-300 active:scale-95"
              >
                <IconoGirar />
                Girar
              </button>
            </div>
          )}
        </Reveal>

        <Reveal delay={120}>
          <div
            ref={zona}
            role="img"
            aria-label={`Arnés sanzo, vista ${mostrandoEspalda ? "de espalda" : "de frente"}. Deslizá para girarlo.`}
            className="relative mx-auto aspect-square w-full max-w-md cursor-grab touch-pan-y select-none [perspective:1100px] active:cursor-grabbing"
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={soltar}
            onPointerCancel={soltar}
          >
            {conCuadros ? (
              <div className="absolute inset-0">
                {cuadros.map((src, i) => (
                  <Image
                    key={src}
                    src={src}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 28rem, 90vw"
                    priority={i === 0}
                    draggable={false}
                    className={`object-contain mix-blend-multiply ${i === cuadro ? "opacity-100" : "opacity-0"}`}
                  />
                ))}
              </div>
            ) : (
              <div
                className="absolute inset-0 [transform-style:preserve-3d]"
                style={{
                  transform: `rotateY(${angulo}deg)`,
                  transition: animando ? "transform 1s cubic-bezier(0.16, 1, 0.3, 1)" : "none",
                }}
                onTransitionEnd={() => setAnimando(false)}
              >
                {[
                  { src: frente, giro: 0 },
                  { src: espalda, giro: 180 },
                ].map((cara) => (
                  <div
                    key={cara.src}
                    className="absolute inset-0 bg-lino [backface-visibility:hidden]"
                    style={{ transform: `rotateY(${cara.giro}deg)` }}
                  >
                    <Image
                      src={cara.src}
                      alt=""
                      fill
                      sizes="(min-width: 768px) 28rem, 90vw"
                      draggable={false}
                      className="object-contain mix-blend-multiply"
                    />
                  </div>
                ))}
              </div>
            )}
            {/* Sombra en el piso: se angosta cuando el arnés queda de perfil. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute bottom-[4%] left-1/2 h-4 -translate-x-1/2 rounded-[50%] bg-tinta/15 blur-md"
              style={{ width: `${30 + 40 * (conCuadros ? 1 : ancho)}%`, transition: animando ? "width 1s cubic-bezier(0.16, 1, 0.3, 1)" : "none" }}
            />
            <p
              className={`pointer-events-none absolute bottom-0 left-1/2 flex -translate-x-1/2 items-center gap-2 text-[10px] uppercase tracking-amplio text-tinta/55 transition-opacity duration-700 ${
                tocado.current ? "opacity-0" : "opacity-100"
              }`}
            >
              <span aria-hidden="true">←</span> girá <span aria-hidden="true">→</span>
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
