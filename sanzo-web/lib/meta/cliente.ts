import { getProducto } from "@/data/products";
import { datosDeProducto, META_PIXEL_ID, type DatosMeta, type EventoMeta } from "./datos";

// Eventos de Meta desde el navegador: un solo lugar. Cada evento sale primero por el Pixel (fbq) y después,
// con el mismo event_id y el mismo nombre, por el servidor (/api/meta → API de Conversiones). Meta junta los dos
// (deduplicación) y se queda con el del navegador.
// Sin NEXT_PUBLIC_META_PIXEL_ID no hace nada.

declare global {
  interface Window {
    /** callMethod aparece cuando fbevents.js terminó de cargar (antes, fbq solo encola). */
    fbq?: ((...args: unknown[]) => void) & { callMethod?: unknown };
  }
}

/** Con el Pixel cargado, la copia del servidor sale este tiempo después (así Meta recibe primero la del navegador). */
const RETRASO_SERVIDOR = 1500;
/** Si el Pixel no carga en este tiempo (bloqueador), la del servidor sale igual. */
const ESPERA_PIXEL = 3000;

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

// Copias para el servidor que todavía no salieron, y los event_id que ya salieron (nunca dos veces el mismo).
const pendientes = new Map<string, { cuerpo: string; timer: number }>();
const enviados = new Set<string>();

function despachar(eventId: string) {
  const p = pendientes.get(eventId);
  if (!p) return;
  pendientes.delete(eventId);
  window.clearTimeout(p.timer);
  if (enviados.has(eventId)) return;
  enviados.add(eventId);
  alServidor(p.cuerpo);
}

const pixelCargado = () => typeof window.fbq?.callMethod === "function";

/**
 * La copia del servidor sale después de la del navegador: con el Pixel cargado, RETRASO_SERVIDOR después;
 * si el Pixel está cargando, espera a que cargue (y lo mismo); si en ESPERA_PIXEL no cargó (bloqueador), sale igual.
 */
function alServidorDespues(eventId: string, cuerpo: string) {
  if (enviados.has(eventId) || pendientes.has(eventId)) return;
  escucharSalida();
  const inicio = Date.now();
  const entrada = { cuerpo, timer: 0 };
  pendientes.set(eventId, entrada);
  const revisar = () => {
    if (pixelCargado()) entrada.timer = window.setTimeout(() => despachar(eventId), RETRASO_SERVIDOR);
    else if (Date.now() - inicio >= ESPERA_PIXEL) despachar(eventId);
    else entrada.timer = window.setTimeout(revisar, 100);
  };
  revisar();
}

// Antes de salir de la página (o de pasar a otra app en el celu), sale todo lo pendiente.
let escuchando = false;
function escucharSalida() {
  if (escuchando) return;
  escuchando = true;
  const vaciar = () => [...pendientes.keys()].forEach(despachar);
  window.addEventListener("pagehide", vaciar);
  document.addEventListener("visibilitychange", () => document.visibilityState === "hidden" && vaciar());
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
  if (servidor) alServidorDespues(eventId, JSON.stringify({ evento, eventId, url: window.location.href, datos }));
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
