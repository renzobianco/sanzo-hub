"use client";

import Image from "next/image";
import { useState } from "react";
import { carritoCombos as textos, type Producto } from "@/data/products";
import { armables, type DescuentoAplicado, type Sugerencia } from "@/lib/promos";
import { formatearPrecio } from "@/lib/formato";
import { useCarrito } from "./CarritoProvider";
import { ImagenProducto } from "../ImagenProducto";
import { Agotado, valoresConAgotados } from "../AgregarAlCarrito";

/** "Collar" / "collar y poo bag" / "correa, collar y poo bag". */
function lista(piezas: Producto[]) {
  const n = piezas.map((p) => p.nombre.toLowerCase());
  return n.length > 1 ? `${n.slice(0, -1).join(", ")} y ${n[n.length - 1]}` : n[0];
}

/** Foto redonda chiquita de una pieza (la del artículo solo si está). */
function Mini({ producto, apagada }: { producto: Producto; apagada?: boolean }) {
  return (
    <span
      className={`relative block aspect-square min-w-0 max-w-[44px] flex-1 overflow-hidden rounded-full bg-crema transition-[opacity,box-shadow] duration-500 ${
        apagada ? "opacity-40 outline-dashed outline-1 outline-tinta/40" : "ring-1 ring-marron/40"
      }`}
    >
      {producto.miniatura ? (
        <Image src={producto.miniatura} alt={producto.nombre} fill sizes="44px" className="object-contain p-1 mix-blend-multiply" />
      ) : (
        <ImagenProducto src={producto.imagenes[0]} nombre={producto.nombre} sizes="44px" aspecto="aspect-square" tamTexto="text-[6px]" />
      )}
    </span>
  );
}

/** Combos ya armados en el carrito: "Armaste el Combo Paseo · Ahorrás $ 6.498". */
export function CombosArmados() {
  const { totales } = useCarrito();
  if (totales.descuentos.length === 0) return null;
  return (
    <ul className="mt-5 space-y-2">
      {totales.descuentos.map((d) => (
        <ComboArmado key={d.promoId} descuento={d} />
      ))}
    </ul>
  );
}

/** Aviso de unos segundos cuando las piezas sueltas se convirtieron en un combo. */
export function AvisoArmado() {
  const { armado } = useCarrito();
  const a = armado ? armables().find((x) => x.combo.id === armado) : undefined;
  if (!a) return null;
  return (
    <ul className="mt-4">
      <ComboArmado
        key={armado}
        descuento={{ promoId: a.combo.id, texto: a.combo.nombre, monto: a.ahorro, piezas: [], envioGratis: a.combo.envioGratis }}
      />
    </ul>
  );
}

function ComboArmado({ descuento }: { descuento: DescuentoAplicado }) {
  return (
    <li className="flex animate-entrada items-center gap-3 rounded-[0.8rem] bg-tinta px-4 py-3 text-crema">
      <span aria-hidden="true" className="flex h-7 w-7 shrink-0 animate-pop items-center justify-center rounded-full bg-crema text-tinta">
        <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </span>
      <p className="min-w-0 flex-1 text-[13px] leading-snug">
        {textos.armaste} <span className="uppercase tracking-[0.12em]">{descuento.texto}</span>
      </p>
      <p className="shrink-0 text-right text-[13px] text-lino">
        {textos.ahorras} {formatearPrecio(descuento.monto)}
      </p>
    </li>
  );
}

/** Combo a medio armar, debajo del producto que lo empieza: qué tenés, qué falta y cuánto ahorrás. */
export function ItemSugerencia({ sugerencia }: { sugerencia: Sugerencia }) {
  const { combo, tiene, faltan, ahorro, desde } = sugerencia;
  const total = tiene.length + faltan.length;
  const piezas = combo.incluye.map((id) => tiene.find((p) => p.id === id) ?? faltan.find((p) => p.id === id)!);

  return (
    <div className="mt-4 animate-entrada rounded-[0.8rem] bg-lino p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[13px] uppercase tracking-[0.14em]">
          {desde
            ? `${desde.length > 1 ? textos.pasan : `${textos.pasa} ${desde[0].nombre}`} ${textos.al} ${combo.nombre}`
            : `${textos.arma} ${combo.nombre}`}
        </p>
        <p className="shrink-0 text-[13px] text-marron">
          {textos.ahorras} {formatearPrecio(ahorro)}
        </p>
      </div>

      {/* Las piezas del combo: las que ya están, marcadas; las que faltan, apagadas. */}
      <div className="mt-3 flex items-center gap-1.5">
        {piezas.map((p) => (
          <Mini key={p.id} producto={p} apagada={!tiene.includes(p)} />
        ))}
        <span className="ml-auto shrink-0 whitespace-nowrap pl-1 text-[12px] tabular-nums text-tinta/60">
          {tiene.length} / {total}
        </span>
      </div>
      <div className="mt-3 h-[3px] overflow-hidden rounded-full bg-crema">
        <div
          className="h-full rounded-full bg-marron transition-[width] duration-700 ease-suave"
          style={{ width: `${(tiene.length / total) * 100}%` }}
        />
      </div>

      <p className="mt-3 text-sm text-tinta/75">
        {faltan.length > 1 ? textos.faltan : textos.falta} {lista(faltan)}.
      </p>
      <ul className="mt-2 divide-y divide-tinta/10">
        {faltan.map((p) => (
          <PiezaQueFalta key={p.id} producto={p} />
        ))}
      </ul>
    </div>
  );
}

function PiezaQueFalta({ producto }: { producto: Producto }) {
  const { agregar } = useCarrito();
  const [eligiendo, setEligiendo] = useState(false);
  // Gorra / piluso: primero el color, después el talle ("Beige · M").
  const [color, setColor] = useState("");
  const opcion = producto.opcion;
  const talles = producto.opcionTalle;
  const boton = "flex h-9 min-w-[2.5rem] items-center justify-center gap-1.5 border border-tinta/25 px-2.5 text-[11px] uppercase tracking-[0.12em] transition-colors active:bg-tinta active:text-crema";

  return (
    <li className="py-2.5">
      <div className="flex items-center gap-3">
        <p className="min-w-0 flex-1 text-[15px]">
          {producto.nombre}
          {producto.precio !== null && <span className="ml-2 text-sm text-tinta/60">{formatearPrecio(producto.precio)}</span>}
        </p>
        {!eligiendo && (
          <button
            type="button"
            onClick={() => (opcion ? setEligiendo(true) : agregar(producto.id))}
            className="btn-borde shrink-0 px-4 py-2 text-[11px]"
          >
            {textos.sumar}
          </button>
        )}
      </div>
      {eligiendo && opcion && (!talles || !color) && (
        <div className="mt-2 flex animate-entrada flex-wrap items-center gap-2">
          <span className="eyebrow mr-1">{opcion.nombre}</span>
          {opcion.valores.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => (talles ? setColor(v) : agregar(producto.id, v))}
              className={boton}
            >
              {opcion.colores?.[v] && (
                <span aria-hidden="true" className="h-3 w-3 rounded-full ring-1 ring-tinta/20" style={{ backgroundColor: opcion.colores[v] }} />
              )}
              {v}
            </button>
          ))}
        </div>
      )}
      {eligiendo && talles && color && (
        <div className="mt-2 flex animate-entrada flex-wrap items-center gap-2">
          <span className="eyebrow mr-1">
            Talle <span className="text-tinta">· {color}</span>
          </span>
          {valoresConAgotados(talles.valores, talles.agotados).map((t) =>
            talles.valores.includes(t) ? (
              <button key={t} type="button" onClick={() => agregar(producto.id, `${color} · ${t}`)} className={boton}>
                {t}
              </button>
            ) : (
              <Agotado key={t} valor={t} clase="h-9 min-w-[2.5rem] px-2.5 text-[11px]" />
            ),
          )}
        </div>
      )}
    </li>
  );
}
