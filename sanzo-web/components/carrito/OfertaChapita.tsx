"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { chapita, ofertaChapita as oferta } from "@/data/products";
import { tipoChapita, textoGrabado, validarGrabado, type ErroresGrabado } from "@/lib/chapita";
import { formatearPrecio } from "@/lib/formato";
import { IconoCerrar } from "../Iconos";

interface Props {
  abierta: boolean;
  /** Sumó la chapita: llega el texto del grabado ("Corazón · Coco · Tel. 11 2345 6789"). */
  onSumar: (texto: string) => void;
  onNo: () => void;
  /** "oferta": cartel al comprar (con Agregar y precio). "combo": la chapita viene en el combo, directo a personalizar. */
  modo?: "oferta" | "combo";
}

/** Cartel que aparece al comprar: primero la pieza con "Agregar"; al tocarlo, elegir forma y grabado con vista en vivo. */
export function OfertaChapita({ abierta, onSumar, onNo, modo = "oferta" }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  const [paso, setPaso] = useState<"cartel" | "personalizar">("cartel");
  const [tipo, setTipo] = useState(oferta.tipos[0]?.id ?? "");
  const [foto, setFoto] = useState(false);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [errores, setErrores] = useState<ErroresGrabado>({});

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (abierta && !d.open) {
      setErrores({});
      setPaso(modo === "combo" ? "personalizar" : "cartel");
      document.body.style.overflow = "hidden";
      d.showModal();
    } else if (!abierta && d.open) d.close();
  }, [abierta, modo]);

  function abrirPersonalizar() {
    setPaso("personalizar");
    ref.current?.scrollTo({ top: 0 });
  }

  function sumar() {
    const g = { tipo, foto, nombre, telefono };
    const e = validarGrabado(g);
    setErrores(e);
    if (Object.keys(e).length > 0) {
      document.getElementById(`${id}-${Object.keys(e)[0]}`)?.focus();
      return;
    }
    onSumar(textoGrabado(g));
  }

  const cerrar = (
    <button type="button" onClick={onNo} aria-label="Cerrar" className="absolute right-2 top-2 z-10 rounded-full bg-crema/85 p-2 backdrop-blur-sm">
      <IconoCerrar />
    </button>
  );
  const noGracias = (
    <button type="button" onClick={onNo} className="mx-auto mt-2 block px-4 py-3 text-[13px] uppercase tracking-[0.16em] text-tinta/60">
      {modo === "combo" ? "Cancelar" : oferta.no}
    </button>
  );

  return (
    <dialog
      ref={ref}
      aria-labelledby={`${id}-titulo`}
      // Esc o cerrar = "No, gracias".
      onCancel={(e) => {
        e.preventDefault();
        onNo();
      }}
      onClose={() => (document.body.style.overflow = "")}
      className="m-0 mt-auto max-h-[94dvh] w-full max-w-none overflow-y-auto rounded-t-[1.4rem] bg-crema p-0 text-tinta backdrop:bg-tinta/55 sm:m-auto sm:max-w-md sm:rounded-[1.4rem]"
    >
      {paso === "cartel" ? (
        <>
          <div className="relative">
            <div className="relative aspect-[1672/941] w-full bg-marron">
              <Image src={oferta.cartel} alt={oferta.cartelAlt} fill sizes="(min-width: 640px) 448px, 100vw" className="object-cover" priority />
            </div>
            <h2 id={`${id}-titulo`} className="sr-only">
              {oferta.cartelAlt}
            </h2>
            {cerrar}
          </div>
          <div className="px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5">
            <button type="button" onClick={abrirPersonalizar} className="btn-primario w-full py-4 text-sm">
              {oferta.agregar}
            </button>
            {noGracias}
          </div>
        </>
      ) : (
        <>
          {/* Fija arriba: mientras escribe, sigue viendo cómo queda. */}
          <div className="sticky top-0 z-10">
            <VistaChapita tipo={tipo} foto={foto} nombre={nombre} telefono={telefono} />
            {cerrar}
          </div>

          <div className="px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
            <h2 id={`${id}-titulo`} className="text-[1.25rem] font-normal uppercase leading-tight tracking-[0.12em]">
              {oferta.titulo}
            </h2>

            <fieldset className="mt-4">
              <legend className="eyebrow mb-2.5">Elegí la forma</legend>
              <div className="grid grid-cols-4 gap-2">
                {oferta.tipos.map((t, i) => (
                  <label key={t.id} className="cursor-pointer">
                    <input
                      id={i === 0 ? `${id}-tipo` : undefined}
                      type="radio"
                      name={`${id}-tipo`}
                      value={t.id}
                      checked={tipo === t.id}
                      onChange={() => {
                        setTipo(t.id);
                        setErrores({});
                      }}
                      className="peer sr-only"
                    />
                    <span className="block overflow-hidden rounded-lg border border-tinta/15 transition-colors peer-checked:border-tinta peer-checked:ring-1 peer-checked:ring-tinta peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-marron">
                      <span className="relative block aspect-square w-full overflow-hidden">
                        <Image src={t.imagen} alt="" fill sizes="25vw" className="scale-[1.35] object-cover" />
                      </span>
                      <span className="block py-1.5 text-center text-[11px] uppercase tracking-[0.12em]">{t.texto}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-lg border border-tinta/15 p-3.5 transition-colors has-[:checked]:border-tinta has-[:checked]:bg-lino/60">
              <input
                type="checkbox"
                checked={foto}
                onChange={(e) => {
                  setFoto(e.target.checked);
                  setErrores({});
                }}
                className="mt-0.5 size-5 shrink-0 accent-tinta"
              />
              <span>
                <span className="block text-[15px]">{oferta.foto.texto}</span>
                <span className="mt-0.5 block text-[13px] leading-snug text-tinta/60">{oferta.foto.detalle}</span>
              </span>
            </label>

            <p className="mt-5 text-[14px] text-tinta/65">
              {foto ? "Si querés, sumale su nombre y tu teléfono." : "Grabá su nombre, tu teléfono o los dos."}
            </p>

            <div className="mt-3">
              <label htmlFor={`${id}-nombre`} className="etiqueta flex justify-between">
                <span>Su nombre</span>
                <span className="text-tinta/50">
                  {nombre.length}/{oferta.maxNombre}
                </span>
              </label>
              <input
                id={`${id}-nombre`}
                className="campo mt-1.5"
                maxLength={oferta.maxNombre}
                autoComplete="off"
                autoCapitalize="words"
                enterKeyHint="next"
                placeholder="Ej. Kala"
                value={nombre}
                onChange={(e) => {
                  setNombre(e.target.value);
                  setErrores((x) => ({ ...x, nombre: undefined }));
                }}
                aria-invalid={!!errores.nombre}
              />
              {errores.nombre && <p className="mt-1.5 text-[15px] text-marron">{errores.nombre}</p>}
            </div>

            <div className="mt-3">
              <label htmlFor={`${id}-telefono`} className="etiqueta">
                Tu teléfono
              </label>
              <input
                id={`${id}-telefono`}
                className="campo mt-1.5"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                enterKeyHint="done"
                maxLength={16}
                placeholder="11 2345 6789"
                value={telefono}
                onChange={(e) => {
                  setTelefono(e.target.value);
                  setErrores((x) => ({ ...x, telefono: undefined, nombre: undefined }));
                }}
                aria-invalid={!!errores.telefono}
              />
              {errores.telefono && <p className="mt-1.5 text-[15px] text-marron">{errores.telefono}</p>}
            </div>

            {modo === "combo" ? (
              // Viene en el combo: ya está en el precio, solo falta el grabado.
              <button type="button" onClick={sumar} className="btn-primario mt-6 w-full py-4 text-sm">
                {oferta.botonCombo}
              </button>
            ) : (
              <>
                <div className="mt-5 flex items-baseline gap-3">
                  <span className="text-[1.6rem] font-medium leading-none">{formatearPrecio(oferta.precio)}</span>
                  {chapita.precio !== null && chapita.precio > oferta.precio && (
                    <s className="text-[15px] text-tinta/50">{formatearPrecio(chapita.precio)}</s>
                  )}
                </div>
                <p className="mt-1 text-[12px] uppercase tracking-[0.18em] text-marron">{oferta.soloAhora}</p>

                <button type="button" onClick={sumar} className="btn-primario mt-4 w-full py-4 text-sm">
                  {oferta.boton} · {formatearPrecio(oferta.precio)}
                </button>
              </>
            )}
            {noGracias}
          </div>
        </>
      )}
    </dialog>
  );
}

/**
 * La chapita elegida con el grabado encima, en vivo. La foto se ve en 4:3 (recortada al medio, entra la
 * chapa entera) y el texto se ubica y se achica con las medidas de `zona`, en píxeles de la foto
 * (cqw = parte del ancho de la vista).
 */
function VistaChapita({ tipo, foto, nombre, telefono }: { tipo: string; foto: boolean; nombre: string; telefono: string }) {
  const t = tipoChapita(tipo) ?? oferta.tipos[0];
  const { ancho, alto } = oferta.fotoTam;
  const recorte = (alto - (ancho * 3) / 4) / 2; // lo que queda afuera arriba (y abajo) de la vista
  const z = t.zona;
  const n = nombre.trim().replace(/\s+/g, " ");
  const tel = telefono.trim().replace(/\s+/g, " ");
  const vacio = !foto && !n && !tel;
  // Sin nada elegido, un ejemplo apagado para que se entienda dónde va.
  const lineaNombre = vacio ? "Kala" : n;
  const lineaTel = vacio ? "" : tel;
  const hayTexto = !!(lineaNombre || lineaTel);

  // Con foto: la carita arriba y el texto (si hay) más chico abajo, todo dentro de la zona.
  const ej = oferta.foto.ejemploTam;
  const altoFoto = foto ? z.alto * (hayTexto ? 0.58 : 0.95) : 0;
  const anchoFoto = Math.min(z.ancho * 0.8, (altoFoto * ej.ancho) / ej.alto);
  const altoTexto = foto ? z.alto * 0.4 : z.alto;

  // Tamaño de letra en píxeles de la foto: lo más grande que entra a lo ancho y a lo alto.
  const tamNombre = Math.min(altoTexto * (lineaTel ? 0.42 : 0.55), z.ancho / (Math.max(lineaNombre.length, 3) * 0.58));
  const tamTel = Math.min(altoTexto * (lineaNombre ? 0.2 : 0.3), z.ancho / (Math.max(lineaTel.length, 6) * 0.56));
  const cqw = (px: number) => `${(px / ancho) * 100}cqw`;

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden bg-marron [container-type:inline-size]" aria-live="polite">
      <Image src={t.imagen} alt={`Chapita ${t.texto}`} fill sizes="(min-width: 640px) 448px, 100vw" className="object-cover" priority />
      <div
        className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center text-center leading-[1.1]"
        style={{
          left: cqw(z.x),
          top: cqw(z.y - recorte),
          width: cqw(z.ancho),
          gap: cqw(z.alto * 0.04),
          // Grabado láser sobre acero espejado: gris claro escarchado, apenas hundido.
          color: "rgba(232, 228, 222, 0.9)",
          textShadow: "0 0 0.5px rgba(255,255,255,0.55), 0 1px 1px rgba(0,0,0,0.35)",
          opacity: vacio ? 0.45 : 1,
        }}
      >
        {foto && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={oferta.foto.ejemplo} alt="Ejemplo: la foto de tu perro grabada" style={{ width: cqw(anchoFoto), opacity: 0.9 }} />
        )}
        {lineaNombre && (
          <span className="whitespace-nowrap font-normal" style={{ fontSize: cqw(tamNombre) }}>
            {lineaNombre}
          </span>
        )}
        {lineaTel && (
          <span className="whitespace-nowrap font-normal tracking-[0.04em]" style={{ fontSize: cqw(tamTel) }}>
            {lineaTel}
          </span>
        )}
      </div>
    </div>
  );
}
