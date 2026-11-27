import { NextResponse } from "next/server";

// Link de los anuncios de Meta (Renzo, 2026-11-27): /kit lleva directo al kit de la portada (al título, con el precio y el botón Comprar a la vista).
// Se redirige a /?<mismos parámetros>#kit para que las UTM y el fbclid que agrega Meta lleguen enteros
// (si el anuncio apuntara a /#kit, Meta podría pegar los parámetros después del #, y se perderían).
export function GET(req: Request) {
  const u = new URL(req.url);
  return NextResponse.redirect(new URL(`/${u.search}#kit-titulo`, u.origin), 307);
}
