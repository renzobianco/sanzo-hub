import { waitUntil } from "@vercel/functions";
import { capiActiva, enviarEventoMeta, limpiarDatosNavegador, userDataDelRequest } from "@/lib/meta/capi";
import { EVENTOS_NAVEGADOR, type EventoNavegador } from "@/lib/meta/datos";
import { urlSitio } from "@/lib/hub";

export const runtime = "nodejs";

// El navegador manda acá cada evento del Pixel (lib/meta/cliente.ts) con el mismo event_id, y sale también
// por la API de Conversiones: si un bloqueador frena el Pixel, Meta igual lo recibe. Purchase no entra
// (lo manda solo el webhook de Mercado Pago). Se responde enseguida; el envío a Meta sigue en segundo plano.

const vacio = (status = 204) => new Response(null, { status });

export async function POST(req: Request) {
  if (!capiActiva()) return vacio();
  const origen = new URL(req.url);
  // Solo desde nuestra web.
  const origin = req.headers.get("origin");
  if (origin && origin !== origen.origin && origin !== urlSitio()) return vacio(403);

  const texto = await req.text().catch(() => "");
  if (!texto || texto.length > 8000) return vacio(400);
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(texto);
  } catch {
    return vacio(400);
  }
  if (!body || typeof body !== "object") return vacio(400);

  const evento = body.evento as EventoNavegador;
  if (!EVENTOS_NAVEGADOR.includes(evento)) return vacio(400);
  const eventId = typeof body.eventId === "string" && /^[\w.:-]{8,80}$/.test(body.eventId) ? body.eventId : null;
  if (!eventId) return vacio(400);

  // La página tiene que ser de esta web; si no, la portada.
  let url = `${urlSitio()}/`;
  if (typeof body.url === "string" && body.url.length <= 1000) {
    try {
      const u = new URL(body.url);
      if (u.host === origen.host || u.origin === urlSitio()) url = u.toString();
    } catch {
      // url rota: queda la portada
    }
  }

  waitUntil(
    enviarEventoMeta({
      evento,
      eventId,
      url,
      userData: userDataDelRequest(req),
      customData: limpiarDatosNavegador(evento, body.datos),
    }),
  );
  return vacio();
}
