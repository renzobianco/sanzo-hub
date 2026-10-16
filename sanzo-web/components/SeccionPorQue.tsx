import { Palabras } from "./Palabras";
import Image from "next/image";
import { porQue } from "@/data/products";
import { IconoPlay } from "./Iconos";
import { Reveal } from "./Reveal";

export function SeccionPorQue() {
  const { eyebrow, titulo, video, poster, razones } = porQue;
  return (
    <section id="por-que" aria-labelledby="porque-titulo" className="bg-crema py-20 md:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 md:grid-cols-2 md:gap-16 md:px-8">
        <Reveal className="order-2 md:order-1">
          {video ? (
            <video
              src={video}
              poster={poster || undefined}
              className="aspect-[4/5] w-full bg-lino object-cover"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-label={titulo}
            />
          ) : poster ? (
            <div className="img-revelar relative aspect-[4/5] w-full overflow-hidden bg-lino">
              <Image src={poster} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
            </div>
          ) : (
            <div className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-4 bg-[radial-gradient(ellipse_at_30%_20%,rgb(var(--crema)/0.7),transparent_60%)] bg-lino text-tinta/60">
              <span className="flex h-16 w-16 items-center justify-center rounded-full border border-tinta/30">
                <IconoPlay className="ml-0.5" />
              </span>
              <span className="text-[11px] uppercase tracking-amplio">Video próximamente</span>
            </div>
          )}
        </Reveal>

        <div className="order-1 md:order-2">
          <Reveal>
            <p className="eyebrow">{eyebrow}</p>
            <h2 id="porque-titulo" className="titulo-seccion mt-3">
              <Palabras texto={titulo} />
            </h2>
          </Reveal>
          <ol className="mt-8 space-y-6">
            {razones.map((r, i) => (
              <li key={r.titulo}>
                <Reveal delay={i * 100} className="flex gap-5">
                  <span className="text-2xl font-light text-marron">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h3 className="text-[15px] uppercase tracking-[0.16em]">{r.titulo}</h3>
                    <p className="mt-1 text-[15px] text-tinta/80">{r.texto}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
