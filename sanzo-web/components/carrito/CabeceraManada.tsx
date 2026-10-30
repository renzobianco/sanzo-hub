import { getProducto } from "@/data/products";
import { ImagenProducto } from "@/components/ImagenProducto";
import { PrecioLinea } from "./PrecioLinea";

/**
 * Con 3 chapitas o más, el carrito las junta bajo el Combo Manada: foto del combo y un solo precio
 * (~~$24.000~~ $16.000 · Ahorrás $8.000). Las chapitas van debajo, cada una con su grabado y sin precio.
 */
export function CabeceraManada({ unidades, lista, ahorro, chica }: { unidades: number; lista: number; ahorro: number; chica?: boolean }) {
  const manada = getProducto("combo-manada");
  return (
    <div className="flex gap-4">
      <ImagenProducto
        src={manada?.imagenes[0]}
        nombre={manada?.nombre ?? "Combo Manada"}
        sizes={chica ? "56px" : "80px"}
        className={`${chica ? "w-14" : "w-20"} shrink-0`}
        tamTexto="text-[9px]"
      />
      <div className="flex flex-1 justify-between gap-3">
        <div>
          <p className="text-[15px] font-normal">{manada?.nombre ?? "Combo Manada"}</p>
          <p className="text-sm text-tinta/70">{unidades} chapitas · 3x2</p>
        </div>
        <PrecioLinea subtotal={lista} ahorro={ahorro} motivo="con el Combo Manada" />
      </div>
    </div>
  );
}
