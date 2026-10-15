"use client";

import { PROVINCIAS } from "@/data/envios";
import { useCarrito } from "./CarritoProvider";

/** Selector compacto de provincia (+ GBA) para calcular el envío desde el carrito. */
export function SelectorZona() {
  const { ubicacion, setUbicacion } = useCarrito();
  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="zona-provincia" className="eyebrow mb-1 block">
          Calculá el envío
        </label>
        <select
          id="zona-provincia"
          className="campo cursor-pointer"
          value={ubicacion.provincia}
          onChange={(e) => setUbicacion({ provincia: e.target.value, enGBA: null })}
        >
          <option value="">Elegí tu provincia</option>
          {PROVINCIAS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>
      {ubicacion.provincia === "Buenos Aires" && (
        <div>
          <label htmlFor="zona-gba" className="eyebrow mb-1 block">
            ¿Estás en el GBA?
          </label>
          <select
            id="zona-gba"
            className="campo cursor-pointer"
            value={ubicacion.enGBA === null ? "" : ubicacion.enGBA ? "si" : "no"}
            onChange={(e) =>
              setUbicacion({ provincia: "Buenos Aires", enGBA: e.target.value === "" ? null : e.target.value === "si" })
            }
          >
            <option value="">Elegí una opción</option>
            <option value="si">Sí</option>
            <option value="no">No</option>
          </select>
        </div>
      )}
    </div>
  );
}
