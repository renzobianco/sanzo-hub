import { getProducto, type Producto } from "@/data/products";
import { zonaPorProvincia, type ZonaEnvio } from "@/data/envios";

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
  envio: EstadoEnvio;
  /** Total con envío; si el envío no tiene precio, es igual al subtotal. */
  total: number;
  contieneKit: boolean;
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

/** Regla: si el carrito tiene un producto con envío gratis (el kit), el envío es $0 para todo el pedido. */
export function calcularTotales(lineas: LineaCarrito[], ubicacion: Ubicacion): Totales {
  const resueltas = resolverLineas(lineas);
  const subtotal = resueltas.reduce((s, l) => s + l.subtotal, 0);
  const unidades = resueltas.reduce((s, l) => s + l.cantidad, 0);
  const contieneKit = resueltas.some((l) => l.producto.envioGratis);

  let envio: EstadoEnvio;
  if (contieneKit) {
    envio = { tipo: "gratis" };
  } else {
    const zona = zonaPorProvincia(ubicacion.provincia, ubicacion.enGBA);
    if (!zona) envio = { tipo: "sin-zona" };
    else if (zona.precio === null) envio = { tipo: "cotizar", zona };
    else envio = { tipo: "precio", zona, monto: zona.precio };
  }

  const total = subtotal + (envio.tipo === "precio" ? envio.monto : 0);
  return { lineas: resueltas, unidades, subtotal, envio, total, contieneKit };
}
