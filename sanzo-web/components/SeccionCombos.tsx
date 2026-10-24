"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Palabras } from "./Palabras";
import { chapita, combos, getProducto, ofertaChapita, sitio, type Producto } from "@/data/products";
import { formatearPrecio } from "@/lib/formato";
import { AgregarAlCarrito } from "./AgregarAlCarrito";
import { ConZoom } from "./ConZoom";
import { ImagenProducto } from "./ImagenProducto";
import { MiniPiezas } from "./MiniPiezas";
import { Reveal } from "./Reveal";

const GAP = 10; // px entre tarjetas
const N = combos.length;
// Tres vueltas de combos seguidas: siempre se arranca y se vuelve a la del medio, así es circular
// (después de Sol asoma Paseo, y antes de Paseo, Sol).
const VUELTAS = [0, 1, 2];
/** Lo que salen las piezas sueltas y cuánto se ahorra con el combo (con precios reales; null si falta alguno). */
function ahorroDe(combo: Producto) {
  // La chapita, sumada a otra compra, sale el precio de la oferta: eso es lo real "por separado".
  const sueltos = combo.incluye.map((id) => (id === chapita.id ? ofertaChapita.precio : getProducto(id)?.precio ?? null));
  if (combo.precio === null || sueltos.some((p) => p === null)) return null;
  const porSeparado = sueltos.reduce<number>((a, p) => a + (p ?? 0), 0);
  return porSeparado > combo.precio ? { porSeparado, ahorro: porSeparado - combo.precio } : null;
}

const tarjetas = VUELTAS.flatMap((v) => combos.map((combo, i) => ({ combo, i, pos: v * N + i })));

/**
 * Combos en carrusel circular: la tarjeta del medio enfocada y las de los costados asomando, más chicas
 * y desenfocadas, para que se note que hay más (idea de Santi). Se desliza con el dedo, tocando
 * una de los costados o con las solapas de arriba (van sincronizadas). Nunca termina.
 * Las fotos de cada combo van cambiando solas (no se deslizan, para no pelear con el carrusel).
 */
export function SeccionCombos() {
  const [pos, setPos] = useState(N); // posición en la pista (arranca en la vuelta del medio)
  const [saltando, setSaltando] = useState(false);
  const pista = useRef<HTMLUListElement>(null);
  const fin = useRef<number | undefined>(undefined);
  const activo = pos % N;

  const paso = () => {
    const primera = pista.current?.firstElementChild as HTMLElement | null;
    return primera ? primera.offsetWidth + GAP : 1;
  };
  const suave = () => (window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth");

  // Arranca en la vuelta del medio, sin animación.
  useLayoutEffect(() => {
    const el = pista.current;
    if (el) el.scrollLeft = N * paso();
  }, []);

  function irA(p: number) {
    pista.current?.scrollTo({ left: p * paso(), behavior: suave() });
  }

  /** Solapa: va a la copia de ese combo más cercana (para el lado más corto). */
  function irCombo(i: number) {
    const cercana = VUELTAS.map((v) => v * N + i).sort((a, b) => Math.abs(a - pos) - Math.abs(b - pos))[0];
    irA(cercana);
  }

  // Si quedó en la primera o la última vuelta, salta a la misma tarjeta de la vuelta del medio (no se nota).
  function alTerminar() {
    const el = pista.current;
    if (!el) return;
    const p = Math.round(el.scrollLeft / paso());
    if (p >= N && p < 2 * N) return;
    const medio = (((p % N) + N) % N) + N;
    setSaltando(true);
    el.scrollLeft = medio * paso();
    setPos(medio);
    requestAnimationFrame(() => requestAnimationFrame(() => setSaltando(false)));
  }

  // La primera vez que entra en pantalla, un amague corto hacia el costado: "esto se desliza".
  useEffect(() => {
    const el = pista.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        window.setTimeout(() => {
          const base = N * paso();
          if (Math.abs(el.scrollLeft - base) > 4) return; // ya lo movió
          el.scrollTo({ left: base + 56, behavior: "smooth" });
          window.setTimeout(() => el.scrollTo({ left: base, behavior: "smooth" }), 450);
        }, 700);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section id="combos" aria-labelledby="combos-titulo" className="overflow-hidden bg-lino py-12 md:py-16">
      <div className="mx-auto max-w-md px-4">
        <Reveal className="mb-6 text-center">
          <p className="eyebrow">Armados para combinar</p>
          <h2 id="combos-titulo" className="mt-2 text-lg font-light uppercase tracking-marca">
            <Palabras texto="Combos" />
          </h2>
        </Reveal>

        <Reveal>
          {/* Solapas: los 4 combos a la vista; mueven el carrusel y siguen al que está en el medio. */}
          {/* Solapas finas: los nombres como texto y una rayita que crece debajo del elegido. */}
          <div role="tablist" aria-label="Combos" className="sin-scrollbar mb-4 flex justify-center gap-5 overflow-x-auto">
            {combos.map((c, i) => (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={i === activo}
                onClick={() => irCombo(i)}
                className={`relative shrink-0 py-2 text-[11px] uppercase tracking-[0.16em] transition-colors duration-300 ease-suave ${
                  i === activo ? "text-tinta" : "text-tinta/45 hover:text-tinta/70"
                }`}
              >
                {c.nombre.replace(/^Combo /, "")}
                <span
                  aria-hidden="true"
                  className={`absolute inset-x-0 bottom-0 h-px origin-center bg-tinta transition-transform duration-500 ease-suave motion-reduce:transition-none ${
                    i === activo ? "scale-x-100" : "scale-x-0"
                  }`}
                />
              </button>
            ))}
          </div>

          {/* De borde a borde de la pantalla, para que asomen las de los costados. */}
          <ul
            ref={pista}
            aria-label="Combos"
            className="sin-scrollbar -mx-4 flex snap-x snap-mandatory items-start overflow-x-auto px-12 pb-2"
            style={{ gap: GAP, scrollPaddingInline: "3rem" }}
            onScroll={(e) => {
              const p = Math.round(e.currentTarget.scrollLeft / paso());
              if (p !== pos) setPos(p);
              window.clearTimeout(fin.current);
              fin.current = window.setTimeout(alTerminar, 140);
            }}
          >
            {tarjetas.map(({ combo, i, pos: p }) => {
              const enfocado = p === pos;
              const copia = p < N || p >= 2 * N;
              return (
                <li
                  key={`${combo.id}-${p}`}
                  aria-hidden={copia || undefined}
                  aria-label={copia ? undefined : `${combo.nombre}, ${i + 1} de ${N}`}
                  className={`relative w-full shrink-0 snap-center ${
                    saltando ? "" : "transition-[transform,filter,opacity] duration-500 ease-suave"
                  } motion-reduce:transition-none ${enfocado ? "scale-100 opacity-100" : "scale-[0.94] opacity-60 blur-[2px]"}`}
                >
                  <article inert={!enfocado} className="overflow-hidden rounded-[0.85rem] bg-crema">
                    <div className="relative">
                      <ConZoom fotos={combo.imagenes} nombre={combo.nombre}>
                        <ImagenProducto
                          srcs={combo.imagenes}
                          nombre={combo.nombre}
                          aspecto="aspect-[4/3]"
                          desfase={i * 900}
                          sizes="(min-width: 768px) 28rem, 85vw"
                        />
                      </ConZoom>
                      {combo.etiqueta && (
                        <p className="pointer-events-none absolute left-2.5 top-2.5 rounded-full border border-marron/35 bg-crema/90 px-2.5 py-1 text-[9px] uppercase tracking-[0.16em] text-marron">
                          {combo.etiqueta}
                        </p>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-base font-normal uppercase tracking-[0.12em]">{combo.nombre}</h3>
                      <p className="mt-1.5 text-[13px] text-tinta/75">{combo.descripcion}</p>
                      <div className="mt-3.5">
                        <MiniPiezas incluye={combo.incluye} />
                      </div>
                      {combo.precio !== null && (
                        <div className="mt-3.5">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-[1.3rem] font-light leading-none tracking-wide">{formatearPrecio(combo.precio)}</p>
                            {ahorroDe(combo) && (
                              <span className="whitespace-nowrap rounded-full border border-marron px-2.5 py-1 text-[11px] tracking-wide text-marron">
                                {sitio.kit.ahorro} {formatearPrecio(ahorroDe(combo)!.ahorro)}
                              </span>
                            )}
                          </div>
                          {ahorroDe(combo) && (
                            <p className="mt-1.5 text-[12px] text-tinta/55">
                              {sitio.kit.porSeparado} <s>{formatearPrecio(ahorroDe(combo)!.porSeparado)}</s>
                            </p>
                          )}
                        </div>
                      )}
                      <div className="pt-4">
                        <AgregarAlCarrito producto={combo} acento="medio" />
                      </div>
                    </div>
                  </article>
                  {/* Tocar una de los costados la trae al medio. */}
                  {!enfocado && (
                    <button
                      type="button"
                      onClick={() => irA(p)}
                      tabIndex={copia ? -1 : undefined}
                      aria-label={`Ver ${combo.nombre}`}
                      className="absolute inset-0 z-10 cursor-pointer"
                    />
                  )}
                </li>
              );
            })}
          </ul>

          {/* Puntitos: cuántos hay y en cuál estás. */}
          <div className="mt-3 flex justify-center gap-1.5" aria-hidden="true">
            {combos.map((c, i) => (
              <span key={c.id} className={`h-[3px] rounded-full transition-all duration-500 ${i === activo ? "w-6 bg-tinta" : "w-2.5 bg-tinta/25"}`} />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
