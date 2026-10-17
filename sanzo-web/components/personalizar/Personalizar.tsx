"use client";

import { useId, useRef, useState } from "react";
import { getProducto, personalizacion as config, vista360, type Producto } from "@/data/products";
import { formatearPrecio } from "@/lib/formato";
import { aGrabadoLaser } from "@/lib/laser";
import {
  estiloPorId,
  materialInicial,
  tamanoInicial,
  tamanoPorId,
  piezasPersonalizables,
  precioPersonalizacion,
  textoPersonalizacion,
  validarPersonalizacion,
  type ErroresPersonalizacion,
  type Personalizacion,
} from "@/lib/personalizacion";
import { IconoCerrar } from "../Iconos";
import { MiniParche, VistaPieza } from "./Vista";
import { Visor360 } from "./Visor360";

interface Props {
  producto: Producto;
  valor?: Personalizacion;
  onCambio: (p: Personalizacion | undefined) => void;
  grande?: boolean;
  /** El botón se muestra como link de texto ("¿Con su nombre? Personalizalo"). */
  comoLink?: boolean;
}

/**
 * Botón "Personalizar" + editor: parche → material → tamaño → nombre (y teléfono) o imagen propia, con la vista previa
 * arriba. En kits y combos se puede ver cada pieza (y el arnés en 360°) con las pestañas de la vista.
 */
export function Personalizar({ producto, valor, onCambio, grande, comoLink }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  const [estilo, setEstilo] = useState<string | undefined>(valor?.estilo);
  const [nombre, setNombre] = useState(valor?.nombre ?? "");
  const [conTelefono, setConTelefono] = useState(!!valor?.telefono);
  const [telefono, setTelefono] = useState(valor?.telefono ?? "");
  const [errores, setErrores] = useState<ErroresPersonalizacion>({});
  const [material, setMaterial] = useState(valor?.material ?? materialInicial());
  const [tamano, setTamano] = useState(valor?.tamano ?? tamanoInicial());
  const [modo, setModo] = useState<Personalizacion["modo"]>(valor?.modo ?? "nombre");
  const [imagen, setImagen] = useState(valor?.imagen);
  const [procesando, setProcesando] = useState(false);
  const piezas = piezasPersonalizables(producto);
  // Pestañas de la vista: una por pieza, más el 360° si está el arnés.
  const vistas = [
    ...piezas.map((p) => ({ id: p, texto: getProducto(p)?.nombre ?? p })),
    ...(vista360.activo && piezas.includes("arnes") ? [{ id: "360", texto: vista360.pestana360 }] : []),
  ];
  const [vista, setVista] = useState(vistas[0]?.id);

  function abrir() {
    setEstilo(valor?.estilo);
    setNombre(valor?.nombre ?? "");
    setConTelefono(!!valor?.telefono);
    setTelefono(valor?.telefono ?? "");
    setErrores({});
    setMaterial(valor?.material ?? materialInicial());
    setTamano(valor?.tamano ?? tamanoInicial());
    setModo(valor?.modo ?? "nombre");
    setImagen(valor?.imagen);
    setVista(vistas[0]?.id);
    document.body.style.overflow = "hidden";
    ref.current?.showModal();
  }

  function listo() {
    const enImagen = modo === "imagen";
    const p: Personalizacion = {
      estilo: estilo ?? "",
      material,
      tamano,
      modo,
      nombre: enImagen ? "" : nombre.trim().replace(/\s+/g, " "),
      telefono: !enImagen && conTelefono ? telefono.trim() : undefined,
      imagen: enImagen ? imagen : undefined,
    };
    const e = validarPersonalizacion(p, { pedirImagen: true });
    setErrores(e);
    if (Object.keys(e).length > 0) {
      document.getElementById(`${id}-${Object.keys(e)[0]}`)?.focus();
      return;
    }
    onCambio(p);
    ref.current?.close();
  }

  // Cualquier imagen → cómo quedaría grabada con láser (todo en el navegador).
  async function subirImagen(archivo?: File) {
    if (!archivo) return;
    setProcesando(true);
    try {
      setImagen(await aGrabadoLaser(archivo));
      setErrores((x) => ({ ...x, imagen: undefined }));
    } catch {
      setErrores((x) => ({
        ...x,
        imagen: "No pudimos leer esa imagen. Probá con otra (JPG o PNG).",
      }));
    } finally {
      setProcesando(false);
    }
  }

  const precio = precioPersonalizacion(producto, { material, tamano, modo });
  const extra = precio > 0 ? `+ ${formatearPrecio(precio)}` : "";
  const estiloElegido = estilo ? estiloPorId(estilo) : undefined;
  const telVisible = conTelefono ? telefono : "";
  const escala = tamanoPorId(tamano)?.escala ?? 1;
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
      ) : comoLink ? (
        <button type="button" onClick={abrir} className="mx-auto block py-1 text-[15px] text-marron">
          {config.link.pregunta}{" "}
          <span className="font-normal underline underline-offset-4">{config.link.accion}</span>
          {extra && <span className="ml-1 text-tinta/60">{extra}</span>}
        </button>
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
        className="m-0 h-[100dvh] max-h-none w-full max-w-none overflow-hidden bg-crema p-0 text-tinta backdrop:bg-tinta/50 sm:m-auto sm:h-[min(92vh,760px)] sm:w-[min(92vw,980px)] sm:rounded-[1.25rem]"
      >
        {/* Celu: vista arriba y formulario abajo. PC: vista grande a la izquierda y formulario a la derecha. */}
        <div className="flex h-full flex-col sm:grid sm:grid-cols-[1.15fr_1fr] sm:grid-rows-[auto_1fr_auto]">
          <div className="flex items-center justify-between border-b border-tinta/10 px-4 py-3 sm:col-span-2 sm:px-6">
            <h2 id={`${id}-titulo`} className="text-sm uppercase tracking-marca">
              {config.titulo}
            </h2>
            <button type="button" onClick={() => ref.current?.close()} aria-label="Cerrar" className="-mr-2 p-2">
              <IconoCerrar />
            </button>
          </div>

          {/* La vista queda fija arriba para ver los cambios mientras escribe. */}
          <div className="shrink-0 bg-lino px-4 pt-3 sm:row-span-2 sm:flex sm:flex-col sm:justify-center sm:overflow-hidden sm:px-8 sm:pt-6">
            {vistas.length > 1 && (
              <div
                role="tablist"
                aria-label="Vista"
                className="sin-scrollbar -mx-4 mb-3 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:mb-5 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0"
              >
                {vistas.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    role="tab"
                    aria-selected={vista === v.id}
                    onClick={() => setVista(v.id)}
                    className={`h-8 shrink-0 whitespace-nowrap rounded-full px-3.5 text-[10px] uppercase tracking-marca transition-colors duration-500 ease-suave active:scale-95 ${
                      vista === v.id ? "bg-tinta text-crema" : "bg-crema/70 text-tinta/70"
                    }`}
                  >
                    {v.texto}
                  </button>
                ))}
              </div>
            )}
            <div className="mx-auto w-[min(100%,34dvh)] sm:w-[min(100%,56vh)]">
              {vista === "360" ? (
                <Visor360 />
              ) : vista && config.piezas[vista] ? (
                <VistaPieza
                  pieza={config.piezas[vista]}
                  nombrePieza={getProducto(vista)?.nombre ?? vista}
                  estilo={estiloElegido}
                  escala={escala}
                  nombre={nombre}
                  telefono={telVisible}
                  imagen={modo === "imagen" ? imagen : undefined}
                />
              ) : null}
            </div>
            {piezas.length > 1 && (
              <p className="pb-3 pt-2 text-center text-[11px] text-tinta/60">Va en {piezas.length} piezas: todas menos el moño.</p>
            )}
            {piezas.length <= 1 && <div className="h-3" />}
          </div>

          <div className="relative flex-1 space-y-7 overflow-y-auto px-4 py-6 sm:col-start-2 sm:row-start-2 sm:px-6">
            <p className="text-[15px] text-tinta/80">{config.bajada}</p>

            <fieldset>
              <legend className="eyebrow mb-3">1 · Parche</legend>
              <div className="grid grid-cols-2 gap-2">
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
                    <span className="flex flex-col items-center gap-2 border border-tinta/20 p-1.5 pb-2.5 transition-colors peer-checked:border-tinta peer-checked:bg-lino peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-marron">
                      <MiniParche estilo={e} />
                      <span className="text-[11px] uppercase tracking-[0.14em]">{e.nombre}</span>
                    </span>
                  </label>
                ))}
              </div>
              {errores.estilo && <p className="mt-2 text-sm text-marron">{errores.estilo}</p>}
            </fieldset>

            <fieldset>
              <legend id={`${id}-material`} tabIndex={-1} className="eyebrow mb-3">
                2 · Material
              </legend>
              <div className="grid grid-cols-2 gap-2">
                {config.materiales.map((m) => (
                  <label key={m.id} className={m.proximamente ? "cursor-not-allowed" : "cursor-pointer"}>
                    <input
                      type="radio"
                      name={`${id}-material`}
                      value={m.id}
                      checked={material === m.id}
                      disabled={m.proximamente}
                      onChange={() => {
                        setMaterial(m.id);
                        setErrores((x) => ({ ...x, material: undefined }));
                      }}
                      className="peer sr-only"
                    />
                    <span className="flex h-12 flex-col items-center justify-center border border-tinta/20 text-[11px] uppercase tracking-[0.12em] transition-colors peer-checked:border-tinta peer-checked:bg-tinta peer-checked:text-crema peer-disabled:opacity-45 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-marron">
                      {m.nombre}
                      {m.proximamente && <span className="mt-0.5 text-[9px] tracking-[0.14em] text-tinta/70">Muy pronto</span>}
                      {!m.proximamente && m.precioExtra > 0 && (
                        <span className="mt-0.5 text-[9px] tracking-normal opacity-80">+ {formatearPrecio(m.precioExtra)}</span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
              {errores.material && <p className="mt-2 text-sm text-marron">{errores.material}</p>}
            </fieldset>

            <fieldset>
              <legend className="eyebrow mb-3">3 · Tamaño</legend>
              <div className="grid grid-cols-3 gap-2">
                {config.tamanos.map((t) => (
                  <label key={t.id} className="cursor-pointer">
                    <input
                      type="radio"
                      name={`${id}-tamano`}
                      value={t.id}
                      checked={tamano === t.id}
                      onChange={() => setTamano(t.id)}
                      className="peer sr-only"
                    />
                    <span className="flex h-14 flex-col items-center justify-center gap-1 border border-tinta/20 text-[11px] uppercase tracking-[0.12em] transition-colors peer-checked:border-tinta peer-checked:bg-tinta peer-checked:text-crema peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-marron">
                      {/* Rectangulito que crece con el tamaño. */}
                      <span
                        aria-hidden="true"
                        className="block rounded-[2px] border border-current opacity-70"
                        style={{
                          width: `${t.escala * 26}px`,
                          height: `${t.escala * 12}px`,
                        }}
                      />
                      {t.nombre}
                      {t.precioExtra > 0 && (
                        <span className="text-[9px] tracking-normal opacity-80">+ {formatearPrecio(t.precioExtra)}</span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
              <p className="mt-2 text-[12px] text-tinta/60">Grande es lo máximo que entra en cada pieza.</p>
            </fieldset>

            <fieldset>
              <legend className="eyebrow mb-3">4 · ¿Qué grabamos?</legend>
              {/* Control segmentado: la píldora se desliza a la opción elegida. */}
              <div className="relative grid grid-cols-2 rounded-full bg-lino p-1">
                <span
                  aria-hidden="true"
                  className={`absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-tinta transition-transform duration-500 ease-suave ${modo === "imagen" ? "translate-x-full" : ""}`}
                />
                {(
                  [
                    ["nombre", "Su nombre"],
                    ["imagen", "Tu imagen"],
                  ] as const
                ).map(([m, texto]) => (
                  <label key={m} className="relative cursor-pointer">
                    <input type="radio" name={`${id}-modo`} checked={modo === m} onChange={() => setModo(m)} className="peer sr-only" />
                    <span
                      className={`flex h-10 items-center justify-center text-[11px] uppercase tracking-[0.12em] transition-colors duration-500 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-marron ${
                        modo === m ? "text-crema" : "text-tinta/70"
                      }`}
                    >
                      {texto}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            {modo === "imagen" ? (
              <div>
                <label
                  id={`${id}-imagen`}
                  tabIndex={-1}
                  className={`flex cursor-pointer items-center gap-4 border border-dashed p-3 transition-transform active:scale-[0.99] ${errores.imagen ? "border-marron" : "border-tinta/40"}`}
                >
                  <input type="file" accept="image/*" className="sr-only" onChange={(e) => subirImagen(e.target.files?.[0])} />
                  <span className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#c9a27a]">
                    {imagen ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imagen} alt="Tu imagen grabada" className="h-full w-full object-contain mix-blend-multiply" />
                    ) : (
                      <span aria-hidden="true" className="text-2xl font-light text-tinta/60">
                        +
                      </span>
                    )}
                    {procesando && <span className="absolute inset-0 animate-pulse bg-crema/60" />}
                  </span>
                  <span className="text-[13px] leading-snug">
                    <span className="block uppercase tracking-[0.12em]">{imagen ? "Cambiar imagen" : "Subir imagen"}</span>
                    <span className="mt-0.5 block text-tinta/60">
                      {procesando ? "Grabando…" : "Cualquier foto o dibujo. Te mostramos cómo queda grabado."}
                    </span>
                  </span>
                </label>
                {errores.imagen && <p className="mt-1.5 text-sm text-marron">{errores.imagen}</p>}
                <p className="mt-3 text-[12px] leading-relaxed text-tinta/60">{config.avisoImagen}</p>
              </div>
            ) : (
              <>
                <div>
                  <label htmlFor={`${id}-nombre`} className="eyebrow flex justify-between">
                    <span>Su nombre</span>
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
                  <legend className="eyebrow mb-3">¿Sumamos tu teléfono?</legend>
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
              </>
            )}
          </div>

          <div className="border-t border-tinta/10 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:col-start-2 sm:row-start-3 sm:px-6">
            <button type="button" onClick={listo} className="btn-primario w-full py-4">
              Listo{extra && ` · ${extra}`}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
