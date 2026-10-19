import { combos, getProducto, kit, type Producto } from "@/data/products";

/**
 * Combos armados en el carrito: si comprás sueltas las piezas de un combo (o del kit),
 * pagás lo mismo que el combo. El ahorro sale solo de los precios reales:
 * suma de las piezas sueltas − precio del combo. Nada se carga a mano.
 */

export interface DescuentoAplicado {
  promoId: string;
  /** Ej. "Combo Paseo". */
  texto: string;
  monto: number;
  /** Ids de las piezas que lo forman (para marcarlas en el carrito). */
  piezas: string[];
  /** Armaste el kit completo: viaja gratis como el kit. */
  envioGratis: boolean;
}

export interface Sugerencia {
  promoId: string;
  combo: Producto;
  /** Piezas del combo que ya están en el carrito. */
  tiene: Producto[];
  /** Piezas que faltan para armarlo. */
  faltan: Producto[];
  ahorro: number;
}

interface Armable {
  combo: Producto;
  piezas: Producto[];
  ahorro: number;
}

const comprable = (p?: Producto): p is Producto => !!p && p.precio !== null && p.disponible;

/** Kit y combos que se pueden armar con piezas sueltas y que de verdad ahorran. */
function armables(): Armable[] {
  const out: Armable[] = [];
  for (const combo of [kit, ...combos]) {
    if (!comprable(combo)) continue;
    const piezas = combo.incluye.map(getProducto);
    if (!piezas.every(comprable)) continue;
    const ahorro = piezas.reduce((s, p) => s + p.precio!, 0) - combo.precio!;
    if (ahorro > 0) out.push({ combo, piezas, ahorro });
  }
  // El kit primero (es el más completo y viaja gratis); después los combos, del que más ahorra al que menos.
  return out.sort((a, b) => (a.combo.tipo === "kit" ? -1 : b.combo.tipo === "kit" ? 1 : b.ahorro - a.ahorro));
}

/**
 * Arma los combos que el carrito ya completa (cada unidad cuenta para un solo combo) y sugiere
 * los que están a medio armar: los que menos piezas les faltan, hasta 2.
 */
export function calcularPromos(unidadesPorProducto: Record<string, number>) {
  const restantes = { ...unidadesPorProducto };
  const descuentos: DescuentoAplicado[] = [];
  const lista = armables();

  for (const a of lista) {
    const veces = Math.min(...a.piezas.map((p) => restantes[p.id] ?? 0));
    if (veces <= 0) continue;
    for (const p of a.piezas) restantes[p.id] -= veces;
    descuentos.push({
      promoId: a.combo.id,
      texto: veces > 1 ? `${a.combo.nombre} × ${veces}` : a.combo.nombre,
      monto: a.ahorro * veces,
      piezas: a.piezas.map((p) => p.id),
      envioGratis: a.combo.envioGratis,
    });
  }

  const sugerencias: Sugerencia[] = [];
  for (const a of lista) {
    const tiene = a.piezas.filter((p) => (restantes[p.id] ?? 0) > 0);
    const faltan = a.piezas.filter((p) => (restantes[p.id] ?? 0) <= 0);
    if (tiene.length === 0 || faltan.length === 0) continue;
    // El kit solo cuando está cerca (si no, es mucho pedir).
    if (a.combo.tipo === "kit" && faltan.length > 2) continue;
    sugerencias.push({ promoId: a.combo.id, combo: a.combo, tiene, faltan, ahorro: a.ahorro });
  }
  sugerencias.sort((x, y) => x.faltan.length - y.faltan.length || y.ahorro - x.ahorro);

  return { descuentos, sugerencias: sugerencias.slice(0, 2) };
}
