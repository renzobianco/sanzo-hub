import Image from "next/image";
import { sitio } from "@/data/products";

export function Hero() {
  const { titulo, subtitulo, boton, imagen } = sitio.hero;
  return (
    <section className="relative flex h-[50svh] min-h-[22rem] items-end overflow-hidden bg-topo text-crema md:items-center">
      {imagen ? (
        <Image src={imagen} alt="" fill priority sizes="100vw" className="object-cover" />
      ) : (
        // Placeholder: luz cálida tipo lino al sol, hasta que se cargue la foto.
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_75%_15%,rgb(var(--lino)/0.55),transparent_60%),radial-gradient(ellipse_70%_70%_at_10%_90%,rgb(var(--marron)/0.75),transparent_70%),linear-gradient(160deg,rgb(var(--topo)),rgb(var(--marron)))]"
        />
      )}
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-tinta/70 via-tinta/25 to-transparent" />

      <div className="relative mx-auto w-full max-w-7xl px-4 pb-10 text-center md:px-8 md:pb-0">
        <h1 className="animate-entrada text-[2.15rem] font-light uppercase leading-[1.15] tracking-marca sm:text-5xl md:text-7xl">
          {titulo}
        </h1>
        <p className="mx-auto mt-5 max-w-md animate-entrada text-base font-light text-crema/90 [animation-delay:150ms] md:text-lg">
          {subtitulo}
        </p>
        <a href="#kit" className="btn-claro mt-9 animate-entrada [animation-delay:300ms]">
          {boton}
        </a>
      </div>
    </section>
  );
}
