import type { Personalizacion } from "./personalizacion";
import type { DatosCheckout } from "./validacion";

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
  error?: string;
}

export const CLAVE_ULTIMO_PEDIDO = "sanzo-ultimo-pedido";
/** Datos del checkout guardados en el navegador del cliente, para no tener que cargarlos de nuevo. */
export const CLAVE_DATOS_CHECKOUT = "sanzo-datos-checkout";
/** Hasta cuándo ofrecemos "Terminar de pagar" un pedido que quedó sin pagar. */
export const DIAS_PEDIDO_PENDIENTE = 7;
