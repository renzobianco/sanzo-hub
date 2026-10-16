"use client";

import { useState } from "react";
import type { Producto } from "@/data/products";
import { formatearPrecio } from "@/lib/formato";
import { AgregarAlCarrito } from "./AgregarAlCarrito";
import { ImagenProducto } from "./ImagenProducto";

/** Tarjeta de producto suelto. Si la opción es de color, al elegirlo se muestra la foto de ese color. */
export function TarjetaProducto({ producto, desfase = 0 }: { producto: Producto; desfase?: number }) {
  const [valor, setValor] = useState("");
  const fija = valor ? producto.opcion?.fotos?.[valor] : undefined;

  return (
    <>
      <div className="overflow-hidden rounded-[0.9rem] transition-[transform,box-shadow] duration-700 ease-suave md:group-hover:-translate-y-1.5 md:group-hover:shadow-[0_22px_40px_-22px_rgb(var(--tinta)/0.45)]">
        <ImagenProducto
          srcs={producto.imagenes}
          desfase={desfase}
          fija={fija}
          nombre={valor ? `${producto.nombre} ${valor}` : producto.nombre}
          sizes="(min-width: 768px) 25vw, 50vw"
        />
      </div>
      <div className="mt-4 flex flex-1 flex-col">
        <h3 className="text-[15px] uppercase tracking-[0.16em]">{producto.nombre}</h3>
        {producto.precio !== null && <p className="mt-1 text-sm text-tinta/75">{formatearPrecio(producto.precio)}</p>}
        <div className="mt-auto pt-4">
          <AgregarAlCarrito producto={producto} onSeleccion={setValor} />
        </div>
      </div>
    </>
  );
}
