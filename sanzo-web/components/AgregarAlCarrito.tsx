"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import type { Producto } from "@/data/products";
import { armarOpcion, piezasConColor } from "@/lib/combos";
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
  /** Combos con piezas de color: avisa los colores elegidos y qué pieza cambió (para mostrarla en la foto). */
  onColores?: (colores: Record<string, string>, pieza: string) => void;
  /** Ficha del kit: talle en una sola línea, botón de comprar y "Personalizalo" como link debajo. */
  compacto?: boolean;
}

/** Botones de una opción (talle o color), con muestra de color si la tiene. */
function Botones({
  nombre,
  valores,
  colores,
  elegido,
  onElegir,
  grande,
}: {
  nombre: string;
  valores: string[];
  colores?: Record<string, string>;
  elegido: string;
  onElegir: (v: string) => void;
  grande?: boolean;
}) {
  return (
    <div className="clear-both flex flex-wrap gap-2">
      {valores.map((v) => (
        <label key={v} className="cursor-pointer">
          <input type="radio" name={nombre} value={v} checked={elegido === v} onChange={() => onElegir(v)} className="peer sr-only" />
          <span
            className={`flex items-center justify-center border border-tinta/25 uppercase tracking-[0.12em] transition-colors peer-checked:border-tinta peer-checked:bg-tinta peer-checked:text-crema peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-marron peer-disabled:cursor-not-allowed peer-disabled:opacity-40 hover:border-tinta ${
              grande ? "h-12 min-w-[3.25rem] px-4 text-sm" : "h-9 min-w-[2.5rem] px-2.5 text-[11px]"
            }`}
          >
            {colores?.[v] && (
              <span
                aria-hidden="true"
                className="mr-1.5 inline-block h-3 w-3 shrink-0 rounded-full ring-1 ring-tinta/20 ring-offset-1 ring-offset-transparent"
                style={{ backgroundColor: colores[v] }}
              />
            )}
            {v}
          </span>
        </label>
      ))}
    </div>
  );
}

export function AgregarAlCarrito({ producto, etiqueta = "Agregar", irAlCheckout, grande, extraOpcion, onSeleccion, onColores, compacto }: Props) {
  const { agregar } = useCarrito();
  const router = useRouter();
  const [seleccion, setSeleccion] = useState<string>("");
  // Combos con piezas de color (ej. gorra + piluso): un color por pieza.
  const [colores, setColores] = useState<Record<string, string>>({});
  const [aviso, setAviso] = useState("");
  const [personalizacion, setPersonalizacion] = useState<Personalizacion>();
  const id = useId();

  const sinPrecio = producto.precio === null;
  const deshabilitado = sinPrecio || !producto.disponible;
  const opcion = producto.opcion;
  const conColor = piezasConColor(producto);

  function onAgregar() {
    if (deshabilitado) return;
    if (opcion && !seleccion) {
      setAviso(`Elegí un ${opcion.nombre.toLowerCase()}.`);
      return;
    }
    const falta = conColor.find((p) => !colores[p.id]);
    if (falta) {
      setAviso(`Falta elegir el color: ${falta.nombre.toLowerCase()}.`);
      return;
    }
    setAviso("");
    const valor = conColor.length ? armarOpcion(producto, seleccion, colores) : seleccion;
    agregar(producto.id, valor || undefined, { abrir: !irAlCheckout, personalizacion });
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
          <Botones
            nombre={`opcion-${id}`}
            valores={opcion.valores}
            colores={opcion.colores}
            elegido={seleccion}
            grande={grande}
            onElegir={(v) => {
              setSeleccion(v);
              onSeleccion?.(v);
              setAviso("");
            }}
          />
        </fieldset>
      )}

      {/* Un renglón por pieza: "Gorra · Beige | Océano", "Piluso · Granate | Jade". */}
      {conColor.map((p) => (
        <fieldset key={p.id} disabled={deshabilitado}>
          <legend className="eyebrow mb-2">
            {p.nombre}
            {colores[p.id] && <span className="ml-2 text-tinta">{colores[p.id]}</span>}
          </legend>
          <Botones
            nombre={`color-${p.id}-${id}`}
            valores={p.opcion!.valores}
            colores={p.opcion!.colores}
            elegido={colores[p.id] ?? ""}
            grande={grande}
            onElegir={(v) => {
              const nuevos = { ...colores, [p.id]: v };
              setColores(nuevos);
              onColores?.(nuevos, p.id);
              setAviso("");
            }}
          />
        </fieldset>
      ))}

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
