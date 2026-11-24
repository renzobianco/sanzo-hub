import { todosLosProductos, type Producto } from "@/data/products";
import { urlSitio } from "@/lib/hub";

// Feed del catálogo para Meta (Administrador de ventas → Catálogo → Fuente de datos → URL programada).
// Sale de data/products.ts: los `id` son los mismos `content_ids` de los eventos del Pixel y de la API
// de Conversiones (si no coinciden, el catálogo no se conecta). Solo productos con precio; sin precios inventados.
// sale_price no va: la web no tiene precios rebajados por producto (el "Por separado" de combos no es un precio tachado del producto).

export const dynamic = "force-static";
export const revalidate = 3600;

const SECCION: Record<Producto["tipo"], string> = { kit: "kit", combo: "combos", individual: "productos" };

const celda = (v: string) => `"${v.replace(/"/g, '""').replace(/\s+/g, " ").trim()}"`;
const absoluta = (ruta: string) => (ruta.startsWith("http") ? ruta : `${urlSitio()}${encodeURI(ruta)}`);

export function GET() {
  const columnas = ["id", "title", "description", "availability", "condition", "price", "link", "image_link", "additional_image_link", "brand"];
  const filas = todosLosProductos
    .filter((p) => p.precio !== null && p.imagenes.length > 0)
    .map((p) => [
      p.id,
      p.nombre,
      p.descripcion || p.nombre,
      p.disponible ? "in stock" : "out of stock",
      "new",
      `${p.precio} ARS`,
      `${urlSitio()}/#${SECCION[p.tipo]}`,
      absoluta(p.imagenes[0]),
      p.imagenes.slice(1, 11).map(absoluta).join(","),
      "sanzo",
    ]);
  const csv = [columnas.join(","), ...filas.map((f) => f.map(celda).join(","))].join("\n") + "\n";
  return new Response(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Cache-Control": "public, max-age=0, s-maxage=3600" },
  });
}
