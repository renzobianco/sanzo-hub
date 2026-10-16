"use client";

import { useState } from "react";
import type { Sugerencia } from "@/lib/promos";
import { formatearPrecio } from "@/lib/formato";
import { useCarrito } from "./CarritoProvider";
import { ImagenProducto } from "../ImagenProducto";

/** "Llevá más, pagá menos": la pieza que le falta al carrito para completar una promo. */
export function SugerenciasPromo() {
  const { totales } = useCarrito();
  if (totales.sugerencias.length === 0) return null;
  return (
    <div className="mb-6 bg-lino p-4">
      <p className="eyebrow text-marron">Llevá más, pagá menos</p>
      <ul className="mt-3 space-y-4">
        {totales.sugerencias.map((s) => (
          <ItemSugerencia key={s.promoId} sugerencia={s} />
        ))}
      </ul>
    </div>
  );
}

function ItemSugerencia({ sugerencia }: { sugerencia: Sugerencia }) {
  const { agregar } = useCarrito();
  const { producto, texto } = sugerencia;
  const [eligiendo, setEligiendo] = useState(false);
  const opcion = producto.opcion;

  return (
    <li className="animate-entrada">
      <div className="flex items-center gap-3">
        <ImagenProducto
          src={producto.imagenes[0]}
          nombre={producto.nombre}
          sizes="56px"
          className="w-14 shrink-0"
          tamTexto="text-[7px]"
          fondo="bg-crema"
        />
        <div className="min-w-0 flex-1">
          <p className="text-[15px]">
            {producto.nombre}
            {producto.precio !== null && <span className="ml-2 text-sm text-tinta/60">{formatearPrecio(producto.precio)}</span>}
          </p>
          <p className="text-sm text-marron">{texto}</p>
        </div>
        {!eligiendo && (
          <button
            type="button"
            onClick={() => (opcion ? setEligiendo(true) : agregar(producto.id))}
            className="btn-borde shrink-0 px-4 py-2 text-[11px]"
          >
            Sumar
          </button>
        )}
      </div>
      {eligiendo && opcion && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="eyebrow mr-1">{opcion.nombre}</span>
          {opcion.valores.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => agregar(producto.id, v)}
              className="h-9 min-w-[2.5rem] border border-tinta/25 px-2.5 text-[11px] uppercase tracking-[0.12em] transition-colors active:bg-tinta active:text-crema"
            >
              {v}
            </button>
          ))}
        </div>
      )}
    </li>
  );
}
