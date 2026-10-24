import { getProducto, type Producto } from "@/data/products";
import type { Totales } from "./carrito";
import { textoOpcion } from "./combos";
import { textoEnvio } from "./formato";
import { textoPersonalizacion } from "./personalizacion";
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

/** Guarda el pedido en "Pedidos web" del Hub. Si falla, solo queda en los logs: el pedido ya salió por mail. */
export async function guardarPedidoEnHub(numero: string, c: DatosCheckout, t: Totales, linkPago?: string) {
  if (!hubActivo()) return;
  const zona = t.envio.tipo === "precio" || t.envio.tipo === "cotizar" ? ` (${t.envio.zona.nombre})` : "";
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
