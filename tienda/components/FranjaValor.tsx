import { IconoCombina, IconoEnvio, IconoPaseo } from "./Iconos";
import { Reveal } from "./Reveal";

const ITEMS = [
  { Icono: IconoPaseo, texto: "Diseñado para el paseo de todos los días" },
  { Icono: IconoCombina, texto: "Todo combina con todo" },
  { Icono: IconoEnvio, texto: "Envíos a todo el país" },
];

export function FranjaValor() {
  return (
    <section aria-label="Por qué sanzo" className="bg-lino py-16 md:py-20">
      <ul className="mx-auto grid max-w-6xl gap-12 px-4 md:grid-cols-3 md:gap-8 md:px-8">
        {ITEMS.map(({ Icono, texto }, i) => (
          <li key={texto}>
            <Reveal delay={i * 100} className="flex flex-col items-center text-center">
              <Icono className="text-marron" />
              <p className="mt-5 max-w-[16rem] text-[13px] uppercase leading-relaxed tracking-marca">{texto}</p>
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  );
}
