import { getProducto } from "@/data/products";
import { ImagenProducto } from "./ImagenProducto";

/** Miniaturas de las piezas que incluye un kit/combo. Ids → foto del individual; texto libre → texto. */
export function MiniPiezas({ incluye, columnas = "grid-cols-3" }: { incluye: string[]; columnas?: string }) {
  return (
    <ul className={`grid gap-3 ${columnas}`}>
      {incluye.map((pieza, i) => {
        const p = getProducto(pieza);
        const nombre = p?.nombre ?? pieza;
        return (
          <li key={pieza} className="pieza text-center" style={{ transitionDelay: `${250 + i * 80}ms` }}>
            <ImagenProducto
              src={p?.imagenes[0]}
              nombre={nombre}
              sizes="96px"
              aspecto="aspect-square"
              className="mx-auto w-full max-w-[76px] rounded-full"
              tamTexto="text-[8px] md:text-[9px] tracking-[0.12em]"
            />
            <span className="mt-2 block text-[11px] uppercase tracking-[0.16em] text-tinta/80">{nombre}</span>
          </li>
        );
      })}
    </ul>
  );
}
