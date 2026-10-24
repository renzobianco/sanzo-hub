import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";

/**
 * Guarda los detalles editados a mano (`?editar` en la ficha). Solo en tu compu (npm run dev):
 * en Vercel no se puede escribir el archivo, así que ahí responde 403.
 */
export async function POST(req: Request) {
  if (process.env.NODE_ENV !== "development") return NextResponse.json({ error: "Solo en local" }, { status: 403 });
  const { id, puntos } = (await req.json()) as { id?: unknown; puntos?: unknown };
  if (typeof id !== "string" || !Array.isArray(puntos)) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const r = (v: unknown) => Math.round(Math.min(100, Math.max(0, Number(v) || 0)) * 10) / 10;
  const limpios = puntos.map((p: Record<string, unknown>) => ({
    x: r(p.x),
    y: r(p.y),
    tx: r(p.tx),
    ty: r(p.ty),
    texto: String(p.texto ?? "").slice(0, 40),
    ...(p.sub ? { sub: String(p.sub).slice(0, 60) } : {}),
  }));

  const archivo = path.join(process.cwd(), "data", "detalles.json");
  const todos = JSON.parse(await fs.readFile(archivo, "utf8")) as Record<string, unknown>;
  if (limpios.length) todos[id] = limpios;
  else delete todos[id];
  // Un punto por línea: queda legible en el JSON.
  const texto =
    "{\n" +
    Object.entries(todos)
      .map(([k, v]) => `  ${JSON.stringify(k)}: [\n${(v as unknown[]).map((p) => `    ${JSON.stringify(p).replace(/,"/g, ', "').replace(/":/g, '": ').replace(/^\{/, "{ ").replace(/\}$/, " }")}`).join(",\n")}\n  ]`)
      .join(",\n") +
    "\n}\n";
  await fs.writeFile(archivo, texto, "utf8");
  return NextResponse.json({ ok: true });
}
