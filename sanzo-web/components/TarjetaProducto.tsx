"use client";

import { useState } from "react";
import type { Producto } from "@/data/products";
import { formatearPrecio } from "@/lib/formato";
import { AgregarAlCarrito } from "./AgregarAlCarrito";
import { FichaProducto } from "./FichaProducto";
import { ImagenProducto } from "./ImagenProducto";

/**
 * Tarjeta de producto suelto. Si la opción es de color, al elegirlo se muestra la foto de ese color.
 * Tocando la foto o el nombre sube la ficha completa (`FichaProducto`).
 */
export function TarjetaProducto({ producto, desfase = 0 }: { producto: Producto; desfase?: number }) {
  const [valor, setValor] = useState("");
  const [ficha, setFicha] = useState(false);
  const fija = valor ? producto.opcion?.fotos?.[valor] : undefined;

  return (
    <>
      <div className="overflow-hidden rounded-[0.9rem] transition-[transform,box-shadow] duration-700 ease-suave md:group-hover:-translate-y-1.5 md:group-hover:shadow-[0_22px_40px_-22px_rgb(var(--tinta)/0.45)]">
        <button
          type="button"
          onClick={() => setFicha(true)}
          aria-label={`Ver ${producto.nombre}`}
          className="group/ficha relative block w-full text-left transition-transform duration-300 ease-suave active:scale-[0.98]"
        >
          <ImagenProducto
            srcs={producto.imagenes}
            desfase={desfase}
            fija={fija}
            nombre={valor ? `${producto.nombre} ${valor}` : producto.nombre}
            sizes="(min-width: 768px) 25vw, 50vw"
          />
          <span
            aria-hidden="true"
            className="absolute bottom-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-crema/85 text-tinta shadow-sm backdrop-blur-sm transition-transform duration-300 group-active/ficha:rotate-90"
          >
            <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </span>
        </button>
      </div>
      <div className="mt-4 flex flex-1 flex-col">
        <button type="button" onClick={() => setFicha(true)} className="text-left">
          <h3 className="text-[15px] uppercase tracking-[0.16em]">{producto.nombre}</h3>
          {producto.precio !== null && <p className="mt-1 text-sm text-tinta/75">{formatearPrecio(producto.precio)}</p>}
        </button>
        <div className="mt-auto pt-4">
          <AgregarAlCarrito producto={producto} onSeleccion={setValor} />
        </div>
      </div>
      <FichaProducto producto={producto} abierta={ficha} onCerrar={() => setFicha(false)} />
    </>
  );
}
