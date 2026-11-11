import type { Metadata } from "next";
import { VistaPedido } from "@/components/personalizar/VistaPedido";
import { getProducto } from "@/data/products";
import { normalizarPersonalizacion } from "@/lib/personalizacion";

// Vista de un pedido personalizado para el Hub (Pedidos web): ?d= con { producto, personalizacion } en base64url.
// El link lo arma lib/hub.ts al guardar el pedido. No es una página para clientes.

export const metadata: Metadata = { title: "Vista del pedido", robots: { index: false, follow: false } };

function leer(d?: string) {
  if (!d) return null;
  try {
    const o = JSON.parse(Buffer.from(d, "base64url").toString("utf8")) as { producto?: string; personalizacion?: unknown };
    const producto = o.producto ? getProducto(o.producto) : undefined;
    const p = producto ? normalizarPersonalizacion(producto, o.personalizacion) : null;
    return producto && p ? { producto, p } : null;
  } catch {
    return null;
  }
}

export default async function Page({ searchParams }: { searchParams: Promise<{ d?: string }> }) {
  const datos = leer((await searchParams).d);
  if (!datos) {
    return <div className="fixed inset-0 z-[9999] bg-crema p-4 text-sm text-tinta/70">No se pudo leer la personalización de este pedido.</div>;
  }
  return <VistaPedido producto={datos.producto} p={datos.p} />;
}
