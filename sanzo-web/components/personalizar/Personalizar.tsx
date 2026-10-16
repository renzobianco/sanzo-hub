"use client";

import { useId, useRef, useState } from "react";
import { personalizacion as config, type FormaPieza } from "@/data/products";
import { formatearPrecio } from "@/lib/formato";
import {
  textoPersonalizacion,
  validarPersonalizacion,
  type ErroresPersonalizacion,
  type Personalizacion,
} from "@/lib/personalizacion";
import { IconoCerrar } from "../Iconos";
import { PiezaGrabada } from "./PiezaGrabada";
import { VistaArnes } from "./VistaArnes";

interface Props {
  valor?: Personalizacion;
  onCambio: (p: Personalizacion | undefined) => void;
  grande?: boolean;
}

/** Botón "Personalizar" + editor: estilo → nombre → teléfono (opcional), con el arnés en vivo arriba. */
export function Personalizar({ valor, onCambio, grande }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  const [estilo, setEstilo] = useState<FormaPieza | undefined>(valor?.estilo);
  const [nombre, setNombre] = useState(valor?.nombre ?? "");
  const [conTelefono, setConTelefono] = useState(!!valor?.telefono);
  const [telefono, setTelefono] = useState(valor?.telefono ?? "");
  const [errores, setErrores] = useState<ErroresPersonalizacion>({});

  function abrir() {
    setEstilo(valor?.estilo);
    setNombre(valor?.nombre ?? "");
    setConTelefono(!!valor?.telefono);
    setTelefono(valor?.telefono ?? "");
    setErrores({});
    document.body.style.overflow = "hidden";
    ref.current?.showModal();
  }

  function listo() {
    const p = {
      estilo: estilo ?? "",
      nombre: nombre.trim().replace(/\s+/g, " "),
      telefono: conTelefono ? telefono.trim() : undefined,
    };
    const e = validarPersonalizacion(p);
    setErrores(e);
    if (Object.keys(e).length > 0) {
      document.getElementById(`${id}-${Object.keys(e)[0]}`)?.focus();
      return;
    }
    onCambio(p as Personalizacion);
    ref.current?.close();
  }

  const extra = config.precioExtra > 0 ? `+ ${formatearPrecio(config.precioExtra)}` : "";
  const tamTexto = grande ? "text-sm" : "text-[11px]";

  // Un solo div raíz: así el space-y del padre no le pone margen al <dialog>.
  return (
    <div>
      {valor ? (
        <div className={`border border-tinta/20 bg-lino/50 ${grande ? "p-4" : "p-3"}`}>
          <p className="eyebrow">Personalizado {extra && <span className="ml-1 text-tinta">{extra}</span>}</p>
          <p className={`mt-1 text-marron ${grande ? "text-[15px]" : "text-xs"}`}>{textoPersonalizacion(valor)}</p>
          <div className={`mt-2 flex gap-4 uppercase tracking-[0.12em] ${tamTexto}`}>
            <button type="button" onClick={abrir} className="underline underline-offset-4">
              Editar
            </button>
            <button type="button" onClick={() => onCambio(undefined)} className="text-tinta/70 underline underline-offset-4">
              Quitar
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={abrir}
          className={`btn border border-dashed border-tinta/60 text-tinta w-full ${grande ? "py-4 text-sm" : "px-3 py-2.5 text-[11px]"}`}
        >
          {config.boton}
          {extra && <span className="text-tinta/70">{extra}</span>}
        </button>
      )}

      <dialog
        ref={ref}
        aria-labelledby={`${id}-titulo`}
        onClose={() => (document.body.style.overflow = "")}
        className="m-0 h-[100dvh] max-h-none w-full max-w-none bg-crema p-0 text-tinta backdrop:bg-tinta/50 md:m-auto md:h-[90vh] md:max-w-md"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-tinta/10 px-4 py-3">
            <h2 id={`${id}-titulo`} className="text-sm uppercase tracking-marca">
              {config.titulo}
            </h2>
            <button type="button" onClick={() => ref.current?.close()} aria-label="Cerrar" className="-mr-2 p-2">
              <IconoCerrar />
            </button>
          </div>

          {/* La vista queda fija arriba para ver los cambios mientras escribe. */}
          <div className="shrink-0 bg-lino px-4 pt-3">
            <div className="mx-auto w-[min(100%,34dvh)]">
              <VistaArnes estilo={estilo} nombre={nombre} telefono={conTelefono ? telefono : ""} />
            </div>
          </div>

          <div className="flex-1 space-y-7 overflow-y-auto px-4 py-6">
            <p className="text-[15px] text-tinta/80">{config.bajada}</p>

            <fieldset>
              <legend className="eyebrow mb-3">1 · Estilo</legend>
              <div className="grid grid-cols-3 gap-2">
                {config.estilos.map((e, i) => (
                  <label key={e.id} className="cursor-pointer">
                    <input
                      id={i === 0 ? `${id}-estilo` : undefined}
                      type="radio"
                      name={`${id}-estilo`}
                      value={e.id}
                      checked={estilo === e.id}
                      onChange={() => {
                        setEstilo(e.id);
                        setErrores((x) => ({ ...x, estilo: undefined }));
                      }}
                      className="peer sr-only"
                    />
                    <span className="flex flex-col items-center gap-2 border border-tinta/20 px-2 py-3 transition-colors peer-checked:border-tinta peer-checked:bg-lino peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-marron">
                      <PiezaGrabada forma={e.id} sinTexto className="w-16" />
                      <span className="text-[11px] uppercase tracking-[0.14em]">{e.nombre}</span>
                    </span>
                  </label>
                ))}
              </div>
              {errores.estilo && <p className="mt-2 text-sm text-marron">{errores.estilo}</p>}
            </fieldset>

            <div>
              <label htmlFor={`${id}-nombre`} className="eyebrow flex justify-between">
                <span>2 · Su nombre</span>
                <span className="tracking-normal">
                  {nombre.length}/{config.maxNombre}
                </span>
              </label>
              <input
                id={`${id}-nombre`}
                className="campo uppercase"
                maxLength={config.maxNombre}
                autoCapitalize="words"
                autoComplete="off"
                enterKeyHint="done"
                placeholder="Ej. Toto"
                value={nombre}
                onChange={(e) => {
                  setNombre(e.target.value);
                  setErrores((x) => ({ ...x, nombre: undefined }));
                }}
                aria-invalid={!!errores.nombre}
              />
              {errores.nombre && <p className="mt-1.5 text-sm text-marron">{errores.nombre}</p>}
            </div>

            <fieldset>
              <legend className="eyebrow mb-3">3 · ¿Sumamos tu teléfono?</legend>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    [false, "Solo nombre"],
                    [true, "Nombre y teléfono"],
                  ] as const
                ).map(([valorTel, texto]) => (
                  <label key={texto} className="cursor-pointer">
                    <input
                      type="radio"
                      name={`${id}-tel`}
                      checked={conTelefono === valorTel}
                      onChange={() => {
                        setConTelefono(valorTel);
                        setErrores((x) => ({ ...x, telefono: undefined }));
                      }}
                      className="peer sr-only"
                    />
                    <span className="flex h-11 items-center justify-center border border-tinta/20 text-[11px] uppercase tracking-[0.12em] transition-colors peer-checked:border-tinta peer-checked:bg-tinta peer-checked:text-crema peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-marron">
                      {texto}
                    </span>
                  </label>
                ))}
              </div>
              {conTelefono && (
                <div className="mt-4">
                  <label htmlFor={`${id}-telefono`} className="eyebrow block">
                    Teléfono
                  </label>
                  <input
                    id={`${id}-telefono`}
                    className="campo"
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
                  {errores.telefono && <p className="mt-1.5 text-sm text-marron">{errores.telefono}</p>}
                </div>
              )}
            </fieldset>
          </div>

          <div className="border-t border-tinta/10 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
            <button type="button" onClick={listo} className="btn-primario w-full py-4">
              Listo{extra && ` · ${extra}`}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
