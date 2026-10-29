import { Palabras } from "./Palabras";
import { vitrinaIndividuales } from "@/data/products";
import { TarjetaProducto } from "./TarjetaProducto";
import { Reveal } from "./Reveal";

export function SeccionProductos() {
  return (
    <section id="productos" aria-labelledby="productos-titulo" className="bg-crema py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <Reveal className="mb-10 text-center md:mb-14">
          <p className="eyebrow">Pieza por pieza</p>
          <h2 id="productos-titulo" className="titulo-seccion mt-3">
            <Palabras texto="Individuales" />
          </h2>
        </Reveal>

        <ul className="grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-4 md:gap-x-6 md:gap-y-14">
          {vitrinaIndividuales.map((p, i) => (
            <li key={p.id}>
              <Reveal delay={(i % 4) * 80} className="group flex h-full flex-col">
                <TarjetaProducto producto={p} />
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
