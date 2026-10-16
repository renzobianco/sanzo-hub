import { getProducto, type Producto } from "@/data/products";
import { envioInfo, zonaPorProvincia, type ZonaEnvio } from "@/data/envios";
import { calcularPromos, type DescuentoAplicado, type Sugerencia } from "./promos";

export interface LineaCarrito {
  key: string;
  productoId: string;
  /** Valor de la opción elegida (talle o color), si aplica. */
  opcion?: string;
  cantidad: number;
}

export interface Ubicacion {
  provincia: string;
  /** Solo importa si la provincia es Buenos Aires. */
  enGBA: boolean | null;
}

export type EstadoEnvio =
  | { tipo: "gratis" }
  | { tipo: "sin-zona" }
  | { tipo: "cotizar"; zona: ZonaEnvio }
  | { tipo: "precio"; zona: ZonaEnvio; monto: number };

export interface LineaResuelta extends LineaCarrito {
  producto: Producto;
  subtotal: number;
}

export interface Totales {
  lineas: LineaResuelta[];
  unidades: number;
  subtotal: number;
  /** Promos completadas (se restan del subtotal). */
  descuentos: DescuentoAplicado[];
  ahorro: number;
  /** Piezas que le faltan al carrito para completar una promo. */
  sugerencias: Sugerencia[];
  envio: EstadoEnvio;
  /** Total con promos y envío; si el envío no tiene precio, no lo suma. */
  total: number;
  contieneKit: boolean;
  /** Cuánto falta para el envío gratis por monto (null si no aplica). */
  faltaParaGratis: number | null;
}

export const MAX_CANTIDAD = 10;

export function claveLinea(productoId: string, opcion?: string) {
  return opcion ? `${productoId}__${opcion}` : productoId;
}

/** Descarta líneas de productos que ya no existen o no se pueden comprar. */
export function resolverLineas(lineas: LineaCarrito[]): LineaResuelta[] {
  const out: LineaResuelta[] = [];
  for (const l of lineas) {
    const producto = getProducto(l.productoId);
    if (!producto || producto.precio === null || !producto.disponible) continue;
    if (producto.opcion && (!l.opcion || !producto.opcion.valores.includes(l.opcion))) continue;
    const cantidad = Math.min(MAX_CANTIDAD, Math.max(1, Math.floor(l.cantidad) || 1));
    out.push({ ...l, cantidad, producto, subtotal: producto.precio * cantidad });
  }
  return out;
}

/**
 * Reglas:
 * - Promos (data/products.ts → promos): se descuentan solas cuando el carrito las completa.
 * - Envío: si el carrito tiene un producto con envío gratis (el kit), o lo que se paga por los
 *   productos llega a `envioInfo.gratisDesde`, el envío es $0 para todo el pedido.
 */
export function calcularTotales(lineas: LineaCarrito[], ubicacion: Ubicacion): Totales {
  const resueltas = resolverLineas(lineas);
  const subtotal = resueltas.reduce((s, l) => s + l.subtotal, 0);
  const unidades = resueltas.reduce((s, l) => s + l.cantidad, 0);
  const contieneKit = resueltas.some((l) => l.producto.envioGratis);

  const porProducto: Record<string, number> = {};
  for (const l of resueltas) porProducto[l.productoId] = (porProducto[l.productoId] ?? 0) + l.cantidad;
  const { descuentos, sugerencias } = calcularPromos(porProducto);
  const ahorro = descuentos.reduce((s, d) => s + d.monto, 0);
  const productos = subtotal - ahorro;

  let envio: EstadoEnvio;
  const umbral = envioInfo.gratisDesde;
  const llegaAlMonto = umbral !== null && productos >= umbral;
  const faltaParaGratis = umbral !== null && !contieneKit && !llegaAlMonto && productos > 0 ? umbral - productos : null;

  if (contieneKit || llegaAlMonto) {
    envio = { tipo: "gratis" };
  } else {
    const zona = zonaPorProvincia(ubicacion.provincia, ubicacion.enGBA);
    if (!zona) envio = { tipo: "sin-zona" };
    else if (zona.precio === null) envio = { tipo: "cotizar", zona };
    else envio = { tipo: "precio", zona, monto: zona.precio };
  }

  const total = productos + (envio.tipo === "precio" ? envio.monto : 0);
  return { lineas: resueltas, unidades, subtotal, descuentos, ahorro, sugerencias, envio, total, contieneKit, faltaParaGratis };
}
