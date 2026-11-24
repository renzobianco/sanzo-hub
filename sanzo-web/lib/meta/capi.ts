import { getProducto } from "@/data/products";
import type { Totales } from "@/lib/carrito";
import { leerPedidoEnHub, urlSitio, type PedidoGuardado } from "@/lib/hub";
import type { DatosCheckout } from "@/lib/validacion";
import {
  contenidosDeLineas,
  datosDeContenidos,
  datosDeProducto,
  eventIdCompra,
  META_GRAPH_VERSION,
  META_PIXEL_ID,
  type ContenidoMeta,
  type DatosMeta,
  type EventoMeta,
  type EventoNavegador,
  type MetaPedido,
} from "./datos";
import { hash, normalizarCP, normalizarEmail, normalizarLugar, normalizarTelefonoAR, separarNombre, sha256 } from "./normalizar";

// API de Conversiones de Meta (CAPI): los mismos eventos del Pixel, pero desde el servidor, con el mismo
// event_id para que Meta los junte (deduplicación). La compra sale solo de acá, cuando Mercado Pago aprueba el pago.
// Variables: NEXT_PUBLIC_META_PIXEL_ID, META_CAPI_TOKEN y, para probar, META_TEST_EVENT_CODE.
// Nada de esto puede romper una compra: todo con try/catch y sin tirar errores para afuera.

const dev = process.env.NODE_ENV !== "production";

export function capiActiva() {
  return !!(META_PIXEL_ID && process.env.META_CAPI_TOKEN?.trim());
}

/** user_data de Meta. Los datos personales van hasheados; fbp, fbc, IP y navegador van tal cual. */
export type UserData = Partial<{
  em: string;
  ph: string;
  fn: string;
  ln: string;
  ct: string;
  st: string;
  zp: string;
  country: string;
  external_id: string;
  fbp: string;
  fbc: string;
  client_ip_address: string;
  client_user_agent: string;
}>;

interface EventoServidor {
  evento: EventoMeta;
  eventId: string;
  url: string;
  userData: UserData;
  customData?: DatosMeta;
  /** Segundos Unix. Por defecto, ahora. */
  eventTime?: number;
}

function sinVacios<T extends Record<string, unknown>>(o: T): T {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== "")) as T;
}

/** Manda un evento a Meta. Nunca tira error: devuelve true si Meta lo recibió. */
export async function enviarEventoMeta({ evento, eventId, url, userData, customData, eventTime }: EventoServidor): Promise<boolean> {
  if (!capiActiva()) return false;
  const ahora = Math.floor(Date.now() / 1000);
  // Meta rechaza eventos de más de 7 días o del futuro.
  const cuando = eventTime && eventTime <= ahora && ahora - eventTime < 6 * 24 * 3600 ? eventTime : ahora;
  const test = process.env.META_TEST_EVENT_CODE?.trim();
  const body = {
    data: [
      sinVacios({
        event_name: evento,
        event_time: cuando,
        event_id: eventId,
        action_source: "website",
        event_source_url: url,
        user_data: sinVacios(userData),
        custom_data: customData && Object.keys(customData).length ? customData : undefined,
      }),
    ],
    ...(test ? { test_event_code: test } : {}),
  };
  if (dev)
    console.info(
      `[meta] servidor → ${evento} ${eventId} · user_data: ${Object.keys(body.data[0].user_data ?? {}).join(", ")} · custom_data: ${JSON.stringify(customData ?? {})}`,
    );
  try {
    const res = await fetch(
      `https://graph.facebook.com/${META_GRAPH_VERSION}/${META_PIXEL_ID}/events?access_token=${encodeURIComponent(process.env.META_CAPI_TOKEN!.trim())}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(8000) },
    );
    const texto = await res.text();
    if (!res.ok) {
      console.error(`[meta] ${evento} ${eventId} rechazado por Meta (${res.status}): ${texto.slice(0, 500)}`);
      return false;
    }
    if (dev) console.info(`[meta] servidor → ${evento} ${eventId}${test ? ` (test ${test})` : ""}: ${texto}`);
    return true;
  } catch (err) {
    console.error(`[meta] No se pudo mandar ${evento} ${eventId}`, err);
    return false;
  }
}

// --- Datos del request (IP, navegador, cookies) -------------------------------------------------

function leerCookies(req: Request): Record<string, string> {
  const out: Record<string, string> = {};
  for (const parte of (req.headers.get("cookie") ?? "").split(";")) {
    const i = parte.indexOf("=");
    if (i < 0) continue;
    const k = parte.slice(0, i).trim();
    try {
      out[k] = decodeURIComponent(parte.slice(i + 1).trim());
    } catch {
      out[k] = parte.slice(i + 1).trim();
    }
  }
  return out;
}

/** fbp / fbc válidos: "fb.1.<timestamp>.<algo>". */
const cookieFb = (v: string | undefined) => (v && v.length <= 400 && /^fb\.\d\.\d+\./.test(v) ? v : undefined);
const cookieUid = (v: string | undefined) => (v && /^[\w-]{8,64}$/.test(v) ? v : undefined);

export interface DatosNavegador {
  fbp?: string;
  fbc?: string;
  ip?: string;
  userAgent?: string;
  externalId?: string;
  utm?: Record<string, string>;
}

export function datosDelRequest(req: Request): DatosNavegador {
  const c = leerCookies(req);
  let utm: Record<string, string> | undefined;
  try {
    const o = c.sz_utm ? JSON.parse(c.sz_utm) : null;
    if (o && typeof o === "object")
      utm = Object.fromEntries(
        Object.entries(o as Record<string, unknown>)
          .filter(([k, v]) => /^(utm_[a-z]+|fbclid)$/.test(k) && typeof v === "string")
          .map(([k, v]) => [k, (v as string).slice(0, 200)]),
      );
  } catch {
    // cookie rota: sin UTM
  }
  return {
    fbp: cookieFb(c._fbp),
    fbc: cookieFb(c._fbc),
    ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || undefined,
    userAgent: req.headers.get("user-agent")?.slice(0, 500) || undefined,
    externalId: cookieUid(c.sz_uid),
    utm,
  };
}

function userDataNavegador(d: DatosNavegador): UserData {
  return {
    fbp: d.fbp,
    fbc: d.fbc,
    client_ip_address: d.ip,
    client_user_agent: d.userAgent,
    external_id: hash(d.externalId),
  };
}

export const userDataDelRequest = (req: Request) => userDataNavegador(datosDelRequest(req));

// --- Eventos del navegador (/api/meta) ---------------------------------------------------------

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : NaN);

/**
 * Lo que manda el navegador no se cree: los id tienen que ser productos reales, las cantidades van de 1 a 10,
 * los precios se acotan contra los de data/products.ts y el nombre sale de acá.
 */
export function limpiarDatosNavegador(evento: EventoNavegador, datos: unknown): DatosMeta | undefined {
  if (evento === "PageView" || evento === "Contact") return undefined;
  const o = datos && typeof datos === "object" ? (datos as Record<string, unknown>) : {};
  const personalizado = o.personalizado === true;

  if (evento === "ViewContent") {
    const id = Array.isArray(o.content_ids) ? o.content_ids[0] : undefined;
    const p = typeof id === "string" ? getProducto(id) : undefined;
    return p ? datosDeProducto(p) : undefined;
  }

  const contents: ContenidoMeta[] = [];
  for (const c of Array.isArray(o.contents) ? o.contents.slice(0, 30) : []) {
    const x = c && typeof c === "object" ? (c as Record<string, unknown>) : {};
    const p = typeof x.id === "string" ? getProducto(x.id) : undefined;
    if (!p || p.precio === null) continue;
    const quantity = Math.min(10, Math.max(1, Math.floor(num(x.quantity)) || 1));
    // Precio de lista más personalización ($5.000 por pieza): nunca menos de la mitad ni más del doble + extras.
    const precio = num(x.item_price);
    const item_price = precio >= p.precio / 2 && precio <= p.precio * 2 + 50000 ? Math.round(precio) : p.precio;
    contents.push({ id: p.id, quantity, item_price });
  }
  if (contents.length === 0) return undefined;
  const suma = contents.reduce((s, c) => s + c.item_price * c.quantity, 0);
  const v = num(o.value);
  // Con promos el valor puede ser menor que la suma de las piezas, nunca mayor.
  const value = v > 0 && v <= suma ? Math.round(v) : suma;
  return datosDeContenidos(contents, value, personalizado);
}

// --- Compra ------------------------------------------------------------------------------------

/** Bloque `meta` que se guarda con el pedido (lo usa el webhook de MP para mandar la compra). */
export function metaDelPedido(req: Request, numero: string, t: Totales): MetaPedido {
  const nav = datosDelRequest(req);
  const contents = contenidosDeLineas(t.lineas);
  const referer = req.headers.get("referer") ?? "";
  return {
    eventId: eventIdCompra(numero),
    ...nav,
    url: referer.startsWith(urlSitio()) || referer.startsWith(new URL(req.url).origin) ? referer.slice(0, 500) : `${urlSitio()}/checkout`,
    valor: t.subtotal - t.ahorro,
    envio: t.envio.tipo === "precio" ? t.envio.monto : 0,
    contents,
    numItems: contents.reduce((s, c) => s + c.quantity, 0),
    personalizado: t.lineas.some((l) => !!l.personalizacion),
  };
}

/** Matching avanzado: todo lo que dejó en el checkout, normalizado y hasheado, más lo del navegador. */
export function userDataDeCompra(c: DatosCheckout, m?: Partial<MetaPedido>): UserData {
  const { fn, ln } = separarNombre(c.nombre ?? "");
  return {
    em: hash(normalizarEmail(c.email ?? "")),
    ph: hash(normalizarTelefonoAR(c.celular ?? "")),
    fn: hash(fn),
    ln: hash(ln),
    ct: hash(normalizarLugar(c.localidad ?? "")),
    st: hash(normalizarLugar(c.provincia ?? "")),
    zp: hash(normalizarCP(c.codigoPostal ?? "")),
    country: sha256("ar"),
    ...userDataNavegador(m ?? {}),
  };
}

/**
 * Manda la compra (Purchase) de un pedido por la API de Conversiones. Nunca tira error.
 * - Webhook de MP (pago aprobado, primera vez): con el pedido ya leído, la fecha de aprobación y lo cobrado.
 * - Más adelante, desde el Hub para los "a coordinar" marcados como pagados a mano: enviarCompraMeta(numero).
 * El event_id es purchase_<número>: si se manda dos veces, Meta la cuenta una sola.
 */
export async function enviarCompraMeta(
  numero: string,
  opts: { pedido?: PedidoGuardado | null; fecha?: string | null; cobrado?: number } = {},
): Promise<boolean> {
  try {
    if (!capiActiva()) return false;
    const pedido = opts.pedido ?? (await leerPedidoEnHub(numero));
    if (!pedido) {
      console.warn(`[meta] Compra ${numero}: no está el pedido, no se manda`);
      return false;
    }
    const m = pedido.meta;
    const envio = m?.envio ?? 0;
    // Lo que vendimos: lo cobrado menos el envío (o, si no se sabe lo cobrado, lo guardado del pedido).
    const valor = opts.cobrado !== undefined && opts.cobrado > 0 ? opts.cobrado - envio : (m?.valor ?? pedido.total - envio);
    const contents = m?.contents ?? [];
    const customData: DatosMeta = {
      ...datosDeContenidos(contents, Math.max(0, Math.round(valor * 100) / 100), !!m?.personalizado),
      order_id: numero,
    };
    if (contents.length === 0) delete customData.content_ids;
    const fecha = opts.fecha ? Date.parse(opts.fecha) : NaN;
    return await enviarEventoMeta({
      evento: "Purchase",
      eventId: m?.eventId ?? eventIdCompra(numero),
      url: m?.url || `${urlSitio()}/checkout`,
      eventTime: Number.isFinite(fecha) ? Math.floor(fecha / 1000) : undefined,
      userData: userDataDeCompra(pedido.cliente, m),
      customData,
    });
  } catch (err) {
    console.error(`[meta] No se pudo mandar la compra ${numero}`, err);
    return false;
  }
}
