import { getProducto, promos, type Producto, type Promo } from "@/data/products";
import { formatearPrecio } from "./formato";

export interface DescuentoAplicado {
  promoId: string;
  /** Ej. "Correa + Moño" o "Poo bag de regalo". */
  texto: string;
  monto: number;
}

export interface Sugerencia {
  promoId: string;
  /** La pieza que falta para completar la promo. */
  producto: Producto;
  /** Ej. "Sumalo y ahorrás $ 2.000". */
  texto: string;
}

const nombre = (id: string) => getProducto(id)?.nombre ?? id;

/** Cuánto vale una vez la promo, o null si todavía no tiene precio (promo apagada). */
function valorPromo(p: Promo): number | null {
  if (p.tipo === "ahorro") return p.monto ?? null;
  if (!p.regalo || !p.lleva.includes(p.regalo)) return null;
  return getProducto(p.regalo)?.precio ?? null;
}

/** Se puede comprar todo lo que pide la promo. */
function comprable(p: Promo) {
  return p.lleva.every((id) => {
    const prod = getProducto(id);
    return prod && prod.precio !== null && prod.disponible;
  });
}

/**
 * Aplica las promos en orden sobre las unidades del carrito (cada unidad cuenta para una sola promo)
 * y arma las sugerencias: promos a las que les falta exactamente una pieza.
 */
export function calcularPromos(unidadesPorProducto: Record<string, number>) {
  const restantes = { ...unidadesPorProducto };
  const descuentos: DescuentoAplicado[] = [];
  const activas = promos.filter((p) => valorPromo(p) !== null && comprable(p));

  for (const p of activas) {
    const veces = Math.min(...p.lleva.map((id) => restantes[id] ?? 0));
    if (veces <= 0) continue;
    for (const id of p.lleva) restantes[id] -= veces;
    descuentos.push({
      promoId: p.id,
      texto: p.tipo === "regalo" ? `${nombre(p.regalo!)} de regalo` : p.lleva.map(nombre).join(" + "),
      monto: valorPromo(p)! * veces,
    });
  }

  // Cada pieza del carrito sostiene una sola sugerencia: no ofrecemos dos promos que no se pueden cumplir juntas.
  const sugerencias: Sugerencia[] = [];
  for (const p of activas) {
    const faltan = p.lleva.filter((id) => (restantes[id] ?? 0) <= 0);
    if (faltan.length !== 1 || p.lleva.length < 2) continue;
    const id = faltan[0];
    if (sugerencias.some((s) => s.producto.id === id)) continue;
    for (const otro of p.lleva) if (otro !== id) restantes[otro] -= 1;
    const texto =
      p.tipo === "ahorro"
        ? `Sumalo y ahorrás ${formatearPrecio(valorPromo(p)!)}`
        : id === p.regalo
          ? "Sumalo: te lo regalamos"
          : `Sumalo y te llevás ${nombre(p.regalo!).toLowerCase()} de regalo`;
    sugerencias.push({ promoId: p.id, producto: getProducto(id)!, texto });
  }

  return { descuentos, sugerencias: sugerencias.slice(0, 2) };
}

