import type { DatosCheckout } from "./validacion";

/** Lo que el checkout manda a /api/pedido. Los precios se recalculan en el servidor. */
export interface PedidoEntrada {
  cliente: DatosCheckout;
  lineas: { productoId: string; opcion?: string; cantidad: number }[];
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
