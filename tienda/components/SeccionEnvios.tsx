import { envioInfo, zonas } from "@/data/envios";
import { formatearPrecio } from "@/lib/formato";
import { Reveal } from "./Reveal";
import { SelloEnvioGratis } from "./SelloEnvioGratis";

export function SeccionEnvios() {
  return (
    <section id="envios" aria-labelledby="envios-titulo" className="bg-crema py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <Reveal className="text-center">
          <p className="eyebrow">{envioInfo.correo}</p>
          <h2 id="envios-titulo" className="titulo-seccion mt-3">
            Envíos
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-[17px] font-light text-tinta/85">{envioInfo.texto}</p>
        </Reveal>

        <ol className="mt-12 grid gap-4 md:mt-16 md:grid-cols-3 md:gap-6">
          {zonas.map((z, i) => (
            <li key={z.id}>
              <Reveal delay={i * 100} className="flex h-full flex-col border border-tinta/15 p-6 md:p-8">
                <p className="eyebrow">Zona {z.id}</p>
                <h3 className="mt-2 text-lg uppercase tracking-[0.16em]">{z.nombre}</h3>
                <p className="mt-3 flex-1 text-[15px] text-tinta/80">{z.detalle}</p>
                <p className="mt-6 text-xl font-light">{z.precio === null ? "A cotizar" : formatearPrecio(z.precio)}</p>
              </Reveal>
            </li>
          ))}
        </ol>

        <Reveal className="mt-10 flex flex-col items-center gap-6 bg-lino px-6 py-10 text-center md:mt-14 md:flex-row md:gap-10 md:px-12 md:text-left">
          <SelloEnvioGratis id="envios" tam={104} />
          <div>
            <p className="text-xl font-light uppercase tracking-marca">El kit completo viaja gratis</p>
            <p className="mt-2 text-[15px] text-tinta/80">
              A cualquier punto del país. Si tu pedido incluye el kit, el envío de todo el pedido es sin cargo.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
