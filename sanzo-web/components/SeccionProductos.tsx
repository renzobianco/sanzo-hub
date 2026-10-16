import { Palabras } from "./Palabras";
import { individuales } from "@/data/products";
import { formatearPrecio } from "@/lib/formato";
import { AgregarAlCarrito } from "./AgregarAlCarrito";
import { ImagenProducto } from "./ImagenProducto";
import { Reveal } from "./Reveal";

export function SeccionProductos() {
  return (
    <section id="productos" aria-labelledby="productos-titulo" className="bg-crema py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <Reveal className="mb-10 text-center md:mb-14">
          <p className="eyebrow">Pieza por pieza</p>
          <h2 id="productos-titulo" className="titulo-seccion mt-3">
            <Palabras texto="Productos" />
          </h2>
        </Reveal>

        <ul className="grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-4 md:gap-x-6 md:gap-y-14">
          {individuales.map((p, i) => (
            <li key={p.id}>
              <Reveal delay={(i % 4) * 80} className="group flex h-full flex-col">
                <div className="overflow-hidden rounded-[0.9rem] transition-[transform,box-shadow] duration-700 ease-suave md:group-hover:-translate-y-1.5 md:group-hover:shadow-[0_22px_40px_-22px_rgb(var(--tinta)/0.45)]">
                  <ImagenProducto
                    srcs={p.imagenes}
                    desfase={(i % 4) * 900}
                    nombre={p.nombre}
                    sizes="(min-width: 768px) 25vw, 50vw"
                  />
                </div>
                <div className="mt-4 flex flex-1 flex-col">
                  <h3 className="text-[15px] uppercase tracking-[0.16em]">{p.nombre}</h3>
                  {p.precio !== null && <p className="mt-1 text-sm text-tinta/75">{formatearPrecio(p.precio)}</p>}
                  <div className="mt-auto pt-4">
                    <AgregarAlCarrito producto={p} />
                  </div>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
