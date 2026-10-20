"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { chapita, ofertaChapita as oferta } from "@/data/products";
import { tipoChapita, textoGrabado, validarGrabado, type ErroresGrabado } from "@/lib/chapita";
import { formatearPrecio } from "@/lib/formato";
import { IconoCerrar } from "../Iconos";

interface Props {
  abierta: boolean;
  /** Sumó la chapita: llega el texto del grabado ("Huesito · KALA"). */
  onSumar: (texto: string) => void;
  onNo: () => void;
}

/** Cartel que aparece al comprar: ofrece una chapita grabada a precio de oferta. */
export function OfertaChapita({ abierta, onSumar, onNo }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  const [tipo, setTipo] = useState(oferta.tipos[0]?.id ?? "");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [errores, setErrores] = useState<ErroresGrabado>({});
  const elegido = tipoChapita(tipo);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (abierta && !d.open) {
      setErrores({});
      document.body.style.overflow = "hidden";
      d.showModal();
    } else if (!abierta && d.open) d.close();
  }, [abierta]);

  function sumar() {
    const g = { tipo, nombre, telefono: elegido?.pide === "telefono" ? telefono : undefined };
    const e = validarGrabado(g);
    setErrores(e);
    if (Object.keys(e).length > 0) {
      document.getElementById(`${id}-${Object.keys(e)[0]}`)?.focus();
      return;
    }
    onSumar(textoGrabado(g));
  }

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
      <div className="relative">
        <div className="relative aspect-[1200/620] w-full bg-lino">
          <Image src={oferta.imagen} alt="Chapitas grabadas: huesito, circular con la cara del perro y rectangular con nombre y teléfono" fill sizes="(min-width: 640px) 448px, 100vw" className="object-cover" />
        </div>
        <button type="button" onClick={onNo} aria-label="Cerrar" className="absolute right-2 top-2 rounded-full bg-crema/85 p-2 backdrop-blur-sm">
          <IconoCerrar />
        </button>
      </div>

      <div className="px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5">
        <h2 id={`${id}-titulo`} className="text-[1.35rem] font-normal uppercase leading-tight tracking-[0.12em]">
          {oferta.titulo}
        </h2>
        <p className="mt-1.5 text-[15px] text-tinta/65">{oferta.bajada}</p>

        <div className="mt-4 flex items-baseline gap-3">
          <span className="text-[2rem] font-medium leading-none">{formatearPrecio(oferta.precio)}</span>
          {chapita.precio !== null && chapita.precio > oferta.precio && (
            <s className="text-[15px] text-tinta/50">{formatearPrecio(chapita.precio)}</s>
          )}
        </div>
        <p className="mt-1 text-[12px] uppercase tracking-[0.18em] text-marron">{oferta.soloAhora}</p>

        <fieldset className="mt-5">
          <legend className="eyebrow mb-2.5">Elegí la chapita</legend>
          <div className="grid grid-cols-3 gap-2">
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
                <span className="flex h-full flex-col items-center justify-center rounded-lg border border-tinta/20 px-1 py-2.5 text-center transition-colors peer-checked:border-tinta peer-checked:bg-tinta peer-checked:text-crema peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-marron">
                  <span className="text-[12px] uppercase tracking-[0.12em]">{t.texto}</span>
                  <span className="mt-0.5 text-[11px] opacity-70">{t.detalle}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {elegido?.pide === "cara" && <p className="mt-3 text-[14px] text-marron">{oferta.avisoCara}</p>}

        <div className="mt-4">
          <label htmlFor={`${id}-nombre`} className="etiqueta flex justify-between">
            <span>
              Su nombre{elegido?.pide === "cara" && <span className="text-tinta/50"> (opcional)</span>}
            </span>
            <span className="text-tinta/50">
              {nombre.length}/{oferta.maxNombre}
            </span>
          </label>
          <input
            id={`${id}-nombre`}
            className="campo mt-1.5 uppercase"
            maxLength={oferta.maxNombre}
            autoComplete="off"
            enterKeyHint="done"
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

        {elegido?.pide === "telefono" && (
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
              maxLength={16}
              placeholder="11 2345 6789"
              value={telefono}
              onChange={(e) => {
                setTelefono(e.target.value);
                setErrores((x) => ({ ...x, telefono: undefined }));
              }}
              aria-invalid={!!errores.telefono}
            />
            {errores.telefono && <p className="mt-1.5 text-[15px] text-marron">{errores.telefono}</p>}
          </div>
        )}

        <button type="button" onClick={sumar} className="btn-primario mt-5 w-full py-4 text-sm">
          {oferta.boton} · {formatearPrecio(oferta.precio)}
        </button>
        <button type="button" onClick={onNo} className="mx-auto mt-2 block px-4 py-3 text-[13px] uppercase tracking-[0.16em] text-tinta/60">
          {oferta.no}
        </button>
      </div>
    </dialog>
  );
}
