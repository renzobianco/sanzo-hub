"use client";

import Image from "next/image";
import { Fragment, useEffect, useRef, useState } from "react";
import type { Producto } from "@/data/products";
import { formatearPrecio } from "@/lib/formato";
import { AgregarAlCarrito } from "./AgregarAlCarrito";
import { useCarrito } from "./carrito/CarritoProvider";
import { ConZoom } from "./ConZoom";
import { IconoCerrar } from "./Iconos";
import { MiniPiezas } from "./MiniPiezas";

const DURACION = 450;

/**
 * Ficha de un producto en una hoja que sube desde abajo: fotos grandes que se deslizan
 * (tocás una y se abre el zoom), descripción, pros y para agregarlo.
 * Se cierra con la X, tocando afuera, con Escape o arrastrándola hacia abajo.
 */
export function FichaProducto({
  producto,
  abierta,
  onCerrar,
}: {
  producto: Producto;
  abierta: boolean;
  onCerrar: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const { abierto: carritoAbierto } = useCarrito();
  const [arriba, setArriba] = useState(false); // la hoja ya subió
  const [foto, setFoto] = useState(0);
  const [arrastre, setArrastre] = useState(0);
  const inicio = useRef<number | null>(null);

  // Abrir: se monta el dialog y en el cuadro siguiente sube (así se ve la transición).
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (abierta && !d.open) {
      d.showModal();
      document.body.style.overflow = "hidden";
      requestAnimationFrame(() => requestAnimationFrame(() => setArriba(true)));
    }
  }, [abierta]);

  function cerrar() {
    setArriba(false);
    setArrastre(0);
    const reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.setTimeout(() => {
      ref.current?.close();
    }, reducir ? 0 : DURACION);
  }

  // Al agregar se abre el carrito: la hoja se va para dejarlo ver.
  useEffect(() => {
    if (carritoAbierto && abierta) cerrar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carritoAbierto]);

  const fotos = producto.imagenes;

  return (
    <dialog
      ref={ref}
      aria-label={producto.nombre}
      onCancel={(e) => {
        e.preventDefault();
        cerrar();
      }}
      onClose={() => {
        document.body.style.overflow = "";
        setFoto(0);
        onCerrar();
      }}
      onClick={(e) => {
        // Toque en el fondo (fuera de la hoja).
        if (e.target === e.currentTarget) cerrar();
      }}
      className={`m-0 mt-auto h-auto max-h-[92dvh] w-full max-w-none overflow-hidden rounded-t-[1.4rem] bg-crema p-0 text-tinta backdrop:transition-colors backdrop:duration-500 md:mx-auto md:mb-8 md:max-w-lg md:rounded-[1.4rem] ${
        arriba ? "backdrop:bg-tinta/55" : "backdrop:bg-tinta/0"
      }`}
      style={{
        transform: arriba ? `translateY(${arrastre}px)` : "translateY(100%)",
        transition: inicio.current !== null ? "none" : `transform ${DURACION}ms cubic-bezier(0.16, 1, 0.3, 1)`,
      }}
    >
      {abierta && (
        <div className="flex max-h-[92dvh] flex-col">
          {/* Agarradera: se arrastra hacia abajo para cerrar. */}
          <div
            className="relative flex h-11 shrink-0 touch-none justify-center pt-3"
            onPointerDown={(e) => {
              inicio.current = e.clientY;
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (inicio.current === null) return;
              setArrastre(Math.max(0, e.clientY - inicio.current));
            }}
            onPointerUp={() => {
              const lejos = arrastre > 110;
              inicio.current = null;
              if (lejos) cerrar();
              else setArrastre(0);
            }}
          >
            <span aria-hidden="true" className="h-1 w-10 rounded-full bg-tinta/20" />
            <button type="button" onClick={cerrar} aria-label="Cerrar" className="absolute right-2 top-0.5 p-2.5">
              <IconoCerrar width={20} height={20} />
            </button>
          </div>

          <div className="overflow-y-auto overscroll-contain pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            {/* Fotos que se deslizan, con puntitos. */}
            {fotos.length > 0 && (
              <div className="relative">
                <ul
                  className="sin-scrollbar flex snap-x snap-mandatory overflow-x-auto"
                  onScroll={(e) => {
                    const el = e.currentTarget;
                    setFoto(Math.round(el.scrollLeft / el.clientWidth));
                  }}
                >
                  {fotos.map((src, i) => (
                    <li key={src} className="w-full shrink-0 snap-center px-4">
                      <ConZoom fotos={fotos} nombre={producto.nombre} inicial={i}>
                        <div className="relative aspect-square overflow-hidden rounded-[1rem] bg-lino">
                          <Image
                            src={src}
                            alt={`${producto.nombre}, foto ${i + 1}`}
                            fill
                            sizes="(min-width: 768px) 32rem, 100vw"
                            className={`object-cover transition-transform duration-[1.2s] ease-suave ${arriba ? "scale-100" : "scale-[1.06]"}`}
                          />
                        </div>
                      </ConZoom>
                    </li>
                  ))}
                </ul>
                {fotos.length > 1 && (
                  <div className="mt-3 flex justify-center gap-1.5" aria-hidden="true">
                    {fotos.map((src, i) => (
                      <span key={src} className={`h-[3px] rounded-full transition-all duration-500 ${i === foto ? "w-6 bg-tinta" : "w-2.5 bg-tinta/25"}`} />
                    ))}
                  </div>
                )}
              </div>
            )}

            <div
              className={`px-5 pt-5 transition-[opacity,transform] delay-150 duration-700 ease-suave ${
                arriba ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
              }`}
            >
              <h2 className="text-2xl font-light uppercase tracking-marca">{producto.nombre}</h2>
              {producto.precio !== null && <p className="mt-1.5 text-xl font-light tracking-wide">{formatearPrecio(producto.precio)}</p>}
              {producto.descripcion && <p className="mt-3 text-[15px] text-tinta/75">{producto.descripcion}</p>}

              {producto.incluye.length > 0 && (
                <div className="mt-5">
                  <MiniPiezas incluye={producto.incluye} columnas="grid-cols-3" />
                </div>
              )}

              {producto.pros && producto.pros.length > 0 && (
                <ul className="mt-5 space-y-2.5">
                  {producto.pros.map((pro) => (
                    <li key={pro} className="flex gap-3 text-[14px] text-tinta/85">
                      <span aria-hidden="true" className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full bg-marron" />
                      {pro}
                    </li>
                  ))}
                </ul>
              )}

              {producto.medidas && producto.medidas.length > 0 && (
                <div className="mt-6">
                  <p className="eyebrow">Medidas</p>
                  <ul className="mt-2 divide-y divide-tinta/10 border-y border-tinta/10">
                    {producto.medidas.map((m, i) => (
                      <li
                        key={m.talle ?? m.texto}
                        className={`flex items-baseline gap-3 py-2.5 text-[14px] text-tinta/85 transition-[opacity,transform] duration-700 ease-suave ${
                          arriba ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
                        }`}
                        style={{ transitionDelay: `${300 + i * 90}ms` }}
                      >
                        {m.talle && (
                          <span className="flex h-6 min-w-[1.5rem] shrink-0 items-center justify-center border border-tinta/30 px-1.5 text-[11px] uppercase">
                            {m.talle}
                          </span>
                        )}
                        {/* Cada medida entera en su renglón ("Tira de 2 cm" no se corta). */}
                        <span>
                          {m.texto.split(" · ").map((parte, j) => (
                            <Fragment key={parte}>
                              {j > 0 && <span className="text-tinta/35"> · </span>}
                              <span className="whitespace-nowrap">{parte}</span>
                            </Fragment>
                          ))}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {producto.guiaTalle && (
                    <div className="mt-3 flex gap-3 rounded-[0.8rem] bg-lino p-3.5 text-[13px] leading-relaxed text-tinta/80">
                      <svg aria-hidden="true" viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" className="mt-0.5 shrink-0 text-marron">
                        <rect x="2.5" y="8" width="19" height="8" rx="1.5" />
                        <path d="M6.5 8v3M10 8v2M13.5 8v3M17 8v2" />
                      </svg>
                      <p>{producto.guiaTalle}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6">
                <AgregarAlCarrito producto={producto} grande />
              </div>
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
}
