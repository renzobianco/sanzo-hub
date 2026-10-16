import { Palabras } from "./Palabras";
import { envioInfo } from "@/data/envios";
import { formatearPrecio } from "@/lib/formato";
import { Reveal } from "./Reveal";

export function SeccionEnvios() {
  return (
    <section id="envios" aria-labelledby="envios-titulo" className="bg-crema py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <Reveal className="text-center">
          <p className="eyebrow">{envioInfo.correo}</p>
          <h2 id="envios-titulo" className="titulo-seccion mt-3">
            <Palabras texto="Envíos" />
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-[17px] font-light text-tinta/85">{envioInfo.texto}</p>
        </Reveal>

        <Reveal className="mt-12 bg-lino px-6 py-10 text-center md:mt-14 md:px-12">
          <div>
            <p className="text-xl font-light uppercase tracking-marca">El kit completo viaja gratis</p>
            <p className="mt-2 text-[15px] text-tinta/80">
              A cualquier punto del país. Si tu pedido incluye el kit, el envío de todo el pedido es sin cargo.
              {envioInfo.gratisDesde !== null && ` Y cualquier pedido desde ${formatearPrecio(envioInfo.gratisDesde)} también.`}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
