import { NextResponse } from "next/server";

// Link de los anuncios de Meta (tarjetas de combos del carrusel): /combos lleva directo a la sección de combos.
// Igual que /kit: redirige a /?<mismos parámetros>#combos para no perder las UTM ni el fbclid.
export function GET(req: Request) {
  const u = new URL(req.url);
  return NextResponse.redirect(new URL(`/${u.search}#combos`, u.origin), 307);
}
