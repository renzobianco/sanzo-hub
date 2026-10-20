import Image from "next/image";
import { Palabras } from "./Palabras";
import { contadorKits, getProducto, kit, sitio } from "@/data/products";
import { formatearPrecio } from "@/lib/formato";
import { AgregarAlCarrito } from "./AgregarAlCarrito";
import { GuiaTalles } from "./GuiaTalles";
import { KitGaleria } from "./KitGaleria";
import { Reveal } from "./Reveal";

export function SeccionKit() {
  const { restantes, total } = contadorKits;
  // Lo que saldrían las piezas compradas sueltas (solo si todas tienen precio).
  const sueltos = kit.incluye.map((id) => getProducto(id)?.precio ?? null);
  const porSeparado = sueltos.every((p) => p !== null) ? sueltos.reduce<number>((a, p) => a + (p ?? 0), 0) : null;
  const ahorro = porSeparado !== null && kit.precio !== null ? porSeparado - kit.precio : 0;
  const piezas = kit.incluye.map((id) => getProducto(id)).filter((p) => !!p);
  // "Arnés, correa, collar, moño, bandana y poo bag"
  const nombres = piezas.map((p, i) => (i === 0 ? p.nombre : p.nombre.toLowerCase()));
  const listaPiezas = nombres.length > 1 ? `${nombres.slice(0, -1).join(", ")} y ${nombres[nombres.length - 1]}` : nombres.join("");
  const porcentaje = restantes === null ? 0 : Math.max(0, Math.min(100, (restantes / total) * 100));

  return (
    // Franja topo (distinta del crema del hero y del lino de los combos) para que la tarjeta del kit se note.
    <section id="kit" aria-labelledby="kit-titulo" className="bg-topo pb-16 pt-10 md:py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        {/* La tarjeta crema "flota" sobre el topo: por eso se distingue del resto. */}
        <div className="overflow-hidden rounded-[1.6rem] bg-crema p-4 shadow-[0_30px_60px_-30px_rgb(var(--tinta)/0.5)] md:p-10">
          <div className="grid gap-10 md:grid-cols-[1.15fr_1fr] md:gap-16 lg:gap-24">
            <Reveal className="relative">
              <KitGaleria imagenes={kit.imagenes} nombre={kit.nombre} />
              {kit.etiqueta && (
                <p className="pointer-events-none absolute left-3 top-3 flex animate-entrada items-center gap-1.5 rounded-full bg-tinta px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-crema [animation-delay:900ms]">
                  <span aria-hidden="true" className="text-marron">★</span>
                  {kit.etiqueta}
                </p>
              )}
            </Reveal>

            {/* Jerarquía: dato chico en marrón → nombre → precio grande → piezas → talle → comprar. */}
            <Reveal delay={120} className="flex flex-col px-1 md:px-0 md:pt-6">
              <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-marron">
                {kit.incluye.length} piezas{kit.envioGratis && " · Envío gratis"}
              </p>
              <h2 id="kit-titulo" className="mt-2 text-[1.65rem] font-normal uppercase leading-tight tracking-[0.14em] md:text-4xl">
                <Palabras texto={kit.nombre} />
              </h2>
              <p className="mt-1.5 text-[15px] text-tinta/60">{sitio.kit.bajada}</p>

              {kit.precio !== null && (
                <div className="mt-6">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[2.75rem] font-medium leading-none tracking-tight">{formatearPrecio(kit.precio)}</p>
                    {ahorro > 0 && (
                      <span className="whitespace-nowrap rounded-full bg-marron px-3 py-1.5 text-[12px] tracking-wide text-crema">
                        {sitio.kit.ahorro} {formatearPrecio(ahorro)}
                      </span>
                    )}
                  </div>
                  {porSeparado !== null && ahorro > 0 && (
                    <p className="mt-2 text-[13px] text-tinta/55">
                      {sitio.kit.porSeparado} <s>{formatearPrecio(porSeparado)}</s>
                    </p>
                  )}
                </div>
              )}

              {/* Las piezas en una sola fila chiquita + la lista en una línea. */}
              <ul className="mt-6 flex gap-2" aria-label={`Incluye ${kit.incluye.length} piezas`}>
                {piezas.map((p) => (
                  <li key={p.id} className="relative aspect-square flex-1 overflow-hidden rounded-full bg-lino">
                    {p.miniatura && <Image src={p.miniatura} alt={p.nombre} fill sizes="64px" className="object-contain p-1 mix-blend-multiply" />}
                  </li>
                ))}
              </ul>
              <p className="mt-2.5 text-[13px] text-tinta/65">{listaPiezas}.</p>

              {restantes !== null && (
                <div className="mt-8">
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

              <div className="mt-7">
                <AgregarAlCarrito
                  producto={kit}
                  etiqueta={sitio.kit.boton}
                  irAlCheckout
                  compacto
                  acento="fuerte"
                  extraOpcion={kit.opcion?.nombre === "Talle" ? <GuiaTalles /> : null}
                />
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
