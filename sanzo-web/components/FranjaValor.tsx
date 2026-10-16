import { confianza } from "@/data/products";
import { envioInfo } from "@/data/envios";
import { formatearPrecio } from "@/lib/formato";
import { IconoCambio, IconoCombina, IconoCuotas, IconoEnvio, IconoGarantia, IconoPaseo } from "./Iconos";
import { Reveal } from "./Reveal";

const ICONOS = { garantia: IconoGarantia, cambio: IconoCambio, combina: IconoCombina, envio: IconoEnvio, paseo: IconoPaseo, cuotas: IconoCuotas };

export function FranjaValor() {
  const items: { icono: keyof typeof ICONOS; texto: string }[] = [...confianza.items];
  if (envioInfo.gratisDesde !== null) {
    items.push({ icono: "envio", texto: `Envío gratis desde ${formatearPrecio(envioInfo.gratisDesde)}` });
  }
  if (confianza.cuotasSinInteres) {
    items.push({ icono: "cuotas", texto: `${confianza.cuotasSinInteres} cuotas sin interés con Mercado Pago` });
  }

  return (
    <section aria-label="Por qué sanzo" className="bg-lino py-16 md:py-20">
      <ul className="mx-auto grid max-w-6xl grid-cols-2 gap-x-4 gap-y-12 px-4 md:flex md:gap-8 md:px-8">
        {items.map(({ icono, texto }, i) => {
          const Icono = ICONOS[icono];
          return (
            <li key={texto} className={items.length % 2 === 1 && i === items.length - 1 ? "col-span-2 md:flex-1" : "md:flex-1"}>
              <Reveal delay={i * 100} className="flex flex-col items-center text-center">
                <Icono className="text-marron" />
                <p className="mt-5 max-w-[16rem] text-[12px] uppercase leading-relaxed tracking-marca">{texto}</p>
              </Reveal>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
