"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { chapita, ofertaChapita as oferta } from "@/data/products";
import { letrasChapita, tipoChapita, textoGrabado, validarGrabado, type ErroresGrabado } from "@/lib/chapita";
import { familia } from "@/lib/fuentes";
import { aGrabadoLaser } from "@/lib/laser";
import { formatearPrecio } from "@/lib/formato";
import { IconoCerrar } from "../Iconos";

/** Pasos del grabado, como en el personalizador de los parches. */
const PASOS = ["Forma", "Qué grabamos", "Letra"];

interface Props {
  abierta: boolean;
  /** Sumó la chapita: llega el texto del grabado ("Corazón · Coco · Tel. 11 2345 6789"). */
  onSumar: (texto: string) => void;
  onNo: () => void;
  /** "oferta": cartel al comprar (con Agregar y precio). "combo": la chapita viene en el combo (o se compra suelta), directo a personalizar. */
  modo?: "oferta" | "combo";
}

/**
 * Cartel que aparece al comprar: primero la pieza con "Agregar"; al tocarlo, el grabado con el mismo formato
 * que el personalizador de los parches: pantalla completa, la chapita sin fondo sobre lino arriba y los pasos abajo.
 */
export function OfertaChapita({ abierta, onSumar, onNo, modo = "oferta" }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  const [paso, setPaso] = useState<"cartel" | "personalizar">("cartel");
  const [tipo, setTipo] = useState(oferta.tipos[0]?.id ?? "");
  // Imagen grabada: ninguna, la cara de su perro u otra. La que suben es solo para la vista previa (la original llega por WhatsApp).
  const [imagenTipo, setImagenTipo] = useState<"" | "carita" | "otra">("");
  const [vistaImagen, setVistaImagen] = useState<{ src: string; proporcion: number } | null>(null);
  const [procesando, setProcesando] = useState(false);
  const foto = imagenTipo === "carita";
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [letra, setLetra] = useState(letrasChapita[0]?.id ?? "jost");
  const [pasoGrabado, setPasoGrabado] = useState(0);
  const [errores, setErrores] = useState<ErroresGrabado>({});
  // Si lo que compra ya trae la chapita (combo), el cartel no se muestra nunca: directo a personalizar.
  const verCartel = modo === "oferta" && paso === "cartel";

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (abierta && !d.open) {
      setErrores({});
      setPasoGrabado(0);
      setPaso(modo === "combo" ? "personalizar" : "cartel");
      document.body.style.overflow = "hidden";
      d.showModal();
    } else if (!abierta && d.open) d.close();
  }, [abierta, modo]);

  /** Revisa lo que hay que grabar; si falta algo, vuelve a ese paso y marca el campo. */
  function revisar() {
    const e = validarGrabado({ tipo, foto, imagen: imagenTipo === "otra", nombre, telefono });
    setErrores(e);
    const campo = Object.keys(e)[0];
    if (!campo) return true;
    setPasoGrabado(PASOS.indexOf(campo === "tipo" ? "Forma" : "Qué grabamos"));
    window.setTimeout(() => document.getElementById(`${id}-${campo}`)?.focus(), 50);
    return false;
  }

  /** Ir a un paso: para pasar de "Qué grabamos" en adelante tiene que estar completo. */
  function irAPaso(i: number) {
    if (i > PASOS.indexOf("Qué grabamos") && !revisar()) return;
    setPasoGrabado(i);
  }

  function sumar() {
    if (!revisar()) return;
    onSumar(textoGrabado({ tipo, foto, imagen: imagenTipo === "otra", nombre, telefono, letra }));
  }

  /** Cualquier foto → cómo quedaría grabada (en el navegador, al instante). */
  async function verImagen(archivo?: File) {
    if (!archivo) return;
    setProcesando(true);
    try {
      const g = await aGrabadoLaser(archivo);
      setVistaImagen({ src: g.grabado, proporcion: g.proporcion });
    } catch {
      setVistaImagen(null);
    } finally {
      setProcesando(false);
    }
  }

  const elegido = tipoChapita(tipo) ?? oferta.tipos[0];
  const ultimo = pasoGrabado === PASOS.length - 1;
  const textoBoton = modo === "combo" ? oferta.botonCombo : `${oferta.boton} · ${formatearPrecio(oferta.precio)}`;

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
      className={
        verCartel
          ? "m-0 mt-auto max-h-[94dvh] w-full max-w-none overflow-y-auto rounded-t-[1.4rem] bg-crema p-0 text-tinta backdrop:bg-tinta/55 sm:m-auto sm:max-w-md sm:rounded-[1.4rem]"
          : // Igual que el personalizador de los parches: pantalla completa en el celu, ventana grande en PC.
            "m-0 h-[100dvh] max-h-none w-full max-w-none overflow-hidden bg-crema p-0 text-tinta backdrop:bg-tinta/50 sm:m-auto sm:h-[min(92vh,760px)] sm:w-[min(92vw,980px)] sm:rounded-[1.25rem]"
      }
    >
      {verCartel ? (
        <>
          {/* Cartel con la foto de las chapitas grabadas y los textos de la marca (Jost liviana, crema y marrón). */}
          <div className="relative">
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-lino">
              <Image src={oferta.cartelFoto} alt={oferta.cartelAlt} fill sizes="(min-width: 640px) 448px, 100vw" className="object-cover object-[50%_45%]" priority />
            </div>
            <button type="button" onClick={onNo} aria-label="Cerrar" className="absolute right-2 top-2 z-10 rounded-full bg-crema/85 p-2 backdrop-blur-sm">
              <IconoCerrar />
            </button>
          </div>
          <div className="px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-6 text-center">
            <p className="flex items-center justify-center gap-2.5 text-[11px] uppercase tracking-[0.28em] text-marron">
              <span aria-hidden="true" className="h-px w-6 bg-marron" />
              {oferta.cartelPrevia}
              <span aria-hidden="true" className="h-px w-6 bg-marron" />
            </p>
            <h2 id={`${id}-titulo`} className="mt-3 text-[1.55rem] font-light uppercase leading-tight tracking-[0.14em]">
              {oferta.cartelTitulo}
            </h2>
            <p className="mx-auto mt-2.5 max-w-[19rem] text-[14px] leading-relaxed text-tinta/70">{oferta.cartelTexto}</p>
            <p className="mt-4 flex items-baseline justify-center gap-2.5">
              <span className="text-[1.5rem] font-light tracking-wide">{formatearPrecio(oferta.precio)}</span>
              {chapita.precio !== null && chapita.precio > oferta.precio && (
                <s className="text-[14px] text-tinta/45">{formatearPrecio(chapita.precio)}</s>
              )}
            </p>
            {oferta.tresPorDos.activa && (
              <p className="mt-2 text-[12px] uppercase tracking-[0.16em] text-marron">{oferta.tresPorDos.aviso}</p>
            )}
            <button type="button" onClick={() => setPaso("personalizar")} className="btn-primario mt-5 w-full py-4 text-sm">
              {oferta.agregar}
            </button>
            <button type="button" onClick={onNo} className="mx-auto mt-2 block px-4 py-3 text-[13px] uppercase tracking-[0.16em] text-tinta/60">
              {oferta.no}
            </button>
          </div>
        </>
      ) : (
        // Celu: vista arriba y formulario abajo. PC: vista grande a la izquierda y formulario a la derecha.
        <div className="flex h-full flex-col sm:grid sm:grid-cols-[1.15fr_1fr] sm:grid-rows-[auto_1fr_auto]">
          <div className="flex items-center justify-between border-b border-tinta/10 px-4 py-3 sm:col-span-2 sm:px-6">
            <h2 id={`${id}-titulo`} className="text-sm uppercase tracking-marca">
              {oferta.titulo}
            </h2>
            <button type="button" onClick={onNo} aria-label="Cerrar" className="-mr-2 p-2">
              <IconoCerrar />
            </button>
          </div>

          {/* La vista queda fija arriba para ver los cambios mientras elige. */}
          <div className="shrink-0 bg-lino px-4 pt-4 sm:row-span-2 sm:flex sm:flex-col sm:justify-center sm:px-8 sm:pt-6">
            <div className="flex h-[30dvh] items-center justify-center [--alto-vista:30dvh] sm:h-[52vh] sm:[--alto-vista:52vh]">
              <VistaChapita tipo={tipo} imagenTipo={imagenTipo} vistaImagen={vistaImagen} nombre={nombre} telefono={telefono} letra={letra} />
            </div>
            <p className="pb-3 pt-3 text-center text-[11px] text-tinta/60">{elegido.texto} · grabado láser</p>
          </div>

          <div className="relative flex-1 overflow-y-auto px-4 py-6 sm:col-start-2 sm:row-start-2 sm:px-6">
            {/* Pasos: uno por pantalla, se tocan para ir a cualquiera. */}
            <div className="grid grid-cols-3 gap-1.5" role="tablist" aria-label="Pasos">
              {PASOS.map((p, i) => (
                <button
                  key={p}
                  type="button"
                  role="tab"
                  aria-selected={pasoGrabado === i}
                  onClick={() => irAPaso(i)}
                  className="flex flex-col gap-1.5 text-left"
                >
                  <span className={`h-[3px] w-full rounded-full transition-colors duration-500 ${i <= pasoGrabado ? "bg-tinta" : "bg-tinta/15"}`} />
                  <span className={`text-[9px] uppercase leading-tight tracking-[0.1em] ${pasoGrabado === i ? "text-tinta" : "text-tinta/50"}`}>
                    {i + 1} · {p}
                  </span>
                </button>
              ))}
            </div>

            <div key={pasoGrabado} className="mt-7 animate-entrada space-y-7">
              {PASOS[pasoGrabado] === "Forma" && (
                <fieldset>
                  <legend className="eyebrow mb-3">
                    Forma <span className="ml-1 normal-case tracking-normal text-tinta/60">{elegido.texto}</span>
                  </legend>
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
                        {/* Como las formas del parche: recuadro fino, la chapita sin fondo y el nombre abajo. */}
                        <span className="flex h-24 flex-col items-center justify-center gap-1.5 border border-tinta/20 px-1 transition-colors peer-checked:border-tinta peer-checked:bg-lino peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-marron">
                          <span className="relative block h-12 w-12">
                            <Image src={t.recorte.src} alt="" fill sizes="48px" className="object-contain" />
                          </span>
                          <span className="text-[9px] uppercase tracking-[0.14em] text-tinta/70">{t.texto}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                  {errores.tipo && <p className="mt-2 text-sm text-marron">{errores.tipo}</p>}
                </fieldset>
              )}

              {PASOS[pasoGrabado] === "Qué grabamos" && (
                <>
                  <fieldset>
                    <legend className="eyebrow mb-3">¿Lleva imagen?</legend>
                    <div className="grid grid-cols-3 gap-2">
                      {(
                        [
                          ["", oferta.foto.opciones.ninguna],
                          ["carita", oferta.foto.opciones.carita],
                          ["otra", oferta.foto.opciones.otra],
                        ] as const
                      ).map(([v, texto]) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => {
                            setImagenTipo(v);
                            setErrores({});
                          }}
                          className={`h-11 border text-[10px] uppercase tracking-[0.12em] transition-colors ${imagenTipo === v ? "border-tinta bg-tinta text-crema" : "border-tinta/20"}`}
                        >
                          {texto}
                        </button>
                      ))}
                    </div>
                    {imagenTipo && (
                      <div className="mt-3 animate-entrada">
                        <p className="text-[12px] leading-relaxed text-tinta/70">{imagenTipo === "carita" ? oferta.foto.detalleCarita : oferta.foto.detalleOtra}</p>
                        <label className="btn mt-3 flex w-full cursor-pointer items-center justify-center border border-dashed border-tinta/60 py-3 text-[11px] text-tinta">
                          {procesando ? "Preparando…" : vistaImagen ? "Cambiar foto" : oferta.foto.elegir}
                          <input
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={(e) => {
                              verImagen(e.target.files?.[0]);
                              e.target.value = "";
                            }}
                          />
                        </label>
                      </div>
                    )}
                  </fieldset>

                  <div>
                    <p className="mb-3 text-[13px] text-tinta/65">
                      {imagenTipo ? "Si querés, sumale su nombre y tu teléfono." : "Grabá su nombre, tu teléfono o los dos."}
                    </p>
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
                    {errores.nombre && <p className="mt-1.5 text-sm text-marron">{errores.nombre}</p>}
                  </div>

                  <div>
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
                    {errores.telefono && <p className="mt-1.5 text-sm text-marron">{errores.telefono}</p>}
                  </div>
                </>
              )}

              {PASOS[pasoGrabado] === "Letra" && (
                <fieldset>
                  <legend className="eyebrow mb-3">
                    Letra <span className="ml-1 normal-case tracking-normal text-tinta/60">{letrasChapita.find((f) => f.id === letra)?.nombre}</span>
                  </legend>
                  {/* Cada letra muestra su nombre escrito con ella: se elige viendo. */}
                  <div className="grid grid-cols-3 gap-2">
                    {letrasChapita.map((f) => {
                      const { familia: fam, peso } = familia(f.id);
                      const muestra = nombre.trim() || "Kala";
                      return (
                        <label key={f.id} className="min-w-0 cursor-pointer">
                          <input type="radio" name={`${id}-letra`} value={f.id} checked={letra === f.id} onChange={() => setLetra(f.id)} className="peer sr-only" />
                          <span className="flex h-16 w-full flex-col items-center justify-center gap-1 overflow-hidden border border-tinta/20 px-2 transition-colors peer-checked:border-tinta peer-checked:bg-lino peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-marron">
                            <span
                              className="block w-full truncate text-center text-lg leading-none"
                              style={{ fontFamily: fam, fontWeight: peso, letterSpacing: f.mayusculas ? "0.06em" : undefined }}
                            >
                              {f.mayusculas ? muestra.toUpperCase() : muestra}
                            </span>
                            <span className="text-[9px] uppercase tracking-[0.14em] text-tinta/60">{f.nombre}</span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              )}
            </div>
          </div>

          <div className="border-t border-tinta/10 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:col-start-2 sm:row-start-3 sm:px-6">
            {ultimo && modo === "oferta" && (
              // El precio de la oferta, con el suelto tachado al lado (lo pidió Renzo).
              <p className="mb-2.5 flex items-baseline justify-center gap-2 text-[12px] uppercase tracking-[0.14em] text-marron">
                {oferta.soloAhora}
                {chapita.precio !== null && chapita.precio > oferta.precio && (
                  <s className="normal-case tracking-normal text-tinta/50">{formatearPrecio(chapita.precio)}</s>
                )}
              </p>
            )}
            <div className="flex gap-2">
              {pasoGrabado > 0 && (
                <button type="button" onClick={() => setPasoGrabado((p) => p - 1)} className="btn w-28 shrink-0 border border-tinta/30 py-4 text-tinta">
                  Atrás
                </button>
              )}
              {ultimo ? (
                <button type="button" onClick={sumar} className="btn-primario flex-1 py-4">
                  {textoBoton}
                </button>
              ) : (
                <button type="button" onClick={() => irAPaso(pasoGrabado + 1)} className="btn-primario flex-1 py-4">
                  Siguiente
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
}

/**
 * La chapita elegida, sin fondo, con el grabado encima en vivo. El texto se ubica y se achica con `zonaRecorte`
 * (partes del ancho y alto del recorte; cqw = parte del ancho de la vista). Grabado láser sobre acero: gris
 * oscuro mate, apenas hundido.
 */
function VistaChapita({
  tipo,
  imagenTipo,
  vistaImagen,
  nombre,
  telefono,
  letra,
}: {
  tipo: string;
  imagenTipo: "" | "carita" | "otra";
  vistaImagen: { src: string; proporcion: number } | null;
  nombre: string;
  telefono: string;
  letra: string;
}) {
  const t = tipoChapita(tipo) ?? oferta.tipos[0];
  const { familia: fam, peso } = familia(letra);
  const mayusculas = letrasChapita.find((f) => f.id === letra)?.mayusculas;
  const { ancho, alto } = t.recorte;
  const z = t.zonaRecorte;
  const n = nombre.trim().replace(/\s+/g, " ");
  const tel = telefono.trim().replace(/\s+/g, " ");
  // Imagen en la vista: la que subió (pasada a grabado) o, si eligió "Su carita" y no subió nada, la de ejemplo.
  const img = vistaImagen ?? (imagenTipo === "carita" ? { src: oferta.foto.ejemplo, proporcion: oferta.foto.ejemploTam.ancho / oferta.foto.ejemploTam.alto } : null);
  const foto = !!imagenTipo && !!img;
  const vacio = !foto && !n && !tel;
  // Sin nada elegido, un ejemplo apagado para que se entienda dónde va.
  const lineaNombre = vacio ? "Kala" : n;
  const lineaTel = vacio ? "" : tel;
  const hayTexto = !!(lineaNombre || lineaTel);

  // Todo en partes del ancho del recorte (1 = todo el ancho).
  const zAlto = (z.alto * alto) / ancho;
  const altoFoto = foto ? zAlto * (hayTexto ? 0.58 : 0.95) : 0;
  const anchoFoto = img ? Math.min(z.ancho * 0.85, altoFoto * img.proporcion) : 0;
  const altoTexto = foto ? zAlto * 0.4 : zAlto;
  const tamNombre = Math.min(altoTexto * (lineaTel ? 0.42 : 0.55), z.ancho / (Math.max(lineaNombre.length, 3) * 0.6));
  const tamTel = Math.min(altoTexto * (lineaNombre ? 0.2 : 0.3), z.ancho / (Math.max(lineaTel.length, 6) * 0.56));
  const cqw = (parte: number) => `${parte * 100}cqw`;

  return (
    <div
      className="relative [container-type:inline-size]"
      // Entra entera en la vista: las altas (placa) por el alto, las anchas (huesito) por el ancho.
      style={{
        width: `min(100%, calc(var(--alto-vista) * ${ancho / alto}))`,
        aspectRatio: `${ancho} / ${alto}`,
        filter: "drop-shadow(0 6px 10px rgb(37 29 22 / 0.18))",
      }}
      aria-live="polite"
    >
      <Image key={t.id} src={t.recorte.src} alt={`Chapita ${t.texto}`} fill sizes="(min-width: 640px) 40vw, 70vw" className="animate-fundido object-contain" priority />
      <div
        className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center text-center leading-[1.1]"
        style={{
          left: `${z.x * 100}%`,
          top: `${z.y * 100}%`,
          width: cqw(z.ancho),
          gap: cqw(zAlto * 0.04),
          // Grabado láser sobre acero: gris casi negro, mate y nítido (como las chapitas reales).
          color: "rgba(30, 28, 27, 0.88)",
          textShadow: "0 0 0.4px rgba(30,28,27,0.6)",
          opacity: vacio ? 0.45 : 1,
        }}
      >
        {foto && img && (
          // El grabado es blanco con transparencia: se pinta del gris del láser con una máscara.
          <span
            role="img"
            aria-label={vistaImagen ? "Tu imagen grabada" : "Ejemplo: la cara de tu perro grabada"}
            className="block"
            style={{
              width: cqw(anchoFoto),
              aspectRatio: `${img.proporcion}`,
              backgroundColor: "rgba(30, 28, 27, 0.88)",
              WebkitMaskImage: `url(${img.src})`,
              maskImage: `url(${img.src})`,
              WebkitMaskSize: "contain",
              maskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
              maskPosition: "center",
            }}
          />
        )}
        {lineaNombre && (
          <span className="whitespace-nowrap" style={{ fontSize: cqw(tamNombre), fontFamily: fam, fontWeight: peso, letterSpacing: mayusculas ? "0.06em" : undefined }}>
            {mayusculas ? lineaNombre.toUpperCase() : lineaNombre}
          </span>
        )}
        {lineaTel && (
          <span className="whitespace-nowrap tracking-[0.04em]" style={{ fontSize: cqw(tamTel) }}>
            {lineaTel}
          </span>
        )}
      </div>
    </div>
  );
}
