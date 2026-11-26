import { NextResponse } from "next/server";
import { leerPedidoEnHub } from "@/lib/hub";
import { cobrarConTarjeta, pagoOnlineActivo, type DatosTarjeta, type ResultadoTarjeta } from "@/lib/mercadopago";

export const runtime = "nodejs";

// Pago con la tarjeta cargada en el checkout (sin salir de la web). El pedido ya existe (lo creó /api/pedido):
// de ahí sale el total. Lo que pasa después (ventas en el Hub, avisos, mail, Meta) lo hace /api/mp-webhook.

type Respuesta = ({ ok: true } & ResultadoTarjeta) | { ok: false; error: string };

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { numero?: unknown; tarjeta?: Partial<DatosTarjeta> } | null;
  const numero = typeof body?.numero === "string" ? body.numero : "";
  const t = body?.tarjeta;
  if (!/^SZ-[A-Z0-9]{1,10}$/.test(numero) || !t || typeof t.token !== "string" || typeof t.payment_method_id !== "string") {
    return NextResponse.json<Respuesta>({ ok: false, error: "Faltan datos del pago." }, { status: 400 });
  }
  if (!pagoOnlineActivo()) return NextResponse.json<Respuesta>({ ok: false, error: "El pago con tarjeta no está disponible." }, { status: 503 });

  const pedido = await leerPedidoEnHub(numero).catch((err) => (console.error(`[tarjeta] No se pudo leer ${numero}`, err), null));
  if (!pedido) return NextResponse.json<Respuesta>({ ok: false, error: "No encontramos tu pedido. Probá de nuevo." }, { status: 404 });
  if (pedido.estado === "pagado") return NextResponse.json<Respuesta>({ ok: true, estado: "aprobado" });
  if (pedido.envioACotizar || !(pedido.total > 0)) {
    return NextResponse.json<Respuesta>({ ok: false, error: "Este pedido no se puede pagar online. Te escribimos." }, { status: 400 });
  }

  const tarjeta: DatosTarjeta = {
    token: t.token.slice(0, 200),
    payment_method_id: t.payment_method_id.slice(0, 40),
    issuer_id: t.issuer_id,
    installments: Number(t.installments) || 1,
    payer: t.payer,
  };
  const r = await cobrarConTarjeta(numero, pedido.total, tarjeta, pedido.cliente.email, new URL(req.url).origin);
  return NextResponse.json<Respuesta>({ ok: true, ...r });
}
