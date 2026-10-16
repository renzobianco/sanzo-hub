import Image from "next/image";
import { galeria, getProducto } from "@/data/products";
import { Palabras } from "./Palabras";
import { Reveal } from "./Reveal";

/**
 * "Salen con sanzo": tira de fotos que se mueve sola, sin fin (se pausa al pasar el mouse en PC).
 * El contenido va duplicado para que el loop no tenga corte.
 */
export function SeccionGaleria() {
  if (galeria.fotos.length === 0) return null;
  const fotos = [...galeria.fotos, ...galeria.fotos];
  return (
    <section aria-labelledby="galeria-titulo" className="overflow-hidden bg-tinta py-20 text-crema md:py-28">
      <Reveal className="mb-10 px-4 text-center md:mb-14">
        <p className="eyebrow text-crema/60">{galeria.eyebrow}</p>
        <h2 id="galeria-titulo" className="titulo-seccion mt-3">
          <Palabras texto={galeria.titulo} />
        </h2>
      </Reveal>
      <div className="group">
        <ul className="flex w-max animate-cinta-lenta gap-3 group-hover:[animation-play-state:paused] md:gap-5">
          {fotos.map((f, i) => {
            const p = getProducto(f.producto);
            const copia = i >= galeria.fotos.length;
            return (
              <li key={`${f.imagen}-${i}`} aria-hidden={copia} className="w-[15rem] shrink-0 md:w-[19rem]">
                <a href="#productos" tabIndex={copia ? -1 : 0} className="group/foto block">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-[1rem] bg-topo/30">
                    <Image
                      src={f.imagen}
                      alt={p && !copia ? `Perro con ${p.nombre.toLowerCase()} sanzo` : ""}
                      fill
                      sizes="(min-width: 768px) 19rem, 15rem"
                      className="object-cover transition-transform duration-[1.2s] ease-suave group-hover/foto:scale-[1.06]"
                    />
                  </div>
                  {p && (
                    <p className="mt-3 flex items-center justify-between text-[11px] uppercase tracking-marca text-crema/80">
                      {p.nombre}
                      <span aria-hidden="true" className="text-marron transition-transform duration-500 ease-suave group-hover/foto:translate-x-1">
                        →
                      </span>
                    </p>
                  )}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
