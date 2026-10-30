import Image from "next/image";
import type { Producto } from "@/data/products";
import { fotoDeLinea } from "@/lib/chapita";
import { fotosPorColor } from "@/lib/combos";
import { ImagenProducto } from "@/components/ImagenProducto";

/** Foto de la línea del carrito. Combo Sol: la gorra arriba y el piluso abajo, cada uno en el color elegido. */
export function MiniaturaLinea({ producto, opcion, chica }: { producto: Producto; opcion?: string; chica?: boolean }) {
  const ancho = chica ? "w-14" : "w-20";
  const fotos = fotosPorColor(producto, opcion);
  if (fotos.length > 1) {
    return (
      <div className={`grid aspect-[4/5] shrink-0 overflow-hidden bg-lino ${ancho}`} style={{ gridTemplateRows: `repeat(${fotos.length}, 1fr)` }}>
        {fotos.map((f, i) => (
          <div key={f} className="relative">
            <Image src={f} alt={i === 0 ? producto.nombre : ""} fill sizes={chica ? "56px" : "80px"} className="object-cover" />
          </div>
        ))}
      </div>
    );
  }
  return (
    <ImagenProducto
      src={fotoDeLinea(producto, opcion)}
      nombre={producto.nombre}
      sizes={chica ? "56px" : "80px"}
      className={`${ancho} shrink-0`}
      tamTexto={chica ? "text-[7px]" : "text-[9px]"}
    />
  );
}
