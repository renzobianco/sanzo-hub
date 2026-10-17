"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { IconoCerrar } from "./Iconos";

/**
 * Envuelve una foto: al tocarla se abre a pantalla completa con todas las fotos del producto.
 * Tocás la foto y se acerca justo donde tocaste; con el dedo apoyado la recorrés; otro toque la aleja.
 */
export function ConZoom({ fotos, nombre, inicial = 0, children }: { fotos: string[]; nombre: string; inicial?: number; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const pista = useRef<HTMLUListElement>(null);
  const [activa, setActiva] = useState(inicial);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  // Las fotos grandes se montan recién al abrir: así no se piden todas al cargar la página.
  const [abierto, setAbierto] = useState(false);
  const tocado = useRef<{ x: number; y: number; t: number } | null>(null);

  // Al abrir, arranca en la foto que se tocó.
  useEffect(() => {
    const el = pista.current;
    if (abierto && el) el.scrollLeft = inicial * el.clientWidth;
  }, [abierto, inicial]);

  if (fotos.length === 0) return <>{children}</>;

  function abrir() {
    setZoom(null);
    setActiva(inicial);
    setAbierto(true);
    document.body.style.overflow = "hidden";
    ref.current?.showModal();
  }

  // Punto tocado en % de la foto: ahí se centra el acercamiento.
  const punto = (e: React.PointerEvent) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 };
  };

  return (
    <>
      <button type="button" onClick={abrir} aria-label={`Ver de cerca: ${nombre}`} className="group/zoom relative block w-full text-left">
        {children}
        <span
          aria-hidden="true"
          className="absolute bottom-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-crema/85 text-tinta shadow-sm backdrop-blur-sm transition-transform duration-300 group-active/zoom:scale-90"
        >
          <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
            <circle cx="10.5" cy="10.5" r="6" />
            <path d="M15 15l5 5M10.5 8v5M8 10.5h5" />
          </svg>
        </span>
      </button>

      <dialog
        ref={ref}
        aria-label={`Fotos de ${nombre}`}
        onClose={() => {
          document.body.style.overflow = "";
          setAbierto(false);
        }}
        className="m-0 h-[100dvh] max-h-none w-full max-w-none overflow-hidden bg-crema p-0 text-tinta backdrop:bg-tinta/60"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-[11px] uppercase tracking-marca text-tinta/70">
              {nombre}
              {fotos.length > 1 && <span className="ml-2 tabular-nums">{activa + 1} / {fotos.length}</span>}
            </p>
            <button type="button" onClick={() => ref.current?.close()} aria-label="Cerrar" className="-mr-2 p-2">
              <IconoCerrar />
            </button>
          </div>

          <ul
            ref={pista}
            className={`sin-scrollbar flex flex-1 snap-x snap-mandatory ${zoom ? "overflow-hidden" : "overflow-x-auto"}`}
            onScroll={(e) => {
              const el = e.currentTarget;
              setActiva(Math.round(el.scrollLeft / el.clientWidth));
            }}
          >
            {abierto && fotos.map((src, i) => {
              const esta = zoom && i === activa;
              return (
                <li key={src} className="relative h-full w-full shrink-0 snap-center overflow-hidden bg-lino">
                  <div
                    className={`absolute inset-0 ${esta ? "cursor-zoom-out touch-none" : "cursor-zoom-in"}`}
                    onPointerDown={(e) => {
                      tocado.current = { x: e.clientX, y: e.clientY, t: Date.now() };
                    }}
                    onPointerMove={(e) => {
                      // Con la foto acercada, la recorrés moviendo el dedo (o el mouse).
                      if (esta && (e.buttons > 0 || e.pointerType === "mouse")) setZoom(punto(e));
                    }}
                    onPointerUp={(e) => {
                      const t = tocado.current;
                      tocado.current = null;
                      // Solo cuenta como toque si casi no se movió (si no, era para deslizar).
                      if (!t || Math.hypot(e.clientX - t.x, e.clientY - t.y) > 10) return;
                      setZoom(esta ? null : punto(e));
                    }}
                  >
                    <Image
                      src={src}
                      alt={`${nombre}, foto ${i + 1}`}
                      fill
                      sizes="100vw"
                      draggable={false}
                      className="select-none object-contain transition-transform duration-500 ease-suave"
                      style={{
                        transform: esta ? "scale(2.5)" : "scale(1)",
                        transformOrigin: esta ? `${zoom.x}% ${zoom.y}%` : "50% 50%",
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>

          <p className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 text-center text-[11px] uppercase tracking-amplio text-tinta/55">
            {zoom ? "Mové el dedo para recorrerla · tocá para alejar" : "Tocá la foto para verla de cerca"}
          </p>
        </div>
      </dialog>
    </>
  );
}
