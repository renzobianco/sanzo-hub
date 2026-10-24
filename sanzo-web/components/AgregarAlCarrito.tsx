"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import type { Producto } from "@/data/products";
import { armarOpcion, piezasConColor } from "@/lib/combos";
import { llevaChapita } from "@/lib/chapita";
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
  /**
   * Qué tan llamativo es el botón de comprar/agregar: "fuerte" (relleno marrón, el kit),
   * "medio" (borde marrón, los combos) o el estándar (borde tinta, el resto). Solo cambia el color.
   */
  acento?: "fuerte" | "medio";
}


const ORDEN_TALLES = ["XS", "S", "M", "L", "XL"];

/** Los elegibles y los agotados juntos, en orden de talle (S, M, L…). */
export function valoresConAgotados(valores: string[], agotados: string[] = []) {
  const todos = [...valores, ...agotados.filter((a) => !valores.includes(a))];
  const pos = (v: string) => (ORDEN_TALLES.includes(v) ? ORDEN_TALLES.indexOf(v) : 99);
  return todos.sort((a, b) => pos(a) - pos(b));
}

/** Talle agotado: el mismo cuadrito, más clarito, sin poder tocarlo (opción 1 de Santi). */
export function Agotado({ valor, clase }: { valor: string; clase: string }) {
  return (
    <span
      aria-label={`${valor}, agotado`}
      title="Agotado"
      className={`flex cursor-not-allowed select-none items-center justify-center border border-tinta/10 uppercase tracking-[0.12em] text-tinta/25 ${clase}`}
    >
      {valor}
    </span>
  );
}

/** Botones de una opción (talle o color), con muestra de color si la tiene. */
function Botones({
  nombre,
  valores,
  colores,
  elegido,
  onElegir,
  grande,
  agotados,
}: {
  nombre: string;
  valores: string[];
  agotados?: string[];
  colores?: Record<string, string>;
  elegido: string;
  onElegir: (v: string) => void;
  grande?: boolean;
}) {
  return (
    <div className="clear-both flex flex-wrap gap-2">
      {valoresConAgotados(valores, agotados).map((v) =>
        !valores.includes(v) ? (
          <Agotado key={v} valor={v} clase={grande ? "h-12 min-w-[3.25rem] px-4 text-sm" : "h-9 min-w-[2.5rem] px-2.5 text-[11px]"} />
        ) : (
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
        ),
      )}
    </div>
  );
}

export function AgregarAlCarrito({ producto, etiqueta = "Agregar", irAlCheckout, grande, extraOpcion, onSeleccion, onColores, compacto, acento }: Props) {
  const { agregar, abrir: abrirCarrito, ofrecerChapita, pedirGrabado } = useCarrito();
  const router = useRouter();
  const [seleccion, setSeleccion] = useState<string>("");
  // Combos con piezas de color (ej. gorra + piluso): un color por pieza.
  const [colores, setColores] = useState<Record<string, string>>({});
  // Gorra / piluso: talle además del color.
  const [talle, setTalle] = useState("");
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
    if (producto.opcionTalle && !talle) {
      setAviso("Elegí un talle.");
      return;
    }
    const falta = conColor.find((p) => !colores[p.id]);
    if (falta) {
      setAviso(`Falta elegir el color: ${falta.nombre.toLowerCase()}.`);
      return;
    }
    setAviso("");
    const valor = conColor.length ? armarOpcion(producto, seleccion, colores) : producto.opcionTalle ? `${seleccion} · ${talle}` : seleccion;
    const seguir = () => (irAlCheckout ? router.push("/checkout") : abrirCarrito());
    // Combo que trae chapita: primero se elige el grabado, y va en la opción ("M · Corazón · Coco").
    if (llevaChapita(producto)) {
      pedirGrabado((grabado) => {
        agregar(producto.id, `${valor} · ${grabado}`, { abrir: false });
        seguir();
      });
      return;
    }
    agregar(producto.id, valor || undefined, { abrir: false, personalizacion });
    // Antes de seguir (carrito o checkout) le ofrecemos la chapita personalizada.
    ofrecerChapita(seguir);
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
                {valoresConAgotados(opcion.valores, opcion.agotados).map((v) =>
                  !opcion.valores.includes(v) ? (
                    <Agotado key={v} valor={v} clase="h-11 min-w-[2.9rem] px-3 text-sm" />
                  ) : (
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
                  ),
                )}
              </div>
            </div>
            {extraOpcion}
          </fieldset>
        )}
        <button
          type="button"
          onClick={onAgregar}
          disabled={deshabilitado}
          className={
            acento === "fuerte"
              ? "btn group relative w-full overflow-hidden bg-tinta py-[1.1rem] text-sm text-crema animate-resplandor hover:bg-marron motion-reduce:animate-none motion-reduce:shadow-[0_16px_34px_-14px_rgb(var(--marron)/0.75)] disabled:animate-none disabled:bg-tinta/30 disabled:text-crema/90 disabled:shadow-none"
              : "btn-primario w-full py-[1.1rem] text-sm"
          }
          aria-describedby={aviso ? `${id}-aviso` : undefined}
        >
          {acento === "fuerte" && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-0 w-1/3 -skew-x-12 animate-brillo bg-gradient-to-r from-transparent via-crema/35 to-transparent motion-reduce:hidden"
            />
          )}
          <span className="relative">{texto}</span>
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
            agotados={opcion.agotados}
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

      {producto.opcionTalle && (
        <fieldset disabled={deshabilitado}>
          <legend className="eyebrow mb-2">
            Talle
            {talle && <span className="ml-2 text-tinta">{talle}</span>}
          </legend>
          <Botones
            nombre={`talle-${id}`}
            valores={producto.opcionTalle.valores}
            agotados={producto.opcionTalle.agotados}
            elegido={talle}
            grande={grande}
            onElegir={(v) => {
              setTalle(v);
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
        className={
          grande
            ? "btn-primario w-full py-5 text-sm"
            : acento === "medio"
              ? "btn w-full bg-tinta px-3 py-2.5 text-[11px] text-crema hover:bg-marron disabled:bg-tinta/30 disabled:text-crema/90"
              : "btn-borde w-full px-3 py-2.5 text-[11px]"
        }
        aria-describedby={aviso ? `${id}-aviso` : undefined}
      >
        {texto}
      </button>
      {aviso_}
    </div>
  );
}
