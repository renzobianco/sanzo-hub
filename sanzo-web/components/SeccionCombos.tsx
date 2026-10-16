import { Palabras } from "./Palabras";
import { combos } from "@/data/products";
import { formatearPrecio } from "@/lib/formato";
import { AgregarAlCarrito } from "./AgregarAlCarrito";
import { ImagenProducto } from "./ImagenProducto";
import { MiniPiezas } from "./MiniPiezas";
import { Reveal } from "./Reveal";

export function SeccionCombos() {
  return (
    <section id="combos" aria-labelledby="combos-titulo" className="bg-lino py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <Reveal className="mb-10 text-center md:mb-14">
          <p className="eyebrow">Armados para combinar</p>
          <h2 id="combos-titulo" className="titulo-seccion mt-3">
            <Palabras texto="Combos" />
          </h2>
        </Reveal>
      </div>

      {/* Carrusel deslizable en mobile, grilla de 3 en desktop. */}
      <ul className="sin-scrollbar mx-auto flex max-w-6xl snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-2 md:grid md:grid-cols-3 md:gap-7 md:overflow-visible md:px-8">
        {combos.map((c, i) => (
          <li key={c.id} className="w-[82%] shrink-0 snap-start sm:w-[60%] md:w-auto">
            <Reveal delay={i * 100} className="group flex h-full flex-col overflow-hidden rounded-[1rem] bg-crema transition-[transform,box-shadow] duration-700 ease-suave md:hover:-translate-y-1.5 md:hover:shadow-[0_26px_50px_-26px_rgb(var(--tinta)/0.45)]">
              <ImagenProducto srcs={c.imagenes} desfase={i * 1300} intervalo={4200} nombre={c.nombre} sizes="(min-width: 768px) 30vw, 82vw" aspecto="aspect-[4/5]" fondo="bg-topo/35" />
              <div className="flex flex-1 flex-col p-5 md:p-7">
                <h3 className="text-xl font-light uppercase tracking-marca">{c.nombre}</h3>
                <p className="mt-2 text-[15px] text-tinta/80">{c.descripcion}</p>
                <div className="mt-6">
                  <MiniPiezas incluye={c.incluye} />
                </div>
                {c.precio !== null && <p className="mt-6 text-lg font-light">{formatearPrecio(c.precio)}</p>}
                <div className="mt-auto pt-5">
                  <AgregarAlCarrito producto={c} />
                </div>
              </div>
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  );
}
