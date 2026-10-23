import { getProducto, type Producto } from "@/data/products";

/** Piezas del combo (individuales de `incluye`), en orden. */
export function piezasDe(combo: Producto): Producto[] {
  return combo.incluye.map(getProducto).filter((p): p is Producto => !!p);
}

/** Piezas del combo que se eligen por color (las que tienen `opcion.colores`, ej. gorra y piluso). */
export function piezasConColor(combo: Producto): Producto[] {
  if (combo.tipo !== "combo") return [];
  return piezasDe(combo).filter((p) => p.opcion?.colores);
}

/** Texto de la opción que va al carrito: "S · Gorra Beige · Piluso Jade" (o solo "S"). */
export function armarOpcion(combo: Producto, talle: string, colores: Record<string, string>) {
  const partes = talle ? [talle] : [];
  for (const p of piezasConColor(combo)) partes.push(`${p.nombre} ${colores[p.id] ?? ""}`.trim());
  return partes.join(" · ");
}

/** Cómo se lee la opción en carrito, checkout, mail y Mercado Pago: "Talle S", "Gorra Beige · Piluso Jade". */
export function textoOpcion(producto: Producto, opcion?: string) {
  if (!opcion) return "";
  // Color + talle (gorra, piluso): "Color Beige · Talle M".
  if (producto.opcion && producto.opcionTalle && opcion.includes(" · ")) {
    const [c, t] = opcion.split(" · ");
    return `${producto.opcion.nombre} ${c} · Talle ${t}`;
  }
  return producto.opcion ? `${producto.opcion.nombre} ${opcion}` : opcion;
}

/** Todas las opciones válidas del producto (para revisar el carrito). Sin opciones → null. */
export function opcionesValidas(producto: Producto): string[] | null {
  const conColor = piezasConColor(producto);
  if (!producto.opcion && conColor.length === 0) return null;
  // Color + talle: "Beige · M".
  if (producto.opcion && producto.opcionTalle) {
    return producto.opcion.valores.flatMap((c) => producto.opcionTalle!.valores.map((t) => `${c} · ${t}`));
  }
  let todas: string[][] = [producto.opcion ? producto.opcion.valores.map((v) => [v]) : [[]]].flat();
  for (const p of conColor) todas = todas.flatMap((t) => p.opcion!.valores.map((c) => [...t, `${p.nombre} ${c}`]));
  return todas.map((t) => t.join(" · "));
}

/**
 * Foto de una pieza dentro del combo. Busca en `combo.fotosPiezas` primero "pieza:Color" y después "pieza";
 * si no hay, usa la foto de la pieza suelta (la del color elegido, si tiene).
 */
export function fotoDePieza(combo: Producto, pieza: Producto, color?: string): string | undefined {
  const propias = combo.fotosPiezas ?? {};
  if (color && propias[`${pieza.id}:${color}`]) return propias[`${pieza.id}:${color}`];
  if (propias[pieza.id]) return propias[pieza.id];
  const i = color ? pieza.opcion?.fotos?.[color] ?? 0 : 0;
  return pieza.imagenes[i] ?? pieza.imagenes[0];
}
