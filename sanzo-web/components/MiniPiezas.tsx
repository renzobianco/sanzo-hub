import { Rollito } from "./Rollito";
import { getProducto } from "@/data/products";
import { ImagenProducto } from "./ImagenProducto";
import { PiezaCirculo } from "./PiezaCirculo";

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
            <span className="relative mx-auto block w-full max-w-[76px]">
            {/* Lo que trae adentro (ej. "+ rollito"): etiqueta chiquita sobre el círculo. */}
            {p?.incluyeExtra && <Rollito texto={p.incluyeExtra} foto={p.incluyeExtraFoto} className="absolute -right-1 -top-1 z-10" />}
            {p ? (
              // Foto de la pieza; manteniéndola apretada se ve en grande con sus detalles.
              <PiezaCirculo pieza={p} sizes="96px" className="relative aspect-square w-full ring-1 ring-tinta/5" />
            ) : (
              <ImagenProducto
                src={undefined}
                nombre={nombre}
                sizes="96px"
                aspecto="aspect-square"
                className="w-full rounded-full"
                tamTexto="text-[8px] md:text-[9px] tracking-[0.12em]"
              />
            )}
            </span>
            <span className="mt-2 block text-[11px] uppercase tracking-[0.16em] text-tinta/80">{nombre}</span>
          </li>
        );
      })}
    </ul>
  );
}
