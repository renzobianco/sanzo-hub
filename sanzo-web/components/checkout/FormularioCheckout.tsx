"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { PROVINCIAS } from "@/data/envios";
import { formatearPrecio, textoEnvio } from "@/lib/formato";
import { CLAVE_ULTIMO_PEDIDO, type PedidoEntrada, type PedidoRespuesta } from "@/lib/pedido";
import { textoPersonalizacion } from "@/lib/personalizacion";
import { datosVacios, validarCheckout, type DatosCheckout } from "@/lib/validacion";
import { useCarrito } from "../carrito/CarritoProvider";
import { ImagenProducto } from "../ImagenProducto";

type Campo = keyof DatosCheckout;

// Orden para enfocar el primer campo con error.
const ORDEN: Campo[] = [
  "nombre",
  "dni",
  "email",
  "celular",
  "calle",
  "altura",
  "provincia",
  "gba",
  "localidad",
  "codigoPostal",
];

export function FormularioCheckout() {
  const router = useRouter();
  const { totales, listo, ubicacion, setUbicacion, vaciar } = useCarrito();
  const [d, setD] = useState<DatosCheckout>(datosVacios);
  const [tocados, setTocados] = useState<Partial<Record<Campo, boolean>>>({});
  const [intentado, setIntentado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState("");
  const [empresa, setEmpresa] = useState("");
  const inicializado = useRef(false);

  // Traer la provincia elegida en el carrito (si ya la habían elegido ahí).
  useEffect(() => {
    if (!listo || inicializado.current) return;
    inicializado.current = true;
    if (ubicacion.provincia) {
      setD((prev) => ({
        ...prev,
        provincia: ubicacion.provincia,
        gba: ubicacion.enGBA === null ? "" : ubicacion.enGBA ? "si" : "no",
      }));
    }
  }, [listo, ubicacion]);

  const errores = useMemo(() => validarCheckout(d), [d]);
  const mostrar = (c: Campo) => (intentado || tocados[c] ? errores[c] : undefined);

  function set<C extends Campo>(c: C, v: DatosCheckout[C]) {
    const next = { ...d, [c]: v };
    if (c === "provincia") next.gba = "";
    setD(next);
    if (c === "provincia" || c === "gba") {
      setUbicacion({
        provincia: next.provincia,
        enGBA: next.provincia === "Buenos Aires" && next.gba ? next.gba === "si" : null,
      });
    }
  }

  const tocar = (c: Campo) => () => setTocados((t) => ({ ...t, [c]: true }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIntentado(true);
    setErrorEnvio("");
    const primero = ORDEN.find((c) => errores[c]);
    if (primero) {
      document.getElementById(`f-${primero}`)?.focus();
      return;
    }
    if (totales.lineas.length === 0) return;

    setEnviando(true);
    const payload: PedidoEntrada = {
      cliente: d,
      lineas: totales.lineas.map((l) => ({
        productoId: l.productoId,
        opcion: l.opcion,
        personalizacion: l.personalizacion,
        cantidad: l.cantidad,
      })),
      empresa,
    };
    try {
      const res = await fetch("/api/pedido", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data: PedidoRespuesta = await res.json();
      if (!res.ok || !data.ok || !data.numero) throw new Error(data.error || "Error");

      try {
        window.localStorage.setItem(CLAVE_ULTIMO_PEDIDO, JSON.stringify({ numero: data.numero, nombre: d.nombre }));
      } catch {
        // sin almacenamiento: /gracias igual recibe el número por la URL
      }
      vaciar();
      if (data.redirigirA) {
        window.location.href = data.redirigirA;
      } else {
        router.push(`/gracias?pedido=${encodeURIComponent(data.numero)}&estado=recibido`);
      }
    } catch (err) {
      setErrorEnvio(
        err instanceof Error && err.message !== "Error"
          ? err.message
          : "No pudimos registrar el pedido. Probá de nuevo en un rato.",
      );
      setEnviando(false);
    }
  }

  if (!listo) {
    return <div className="min-h-[60vh]" aria-busy="true" />;
  }

  if (totales.lineas.length === 0 && !enviando) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 text-center">
        <p className="text-xl font-light">Tu carrito está vacío.</p>
        <Link href="/#kit" className="btn-primario">
          Ver el kit
        </Link>
      </div>
    );
  }

  const { lineas, subtotal, envio, total } = totales;

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-12 md:grid-cols-[1fr_380px] md:gap-16">
      <div className="space-y-12">
        <Grupo titulo="Tus datos">
          <Campo id="nombre" label="Nombre y apellido" error={mostrar("nombre")} className="sm:col-span-2">
            <input
              id="f-nombre"
              className="campo"
              autoComplete="name"
              value={d.nombre}
              onChange={(e) => set("nombre", e.target.value)}
              onBlur={tocar("nombre")}
              aria-invalid={!!mostrar("nombre")}
              aria-describedby={mostrar("nombre") ? "e-nombre" : undefined}
            />
          </Campo>
          <Campo id="dni" label="DNI" error={mostrar("dni")}>
            <input
              id="f-dni"
              className="campo"
              inputMode="numeric"
              autoComplete="off"
              maxLength={10}
              value={d.dni}
              onChange={(e) => set("dni", e.target.value.replace(/[^\d.]/g, ""))}
              onBlur={tocar("dni")}
              aria-invalid={!!mostrar("dni")}
              aria-describedby={mostrar("dni") ? "e-dni" : undefined}
            />
          </Campo>
          <Campo id="celular" label="Celular" error={mostrar("celular")}>
            <input
              id="f-celular"
              className="campo"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="11 2345 6789"
              value={d.celular}
              onChange={(e) => set("celular", e.target.value)}
              onBlur={tocar("celular")}
              aria-invalid={!!mostrar("celular")}
              aria-describedby={mostrar("celular") ? "e-celular" : undefined}
            />
          </Campo>
          <Campo id="email" label="Email" error={mostrar("email")} className="sm:col-span-2">
            <input
              id="f-email"
              className="campo"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={d.email}
              onChange={(e) => set("email", e.target.value)}
              onBlur={tocar("email")}
              aria-invalid={!!mostrar("email")}
              aria-describedby={mostrar("email") ? "e-email" : undefined}
            />
          </Campo>
        </Grupo>

        <fieldset>
          <legend className="titulo-form">Entrega</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ["domicilio", "Envío a domicilio"],
                ["sucursal", "Retiro en sucursal de Correo Argentino"],
              ] as const
            ).map(([valor, texto]) => (
              <label key={valor} className="cursor-pointer">
                <input
                  type="radio"
                  name="entrega"
                  value={valor}
                  checked={d.entrega === valor}
                  onChange={() => set("entrega", valor)}
                  className="peer sr-only"
                />
                <span className="flex h-full items-center gap-3 rounded-lg border border-tinta/30 px-4 py-4 text-[15px] transition-colors peer-checked:border-tinta peer-checked:bg-lino/60 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-marron">
                  <span
                    aria-hidden="true"
                    className={`h-4 w-4 shrink-0 rounded-full border border-tinta ${
                      d.entrega === valor ? "bg-tinta shadow-[inset_0_0_0_3px_rgb(var(--crema))]" : ""
                    }`}
                  />
                  {texto}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <Grupo titulo={d.entrega === "domicilio" ? "Dirección de entrega" : "¿Dónde retirás?"}>
          {d.entrega === "domicilio" && (
            <>
              <Campo id="calle" label="Calle" error={mostrar("calle")}>
                <input
                  id="f-calle"
                  className="campo"
                  autoComplete="address-line1"
                  value={d.calle}
                  onChange={(e) => set("calle", e.target.value)}
                  onBlur={tocar("calle")}
                  aria-invalid={!!mostrar("calle")}
                  aria-describedby={mostrar("calle") ? "e-calle" : undefined}
                />
              </Campo>
              <Campo id="altura" label="Altura" error={mostrar("altura")}>
                <input
                  id="f-altura"
                  className="campo"
                  inputMode="numeric"
                  value={d.altura}
                  onChange={(e) => set("altura", e.target.value)}
                  onBlur={tocar("altura")}
                  aria-invalid={!!mostrar("altura")}
                  aria-describedby={mostrar("altura") ? "e-altura" : undefined}
                />
              </Campo>
              <Campo id="pisoDepto" label="Piso / depto" opcional>
                <input
                  id="f-pisoDepto"
                  className="campo"
                  autoComplete="address-line2"
                  value={d.pisoDepto}
                  onChange={(e) => set("pisoDepto", e.target.value)}
                />
              </Campo>
              <Campo id="referencia" label="Punto de referencia" opcional>
                <input
                  id="f-referencia"
                  className="campo"
                  placeholder="Ej. portón verde"
                  value={d.referencia}
                  onChange={(e) => set("referencia", e.target.value)}
                />
              </Campo>
            </>
          )}

          <Campo id="provincia" label="Provincia" error={mostrar("provincia")}>
            <select
              id="f-provincia"
              className="campo cursor-pointer"
              autoComplete="address-level1"
              value={d.provincia}
              onChange={(e) => set("provincia", e.target.value)}
              onBlur={tocar("provincia")}
              aria-invalid={!!mostrar("provincia")}
              aria-describedby={mostrar("provincia") ? "e-provincia" : undefined}
            >
              <option value="">Elegí tu provincia</option>
              {PROVINCIAS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Campo>

          {d.provincia === "Buenos Aires" && (
            <Campo id="gba" label="¿Estás en el GBA?" error={mostrar("gba")}>
              <select
                id="f-gba"
                className="campo cursor-pointer"
                value={d.gba}
                onChange={(e) => set("gba", e.target.value)}
                onBlur={tocar("gba")}
                aria-invalid={!!mostrar("gba")}
                aria-describedby={mostrar("gba") ? "e-gba" : undefined}
              >
                <option value="">Elegí una opción</option>
                <option value="si">Sí</option>
                <option value="no">No</option>
              </select>
            </Campo>
          )}

          <Campo id="localidad" label="Localidad" error={mostrar("localidad")}>
            <input
              id="f-localidad"
              className="campo"
              autoComplete="address-level2"
              value={d.localidad}
              onChange={(e) => set("localidad", e.target.value)}
              onBlur={tocar("localidad")}
              aria-invalid={!!mostrar("localidad")}
              aria-describedby={mostrar("localidad") ? "e-localidad" : undefined}
            />
          </Campo>
          <Campo id="codigoPostal" label="Código postal" error={mostrar("codigoPostal")}>
            <input
              id="f-codigoPostal"
              className="campo uppercase"
              autoComplete="postal-code"
              maxLength={8}
              placeholder="1425 o C1425ABC"
              value={d.codigoPostal}
              onChange={(e) => set("codigoPostal", e.target.value.trim())}
              onBlur={tocar("codigoPostal")}
              aria-invalid={!!mostrar("codigoPostal")}
              aria-describedby={mostrar("codigoPostal") ? "e-codigoPostal" : undefined}
            />
          </Campo>
          <Campo id="notas" label="Notas del pedido" opcional className="sm:col-span-2">
            <textarea
              id="f-notas"
              className="campo min-h-[90px] resize-y"
              value={d.notas}
              onChange={(e) => set("notas", e.target.value)}
            />
          </Campo>
        </Grupo>

        {/* Honeypot anti-spam: invisible para personas. */}
        <div aria-hidden="true" className="absolute left-[-9999px] h-px w-px overflow-hidden">
          <label htmlFor="f-empresa">Empresa</label>
          <input id="f-empresa" tabIndex={-1} autoComplete="off" value={empresa} onChange={(e) => setEmpresa(e.target.value)} />
        </div>
      </div>

      <aside aria-labelledby="resumen-titulo" className="h-fit bg-lino/70 p-6 md:sticky md:top-24 md:p-8">
        <h2 id="resumen-titulo" className="text-lg font-normal tracking-wide">
          Tu pedido
        </h2>
        <ul className="mt-5 divide-y divide-tinta/10">
          {lineas.map((l) => (
            <li key={l.key} className="flex gap-4 py-4">
              <ImagenProducto
                src={l.producto.imagenes[0]}
                nombre={l.producto.nombre}
                sizes="56px"
                className="w-14 shrink-0"
                tamTexto="text-[7px]"
              />
              <div className="flex-1 text-[15px]">
                <p>{l.producto.nombre}</p>
                <p className="text-sm text-tinta/70">
                  {l.opcion && l.producto.opcion ? `${l.producto.opcion.nombre} ${l.opcion} · ` : ""}
                  {l.cantidad} u.
                </p>
                {l.personalizacion && (
                  <p className="text-sm text-marron">{textoPersonalizacion(l.personalizacion)}</p>
                )}
              </div>
              <p className="text-[15px]">{formatearPrecio(l.subtotal)}</p>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-2 border-t border-tinta/15 pt-4 text-[15px]">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{formatearPrecio(subtotal)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>
              Envío
              {(envio.tipo === "precio" || envio.tipo === "cotizar") && (
                <span className="block text-xs text-tinta/70">{envio.zona.nombre}</span>
              )}
              {envio.tipo === "gratis" && <span className="block text-xs text-tinta/70">Incluido con el kit completo</span>}
            </dt>
            <dd className={envio.tipo === "gratis" ? "text-marron" : ""}>{textoEnvio(envio)}</dd>
          </div>
          <div className="flex justify-between border-t border-tinta/15 pt-3 text-lg">
            <dt>Total</dt>
            <dd className="text-right">
              {formatearPrecio(total)}
              {(envio.tipo === "cotizar" || envio.tipo === "sin-zona") && (
                <span className="block text-xs text-tinta/70">+ envío</span>
              )}
            </dd>
          </div>
        </dl>

        <button type="submit" disabled={enviando} className="btn-primario mt-8 w-full py-4">
          {enviando ? "Enviando…" : "Confirmar pedido"}
        </button>
        <p role="alert" className="mt-3 text-sm text-marron empty:hidden">
          {errorEnvio || (intentado && Object.keys(errores).length > 0 ? "Revisá los campos marcados." : "")}
        </p>
        <p className="mt-4 text-xs leading-relaxed text-tinta/70">El pago se hace por Mercado Pago.</p>
      </aside>
    </form>
  );
}

function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="titulo-form">{titulo}</legend>
      <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function Campo({
  id,
  label,
  error,
  opcional,
  className = "",
  children,
}: {
  id: string;
  label: string;
  error?: string;
  opcional?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={`f-${id}`} className="etiqueta">
        {label}
        {opcional && <span className="ml-1 text-tinta/60">(opcional)</span>}
      </label>
      {children}
      {error && (
        <p id={`e-${id}`} className="mt-1.5 text-[15px] font-normal text-marron">
          {error}
        </p>
      )}
    </div>
  );
}
