"use client";

import Link from "next/link";
import { Fragment, useEffect, useRef } from "react";
import { useCarrito } from "./CarritoProvider";
import { SelectorZona } from "./SelectorZona";
import { AvisoArmado, CombosArmados, ItemSugerencia } from "./SugerenciasPromo";
import type { Sugerencia } from "@/lib/promos";
import { Personalizar } from "../personalizar/Personalizar";
import { esPersonalizable } from "@/lib/personalizacion";
import { ImagenProducto } from "../ImagenProducto";
import { IconoCerrar, IconoMas, IconoMenos } from "../Iconos";
import { CabeceraManada } from "@/components/carrito/CabeceraManada";
import { PrecioLinea } from "@/components/carrito/PrecioLinea";
import { detalleEnvio, formatearPrecio, textoEnvio } from "@/lib/formato";
import { chapitasEnCarrito, MAX_CANTIDAD, ahorroChapitas } from "@/lib/carrito";
import { textoOpcion } from "@/lib/combos";
import { ofertaChapita } from "@/data/products";
import { esChapita, fotoDeLinea } from "@/lib/chapita";
import { textoPersonalizacion } from "@/lib/personalizacion";
import { trabarScroll } from "@/lib/scroll";

export function CarritoDrawer() {
  const { abierto, cerrar, totales, cambiarCantidad, quitar, personalizar } = useCarrito();
  const botonCerrar = useRef<HTMLButtonElement>(null);
  const { lineas, subtotal, descuentos, envio, total, contieneKit, faltaParaGratis } = totales;
  // Chapitas: cada línea muestra lo que paga de verdad y cuánto ahorra.
  const chapitas = ahorroChapitas(lineas);
  const motivoChapita = chapitas.tresPorDos ? "con el Combo Manada" : "por sumarla a tu compra";
  // Nombre del combo que arma esa pieza (para la etiquetita en la línea).
  // Cada combo a medio armar va debajo del primer producto del carrito que lo empieza (uno por producto).
  const sugerenciaDe = new Map<string, Sugerencia>();
  const mostradas = new Set<string>();
  for (const l of lineas) {
    const s = totales.sugerencias.find(
      (x) => !mostradas.has(x.promoId) && (x.tiene.some((p) => p.id === l.productoId) || !!x.desde?.some((c) => c.id === l.productoId)),
    );
    if (s) {
      mostradas.add(s.promoId);
      sugerenciaDe.set(l.key, s);
    }
  }
  // 3x2 en chapitas: con 2 (o 5, 8…) avisa en la primera chapita que la próxima es de regalo.
  const primeraChapita = lineas.find((l) => esChapita(l.productoId))?.key;
  const faltaUnaChapita = ofertaChapita.tresPorDos.activa && chapitasEnCarrito(lineas) % 3 === 2;
  // Las chapitas no llevan la etiqueta: su precio ya dice cuánto ahorran.
  const enCombo = (id: string) => (esChapita(id) ? undefined : descuentos.find((d) => d.piezas.includes(id))?.texto.replace(/ × \d+$/, ""));

  useEffect(() => {
    if (!abierto) return;
    const previo = document.activeElement as HTMLElement | null;
    botonCerrar.current?.focus();
    const liberar = trabarScroll();
    // Con el editor de personalización abierto, Escape cierra solo el editor.
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !document.querySelector("dialog[open]") && cerrar();
    window.addEventListener("keydown", onKey);
    return () => {
      liberar();
      window.removeEventListener("keydown", onKey);
      previo?.focus?.();
    };
  }, [abierto, cerrar]);

  return (
    <div className={`fixed inset-0 z-50 ${abierto ? "" : "pointer-events-none"}`} inert={!abierto}>
      <div
        className={`absolute inset-0 bg-tinta/40 transition-opacity duration-500 ${abierto ? "opacity-100" : "opacity-0"}`}
        onClick={cerrar}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="carrito-titulo"
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-crema shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          abierto ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-tinta/10 px-5 py-4">
          <h2 id="carrito-titulo" className="text-sm uppercase tracking-marca">
            Tu carrito
          </h2>
          <button ref={botonCerrar} type="button" onClick={cerrar} className="-mr-2 p-2" aria-label="Cerrar carrito">
            <IconoCerrar />
          </button>
        </div>

        {lineas.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 px-8 text-center">
            <p className="text-lg font-light">Todavía no agregaste nada.</p>
            <a href="/#kit" onClick={cerrar} className="btn-borde">
              Ver el kit
            </a>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5">
            <AvisoArmado />
            <ul className="divide-y divide-tinta/10">
              {lineas.map((l) => (
                <Fragment key={l.key}>
                {chapitas.agrupadas && l.key === primeraChapita && (
                  <li className="py-5">
                    <CabeceraManada unidades={chapitas.unidades} lista={chapitas.lista} ahorro={chapitas.tresPorDos + chapitas.conCompra} />
                  </li>
                )}
                <li className={`py-5 ${chapitas.agrupadas && esChapita(l.productoId) ? "!border-t-0 pl-6 pt-0" : ""}`}>
                  <div className="flex gap-4">
                  <ImagenProducto
                    src={fotoDeLinea(l.producto, l.opcion)}
                    ajuste="cover"
                    nombre={l.producto.nombre}
                    sizes="80px"
                    className="w-20 shrink-0"
                    tamTexto="text-[9px]"
                  />
                  <div className="flex flex-1 flex-col">
                    <div className="flex justify-between gap-3">
                      <div>
                        <p className="text-[15px] font-normal">{l.producto.nombre}</p>
                        {l.opcion && <p className="text-sm text-tinta/70">{textoOpcion(l.producto, l.opcion)}</p>}
                        {enCombo(l.productoId) && (
                          <p className="mt-1 inline-block rounded-full bg-tinta px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-crema">
                            {enCombo(l.productoId)}
                          </p>
                        )}
                        {faltaUnaChapita && l.key === primeraChapita && (
                          <p className="mt-1 text-[13px] text-marron">{ofertaChapita.tresPorDos.falta}</p>
                        )}
                        {esPersonalizable(l.producto) ? (
                          <div className="mt-1.5">
                            <Personalizar
                              producto={l.producto}
                              valor={l.personalizacion}
                              onCambio={(p) => personalizar(l.key, p)}
                              enCarrito
                            />
                          </div>
                        ) : (
                          l.personalizacion && <p className="text-sm text-marron">{textoPersonalizacion(l.personalizacion)}</p>
                        )}
                      </div>
                      {!(chapitas.agrupadas && esChapita(l.productoId)) && (
                        <PrecioLinea subtotal={l.subtotal} ahorro={chapitas.porLinea[l.key]} motivo={motivoChapita} />
                      )}
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="flex items-center border border-tinta/25">
                        <button
                          type="button"
                          className="p-2 disabled:opacity-30"
                          onClick={() => cambiarCantidad(l.key, l.cantidad - 1)}
                          aria-label={`Restar una unidad de ${l.producto.nombre}`}
                        >
                          <IconoMenos />
                        </button>
                        <span className="w-8 text-center text-sm" aria-live="polite">
                          {l.cantidad}
                        </span>
                        <button
                          type="button"
                          className="p-2 disabled:opacity-30"
                          disabled={l.cantidad >= MAX_CANTIDAD}
                          onClick={() => cambiarCantidad(l.key, l.cantidad + 1)}
                          aria-label={`Sumar una unidad de ${l.producto.nombre}`}
                        >
                          <IconoMas />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => quitar(l.key)}
                        className="text-xs uppercase tracking-marca text-tinta/70 underline-offset-4 hover:underline"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                  </div>
                  {sugerenciaDe.has(l.key) && <ItemSugerencia sugerencia={sugerenciaDe.get(l.key)!} />}
                </li>
                </Fragment>
              ))}
            </ul>
            <CombosArmados />
            </div>

            <div className="space-y-4 border-t border-tinta/10 bg-lino/50 px-5 pb-6 pt-5">
              {faltaParaGratis !== null && (
                <p className="text-sm text-marron">
                  Te faltan {formatearPrecio(faltaParaGratis)} para el envío gratis.
                </p>
              )}
              {envio.tipo !== "gratis" && <SelectorZona />}
              <dl className="space-y-2 text-[15px]">
                <div className="flex justify-between">
                  <dt>Subtotal</dt>
                  <dd>{formatearPrecio(subtotal)}</dd>
                </div>
                {descuentos.map((d) => (
                  <div key={d.promoId} className="flex justify-between text-marron">
                    <dt>{d.texto}</dt>
                    <dd>− {formatearPrecio(d.monto)}</dd>
                  </div>
                ))}
                <div className="flex justify-between">
                  <dt>
                    Envío
                    {envio.tipo === "gratis" && (
                      <span className="text-tinta/70"> · {contieneKit ? "con el kit completo" : "por monto"}</span>
                    )}
                    {(envio.tipo === "precio" || envio.tipo === "cotizar") && (
                      <span className="text-tinta/70"> · {detalleEnvio(envio)}</span>
                    )}
                  </dt>
                  <dd className={envio.tipo === "gratis" ? "text-marron" : ""}>{textoEnvio(envio)}</dd>
                </div>
                <div className="flex justify-between border-t border-tinta/15 pt-3 text-lg">
                  <dt>Total</dt>
                  <dd>
                    {formatearPrecio(total)}
                    {(envio.tipo === "cotizar" || envio.tipo === "sin-zona") && (
                      <span className="block text-right text-xs text-tinta/70">+ envío</span>
                    )}
                  </dd>
                </div>
              </dl>
              <Link href="/checkout" onClick={cerrar} className="btn-primario w-full">
                Finalizar compra
              </Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
