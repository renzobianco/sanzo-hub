"use client";

import { cotizacion, PROVINCIAS, type TipoEntrega } from "@/data/envios";
import { zonaDeUbicacion } from "@/lib/carrito";
import { formatearPrecio } from "@/lib/formato";
import { useCarrito } from "./CarritoProvider";

const ENTREGAS: [TipoEntrega, string][] = [
  ["domicilio", "A domicilio"],
  ["sucursal", "Retiro en sucursal"],
];

/**
 * Cotizador de envío: código postal (o provincia) → precio a domicilio y a sucursal según la zona
 * (tarifas en data/envios.ts). En el carrito (`elegir`) se toca una opción y es la que se cobra;
 * en la ficha del producto solo se muestran.
 */
export function SelectorZona({ elegir = true }: { elegir?: boolean }) {
  const { ubicacion, setUbicacion } = useCarrito();
  const zona = zonaDeUbicacion(ubicacion);
  const cpIncompleto = !ubicacion.provincia && ubicacion.cp.length >= 4 && !zona;

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="zona-cp" className="etiqueta">
          Calculá el envío
        </label>
        <div className="flex gap-2">
          <input
            id="zona-cp"
            className="campo flex-1 uppercase"
            inputMode="text"
            autoComplete="postal-code"
            maxLength={8}
            placeholder="Tu código postal"
            value={ubicacion.provincia ? "" : ubicacion.cp}
            onChange={(e) => setUbicacion({ ...ubicacion, provincia: "", cp: e.target.value.trim().toUpperCase() })}
          />
          <select
            aria-label="O elegí tu provincia"
            className="campo w-[42%] cursor-pointer"
            value={ubicacion.provincia}
            onChange={(e) => setUbicacion({ ...ubicacion, provincia: e.target.value })}
          >
            <option value="">o tu provincia</option>
            {PROVINCIAS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        {cpIncompleto && <p className="mt-1.5 text-xs text-marron">Revisá el código postal (ej. 1425 o C1425ABC).</p>}
      </div>

      {zona && (
        <div>
          <div className={`grid grid-cols-2 gap-2 ${elegir ? "" : "pointer-events-none"}`} role={elegir ? "radiogroup" : undefined} aria-label="Tipo de entrega">
            {ENTREGAS.map(([valor, texto]) => {
              const precio = zona.precio[valor];
              const activo = elegir && ubicacion.entrega === valor;
              return (
                <button
                  key={valor}
                  type="button"
                  role={elegir ? "radio" : undefined}
                  aria-checked={elegir ? activo : undefined}
                  tabIndex={elegir ? 0 : -1}
                  onClick={() => setUbicacion({ ...ubicacion, entrega: valor })}
                  className={`rounded-lg border px-3 py-2.5 text-left transition-colors ${activo ? "border-tinta bg-crema" : "border-tinta/20"}`}
                >
                  <span className="block text-[12px] text-tinta/70">{texto}</span>
                  <span className="block text-[15px]">{precio == null ? "A cotizar" : formatearPrecio(precio)}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-xs text-tinta/60">
            {zona.nombre} · Correo Argentino, {cotizacion.plazo}
          </p>
        </div>
      )}
    </div>
  );
}
