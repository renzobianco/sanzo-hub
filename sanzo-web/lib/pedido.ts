import type { Personalizacion } from "./personalizacion";
import type { DatosCheckout } from "./validacion";
import type { MetaRespuestaPedido } from "./meta/datos";

/** Lo que el checkout manda a /api/pedido. Los precios se recalculan en el servidor. */
export interface PedidoEntrada {
  cliente: DatosCheckout;
  lineas: { productoId: string; opcion?: string; personalizacion?: Personalizacion; imagen?: string; cantidad: number }[];
  /** Honeypot anti-spam: tiene que llegar vacío. */
  empresa?: string;
}

export interface PedidoRespuesta {
  ok: boolean;
  numero?: string;
  /** Link de Mercado Pago si corresponde redirigir directo. */
  redirigirA?: string;
  /** Hay cobro online armado (se puede pagar con Mercado Pago o con la tarjeta en la web). */
  pagoOnline?: boolean;
  /** Total que calculó el servidor (lo que se cobra con la tarjeta). */
  total?: number;
  /** Datos de la compra para el Pixel de Meta (AddPaymentInfo y el Purchase de /gracias). */
  meta?: MetaRespuestaPedido;
  error?: string;
}

export const CLAVE_ULTIMO_PEDIDO = "sanzo-ultimo-pedido";
/** Datos del checkout guardados en el navegador del cliente, para no tener que cargarlos de nuevo. */
export const CLAVE_DATOS_CHECKOUT = "sanzo-datos-checkout";
/** Hasta cuándo ofrecemos "Terminar de pagar" un pedido que quedó sin pagar. */
export const DIAS_PEDIDO_PENDIENTE = 7;
