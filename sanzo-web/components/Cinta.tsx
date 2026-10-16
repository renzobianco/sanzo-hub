import { cinta } from "@/data/products";

/** Cinta que corre lenta debajo del hero. Se duplica el contenido para que el loop no tenga corte. */
export function Cinta() {
  if (cinta.length === 0) return null;
  return (
    <div className="overflow-hidden border-b border-tinta/10 bg-tinta py-3.5 text-crema" aria-label={cinta.join(" · ")}>
      <ul className="flex w-max animate-cinta" aria-hidden="true">
        {[0, 1].map((copia) =>
          cinta.map((t, i) => (
            <li key={`${copia}-${i}`} className="flex items-center whitespace-nowrap text-[11px] uppercase tracking-amplio">
              <span className="px-6">{t}</span>
              <span className="text-marron">✦</span>
            </li>
          )),
        )}
      </ul>
    </div>
  );
}
