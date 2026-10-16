import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface ArrepentimientoRespuesta {
  ok: boolean;
  codigo?: string;
  error?: string;
}

function str(v: unknown, max = 300) {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** Botón de arrepentimiento (Res. 424/2020): registra el pedido, nos avisa por mail y devuelve un código de trámite. */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json<ArrepentimientoRespuesta>({ ok: false, error: "Pedido inválido." }, { status: 400 });
  }

  // Honeypot anti-spam.
  if (str(body.empresa)) return NextResponse.json<ArrepentimientoRespuesta>({ ok: true, codigo: "AR-000000" });

  const datos = {
    nombre: str(body.nombre, 120),
    email: str(body.email, 160),
    celular: str(body.celular, 40),
    pedido: str(body.pedido, 40),
    motivo: str(body.motivo, 1000),
  };
  if (!datos.nombre || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email) || !datos.pedido) {
    return NextResponse.json<ArrepentimientoRespuesta>({ ok: false, error: "Completá nombre, mail y número de pedido." }, { status: 400 });
  }

  // Código corto y ordenable: AR- + timestamp en base 36.
  const codigo = `AR-${Date.now().toString(36).toUpperCase().slice(-6)}`;
  const filas: [string, string][] = [
    ["Código de trámite", codigo],
    ["Nombre", datos.nombre],
    ["Email", datos.email],
    ["Celular", datos.celular || "—"],
    ["Número de pedido", datos.pedido],
    ["Motivo", datos.motivo || "—"],
  ];
  const texto = [`Pedido de arrepentimiento ${codigo}`, "", ...filas.map(([k, v]) => `${k}: ${v}`)].join("\n");

  const apiKey = process.env.RESEND_API_KEY;
  const destino = process.env.PEDIDOS_EMAIL;
  if (!apiKey || !destino) {
    console.log(`\n[arrepentimiento] RESEND_API_KEY o PEDIDOS_EMAIL sin configurar:\n${texto}\n`);
  } else {
    try {
      const td = 'style="padding:6px 10px;border-bottom:1px solid #E8DCCB"';
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: process.env.PEDIDOS_FROM || "sanzo <onboarding@resend.dev>",
          to: destino.split(",").map((s) => s.trim()).filter(Boolean),
          reply_to: datos.email,
          subject: `Arrepentimiento ${codigo} — pedido ${datos.pedido}`,
          html: `<div style="font-family:Arial,sans-serif;color:#251D16"><h2 style="font-weight:400">Pedido de arrepentimiento ${esc(codigo)}</h2><table style="border-collapse:collapse">${filas
            .map(([k, v]) => `<tr><td ${td}><b>${esc(k)}</b></td><td ${td}>${esc(v)}</td></tr>`)
            .join("")}</table><p>Respondele dentro de las 24 h confirmando el pedido.</p></div>`,
          text: texto,
        }),
      });
      if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
    } catch (err) {
      console.error("[arrepentimiento] Falló el mail", err, `\n${texto}`);
      return NextResponse.json<ArrepentimientoRespuesta>(
        { ok: false, error: "No pudimos registrarlo. Probá de nuevo o escribinos por WhatsApp." },
        { status: 502 },
      );
    }
  }

  return NextResponse.json<ArrepentimientoRespuesta>({ ok: true, codigo });
}
