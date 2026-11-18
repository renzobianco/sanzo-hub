import nodemailer from "nodemailer";
import { puntoRetiro, retiro } from "@/data/envios";
import { sitio } from "@/data/products";
import { formatearPrecio } from "./formato";
import { urlSitio, type PedidoGuardado } from "./hub";

// Mail de confirmación al cliente cuando Mercado Pago aprueba el pago. Sale desde el Gmail de sanzo
// (GMAIL_USUARIO + GMAIL_CLAVE_APP, una "contraseña de aplicación" de Google, no la clave normal).
// Sin esas variables no se manda nada. Si falla, solo queda en los logs: el pago ya está registrado.

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function textoEntrega(p: PedidoGuardado) {
  const c = p.cliente;
  if (c.entrega === "retiro") return `Lo retirás en ${puntoRetiro(c.puntoRetiro).direccion}. ${retiro.horarios} Escribinos por WhatsApp para coordinar el día.`;
  if (c.entrega === "sucursal") return `Te lo mandamos a una sucursal de Correo Argentino en ${c.localidad}, ${c.provincia}. Te avisamos cuando lo despachemos.`;
  const piso = c.pisoDepto ? `, ${c.pisoDepto}` : "";
  return `Te lo mandamos a ${c.calle} ${c.altura}${piso}, ${c.localidad}, ${c.provincia}. Te avisamos cuando lo despachemos.`;
}

function armar(p: PedidoGuardado) {
  const nombre = p.cliente.nombre.trim().split(/\s+/)[0] || "";
  const entrega = textoEntrega(p);
  const whatsapp = sitio.whatsapp.numero ? `https://wa.me/${sitio.whatsapp.numero}?text=${encodeURIComponent(`Hola sanzo! Tengo una consulta por mi pedido ${p.numero}`)}` : "";
  const items = p.items.map((i) => ({
    titulo: `${i.cantidad} x ${i.nombre}`,
    detalle: [i.opcion, i.personalizacion && `Personalizado: ${i.personalizacion}`].filter(Boolean).join(" · "),
    precio: formatearPrecio(i.subtotal),
  }));

  const td = 'style="padding:10px 0;border-bottom:1px solid #E8DCCB;vertical-align:top"';
  const html = `
<div style="background:#F4EDE3;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#251D16">
  <div style="max-width:560px;margin:0 auto">
    <img src="${urlSitio()}/logo-sanzo.png" alt="sanzo" width="120" style="display:block;margin:0 auto 28px;width:120px;height:auto">
    <p style="margin:0;text-align:center;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#946037">Pago aprobado</p>
    <h1 style="margin:10px 0 0;text-align:center;font-weight:400;font-size:24px;letter-spacing:2px;text-transform:uppercase">Ya casi sale a pasear</h1>
    <p style="margin:24px 0 0;font-size:16px;line-height:1.6">Hola${nombre ? ` ${esc(nombre)}` : ""}, recibimos tu pago. Ya estamos preparando tu pedido con cuidado.</p>
    <p style="margin:20px 0 0;text-align:center"><span style="display:inline-block;border:1px solid #A39282;padding:8px 18px;font-size:13px;letter-spacing:2px;text-transform:uppercase">Pedido <span style="color:#946037">${esc(p.numero)}</span></span></p>
    <table style="border-collapse:collapse;width:100%;margin-top:24px;font-size:15px">
      ${items
        .map(
          (i) =>
            `<tr><td ${td}>${esc(i.titulo)}${i.detalle ? `<br><span style="font-size:13px;color:#6b5d50">${esc(i.detalle)}</span>` : ""}</td><td align="right" ${td}>${i.precio}</td></tr>`,
        )
        .join("")}
      ${p.ahorro > 0 ? `<tr><td ${td}>Promo</td><td align="right" ${td}>− ${formatearPrecio(p.ahorro)}</td></tr>` : ""}
      <tr><td ${td}>Envío</td><td align="right" ${td}>${esc(p.envio)}</td></tr>
      <tr><td style="padding:12px 0"><b>Total pagado</b></td><td align="right" style="padding:12px 0"><b>${formatearPrecio(p.total)}</b></td></tr>
    </table>
    <p style="margin:24px 0 0;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#946037">Entrega</p>
    <p style="margin:8px 0 0;font-size:15px;line-height:1.6">${esc(entrega)}</p>
    ${whatsapp ? `<p style="margin:28px 0 0;text-align:center"><a href="${whatsapp}" style="display:inline-block;background:#946037;color:#F4EDE3;text-decoration:none;padding:12px 24px;font-size:13px;letter-spacing:2px;text-transform:uppercase">Escribinos por WhatsApp</a></p>` : ""}
    <p style="margin:28px 0 0;font-size:15px;line-height:1.6">Gracias por elegir sanzo para sus paseos.</p>
    <p style="margin:24px 0 0;font-size:12px;color:#6b5d50;text-align:center">Si tenés alguna duda, respondé este mail o escribinos por Instagram @${esc(sitio.redes.instagram)}.</p>
  </div>
</div>`;

  const texto = [
    `Hola${nombre ? ` ${nombre}` : ""}, recibimos tu pago. Ya estamos preparando tu pedido con cuidado.`,
    "",
    `Pedido ${p.numero}`,
    ...items.map((i) => `${i.titulo}${i.detalle ? ` (${i.detalle})` : ""} — ${i.precio}`),
    ...(p.ahorro > 0 ? [`Promo: − ${formatearPrecio(p.ahorro)}`] : []),
    `Envío: ${p.envio}`,
    `Total pagado: ${formatearPrecio(p.total)}`,
    "",
    `Entrega: ${entrega}`,
    ...(whatsapp ? ["", `WhatsApp: ${whatsapp}`] : []),
    "",
    "Gracias por elegir sanzo para sus paseos.",
  ].join("\n");

  return { html, texto };
}

export async function mandarConfirmacionAlCliente(p: PedidoGuardado) {
  const usuario = process.env.GMAIL_USUARIO?.trim();
  const clave = process.env.GMAIL_CLAVE_APP?.replace(/\s+/g, "");
  const para = p.cliente.email?.trim();
  if (!usuario || !clave || !para) return;
  try {
    const transporte = nodemailer.createTransport({ service: "gmail", auth: { user: usuario, pass: clave } });
    const { html, texto } = armar(p);
    await transporte.sendMail({
      from: `sanzo <${usuario}>`,
      to: para,
      subject: `Recibimos tu pago · pedido ${p.numero}`,
      html,
      text: texto,
    });
  } catch (err) {
    console.error(`[mail-cliente] No se pudo mandar la confirmación del pedido ${p.numero} a ${para}`, err);
  }
}
