import { Palabras } from "./Palabras";
import Image from "next/image";
import { resenas } from "@/data/products";
import { Reveal } from "./Reveal";

/** Reseñas y videos de clientes reales. Sin reseñas cargadas, no se muestra. */
export function SeccionResenas() {
  if (resenas.length === 0) return null;
  return (
    <section id="resenas" aria-labelledby="resenas-titulo" className="bg-crema py-20 md:py-28">
      <Reveal className="mb-10 px-4 text-center md:mb-14">
        <p className="eyebrow">Los que ya salen con sanzo</p>
        <h2 id="resenas-titulo" className="titulo-seccion mt-3">
          <Palabras texto="Reseñas" />
        </h2>
      </Reveal>
      <ul className="sin-scrollbar mx-auto flex max-w-7xl snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-2 md:px-8">
        {resenas.map((r, i) => (
          <li key={`${r.nombre}-${i}`} className="w-[78%] shrink-0 snap-start sm:w-[45%] md:w-[30%]">
            <figure className="flex h-full flex-col bg-lino">
              {r.video ? (
                <video src={r.video} className="aspect-[4/5] w-full object-cover" muted loop playsInline autoPlay preload="metadata" />
              ) : r.foto ? (
                <div className="relative aspect-[4/5]">
                  <Image src={r.foto} alt="" fill sizes="(min-width: 768px) 30vw, 78vw" className="object-cover" />
                </div>
              ) : null}
              <blockquote className="flex-1 p-5 text-[15px] leading-relaxed">“{r.texto}”</blockquote>
              <figcaption className="px-5 pb-5 text-[11px] uppercase tracking-marca text-tinta/70">
                {r.nombre}
                {r.perro && ` · ${r.perro}`}
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
}
