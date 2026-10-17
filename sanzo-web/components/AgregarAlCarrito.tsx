"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import type { Producto } from "@/data/products";
import { esPersonalizable, type Personalizacion } from "@/lib/personalizacion";
import { useCarrito } from "./carrito/CarritoProvider";
import { Personalizar } from "./personalizar/Personalizar";

interface Props {
  producto: Producto;
  etiqueta?: string;
  /** Después de agregar, ir directo a /checkout en lugar de abrir el carrito. */
  irAlCheckout?: boolean;
  grande?: boolean;
  /** Algo a la derecha del título de la opción (ej. link a la guía de talles). */
  extraOpcion?: React.ReactNode;
  /** Avisa qué valor eligió (ej. para mostrar la foto de ese color). */
  onSeleccion?: (valor: string) => void;
  /** Ficha del kit: talle en una sola línea, botón de comprar y "Personalizalo" como link debajo. */
  compacto?: boolean;
}

export function AgregarAlCarrito({ producto, etiqueta = "Agregar", irAlCheckout, grande, extraOpcion, onSeleccion, compacto }: Props) {
  const { agregar } = useCarrito();
  const router = useRouter();
  const [seleccion, setSeleccion] = useState<string>("");
  const [aviso, setAviso] = useState("");
  const [personalizacion, setPersonalizacion] = useState<Personalizacion>();
  const id = useId();

  const sinPrecio = producto.precio === null;
  const deshabilitado = sinPrecio || !producto.disponible;
  const opcion = producto.opcion;

  function onAgregar() {
    if (deshabilitado) return;
    if (opcion && !seleccion) {
      setAviso(`Elegí un ${opcion.nombre.toLowerCase()}.`);
      return;
    }
    setAviso("");
    agregar(producto.id, seleccion || undefined, { abrir: !irAlCheckout, personalizacion });
    if (irAlCheckout) router.push("/checkout");
  }

  let texto = etiqueta;
  if (!producto.disponible) texto = "Sin unidades por ahora";

  const aviso_ = (
    <p id={`${id}-aviso`} role="status" className="min-h-0 text-sm text-marron empty:hidden">
      {aviso}
    </p>
  );

  if (compacto) {
    return (
      <div className="space-y-4">
        {opcion && (
          <fieldset disabled={deshabilitado} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <legend className="eyebrow float-left">{opcion.nombre}</legend>
              <div className="flex gap-2">
                {opcion.valores.map((v) => (
                  <label key={v} className="cursor-pointer">
                    <input
                      type="radio"
                      name={`opcion-${id}`}
                      value={v}
                      checked={seleccion === v}
                      onChange={() => {
                        setSeleccion(v);
                        onSeleccion?.(v);
                        setAviso("");
                      }}
                      className="peer sr-only"
                    />
                    <span className="flex h-11 min-w-[2.9rem] items-center justify-center border border-tinta/30 px-3 text-sm uppercase tracking-[0.12em] transition-colors peer-checked:border-tinta peer-checked:bg-tinta peer-checked:text-crema peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-marron">
                      {v}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            {extraOpcion}
          </fieldset>
        )}
        <button
          type="button"
          onClick={onAgregar}
          disabled={deshabilitado}
          className="btn-primario w-full py-[1.1rem] text-sm"
          aria-describedby={aviso ? `${id}-aviso` : undefined}
        >
          {texto}
        </button>
        {aviso_}
        {esPersonalizable(producto) && <Personalizar producto={producto} valor={personalizacion} onCambio={setPersonalizacion} grande comoLink />}
      </div>
    );
  }

  return (
    <div className={grande ? "space-y-6" : "space-y-3"}>
      {opcion && (
        <fieldset disabled={deshabilitado}>
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <legend className="eyebrow float-left">
              {opcion.nombre}
              {seleccion && <span className="ml-2 text-tinta">{seleccion}</span>}
            </legend>
            {extraOpcion}
          </div>
          <div className="clear-both flex flex-wrap gap-2">
            {opcion.valores.map((v) => (
              <label key={v} className="cursor-pointer">
                <input
                  type="radio"
                  name={`opcion-${id}`}
                  value={v}
                  checked={seleccion === v}
                  onChange={() => {
                    setSeleccion(v);
                    onSeleccion?.(v);
                    setAviso("");
                  }}
                  className="peer sr-only"
                />
                <span
                  className={`flex items-center justify-center border border-tinta/25 uppercase tracking-[0.12em] transition-colors peer-checked:border-tinta peer-checked:bg-tinta peer-checked:text-crema peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-marron peer-disabled:cursor-not-allowed peer-disabled:opacity-40 hover:border-tinta ${
                    grande ? "h-12 min-w-[3.25rem] px-4 text-sm" : "h-9 min-w-[2.5rem] px-2.5 text-[11px]"
                  }`}
                >
                  {opcion.colores?.[v] && (
                    <span
                      aria-hidden="true"
                      className="mr-1.5 inline-block h-3 w-3 shrink-0 rounded-full ring-1 ring-tinta/20 ring-offset-1 ring-offset-transparent"
                      style={{ backgroundColor: opcion.colores[v] }}
                    />
                  )}
                  {v}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {esPersonalizable(producto) && (
        <Personalizar producto={producto} valor={personalizacion} onCambio={setPersonalizacion} grande={grande} />
      )}

      <button
        type="button"
        onClick={onAgregar}
        disabled={deshabilitado}
        className={grande ? "btn-primario w-full py-5 text-sm" : "btn-borde w-full px-3 py-2.5 text-[11px]"}
        aria-describedby={aviso ? `${id}-aviso` : undefined}
      >
        {texto}
      </button>
      {aviso_}
    </div>
  );
}
