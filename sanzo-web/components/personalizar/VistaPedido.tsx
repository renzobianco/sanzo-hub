"use client";

import { useEffect, useRef, useState } from "react";
import { getProducto, personalizacion as config, type Producto } from "@/data/products";
import { disenosPorPieza, textoCorto, type Personalizacion } from "@/lib/personalizacion";
import { cargarZonas, type Zona } from "@/lib/zonas";
import { VistaPieza } from "./Vista";

/**
 * Cómo queda lo que pidió el cliente: cada pieza personalizada con su parche (forma, color, medida, letra,
 * nombre) en el lugar que eligió. Es la misma vista previa del personalizador, pero fija. La usa el Hub
 * (Pedidos web) adentro de un iframe: le avisa el alto con postMessage para que no quede con scroll.
 */
export function VistaPedido({ producto, p }: { producto: Producto; p: Personalizacion }) {
  const [zonas, setZonas] = useState<Record<string, Zona>>({});
  const caja = useRef<HTMLDivElement>(null);

  useEffect(() => {
    cargarZonas().then(setZonas);
  }, []);

  useEffect(() => {
    const el = caja.current;
    if (!el || window.parent === window) return;
    const avisar = () => window.parent.postMessage({ sanzoVista: true, url: location.href, alto: Math.ceil(el.getBoundingClientRect().height) }, "*");
    const ro = new ResizeObserver(avisar);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const disenos = disenosPorPieza(producto, p);

  return (
    // Tapa el encabezado y el pie de la web: acá solo va la vista.
    <div className="fixed inset-0 z-[9999] overflow-auto bg-crema">
      <div ref={caja} className="space-y-5 p-3">
        {disenos.map(([pz, d]) => {
          const c = config.piezas[pz];
          if (!c) return null;
          const pos = p.posiciones?.[pz];
          return (
            <section key={pz}>
              <p className="mb-2 text-[11px] uppercase tracking-[0.14em] text-tinta/70">
                {getProducto(pz)?.nombre ?? pz} <span className="normal-case tracking-normal text-tinta/50">· {textoCorto(d)}</span>
              </p>
              <VistaPieza
                fija
                pieza={c}
                nombrePieza={getProducto(pz)?.nombre ?? pz}
                diseno={{ ...d, telefono: d.telefono ?? d.linea2 ?? "", tamLetra: d.tamLetra ?? 1 }}
                zona={zonas[pz]}
                posicion={pos ? { x: pos[0] * c.tam.ancho, y: pos[1] * c.tam.alto } : undefined}
                onMover={() => {}}
              />
            </section>
          );
        })}
      </div>
    </div>
  );
}
