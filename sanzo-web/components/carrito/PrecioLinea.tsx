import { formatearPrecio } from "@/lib/formato";

/** Precio de una línea del carrito: con descuento, el de lista tachado chiquito arriba y lo que se paga abajo. */
export function PrecioLinea({ lista, paga }: { lista: number; paga: number }) {
  if (lista <= paga) return <p className="whitespace-nowrap text-[15px]">{formatearPrecio(paga)}</p>;
  return (
    <div className="whitespace-nowrap text-right">
      <s className="block text-[12px] text-tinta/45">{formatearPrecio(lista)}</s>
      <p className="text-[15px]">{paga > 0 ? formatearPrecio(paga) : <span className="text-marron">De regalo</span>}</p>
    </div>
  );
}
