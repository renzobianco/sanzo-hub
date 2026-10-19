"use client";

import { useEffect, useState } from "react";
import { sitio } from "@/data/products";
import { useFooterVisible } from "@/lib/flotantes";
import { IconoCerrar, IconoWhatsapp } from "./Iconos";

const link = (texto: string) => `https://wa.me/${sitio.whatsapp.numero}?text=${encodeURIComponent(texto)}`;

/**
 * Botón flotante de WhatsApp: aparece al pasar la portada y, al tocarlo, abre una tarjetita
 * con preguntas rápidas que ya llegan escritas al chat.
 */
export function BotonWhatsapp() {
  const { numero, titulo, texto, mensaje, rapidas } = sitio.whatsapp;
  const [pasoPortada, setVisible] = useState(false);
  const [abierto, setAbierto] = useState(false);
  // Sobre el footer se esconde (tapaba los legales).
  const sobreFooter = useFooterVisible();
  const visible = pasoPortada && !sobreFooter;

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.5);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!abierto) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [abierto]);

  if (!numero) return null;

  // El contenedor no toma clics (si no, la tarjeta invisible tapa los botones de abajo a la derecha):
  // solo el botón y la tarjeta abierta los reciben.

  return (
    <div
      className={`pointer-events-none fixed bottom-5 right-4 z-40 flex flex-col items-end transition-all duration-700 ease-suave md:bottom-8 md:right-8 ${
        visible || abierto ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
      }`}
    >
      {/* Tarjeta */}
      <div
        id="whatsapp-tarjeta"
        role="dialog"
        aria-label={titulo}
        className={`mb-3 w-[min(19rem,calc(100vw-2rem))] origin-bottom-right bg-crema p-5 shadow-[0_18px_50px_rgb(var(--tinta)/0.22)] transition-all duration-500 ease-suave ${
          abierto ? "pointer-events-auto scale-100 opacity-100" : "pointer-events-none scale-90 opacity-0"
        }`}
        aria-hidden={!abierto}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-lg font-light uppercase tracking-marca">{titulo}</p>
            <p className="mt-1 text-sm text-tinta/75">{texto}</p>
          </div>
          <button type="button" onClick={() => setAbierto(false)} aria-label="Cerrar" className="-m-2 p-2" tabIndex={abierto ? 0 : -1}>
            <IconoCerrar width={18} height={18} />
          </button>
        </div>
        <ul className="mt-4 space-y-2">
          {rapidas.map((r, i) => (
            <li
              key={r}
              className={`transition-all duration-500 ease-suave ${abierto ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}
              style={{ transitionDelay: abierto ? `${120 + i * 60}ms` : "0ms" }}
            >
              <a
                href={link(r)}
                target="_blank"
                rel="noopener noreferrer"
                tabIndex={abierto ? 0 : -1}
                className="block border border-tinta/15 px-3.5 py-2.5 text-[14px] transition-[background-color,transform] duration-300 active:scale-[0.98] active:bg-lino"
              >
                {r}
              </a>
            </li>
          ))}
        </ul>
        <a
          href={link(mensaje)}
          target="_blank"
          rel="noopener noreferrer"
          tabIndex={abierto ? 0 : -1}
          className="btn-primario mt-4 w-full py-3 text-[12px]"
        >
          <IconoWhatsapp width={18} height={18} />
          Abrir WhatsApp
        </a>
      </div>

      {/* Botón */}
      <button
        type="button"
        onClick={() => setAbierto((a) => !a)}
        aria-expanded={abierto}
        aria-controls="whatsapp-tarjeta"
        aria-label={abierto ? "Cerrar ayuda por WhatsApp" : "Escribinos por WhatsApp"}
        className={`relative flex h-14 w-14 items-center justify-center rounded-full bg-tinta text-crema ring-1 ring-crema/25 ${visible || abierto ? "pointer-events-auto" : ""} shadow-[0_10px_30px_rgb(var(--tinta)/0.3)] transition-transform duration-300 ease-suave active:scale-90`}
      >
        {!abierto && <span aria-hidden="true" className="absolute inset-0 animate-ping rounded-full bg-marron/30 [animation-duration:2.6s]" />}
        <span className={`transition-transform duration-500 ease-suave ${abierto ? "rotate-90" : ""}`}>
          {abierto ? <IconoCerrar /> : <IconoWhatsapp width={25} height={25} />}
        </span>
      </button>
    </div>
  );
}
