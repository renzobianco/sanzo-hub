import { getProducto } from "@/data/products";
import { ImagenProducto } from "@/components/ImagenProducto";
import { textoOpcion } from "@/lib/combos";
import type { AhorroChapitas, LineaResuelta } from "@/lib/carrito";
import { PrecioLinea } from "./PrecioLinea";

/**
 * Con 3 chapitas o más, el carrito las muestra como una línea "Combo Manada" (igual que los otros combos):
 * foto del combo, el grabado de cada chapita y un solo precio (~~$24.000~~ $16.000). Las que sobran del trío van aparte.
 */
export function LineaManada({ lineas, ch, onQuitar, chica }: { lineas: LineaResuelta[]; ch: AhorroChapitas; onQuitar?: () => void; chica?: boolean }) {
  const manada = getProducto("combo-manada");
  const nombre = manada?.nombre ?? "Combo Manada";
  const combos = ch.enManada / 3;
  const grabados = lineas
    .filter((l) => ch.reparto[l.key]?.enManada)
    .map((l) => ({ key: l.key, texto: textoOpcion(l.producto, l.opcion), n: ch.reparto[l.key].enManada }));
  return (
    <div className="flex gap-4">
      <ImagenProducto
        src={manada?.imagenes[0]}
        nombre={nombre}
        sizes={chica ? "56px" : "80px"}
        className={`${chica ? "w-14" : "w-20"} shrink-0`}
        tamTexto="text-[9px]"
      />
      <div className="flex flex-1 flex-col">
        <div className="flex justify-between gap-3">
          <div>
            <p className="text-[15px] font-normal">
              {nombre}
              {combos > 1 && <span className="text-tinta/60"> × {combos}</span>}
            </p>
            <ul className="text-sm text-tinta/70">
              {grabados.map((g) => (
                <li key={g.key}>
                  {g.texto}
                  {g.n > 1 && <span className="text-tinta/50"> × {g.n}</span>}
                </li>
              ))}
            </ul>
          </div>
          <PrecioLinea lista={ch.listaManada} paga={ch.listaManada - ch.tresPorDos} />
        </div>
        {onQuitar && (
          <div className="mt-auto flex justify-end pt-3">
            <button type="button" onClick={onQuitar} className="text-xs uppercase tracking-marca text-tinta/70 underline-offset-4 hover:underline">
              Quitar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
