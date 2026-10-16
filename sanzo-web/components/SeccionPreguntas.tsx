import { Palabras } from "./Palabras";
import { preguntas } from "@/data/products";
import { IconoMas } from "./Iconos";
import { Reveal } from "./Reveal";

export function SeccionPreguntas() {
  return (
    <section id="preguntas" aria-labelledby="preguntas-titulo" className="bg-lino py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-4 md:px-8">
        <Reveal className="mb-10 text-center md:mb-14">
          <h2 id="preguntas-titulo" className="titulo-seccion">
            <Palabras texto="Preguntas frecuentes" />
          </h2>
        </Reveal>
        <Reveal>
          <div className="divide-y divide-tinta/15 border-y border-tinta/15">
            {preguntas.map((p) => (
              <details key={p.pregunta} className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-[16px] md:text-[17px] [&::-webkit-details-marker]:hidden">
                  {p.pregunta}
                  <IconoMas className="shrink-0 transition-transform duration-300 group-open:rotate-45" />
                </summary>
                <p className="pb-6 pr-10 text-[15px] leading-relaxed text-tinta/80">{p.respuesta}</p>
              </details>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
