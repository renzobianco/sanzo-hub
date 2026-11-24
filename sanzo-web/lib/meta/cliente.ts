import { getProducto } from "@/data/products";
import { datosDeProducto, META_PIXEL_ID, type DatosMeta, type EventoMeta } from "./datos";

// Eventos de Meta desde el navegador: un solo lugar. Cada evento sale por el Pixel (fbq) y, con el mismo
// event_id, por el servidor (/api/meta → API de Conversiones). Meta junta los dos (deduplicación).
// Sin NEXT_PUBLIC_META_PIXEL_ID no hace nada.

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

const dev = process.env.NODE_ENV !== "production";

function nuevoId() {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  }
}

/** Al Pixel. Si todavía no cargó el código base (se carga después de la página), reintenta un rato. */
function alPixel(evento: EventoMeta, datos: DatosMeta, eventID: string, intento = 0) {
  if (window.fbq) {
    try {
      window.fbq("track", evento, datos, { eventID });
    } catch {
      // el Pixel nunca rompe la página
    }
  } else if (intento < 50) {
    window.setTimeout(() => alPixel(evento, datos, eventID, intento + 1), 100);
  }
}

function alServidor(cuerpo: string) {
  try {
    const blob = new Blob([cuerpo], { type: "application/json" });
    if (navigator.sendBeacon?.("/api/meta", blob)) return;
  } catch {
    // sigue con fetch
  }
  fetch("/api/meta", { method: "POST", body: cuerpo, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => {});
}

/**
 * Manda un evento a Meta (Pixel + servidor con el mismo event_id). Devuelve el event_id.
 * soloNavegador: solo el Pixel (el Purchase de /gracias: el del servidor lo manda el webhook de MP).
 */
export function trackMeta(evento: EventoMeta, datos: DatosMeta = {}, opts: { eventId?: string; soloNavegador?: boolean } = {}) {
  if (!META_PIXEL_ID || typeof window === "undefined") return;
  const eventId = opts.eventId ?? nuevoId();
  alPixel(evento, datos, eventId);
  const servidor = !opts.soloNavegador && evento !== "Purchase";
  if (servidor) alServidor(JSON.stringify({ evento, eventId, url: window.location.href, datos }));
  if (dev) console.info(`[meta] ${servidor ? "navegador + servidor" : "solo navegador"} → ${evento} ${eventId}`, datos);
  return eventId;
}

// ViewContent: una vez por producto mientras la página está abierta (el carrusel de combos pasa varias veces).
const vistos = new Set<string>();

export function verContenido(productoId: string) {
  if (vistos.has(productoId)) return;
  const p = getProducto(productoId);
  if (!p) return;
  vistos.add(productoId);
  trackMeta("ViewContent", datosDeProducto(p));
}
