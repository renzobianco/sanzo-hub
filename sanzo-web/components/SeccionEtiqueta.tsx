import { Palabras } from "./Palabras";
import { etiqueta } from "@/data/products";
import { Reveal } from "./Reveal";

// Bocetos en línea punteada de las formas de etiqueta (viewBox 64×40), en el orden de `etiqueta.formas`.
const FORMAS = [
  <rect key="r" x="10" y="10" width="44" height="20" rx="3" />,
  <path key="h" d="M18 14a5 5 0 1 0-4 8 5 5 0 1 0 4 8h28a5 5 0 1 0 4-8 5 5 0 1 0-4-8Z" />,
  <circle key="c" cx="32" cy="20" r="13" />,
];

const trazo = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.2,
  strokeDasharray: "3 2.5",
  strokeLinecap: "round" as const,
};

/** Adelanto de la etiqueta personalizada. Todavía no se compra: solo cuenta que viene. */
export function SeccionEtiqueta() {
  if (!etiqueta.activo) return null;
  const [diseno, libre] = etiqueta.opciones;
  return (
    <section id="etiqueta" aria-labelledby="etiqueta-titulo" className="bg-lino py-20 md:py-28">
      <div className="mx-auto max-w-4xl px-4 md:px-8">
        <Reveal className="text-center">
          <p className="eyebrow text-marron">{etiqueta.eyebrow}</p>
          <h2 id="etiqueta-titulo" className="titulo-seccion mt-3">
            <Palabras texto={etiqueta.titulo} />
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[16px] font-light text-tinta/85">{etiqueta.bajada}</p>
        </Reveal>

        <div className="mt-10 grid gap-4 md:mt-14 md:grid-cols-2 md:gap-6">
          <Reveal className="border border-dashed border-tinta/30 p-6 md:p-8">
            <ul className="flex items-end justify-around text-marron">
              {etiqueta.formas.map((f, i) => (
                <li key={f} className="flex flex-col items-center gap-2">
                  <svg
                    viewBox="0 0 64 40"
                    width={64}
                    height={40}
                    aria-hidden="true"
                    className="animate-balanceo"
                    style={{ animationDelay: `${i * -2}s` }}
                  >
                    <g {...trazo}>{FORMAS[i % FORMAS.length]}</g>
                  </svg>
                  <span className="text-[10px] uppercase tracking-[0.16em] text-tinta/70">{f}</span>
                </li>
              ))}
            </ul>
            <h3 className="mt-7 text-[15px] uppercase tracking-[0.16em]">{diseno.titulo}</h3>
            <p className="mt-1 text-[15px] text-tinta/80">{diseno.texto}</p>
          </Reveal>

          <Reveal delay={120} className="border border-dashed border-tinta/30 p-6 md:p-8">
            <div className="flex justify-center text-marron">
              <svg viewBox="0 0 64 40" width={96} height={60} aria-hidden="true" className="animate-balanceo">
                <g {...trazo}>
                  <path d="M14 8h36a4 4 0 0 1 4 4v16a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4V12a4 4 0 0 1 4-4Z" />
                  <path d="M22 26l7-8 5 5 4-4 6 7M40 14.5a1.6 1.6 0 1 0 0 .1" strokeDasharray="none" />
                </g>
              </svg>
            </div>
            <h3 className="mt-7 text-[15px] uppercase tracking-[0.16em]">{libre.titulo}</h3>
            <p className="mt-1 text-[15px] text-tinta/80">{libre.texto}</p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
