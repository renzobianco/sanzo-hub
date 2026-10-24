import { NextResponse } from "next/server";
import { calcularTotales, type LineaCarrito, type Totales } from "@/lib/carrito";
import { formatearPrecio, textoEnvio } from "@/lib/formato";
import { crearPreferencia, pagoOnlineActivo, sePuedeCobrar } from "@/lib/mercadopago";
import type { PedidoEntrada, PedidoRespuesta } from "@/lib/pedido";
import { esImagenNuestra, guardarPedidoEnHub } from "@/lib/hub";
import { textoPersonalizacion, type Personalizacion } from "@/lib/personalizacion";
import { textoOpcion } from "@/lib/combos";
import { validarCheckout, type DatosCheckout } from "@/lib/validacion";

export const runtime = "nodejs";

function numeroPedido() {
  // Corto y ordenable: SZ- + timestamp en base 36 (ej. SZ-MG8K2Q).
  return `SZ-${Date.now().toString(36).toUpperCase().slice(-6)}`;
}

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function str(v: unknown, max = 300) {
  return typeof v === "string" ? v.slice(0, max) : "";
}

/** Solo recorta y tipa; la validación real la hace resolverLineas (descarta la línea si no es válida). */
function limpiarPersonalizacion(p: unknown): Personalizacion | undefined {
  if (!p || typeof p !== "object") return undefined;
  const o = p as Record<string, unknown>;
  const imagenUrl = str(o.imagenUrl, 400);
  return {
    forma: str(o.forma, 30),
    formaOtra: typeof o.formaOtra === "string" ? str(o.formaOtra, 120) : undefined,
    material: str(o.material, 30),
    color: str(o.color, 30),
    ancho: Number(o.ancho),
    alto: Number(o.alto),
    modo: o.modo === "imagen" ? "imagen" : "nombre",
    nombre: str(o.nombre, 40),
    telefono: typeof o.telefono === "string" ? str(o.telefono, 30) : undefined,
    fuente: str(o.fuente, 30),
    // Solo links de imágenes que subimos nosotros.
    imagenUrl: imagenUrl && esImagenNuestra(imagenUrl) ? imagenUrl : undefined,
  };
}

function limpiarCliente(c: Partial<DatosCheckout> | undefined): DatosCheckout {
  return {
    nombre: str(c?.nombre),
    dni: str(c?.dni, 20),
    email: str(c?.email),
    celular: str(c?.celular, 40),
    entrega: c?.entrega === "sucursal" ? "sucursal" : "domicilio",
    calle: str(c?.calle),
    altura: str(c?.altura, 20),
    pisoDepto: str(c?.pisoDepto, 60),
    referencia: str(c?.referencia),
    provincia: str(c?.provincia, 80),
    gba: str(c?.gba, 4),
    localidad: str(c?.localidad, 120),
    codigoPostal: str(c?.codigoPostal, 12),
    notas: str(c?.notas, 1000),
  };
}

function armarMail(numero: string, c: DatosCheckout, t: Totales, pago: string) {
  const entrega = c.entrega === "domicilio" ? "Envío a domicilio" : "Retiro en sucursal de Correo Argentino";
  const direccion =
    c.entrega === "domicilio"
      ? [`${c.calle} ${c.altura}`, c.pisoDepto && `Piso/depto: ${c.pisoDepto}`, c.referencia && `Referencia: ${c.referencia}`]
          .filter(Boolean)
          .join(" · ")
      : "—";
  const zona = t.envio.tipo === "precio" || t.envio.tipo === "cotizar" ? ` (${t.envio.zona.nombre})` : "";
  const envio = `${textoEnvio(t.envio)}${zona}`;
  const gba = c.provincia === "Buenos Aires" ? ` · GBA: ${c.gba === "si" ? "sí" : "no"}` : "";

  const filas: [string, string][] = [
    ["Nombre", c.nombre],
    ["DNI", c.dni],
    ["Email", c.email],
    ["Celular", c.celular],
    ["Entrega", entrega],
    ["Dirección", direccion],
    ["Provincia", c.provincia + gba],
    ["Localidad", c.localidad],
    ["Código postal", c.codigoPostal.toUpperCase()],
    ["Notas", c.notas || "—"],
    ["Pago", pago],
  ];

  const items = t.lineas.map((l) => ({
    nombre:
      l.producto.nombre +
      (l.opcion ? ` (${textoOpcion(l.producto, l.opcion)})` : "") +
      (l.personalizacion ? ` — PERSONALIZADO: ${textoPersonalizacion(l.personalizacion)}` : ""),
    imagen: l.personalizacion?.modo === "imagen" ? l.personalizacion.imagenUrl ?? "FALTA LA IMAGEN: la manda por WhatsApp" : "",
    cantidad: l.cantidad,
    unitario: formatearPrecio(l.unitario),
    subtotal: formatearPrecio(l.subtotal),
  }));

  const td = 'style="padding:6px 10px;border-bottom:1px solid #E8DCCB;vertical-align:top"';
  const html = `
  <div style="font-family:Arial,sans-serif;color:#251D16;max-width:640px">
    <h2 style="font-weight:400;letter-spacing:2px">Nuevo pedido ${esc(numero)}</h2>
    <table style="border-collapse:collapse;width:100%;margin-bottom:20px">
      ${filas.map(([k, v]) => `<tr><td ${td}><b>${esc(k)}</b></td><td ${td}>${esc(v)}</td></tr>`).join("")}
    </table>
    <table style="border-collapse:collapse;width:100%">
      <tr><th align="left" ${td}>Producto</th><th ${td}>Cant.</th><th align="right" ${td}>Unitario</th><th align="right" ${td}>Subtotal</th></tr>
      ${items
        .map(
          (i) =>
            `<tr><td ${td}>${esc(i.nombre)}${
              i.imagen.startsWith("https://") ? `<br><a href="${esc(i.imagen)}">Ver imagen para grabar</a>` : i.imagen ? `<br><b>${esc(i.imagen)}</b>` : ""
            }</td><td align="center" ${td}>${i.cantidad}</td><td align="right" ${td}>${i.unitario}</td><td align="right" ${td}>${i.subtotal}</td></tr>`,
        )
        .join("")}
      <tr><td colspan="3" align="right" ${td}>Subtotal</td><td align="right" ${td}>${formatearPrecio(t.subtotal)}</td></tr>
      ${t.descuentos.map((d) => `<tr><td colspan="3" align="right" ${td}>Armó el ${esc(d.texto)}</td><td align="right" ${td}>− ${formatearPrecio(d.monto)}</td></tr>`).join("")}
      <tr><td colspan="3" align="right" ${td}>Envío</td><td align="right" ${td}>${esc(envio)}</td></tr>
      <tr><td colspan="3" align="right" ${td}><b>Total</b></td><td align="right" ${td}><b>${formatearPrecio(t.total)}${
        t.envio.tipo === "cotizar" ? " + envío" : ""
      }</b></td></tr>
    </table>
  </div>`;

  const texto = [
    `Nuevo pedido ${numero}`,
    "",
    ...filas.map(([k, v]) => `${k}: ${v}`),
    "",
    ...items.map((i) => `${i.cantidad} x ${i.nombre} — ${i.subtotal}${i.imagen ? `\n   Imagen para grabar: ${i.imagen}` : ""}`),
    `Subtotal: ${formatearPrecio(t.subtotal)}`,
    ...t.descuentos.map((d) => `Armó el ${d.texto}: − ${formatearPrecio(d.monto)}`),
    `Envío: ${envio}`,
    `Total: ${formatearPrecio(t.total)}${t.envio.tipo === "cotizar" ? " + envío" : ""}`,
  ].join("\n");

  return { html, texto };
}

export async function POST(req: Request) {
  let body: PedidoEntrada;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json<PedidoRespuesta>({ ok: false, error: "Pedido inválido." }, { status: 400 });
  }

  // Honeypot: los bots completan todo. Respondemos ok sin hacer nada.
  if (body.empresa) return NextResponse.json<PedidoRespuesta>({ ok: true, numero: numeroPedido() });

  const cliente = limpiarCliente(body.cliente);
  const errores = validarCheckout(cliente);
  if (Object.keys(errores).length > 0) {
    return NextResponse.json<PedidoRespuesta>({ ok: false, error: "Revisá los datos del formulario." }, { status: 400 });
  }

  const lineas: LineaCarrito[] = (Array.isArray(body.lineas) ? body.lineas : []).slice(0, 30).map((l) => ({
    key: "",
    productoId: str(l?.productoId, 60),
    opcion: str(l?.opcion, 80) || undefined,
    personalizacion: limpiarPersonalizacion(l?.personalizacion),
    cantidad: Number(l?.cantidad) || 1,
  }));

  const totales = calcularTotales(lineas, {
    provincia: cliente.provincia,
    enGBA: cliente.provincia === "Buenos Aires" ? cliente.gba === "si" : null,
  });
  if (totales.lineas.length === 0) {
    return NextResponse.json<PedidoRespuesta>({ ok: false, error: "El carrito está vacío." }, { status: 400 });
  }

  const numero = numeroPedido();

  // Pago online con Mercado Pago (Checkout Pro): tarjeta de crédito/débito o cuenta de MP.
  // Si no hay credenciales, el envío está "a cotizar" o MP falla, el pedido igual se registra y le escribimos.
  let linkPago: string | undefined;
  if (pagoOnlineActivo() && sePuedeCobrar(totales)) {
    try {
      linkPago = await crearPreferencia(numero, cliente, totales, new URL(req.url).origin);
    } catch (err) {
      console.error("[pedido] No se pudo crear el pago en Mercado Pago", err);
    }
  }
  const pago = linkPago
    ? "Online con Mercado Pago. Confirmá el cobro en tu cuenta de MP (referencia: número de pedido)."
    : "A coordinar: escribile con el link de pago.";
  const { html, texto } = armarMail(numero, cliente, totales, pago);

  const apiKey = process.env.RESEND_API_KEY;
  const destino = process.env.PEDIDOS_EMAIL;
  if (!apiKey || !destino) {
    console.log(`\n[pedido] RESEND_API_KEY o PEDIDOS_EMAIL sin configurar. Pedido recibido:\n${texto}\n`);
  } else {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: process.env.PEDIDOS_FROM || "sanzo <onboarding@resend.dev>",
          to: destino.split(",").map((s) => s.trim()).filter(Boolean),
          reply_to: cliente.email,
          subject: `Nuevo pedido ${numero} — ${cliente.nombre}`,
          html,
          text: texto,
        }),
      });
      if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
    } catch (err) {
      // Queda en los logs de Vercel para no perder el pedido.
      console.error("[pedido] Falló el envío del mail", err, `\n${texto}`);
      return NextResponse.json<PedidoRespuesta>(
        { ok: false, error: "No pudimos registrar el pedido. Probá de nuevo en un rato o escribinos por Instagram." },
        { status: 502 },
      );
    }
  }

  // Copia en "Pedidos web" del Hub (se pasa a ventas cuando se confirma el pago).
  await guardarPedidoEnHub(numero, cliente, totales, linkPago);

  // Sin credenciales de MP: link fijo del producto, solo si es un único producto (1 unidad), al precio
  // del link y sin envío a cobrar (el link de MP tiene precio fijo y no incluye el envío).
  const unica = totales.lineas.length === 1 && totales.lineas[0].cantidad === 1 ? totales.lineas[0] : null;
  const precioFijo = unica !== null && unica.unitario === unica.producto.precio;
  const linkFijo = unica && precioFijo && totales.envio.tipo === "gratis" ? unica.producto.linkPago || undefined : undefined;
  const redirigirA = linkPago ?? linkFijo;

  return NextResponse.json<PedidoRespuesta>({ ok: true, numero, redirigirA });
}
