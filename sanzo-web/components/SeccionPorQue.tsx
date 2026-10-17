import Image from "next/image";
import { confianza, porQue } from "@/data/products";
import { envioInfo } from "@/data/envios";
import { formatearPrecio } from "@/lib/formato";
import { IconoCambio, IconoCombina, IconoCuotas, IconoEnvio, IconoGarantia, IconoPaseo, IconoReloj } from "./Iconos";
import { Palabras } from "./Palabras";
import { Reveal } from "./Reveal";

const ICONOS = { garantia: IconoGarantia, cambio: IconoCambio, combina: IconoCombina, envio: IconoEnvio, paseo: IconoPaseo, reloj: IconoReloj, cuotas: IconoCuotas };

/**
 * "¿Por qué sanzo?" en grilla tipo bento: foto grande con una frase, la primera razón destacada
 * en una tarjeta oscura y el resto en tarjetas chicas. Celu: 2 columnas. PC: 4.
 */
export function SeccionPorQue() {
  const { eyebrow, titulo, foto, video, frase } = porQue;
  const razones = [...porQue.razones];
  if (envioInfo.gratisDesde !== null) {
    razones.push({ icono: "envio", titulo: "Envío gratis", texto: `En compras desde ${formatearPrecio(envioInfo.gratisDesde)}.` });
  }
  if (confianza.cuotasSinInteres) {
    razones.push({ icono: "cuotas", titulo: `${confianza.cuotasSinInteres} cuotas sin interés`, texto: "Con Mercado Pago." });
  }
  const [destacada, ...resto] = razones;
  // Si quedan impares, la última ocupa todo el ancho en el celu (sin huecos en la grilla).
  const ultimaAncha = resto.length % 2 === 1;

  return (
    <section id="por-que" aria-labelledby="porque-titulo" className="bg-crema py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <Reveal className="mb-10 text-center md:mb-14">
          <p className="eyebrow">{eyebrow}</p>
          <h2 id="porque-titulo" className="titulo-seccion mt-3">
            <Palabras texto={titulo} />
          </h2>
        </Reveal>

        <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <li className="col-span-2 md:row-span-2">
            <Reveal className="h-full">
              <figure className="img-revelar relative aspect-[4/3] h-full overflow-hidden rounded-[1.25rem] bg-lino md:aspect-auto md:min-h-[26rem]">
                {video ? (
                  <video src={video} poster={foto || undefined} autoPlay muted loop playsInline preload="metadata" className="h-full w-full object-cover" />
                ) : (
                  <Image src={foto} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="animate-respirar object-cover" />
                )}
                <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-tinta/70 via-tinta/10 to-transparent" />
                <figcaption className="absolute inset-x-5 bottom-5 max-w-sm text-[17px] font-light leading-snug text-crema md:inset-x-7 md:bottom-7 md:text-xl">
                  {frase}
                </figcaption>
              </figure>
            </Reveal>
          </li>

          {destacada && (
            <li className="row-span-2">
              <Reveal delay={80} className="h-full">
                <Tarjeta {...destacada} oscura indice={0} />
              </Reveal>
            </li>
          )}

          {resto.map((r, i) => (
            <li key={r.titulo} className={ultimaAncha && i === resto.length - 1 ? "col-span-2 md:col-span-1" : ""}>
              <Reveal delay={140 + i * 70} className="h-full">
                <Tarjeta {...r} indice={i + 1} />
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Tarjeta({
  icono,
  titulo,
  texto,
  oscura = false,
  indice,
}: {
  icono: keyof typeof ICONOS;
  titulo: string;
  texto: string;
  oscura?: boolean;
  indice: number;
}) {
  const Icono = ICONOS[icono];
  return (
    <div
      className={`flex h-full min-h-[10.5rem] flex-col justify-between rounded-[1.25rem] p-5 transition-transform duration-500 ease-suave active:scale-[0.98] md:p-6 ${
        oscura ? "bg-tinta text-crema" : "bg-lino text-tinta"
      }`}
    >
      {/* El ícono flota apenas, cada tarjeta a su ritmo. */}
      <span className="animate-flotar self-start" style={{ animationDelay: `${indice * -700}ms` }}>
        <Icono className={oscura ? "text-crema" : "text-marron"} />
      </span>
      <div className="mt-6">
        <h3 className={`uppercase tracking-[0.16em] ${oscura ? "text-[15px]" : "text-[13px]"}`}>{titulo}</h3>
        <p className={`mt-1.5 text-[14px] leading-snug ${oscura ? "text-crema/75" : "text-tinta/75"}`}>{texto}</p>
      </div>
    </div>
  );
}
