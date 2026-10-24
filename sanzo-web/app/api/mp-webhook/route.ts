import { NextResponse } from "next/server";
import { aplicarPedidoEnHub, estadoPedidoEnHub, hubActivo, type PagoMP } from "@/lib/hub";

export const runtime = "nodejs";

// Aviso de Mercado Pago (notification_url de la preferencia). No se confía en lo que llega:
// con el id se consulta el pago a MP con nuestro token y de ahí sale el estado real.
// Responder con error hace que MP reintente más tarde.

interface PagoAPI {
  id: number;
  status: string;
  status_detail: string;
  external_reference: string | null;
  transaction_amount: number;
  payment_method_id: string;
  date_approved: string | null;
  date_created: string;
}

/** Estado del pedido según el estado del pago en MP. null → no cambia nada. */
function estadoPorPago(status: string) {
  if (status === "approved") return "pagado" as const;
  if (status === "pending" || status === "in_process" || status === "authorized") return "pendiente_pago" as const;
  if (status === "rejected" || status === "cancelled") return "rechazado" as const;
  return null; // refunded / charged_back: se resuelve a mano en el Hub.
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const body = (await req.json().catch(() => ({}))) as { type?: string; topic?: string; data?: { id?: string | number } };
  const tipo = body.type ?? body.topic ?? url.searchParams.get("type") ?? url.searchParams.get("topic");
  const id = body.data?.id ?? url.searchParams.get("data.id") ?? url.searchParams.get("id");
  if (tipo !== "payment" || !id || !process.env.MP_ACCESS_TOKEN || !hubActivo()) return NextResponse.json({ ok: true });

  const res = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(String(id))}`, {
    headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
  });
  if (res.status === 404) return NextResponse.json({ ok: true });
  if (!res.ok) {
    console.error(`[mp-webhook] No se pudo leer el pago ${id}: ${res.status}`);
    return NextResponse.json({ ok: false }, { status: 502 });
  }
  const p = (await res.json()) as PagoAPI;
  const numero = p.external_reference;
  const estado = estadoPorPago(p.status);
  if (!numero || !estado) return NextResponse.json({ ok: true });

  const pago: PagoMP = {
    id: String(p.id),
    estado: p.status,
    detalle: p.status_detail,
    monto: p.transaction_amount,
    medio: p.payment_method_id,
    fecha: p.date_approved ?? p.date_created,
  };
  try {
    const r = estado === "pagado" ? await aplicarPedidoEnHub(numero, pago) : await estadoPedidoEnHub(numero, estado, pago);
    if (r !== "ok" && r !== "ya_aplicado") console.warn(`[mp-webhook] Pedido ${numero} (pago ${p.id}, ${p.status}): ${r}`);
  } catch (err) {
    console.error(`[mp-webhook] No se pudo actualizar el pedido ${numero} en el Hub`, err);
    return NextResponse.json({ ok: false }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
