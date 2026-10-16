import type { Totales } from "./carrito";
import { textoPersonalizacion } from "./personalizacion";
import type { DatosCheckout } from "./validacion";

/** true si hay credenciales de Mercado Pago cargadas (variable MP_ACCESS_TOKEN en Vercel). */
export function pagoOnlineActivo() {
  return !!process.env.MP_ACCESS_TOKEN;
}

/** Se puede cobrar online si el envío tiene precio definido (o es gratis). "A cotizar" → le escribimos. */
export function sePuedeCobrar(t: Totales) {
  return t.envio.tipo === "gratis" || t.envio.tipo === "precio";
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
      l.opcion && l.producto.opcion ? `${l.producto.opcion.nombre} ${l.opcion}` : "",
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
    items.push({ id: "envio", title: `Envío (${t.envio.zona.nombre})`, quantity: 1, unit_price: t.envio.monto, currency_id: "ARS" });
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
    }),
  });
  if (!res.ok) throw new Error(`Mercado Pago ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { init_point?: string };
  if (!data.init_point) throw new Error("Mercado Pago no devolvió init_point");
  return data.init_point;
}
