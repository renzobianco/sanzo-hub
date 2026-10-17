import Image from "next/image";
import { getProducto } from "@/data/products";
import { ImagenProducto } from "./ImagenProducto";

/**
 * Miniaturas de las piezas que incluye un kit/combo. Ids → foto del artículo solo (`miniatura`) o,
 * si no hay, la del individual; texto libre → texto.
 */
export function MiniPiezas({ incluye, columnas = "grid-cols-3" }: { incluye: string[]; columnas?: string }) {
  return (
    <ul className={`grid gap-3 ${columnas}`}>
      {incluye.map((pieza, i) => {
        const p = getProducto(pieza);
        const nombre = p?.nombre ?? pieza;
        return (
          <li key={pieza} className="pieza text-center" style={{ transitionDelay: `${250 + i * 80}ms` }}>
            {p?.miniatura ? (
              // Artículo sobre fondo claro: el multiply funde el fondo de la foto con el lino.
              <span className="relative mx-auto block aspect-square w-full max-w-[76px] overflow-hidden rounded-full bg-lino ring-1 ring-tinta/5">
                <Image src={p.miniatura} alt={nombre} fill sizes="96px" className="object-contain p-1.5 mix-blend-multiply" />
              </span>
            ) : (
              <ImagenProducto
                src={p?.imagenes[0]}
                nombre={nombre}
                sizes="96px"
                aspecto="aspect-square"
                className="mx-auto w-full max-w-[76px] rounded-full"
                tamTexto="text-[8px] md:text-[9px] tracking-[0.12em]"
              />
            )}
            <span className="mt-2 block text-[11px] uppercase tracking-[0.16em] text-tinta/80">{nombre}</span>
          </li>
        );
      })}
    </ul>
  );
}
