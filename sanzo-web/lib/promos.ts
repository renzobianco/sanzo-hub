import { combos, getProducto, kit, type Producto } from "@/data/products";
import { piezasConColor } from "./combos";

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
  /** Combos del carrito que se pasarían a este más grande (ej. Combo Aventura → Kit). */
  desde?: Producto[];
}

export interface Armable {
  combo: Producto;
  piezas: Producto[];
  ahorro: number;
}

const comprable = (p?: Producto): p is Producto => !!p && p.precio !== null && p.disponible;

/** Kit y combos que se pueden armar con piezas sueltas y que de verdad ahorran. */
export function armables(): Armable[] {
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
 * los que están a medio armar, del que menos piezas le faltan al que más (el carrito muestra una debajo de cada producto).
 */
export function calcularPromos(unidadesPorProducto: Record<string, number>, combosEnCarrito: string[] = []) {
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

  // Un combo del carrito que entra entero en otro más grande cuenta como que ya tenés esas piezas
  // (ej. Combo Aventura → Kit completo).
  const enCarrito = combosEnCarrito.map(getProducto).filter((c): c is Producto => !!c && piezasConColor(c).length === 0);
  const sugerencias: Sugerencia[] = [];
  for (const a of lista) {
    // Combos del carrito que entran enteros en este, sin pisarse (ej. Aventura + Estilo → kit).
    const desde: Producto[] = [];
    const cubiertas = new Set<string>();
    const entran = enCarrito
      .filter((c) => c.id !== a.combo.id && c.incluye.length < a.combo.incluye.length && c.incluye.every((id) => a.combo.incluye.includes(id)))
      .sort((x, y) => y.incluye.length - x.incluye.length);
    for (const c of entran) {
      if (c.incluye.some((id) => cubiertas.has(id))) continue;
      c.incluye.forEach((id) => cubiertas.add(id));
      desde.push(c);
    }
    const tieneLa = (p: Producto) => (restantes[p.id] ?? 0) > 0 || cubiertas.has(p.id);
    const tiene = a.piezas.filter(tieneLa);
    const faltan = a.piezas.filter((p) => !tieneLa(p));
    if (tiene.length === 0 || faltan.length === 0) continue;
    // El kit desde piezas sueltas solo cuando está cerca (si no, es mucho pedir). Desde un combo, siempre.
    if (a.combo.tipo === "kit" && desde.length === 0 && faltan.length > 2) continue;
    sugerencias.push({ promoId: a.combo.id, combo: a.combo, tiene, faltan, ahorro: a.ahorro, desde: desde.length ? desde : undefined });
  }
  // Primero pasar de combo a uno más grande; después los que menos piezas les faltan.
  sugerencias.sort((x, y) => Number(!!y.desde) - Number(!!x.desde) || x.faltan.length - y.faltan.length || y.ahorro - x.ahorro);

  return { descuentos, sugerencias };
}
