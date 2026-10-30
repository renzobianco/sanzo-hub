import { formatearPrecio } from "@/lib/formato";

/**
 * Precio de una línea del carrito. Con ahorro (chapitas: 3x2 o precio con otra compra), el de lista va tachado
 * chiquito y lo grande es lo que se paga, con el ahorro abajo: 3 chapitas → ~~$24.000~~ $16.000.
 */
export function PrecioLinea({ subtotal, ahorro = 0, motivo }: { subtotal: number; ahorro?: number; motivo?: string }) {
  if (!ahorro) return <p className="whitespace-nowrap text-[15px]">{formatearPrecio(subtotal)}</p>;
  const paga = subtotal - ahorro;
  return (
    <div className="whitespace-nowrap text-right">
      <s className="block text-[12px] text-tinta/45">{formatearPrecio(subtotal)}</s>
      <p className="text-[15px]">{paga > 0 ? formatearPrecio(paga) : <span className="text-marron">De regalo</span>}</p>
      <p className="mt-0.5 text-[11px] leading-tight text-marron">
        Ahorrás {formatearPrecio(ahorro)}
        {motivo && <span className="block">{motivo}</span>}
      </p>
    </div>
  );
}
