"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Recuadro para escribir con el dedo ("Tu letra"). Al levantar el dedo, lo dibujado se manda como imagen
 * (PNG con fondo blanco): el editor la pasa a grabado láser y la sube en alta calidad, igual que "Tu imagen".
 */
export function PadEscritura({ onListo, hayDibujo }: { onListo: (archivo: File) => void; hayDibujo: boolean }) {
  const lienzo = useRef<HTMLCanvasElement>(null);
  const dibujando = useRef(false);
  const ultimo = useRef<{ x: number; y: number } | null>(null);
  const espera = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [vacio, setVacio] = useState(!hayDibujo);

  // Resolución real del celu (nítido) y fondo blanco: lo blanco no se graba.
  useEffect(() => {
    const c = lienzo.current;
    if (!c) return;
    const r = c.getBoundingClientRect();
    const k = Math.min(3, window.devicePixelRatio || 1);
    c.width = Math.round(r.width * k);
    c.height = Math.round(r.height * k);
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.scale(k, k);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, r.width, r.height);
  }, []);

  function punto(e: React.PointerEvent<HTMLCanvasElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function trazo(a: { x: number; y: number }, b: { x: number; y: number }) {
    const ctx = lienzo.current?.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = "#251d16";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  function empezar(e: React.PointerEvent<HTMLCanvasElement>) {
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Algunos navegadores no dejan capturar: igual se dibuja.
    }
    if (espera.current) clearTimeout(espera.current);
    dibujando.current = true;
    ultimo.current = punto(e);
    trazo(ultimo.current, { x: ultimo.current.x + 0.1, y: ultimo.current.y + 0.1 });
    setVacio(false);
  }

  function seguir(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!dibujando.current || !ultimo.current) return;
    const p = punto(e);
    trazo(ultimo.current, p);
    ultimo.current = p;
  }

  // Al terminar (con una pausita, por si sigue escribiendo otra letra) se manda lo dibujado.
  function soltar() {
    if (!dibujando.current) return;
    dibujando.current = false;
    if (espera.current) clearTimeout(espera.current);
    espera.current = setTimeout(() => {
      lienzo.current?.toBlob((b) => b && onListo(new File([b], "letra.png", { type: "image/png" })), "image/png");
    }, 700);
  }

  function borrar() {
    const c = lienzo.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const r = c.getBoundingClientRect();
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, r.width, r.height);
    setVacio(true);
  }

  return (
    <div className="min-w-0 animate-entrada">
      <div className="relative w-full min-w-0">
        <canvas
          ref={lienzo}
          className="block aspect-[3/1] w-full max-w-full touch-none rounded-md border border-dashed border-tinta/40 bg-crema"
          onPointerDown={empezar}
          onPointerMove={seguir}
          onPointerUp={soltar}
          onPointerCancel={soltar}
        />
        {vacio && (
          <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-[12px] uppercase tracking-[0.12em] text-tinta/40">
            Escribí el nombre con el dedo
          </p>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between text-[12px] text-tinta/60">
        <span>Lo grabamos tal cual lo escribiste.</span>
        <button type="button" onClick={borrar} className="py-1 uppercase tracking-[0.12em] text-tinta underline underline-offset-4">
          Borrar
        </button>
      </div>
    </div>
  );
}
