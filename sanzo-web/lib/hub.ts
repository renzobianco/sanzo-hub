import { getProducto, personalizacion, type Producto } from "@/data/products";
import type { Totales } from "./carrito";
import { textoOpcion } from "./combos";
import { detalleEnvio, textoEnvio } from "./formato";
import { imagenesPersonalizacion, textoPersonalizacion } from "./personalizacion";
import type { DatosCheckout } from "./validacion";

// Sanzo Hub (la app interna) comparte una base Supabase. Cada pedido de la web se guarda en
// `sanzo_web_orders` con las ventas ya traducidas a los productos del Hub; cuando se confirma el
// pago, la función aplicar_pedido_web (sanzo-hub/supabase/migrations/005_web_orders.sql) crea las
// ventas y descuenta el stock. Sin SUPABASE_URL / SUPABASE_ANON_KEY en Vercel, no se hace nada.

/** Ids de la web que en el Hub se llaman distinto. El resto coincide (arnes, correa, collar…). */
const ID_HUB: Record<string, string> = { "kit-completo": "kit", "poo-bag": "portabolsa" };

export type EstadoPedidoWeb = "pendiente_pago" | "a_coordinar" | "pagado" | "rechazado" | "revisar" | "cancelado";

/** Venta tal cual la guarda el Hub en `sanzo_sales` (fecha y createdAt los pone la base al aplicar). */
interface VentaHub {
  id: string;
  productId: string;
  qty: number;
  unitPrice: number;
  shipping: number;
  channel: "Tienda online";
  payment: string;
  status: "Pagado";
  clientName: string;
  clientHandle: string;
  notes: string;
}

/** Dirección pública de la web (para que el Hub muestre las fotos de las piezas). */
function urlSitio() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "https://sanzo-web.vercel.app")
  ).replace(/\/+$/, "");
}

export function hubActivo() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
}

const centavos = (n: number) => Math.round(n * 100) / 100;

/** Productos del Hub que salen de un producto de la web, con su peso para repartir el precio. */
function piezasHub(p: Producto): { id: string; peso: number }[] {
  if (p.tipo !== "combo") return [{ id: ID_HUB[p.id] ?? p.id, peso: 1 }];
  // Combo: cada pieza por separado, el precio repartido según lo que vale suelta.
  return p.incluye
    .map(getProducto)
    .filter((x): x is Producto => !!x)
    .map((x) => ({ id: ID_HUB[x.id] ?? x.id, peso: x.precio ?? 1 }));
}

function ventasDelPedido(numero: string, c: DatosCheckout, t: Totales, pagoOnline: boolean): VentaHub[] {
  // Las promos (combos armados con sueltas) se reparten en proporción entre todo lo vendido.
  const factor = t.subtotal > 0 ? (t.subtotal - t.ahorro) / t.subtotal : 1;
  const ventas: VentaHub[] = [];
  for (const l of t.lineas) {
    const piezas = piezasHub(l.producto);
    const pesoTotal = piezas.reduce((s, x) => s + x.peso, 0);
    const detalle = [
      l.producto.nombre,
      l.opcion ? textoOpcion(l.producto, l.opcion) : "",
      l.personalizacion ? `Personalizado: ${textoPersonalizacion(l.personalizacion)}` : "",
    ]
      .filter(Boolean)
      .join(" · ");
    for (const x of piezas) {
      ventas.push({
        id: `${numero}-${ventas.length + 1}`,
        productId: x.id,
        qty: l.cantidad,
        unitPrice: centavos(l.unitario * factor * (x.peso / pesoTotal)),
        shipping: 0,
        channel: "Tienda online",
        payment: pagoOnline ? "Mercado Pago" : "Otro",
        status: "Pagado",
        clientName: c.nombre.trim(),
        clientHandle: "",
        notes: `Pedido web ${numero} · ${detalle}`,
      });
    }
  }
  if (ventas[0] && t.envio.tipo === "precio") ventas[0].shipping = t.envio.monto;
  return ventas;
}

/** Acepta la URL del proyecto como venga pegada: con o sin "/" final o "/rest/v1". */
function baseSupabase() {
  return process.env.SUPABASE_URL!.trim().replace(/\/+$/, "").replace(/\/rest\/v1$/, "");
}

async function supabase(path: string, body: unknown) {
  const key = process.env.SUPABASE_ANON_KEY!.trim();
  const res = await fetch(`${baseSupabase()}/rest/v1/${path}`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  const texto = await res.text();
  return texto ? JSON.parse(texto) : null;
}

/** Bucket público donde quedan las imágenes que suben para grabar (sanzo-hub/supabase/migrations/006_imagenes_pedidos.sql). */
export const BUCKET_IMAGENES = "sanzo-pedidos";

/** Sube la imagen original para grabar y devuelve su link público (el que se ve en el Hub). */
export async function subirImagenPedido(archivo: Blob, extension: string): Promise<string> {
  const key = process.env.SUPABASE_ANON_KEY!.trim();
  const mes = new Date().toISOString().slice(0, 7);
  const ruta = `${mes}/${crypto.randomUUID()}.${extension}`;
  const res = await fetch(`${baseSupabase()}/storage/v1/object/${BUCKET_IMAGENES}/${ruta}`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": archivo.type, "x-upsert": "false" },
    body: archivo,
  });
  if (!res.ok) throw new Error(`Supabase Storage ${res.status}: ${await res.text()}`);
  return `${baseSupabase()}/storage/v1/object/public/${BUCKET_IMAGENES}/${ruta}`;
}

/** ¿Este link es de una imagen subida por nosotros? (que no nos cuelen cualquier link en el pedido) */
export function esImagenNuestra(url: string) {
  return hubActivo() && url.startsWith(`${baseSupabase()}/storage/v1/object/public/${BUCKET_IMAGENES}/`);
}

/** Guarda el pedido en "Pedidos web" del Hub. Si falla, solo queda en los logs: el pedido ya salió por mail. */
export async function guardarPedidoEnHub(numero: string, c: DatosCheckout, t: Totales, linkPago?: string) {
  if (!hubActivo()) return;
  const zona = t.envio.tipo === "precio" || t.envio.tipo === "cotizar" ? ` (${detalleEnvio(t.envio)})` : "";
  const payload = {
    numero,
    createdAt: new Date().toISOString(),
    estado: (linkPago ? "pendiente_pago" : "a_coordinar") satisfies EstadoPedidoWeb,
    aplicado: false,
    pagoOnline: !!linkPago,
    cliente: c,
    items: t.lineas.map((l) => ({
      nombre: l.producto.nombre,
      opcion: l.opcion ? textoOpcion(l.producto, l.opcion) : "",
      personalizacion: l.personalizacion ? textoPersonalizacion(l.personalizacion) : "",
      // Imagen original para grabar (link público). Vacío si no se pudo subir: la manda por WhatsApp.
      imagen: l.personalizacion ? imagenesPersonalizacion(l.personalizacion).find((i) => i.url)?.url ?? "" : l.imagen ?? "",
      // Todas las imágenes a grabar (en kits con un diseño por pieza puede haber varias).
      imagenes: l.personalizacion ? imagenesPersonalizacion(l.personalizacion) : l.imagen ? [{ pieza: "Chapita", url: l.imagen }] : [],
      // Dónde va el parche en cada pieza: foto de la pieza + punto (x, y en % de la foto).
      ubicacion: Object.entries(l.personalizacion?.posiciones ?? {}).filter(([pieza]) => l.personalizacion?.piezas?.[pieza] !== null).map(([pieza, [x, y]]) => ({
        pieza: getProducto(pieza)?.nombre ?? pieza,
        foto: urlSitio() + (personalizacion.piezas[pieza]?.imagen ?? ""),
        x: Math.round(x * 1000) / 10,
        y: Math.round(y * 1000) / 10,
      })),
      cantidad: l.cantidad,
      subtotal: l.subtotal,
    })),
    subtotal: t.subtotal,
    ahorro: t.ahorro,
    envio: `${textoEnvio(t.envio)}${zona}`,
    envioACotizar: t.envio.tipo === "cotizar",
    total: t.total,
    ventas: ventasDelPedido(numero, c, t, !!linkPago),
  };
  try {
    await supabase("sanzo_web_orders", { id: numero, payload });
  } catch (err) {
    console.error(`[hub] No se pudo guardar el pedido ${numero} en el Hub`, err);
  }
}

/** Datos del pago de Mercado Pago que quedan guardados en el pedido. */
export interface PagoMP {
  id: string;
  estado: string;
  detalle: string;
  monto: number;
  medio: string;
  fecha: string;
}

/** Pago aprobado: pasa el pedido a ventas del Hub (descuenta stock). Devuelve lo que respondió la base. */
export async function aplicarPedidoEnHub(numero: string, pago: PagoMP): Promise<string> {
  return supabase("rpc/aplicar_pedido_web", { p_id: numero, p_pago: pago });
}

export async function estadoPedidoEnHub(numero: string, estado: EstadoPedidoWeb, pago: PagoMP): Promise<string> {
  return supabase("rpc/estado_pedido_web", { p_id: numero, p_estado: estado, p_pago: pago });
}
