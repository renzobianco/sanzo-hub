import { Palabras } from "./Palabras";
import { contadorKits, getProducto, kit, sitio } from "@/data/products";
import { formatearPrecio } from "@/lib/formato";
import { AgregarAlCarrito } from "./AgregarAlCarrito";
import { GuiaTalles } from "./GuiaTalles";
import { KitGaleria } from "./KitGaleria";
import { MiniPiezas } from "./MiniPiezas";
import { Reveal } from "./Reveal";

export function SeccionKit() {
  const { restantes, total } = contadorKits;
  // Lo que saldrían las piezas compradas sueltas (solo si todas tienen precio).
  const sueltos = kit.incluye.map((id) => getProducto(id)?.precio ?? null);
  const porSeparado = sueltos.every((p) => p !== null) ? sueltos.reduce<number>((a, p) => a + (p ?? 0), 0) : null;
  const ahorro = porSeparado !== null && kit.precio !== null ? porSeparado - kit.precio : 0;
  const porcentaje = restantes === null ? 0 : Math.max(0, Math.min(100, (restantes / total) * 100));

  return (
    <section id="kit" aria-labelledby="kit-titulo" className="bg-crema pb-20 md:py-32">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.15fr_1fr] md:gap-16 md:px-8 lg:gap-24">
        {/* En el celu la foto va de borde a borde. */}
        <Reveal className="relative">
          <KitGaleria imagenes={kit.imagenes} nombre={kit.nombre} />
          {kit.etiqueta && (
            <p className="pointer-events-none absolute left-3 top-3 flex animate-entrada items-center gap-1.5 rounded-full bg-tinta px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-crema [animation-delay:900ms]">
              <span aria-hidden="true" className="text-marron">★</span>
              {kit.etiqueta}
            </p>
          )}
        </Reveal>

        <Reveal delay={120} className="flex flex-col px-5 md:px-0 md:pt-6">
          <h2 id="kit-titulo" className="text-[2.6rem] font-extralight uppercase leading-[1.05] tracking-[0.12em] md:text-6xl">
            <Palabras texto={kit.nombre} />
          </h2>
          <span aria-hidden="true" className="mt-6 block h-px w-14 bg-marron" />
          <p className="mt-6 max-w-md text-lg font-light leading-relaxed text-tinta/80">{sitio.kit.bajada}</p>

          {kit.precio !== null && (
            <div className="mt-8">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <p className="text-[2.6rem] font-light leading-none tracking-wide">{formatearPrecio(kit.precio)}</p>
                {kit.envioGratis && (
                  <span className="rounded-full border border-tinta/30 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-tinta/85">
                    Envío gratis
                  </span>
                )}
              </div>
              {/* Una línea discreta: lo que saldrían las piezas sueltas y cuánto ahorra. */}
              {ahorro > 0 && porSeparado !== null && (
                <p className="mt-3 text-[13px] text-tinta/60">
                  {sitio.kit.porSeparado} <s>{formatearPrecio(porSeparado)}</s> · {sitio.kit.ahorro.toLowerCase()} {formatearPrecio(ahorro)}
                </p>
              )}
            </div>
          )}

          <div className="mt-10 rounded-2xl border border-tinta/15 px-4 pb-5 pt-4">
            <p className="eyebrow mb-4 text-center">Incluye {kit.incluye.length} piezas</p>
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
