import { NextResponse } from "next/server";
import { hubActivo, subirImagenPedido } from "@/lib/hub";

export const runtime = "nodejs";

// La imagen original que suben para grabar en el parche. Queda en Supabase Storage y el link viaja
// con el pedido (se ve en "Pedidos web" del Hub). El navegador ya la achica si pasa de 4 MB.
const TIPOS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/heic": "heic",
  "image/heif": "heif",
};
const MAX_BYTES = 4_400_000;

export async function POST(req: Request) {
  if (!hubActivo()) return NextResponse.json({ ok: false, error: "sin-hub" }, { status: 503 });
  let archivo: FormDataEntryValue | null;
  try {
    archivo = (await req.formData()).get("imagen");
  } catch {
    return NextResponse.json({ ok: false, error: "Imagen inválida." }, { status: 400 });
  }
  if (!(archivo instanceof Blob) || !TIPOS[archivo.type]) {
    return NextResponse.json({ ok: false, error: "Subí una imagen JPG o PNG." }, { status: 400 });
  }
  if (archivo.size > MAX_BYTES) return NextResponse.json({ ok: false, error: "La imagen es muy pesada." }, { status: 413 });
  try {
    const url = await subirImagenPedido(archivo, TIPOS[archivo.type]);
    return NextResponse.json({ ok: true, url });
  } catch (err) {
    console.error("[imagen] No se pudo subir", err);
    return NextResponse.json({ ok: false, error: "No pudimos guardar la imagen." }, { status: 502 });
  }
}
