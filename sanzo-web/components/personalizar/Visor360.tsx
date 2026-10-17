"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { vista360 } from "@/data/products";
import { IconoGirar } from "../Iconos";

/**
 * Vista 360° del arnés, dentro de "Personalizar". Se gira arrastrando (dedo o mouse).
 * - Con `cuadros` (fotos de la vuelta completa): cambia de cuadro según cuánto arrastrás.
 * - Sin cuadros: tarjeta 3D frente/espalda que sigue al dedo y al soltar se acomoda.
 * Mientras nadie la toca, se balancea apenas para invitar a girarla.
 */
export function Visor360() {
  const { frente, espalda, cuadros } = vista360;
  const conCuadros = cuadros.length >= 8;
  const [angulo, setAngulo] = useState(0);
  const [animando, setAnimando] = useState(false);
  const [tocado, setTocado] = useState(false);
  const tocadoRef = useRef(false);
  const arrastre = useRef<{ x: number; inicio: number } | null>(null);

  // Balanceo suave hasta la primera interacción.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const t0 = performance.now();
    const paso = (t: number) => {
      if (tocadoRef.current) return;
      setAngulo(Math.sin((t - t0) / 1100) * (conCuadros ? 40 : 22));
      frame = requestAnimationFrame(paso);
    };
    frame = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(frame);
  }, [conCuadros]);

  const tomar = () => {
    tocadoRef.current = true;
    setTocado(true);
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
    // Gira por el camino más corto hasta el destino (0 frente, 180 espalda).
    setAngulo((a) => Math.round((a - destino) / 360) * 360 + destino);
  };
  const vuelta = () => {
    tomar();
    setAnimando(true);
    setAngulo((a) => Math.round(a / 180) * 180 + 360);
  };

  const norm = ((angulo % 360) + 360) % 360;
  const mostrandoEspalda = norm > 90 && norm < 270;
  const cuadro = conCuadros ? Math.round((norm / 360) * cuadros.length) % cuadros.length : 0;
  // La sombra del piso se angosta cuando el arnés queda de perfil.
  const ancho = Math.abs(Math.cos((angulo * Math.PI) / 180));
  const curva = "1s cubic-bezier(0.16, 1, 0.3, 1)";

  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden bg-lino">
      <div
        role="img"
        aria-label={`Arnés sanzo, vista ${mostrandoEspalda ? "de espalda" : "de frente"}. Deslizá para girarlo.`}
        className="absolute inset-x-0 bottom-14 top-2 cursor-grab touch-pan-y select-none [perspective:1100px] active:cursor-grabbing"
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
            style={{ transform: `rotateY(${angulo}deg)`, transition: animando ? `transform ${curva}` : "none" }}
            onTransitionEnd={() => setAnimando(false)}
          >
            {[
              { src: frente, giro: 0 },
              { src: espalda, giro: 180 },
            ].map((cara) => (
              <div key={cara.src} className="absolute inset-0 bg-lino [backface-visibility:hidden]" style={{ transform: `rotateY(${cara.giro}deg)` }}>
                <Image src={cara.src} alt="" fill sizes="(min-width: 768px) 28rem, 90vw" draggable={false} className="object-contain mix-blend-multiply" />
              </div>
            ))}
          </div>
        )}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-[2%] left-1/2 h-3 -translate-x-1/2 rounded-[50%] bg-tinta/15 blur-md"
          style={{ width: `${30 + 40 * (conCuadros ? 1 : ancho)}%`, transition: animando ? `width ${curva}` : "none" }}
        />
      </div>

      <p
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-0 bottom-14 text-center text-[10px] uppercase tracking-amplio text-tinta/55 transition-opacity duration-700 ${
          tocado ? "opacity-0" : "opacity-100"
        }`}
      >
        ← girá →
      </p>

      {!conCuadros && (
        <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
          {[
            ["Frente", 0],
            ["Espalda", 180],
          ].map(([t, d]) => (
            <button
              key={t}
              type="button"
              onClick={() => ir(d as number)}
              aria-pressed={(d === 0) !== mostrandoEspalda}
              className="h-8 rounded-full border border-tinta/25 px-3.5 text-[10px] uppercase tracking-marca transition-colors duration-300 aria-pressed:border-tinta aria-pressed:bg-tinta aria-pressed:text-crema"
            >
              {t}
            </button>
          ))}
          <button
            type="button"
            onClick={vuelta}
            className="flex h-8 items-center gap-1.5 rounded-full border border-tinta/25 px-3.5 text-[10px] uppercase tracking-marca transition-transform duration-300 active:scale-95"
          >
            <IconoGirar />
            Girar
          </button>
        </div>
      )}
    </div>
  );
}
