import type { Producto } from "@/data/products";
import type { LineaResuelta } from "@/lib/carrito";

// Lo que comparten el navegador (Pixel) y el servidor (API de Conversiones).
// Los id de producto (`content_ids`) son los mismos `id` de data/products.ts y del catálogo de Meta
// (/catalogo-meta): si no coinciden, el catálogo no se conecta con el pixel.

/** Versión de la Graph API (última estable según developers.facebook.com/docs/graph-api/changelog/versions, 2026-11-24). */
export const META_GRAPH_VERSION = "v26.0";

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() ?? "";

/** Eventos que el navegador puede mandar también por el servidor (/api/meta). Purchase nunca: ese lo manda el webhook de MP. */
export const EVENTOS_NAVEGADOR = ["PageView", "ViewContent", "AddToCart", "InitiateCheckout", "AddPaymentInfo", "Contact"] as const;
export type EventoNavegador = (typeof EVENTOS_NAVEGADOR)[number];
export type EventoMeta = EventoNavegador | "Purchase";

export interface ContenidoMeta {
  id: string;
  quantity: number;
  item_price: number;
}

/** custom_data de Meta (mismo formato en el Pixel y en la API de Conversiones). */
export interface DatosMeta {
  content_ids?: string[];
  content_type?: "product";
  content_name?: string;
  contents?: ContenidoMeta[];
  value?: number;
  currency?: "ARS";
  num_items?: number;
  order_id?: string;
  /** Propiedad propia: el pedido lleva algo personalizado (sirve para armar audiencias). */
  personalizado?: boolean;
}

/** Lo que se guarda con el pedido (payload.meta en sanzo_web_orders) para mandar después la compra por el servidor. */
export interface MetaPedido {
  /** event_id de la compra: el mismo en el Purchase del navegador (/gracias) y del servidor (webhook). */
  eventId: string;
  fbp?: string;
  fbc?: string;
  ip?: string;
  userAgent?: string;
  /** sz_uid (cookie propia, anónima). Se manda hasheado. */
  externalId?: string;
  /** Página desde la que se hizo el pedido. */
  url?: string;
  /** utm_* y fbclid con los que llegó la persona (cookie sz_utm). */
  utm?: Record<string, string>;
  /** Productos (sin envío), con promos ya restadas. */
  valor: number;
  /** Lo que se cobra de envío (0 si es gratis, retiro o a cotizar). */
  envio: number;
  contents: ContenidoMeta[];
  numItems: number;
  personalizado: boolean;
}

/** Lo que /api/pedido le devuelve al navegador para el Purchase de /gracias y el AddPaymentInfo. */
export interface MetaRespuestaPedido {
  eventId: string;
  value: number;
  contents: ContenidoMeta[];
  num_items: number;
  personalizado: boolean;
}

export const eventIdCompra = (numero: string) => `purchase_${numero}`;

/** ViewContent de un producto, kit o combo. */
export function datosDeProducto(p: Producto): DatosMeta {
  return {
    content_ids: [p.id],
    content_type: "product",
    content_name: p.nombre,
    ...(p.precio !== null ? { value: p.precio, currency: "ARS" as const } : {}),
  };
}

/** Contenidos de las líneas del carrito (precio por unidad con la personalización incluida). */
export function contenidosDeLineas(lineas: LineaResuelta[]): ContenidoMeta[] {
  return lineas.map((l) => ({ id: l.productoId, quantity: l.cantidad, item_price: l.unitario }));
}

/** AddToCart / InitiateCheckout / AddPaymentInfo / Purchase a partir de las líneas y el valor (sin envío). */
export function datosDeContenidos(contents: ContenidoMeta[], value: number, personalizado: boolean): DatosMeta {
  return {
    content_ids: [...new Set(contents.map((c) => c.id))],
    content_type: "product",
    contents,
    value,
    currency: "ARS",
    num_items: contents.reduce((s, c) => s + c.quantity, 0),
    ...(personalizado ? { personalizado: true } : {}),
  };
}

export function datosDeLineas(lineas: LineaResuelta[], value: number): DatosMeta {
  return datosDeContenidos(contenidosDeLineas(lineas), value, lineas.some((l) => !!l.personalizacion));
}
