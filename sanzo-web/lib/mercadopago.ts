import type { Totales } from "./carrito";
import { textoPersonalizacion } from "./personalizacion";
import { textoOpcion } from "./combos";
import type { DatosCheckout } from "./validacion";
import { detalleEnvio } from "./formato";

/** true si hay credenciales de Mercado Pago cargadas (variable MP_ACCESS_TOKEN en Vercel). */
export function pagoOnlineActivo() {
  return !!process.env.MP_ACCESS_TOKEN;
}

/** Se puede cobrar online si el envío tiene precio definido (o es gratis). "A cotizar" → le escribimos. */
export function sePuedeCobrar(t: Totales) {
  return t.envio.tipo === "gratis" || t.envio.tipo === "precio" || t.envio.tipo === "retiro";
}

/**
 * Crea una preferencia de Checkout Pro y devuelve el link de pago (init_point).
 * En esa pantalla el cliente paga con tarjeta de crédito/débito (sin cuenta) o con su cuenta de MP.
 * Docs: https://www.mercadopago.com.ar/developers/es/reference/preferences/_checkout_preferences/post
 */
export async function crearPreferencia(numero: string, c: DatosCheckout, t: Totales, origen: string): Promise<string> {
  const porLinea = t.lineas.map((l) => ({
    id: l.productoId,
    title: [
      l.producto.nombre,
      textoOpcion(l.producto, l.opcion),
      l.personalizacion ? `Personalizado: ${textoPersonalizacion(l.personalizacion)}` : "",
    ]
      .filter(Boolean)
      .join(" · "),
    quantity: l.cantidad,
    unit_price: l.unitario,
    currency_id: "ARS",
  }));
  // MP no acepta ítems negativos: si hay promos, los productos van en una sola línea con el ahorro ya restado.
  const items =
    t.ahorro > 0
      ? [
          {
            id: "pedido",
            title: `${porLinea.map((i) => `${i.quantity} x ${i.title}`).join(" + ")} (promo: − $${t.ahorro})`.slice(0, 250),
            quantity: 1,
            unit_price: t.subtotal - t.ahorro,
            currency_id: "ARS",
          },
        ]
      : porLinea;
  if (t.envio.tipo === "precio" && t.envio.monto > 0) {
    items.push({ id: "envio", title: `Envío (${detalleEnvio(t.envio)})`, quantity: 1, unit_price: t.envio.monto, currency_id: "ARS" });
  }

  const [nombre, ...apellido] = c.nombre.trim().split(/\s+/);
  const celular = c.celular.replace(/\D/g, "");
  const volver = (estado: string) => `${origen}/gracias?pedido=${encodeURIComponent(numero)}&estado=${estado}`;

  const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      // Evita crear dos preferencias si el pedido se reintenta.
      "X-Idempotency-Key": numero,
    },
    body: JSON.stringify({
      items,
      external_reference: numero,
      statement_descriptor: "SANZO",
      payer: {
        name: nombre,
        surname: apellido.join(" "),
        email: c.email.trim(),
        phone: { area_code: "", number: celular },
        identification: { type: "DNI", number: c.dni.replace(/\D/g, "") },
      },
      back_urls: { success: volver("aprobado"), pending: volver("pendiente"), failure: volver("rechazado") },
      auto_return: "approved",
      // MP avisa acá cada cambio del pago; con eso el pedido se pasa solo a ventas del Hub.
      notification_url: `${origen}/api/mp-webhook`,
    }),
  });
  if (!res.ok) throw new Error(`Mercado Pago ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { init_point?: string };
  if (!data.init_point) throw new Error("Mercado Pago no devolvió init_point");
  return data.init_point;
}

/** Public Key de Mercado Pago (formulario de tarjeta dentro de la web). Vacío → solo el botón de Mercado Pago. */
export function clavePublicaMP() {
  return (process.env.MP_PUBLIC_KEY || process.env.NEXT_PUBLIC_MP_PUBLIC_KEY || "").trim();
}

/** Lo que manda el formulario de tarjeta (Card Payment Brick) al tocar Pagar. */
export interface DatosTarjeta {
  token: string;
  payment_method_id: string;
  issuer_id?: string | number;
  installments: number;
  payer?: { email?: string; identification?: { type?: string; number?: string } };
}

export type ResultadoTarjeta = { estado: "aprobado" | "pendiente" | "rechazado"; mensaje?: string };

/** Por qué no pasó la tarjeta, en criollo (status_detail de MP). */
const RECHAZOS: Record<string, string> = {
  cc_rejected_bad_filled_card_number: "Revisá el número de la tarjeta.",
  cc_rejected_bad_filled_date: "Revisá la fecha de vencimiento.",
  cc_rejected_bad_filled_security_code: "Revisá el código de seguridad.",
  cc_rejected_bad_filled_other: "Revisá los datos de la tarjeta.",
  cc_rejected_insufficient_amount: "La tarjeta no tiene saldo suficiente.",
  cc_rejected_call_for_authorize: "Tenés que autorizar el pago con el banco de tu tarjeta.",
  cc_rejected_card_disabled: "La tarjeta no está activa. Llamá a tu banco para activarla.",
  cc_rejected_duplicated_payment: "Ya hiciste un pago por este monto. Si querés pagar de nuevo, usá otra tarjeta.",
  cc_rejected_max_attempts: "Llegaste al límite de intentos. Probá con otra tarjeta.",
  cc_rejected_invalid_installments: "La tarjeta no acepta esas cuotas. Probá con otras.",
};

/**
 * Cobra con la tarjeta cargada en la web (Checkout API). El monto sale del pedido guardado, nunca del navegador.
 * El webhook recibe el aviso igual que con Checkout Pro (external_reference = número de pedido).
 * Docs: https://www.mercadopago.com.ar/developers/es/reference/payments/_payments/post
 */
export async function cobrarConTarjeta(numero: string, total: number, tarjeta: DatosTarjeta, emailPedido: string, origen: string): Promise<ResultadoTarjeta> {
  const res = await fetch("https://api.mercadopago.com/v1/payments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      // Una clave por intento: cada token de tarjeta sirve una sola vez.
      "X-Idempotency-Key": `${numero}-${tarjeta.token}`.slice(0, 64),
    },
    body: JSON.stringify({
      transaction_amount: total,
      token: tarjeta.token,
      description: `Pedido ${numero} · sanzo`,
      installments: Number(tarjeta.installments) || 1,
      payment_method_id: tarjeta.payment_method_id,
      ...(tarjeta.issuer_id ? { issuer_id: Number(tarjeta.issuer_id) } : {}),
      payer: {
        email: tarjeta.payer?.email || emailPedido,
        ...(tarjeta.payer?.identification?.number ? { identification: tarjeta.payer.identification } : {}),
      },
      external_reference: numero,
      statement_descriptor: "SANZO",
      notification_url: `${origen}/api/mp-webhook`,
    }),
  });
  const data = (await res.json().catch(() => ({}))) as { status?: string; status_detail?: string; message?: string };
  if (!res.ok) {
    console.error(`[tarjeta] Mercado Pago ${res.status} en ${numero}:`, data);
    return { estado: "rechazado", mensaje: "No pudimos procesar la tarjeta. Revisá los datos o probá con otra." };
  }
  if (data.status === "approved") return { estado: "aprobado" };
  if (data.status === "in_process" || data.status === "pending" || data.status === "authorized") return { estado: "pendiente" };
  return { estado: "rechazado", mensaje: RECHAZOS[data.status_detail ?? ""] ?? "El pago no pasó. Probá con otra tarjeta o pagá con Mercado Pago." };
}
