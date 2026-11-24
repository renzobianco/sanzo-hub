import { NextResponse, type NextRequest } from "next/server";

// Cookies propias para la API de Conversiones de Meta, puestas desde el servidor en la primera visita
// (así existen aunque un bloqueador frene el Pixel). Solo si está NEXT_PUBLIC_META_PIXEL_ID.
// - sz_uid: id anónimo nuestro (1 año). Va a Meta como external_id, hasheado.
// - _fbc: si llega con ?fbclid= (clic en un anuncio), "fb.1.<ms>.<fbclid>" (90 días), el formato de Meta.
// - _fbp: id del navegador con el formato de Meta (90 días); el Pixel lo reusa si ya existe.
// - sz_utm: utm_* y fbclid con los que llegó (30 días), para guardarlos con el pedido.
// Hecho a mano (es lo mismo que hace el Conversions API Parameter Builder de Meta, sin sumar dependencias).

const DIA = 24 * 60 * 60;

export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  if (!process.env.NEXT_PUBLIC_META_PIXEL_ID) return res;

  const url = req.nextUrl;
  const opciones = (dias: number) => ({
    path: "/",
    maxAge: dias * DIA,
    sameSite: "lax" as const,
    secure: url.protocol === "https:",
    httpOnly: false, // el Pixel las lee
  });
  const ahora = Date.now();

  if (!req.cookies.get("sz_uid")) res.cookies.set("sz_uid", crypto.randomUUID(), opciones(365));

  const fbclid = url.searchParams.get("fbclid");
  const fbc = req.cookies.get("_fbc")?.value;
  if (fbclid && fbclid.length <= 500 && (!fbc || !fbc.endsWith(`.${fbclid}`))) {
    res.cookies.set("_fbc", `fb.1.${ahora}.${fbclid}`, opciones(90));
  }

  if (!req.cookies.get("_fbp")) {
    const azar = crypto.getRandomValues(new Uint32Array(1))[0];
    res.cookies.set("_fbp", `fb.1.${ahora}.${azar}`, opciones(90));
  }

  const utm: Record<string, string> = {};
  for (const [k, v] of url.searchParams) {
    if ((/^utm_[a-z]+$/.test(k) || k === "fbclid") && v) utm[k] = v.slice(0, 200);
  }
  if (Object.keys(utm).length) res.cookies.set("sz_utm", JSON.stringify(utm), opciones(30));

  return res;
}

export const config = {
  // Solo páginas: nada de /api, archivos de Next, fotos ni el feed del catálogo.
  matcher: ["/((?!api/|_next/|catalogo-meta|.*\\.[a-zA-Z0-9]+$).*)"],
};
