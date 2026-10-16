import { Palabras } from "./Palabras";
import { contadorKits, kit, sitio } from "@/data/products";
import { formatearPrecio } from "@/lib/formato";
import { AgregarAlCarrito } from "./AgregarAlCarrito";
import { GuiaTalles } from "./GuiaTalles";
import { KitGaleria } from "./KitGaleria";
import { MiniPiezas } from "./MiniPiezas";
import { Reveal } from "./Reveal";

export function SeccionKit() {
  const { restantes, total } = contadorKits;
  const porcentaje = restantes === null ? 0 : Math.max(0, Math.min(100, (restantes / total) * 100));

  return (
    <section id="kit" aria-labelledby="kit-titulo" className="bg-crema py-20 md:py-32">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 md:grid-cols-[1.15fr_1fr] md:gap-16 md:px-8 lg:gap-24">
        <Reveal>
          <KitGaleria imagenes={kit.imagenes} nombre={kit.nombre} />
        </Reveal>

        <Reveal delay={120} className="flex flex-col md:pt-6">
          <p className="eyebrow">El protagonista</p>
          <div className="mt-3">
            <h2 id="kit-titulo" className="text-3xl font-light uppercase leading-tight tracking-marca md:text-5xl">
              <Palabras texto={kit.nombre} />
            </h2>
          </div>

          <p className="mt-6 max-w-md text-lg font-light leading-relaxed text-tinta/85">{sitio.kit.bajada}</p>
          {kit.precio !== null && <p className="mt-6 text-2xl font-light tracking-wide">{formatearPrecio(kit.precio)}</p>}

          <div className="mt-10">
            <p className="eyebrow mb-4">Incluye {kit.incluye.length} piezas</p>
            <MiniPiezas incluye={kit.incluye} columnas="grid-cols-3 sm:grid-cols-6 md:grid-cols-3 lg:grid-cols-6" />
          </div>

          {restantes !== null && (
            <div className="mt-10">
              <p className="text-sm uppercase tracking-marca">
                Quedan <span className="text-marron">{restantes}</span> de {total} kits
              </p>
              <div
                className="mt-3 h-[3px] w-full bg-lino"
                role="progressbar"
                aria-label="Kits disponibles"
                aria-valuemin={0}
                aria-valuemax={total}
                aria-valuenow={restantes}
              >
                <div className="h-full bg-marron transition-[width] duration-1000" style={{ width: `${porcentaje}%` }} />
              </div>
            </div>
          )}

          <div className="mt-10">
            <AgregarAlCarrito
              producto={kit}
              etiqueta={sitio.kit.boton}
              irAlCheckout
              grande
              extraOpcion={kit.opcion?.nombre === "Talle" ? <GuiaTalles /> : null}
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
