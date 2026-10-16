import { Palabras } from "./Palabras";
import Image from "next/image";
import { galeria, getProducto } from "@/data/products";
import { CarruselVivo } from "./CarruselVivo";
import { Reveal } from "./Reveal";

/** "Salen con sanzo": fotos de perros con los productos, deslizables. Cada foto lleva a su producto. */
export function SeccionGaleria() {
  if (galeria.fotos.length === 0) return null;
  return (
    <section aria-labelledby="galeria-titulo" className="overflow-hidden bg-tinta py-20 text-crema md:py-28">
      <Reveal className="mb-10 px-4 text-center md:mb-14">
        <p className="eyebrow text-crema/60">{galeria.eyebrow}</p>
        <h2 id="galeria-titulo" className="titulo-seccion mt-3">
          <Palabras texto={galeria.titulo} />
        </h2>
      </Reveal>
      <CarruselVivo className="sin-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-[14%] md:gap-5 md:px-8">
        {galeria.fotos.map((f, i) => {
          const p = getProducto(f.producto);
          return (
            <li key={f.imagen} className="w-[72%] shrink-0 snap-center will-change-transform sm:w-[44%] md:w-[28%]">
              <Reveal delay={Math.min(i, 3) * 90}>
                <a href="#productos" className="group block">
                  <div className="img-revelar relative aspect-[4/5] overflow-hidden bg-topo/30">
                    <Image
                      src={f.imagen}
                      alt={p ? `Perro con ${p.nombre.toLowerCase()} sanzo` : ""}
                      fill
                      sizes="(min-width: 768px) 28vw, 72vw"
                      className="object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04] group-active:scale-[1.02]"
                    />
                  </div>
                  {p && (
                    <p className="mt-3 flex items-center justify-between text-[11px] uppercase tracking-marca text-crema/80">
                      {p.nombre}
                      <span aria-hidden="true" className="text-marron">
                        →
                      </span>
                    </p>
                  )}
                </a>
              </Reveal>
            </li>
          );
        })}
      </CarruselVivo>
    </section>
  );
}
