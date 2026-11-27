import { NextResponse } from "next/server";

// Link de los anuncios de Meta (Renzo, 2026-11-27): /kit lleva directo a la sección del kit de la portada.
// Se redirige a /?<mismos parámetros>#kit para que las UTM y el fbclid que agrega Meta lleguen enteros
// (si el anuncio apuntara a /#kit, Meta podría pegar los parámetros después del #, y se perderían).
export function GET(req: Request) {
  const u = new URL(req.url);
  return NextResponse.redirect(new URL(`/${u.search}#kit`, u.origin), 307);
}
