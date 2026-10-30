"use client";

import { useEffect, useId, useRef, useState } from "react";
import { trabarScroll } from "@/lib/scroll";
import { getProducto, personalizacion as config, sitio, vista360, type Producto } from "@/data/products";
import { formatearPrecio } from "@/lib/formato";
import { medidaFinal, proporcionForma } from "@/lib/formas";
import { familia } from "@/lib/fuentes";
import { aGrabadoLaser, imagenParaSubir, type Grabado } from "@/lib/laser";
import { cargarZonas, colocar, esRedonda, recortarZona, type Zona } from "@/lib/zonas";
import {
  clavePersonalizacion,
  colorInicial,
  colorPorId,
  materialInicial,
  medidaMaxima,
  piezasPersonalizables,
  precioPersonalizacion,
  precioPieza,
  textoCorto,
  textoPersonalizacion,
  tramoTamano,
  TAM_LETRA,
  tamLetraValido,
  validarPersonalizacion,
  type ErroresPersonalizacion,
  type DisenoPieza,
  type Personalizacion,
} from "@/lib/personalizacion";
import { IconoCerrar } from "../Iconos";
import { MiniForma, Parche, ParcheSolo, precargarPiezas, VistaPieza, type DisenoParche } from "./Vista";
import { PadEscritura } from "./PadEscritura";
import { Visor360 } from "./Visor360";

interface Props {
  producto: Producto;
  valor?: Personalizacion;
  onCambio: (p: Personalizacion | undefined) => void;
  grande?: boolean;
  /** El botón se muestra como link de texto ("¿Con su nombre? Personalizalo"). */
  comoLink?: boolean;
  /** Versión chica para cada ítem del carrito. */
  enCarrito?: boolean;
}

type EstadoSubida = "nada" | "subiendo" | "ok" | "error";

const cm = (v: number) => String(Math.round(v * 10) / 10).replace(".", ",");

/** El diseño de una pieza mientras se edita (con lo que hace falta para el formulario). */
interface Diseno {
  forma: string;
  formaOtra: string;
  material: string;
  color: string;
  ancho: number;
  alto: number;
  modo: Personalizacion["modo"];
  nombre: string;
  conTelefono: boolean;
  telefono: string;
  /** Otra línea libre debajo del nombre (en lugar del teléfono). */
  conLinea2: boolean;
  linea2: string;
  fuente: string;
  /** Tamaño de la letra: 0,5 a 1 de lo más grande que entra. */
  tamLetra: number;
  /** "Tu letra" sin escribir acá: la manda por WhatsApp. */
  letraWhatsapp: boolean;
  /** La forma que tenía con nombre (al pasar a "Tu imagen" la forma es su silueta; al volver, vuelve esta). */
  formaAntes?: string;
  vistaImagen?: Grabado;
  imagenUrl?: string;
  subida: EstadoSubida;
}

/** Diseño para editar a partir de uno guardado (o el de entrada). */
function disenoDesde(p?: DisenoPieza | null): Diseno {
  const { inicial } = config.medidas;
  return {
    forma: p?.forma ?? config.formas[0].id,
    formaOtra: p?.formaOtra ?? "",
    material: p?.material ?? materialInicial(),
    color: p?.color ?? colorInicial(),
    ancho: p?.ancho ?? inicial.ancho,
    alto: p?.alto ?? inicial.alto,
    modo: p?.modo ?? "nombre",
    nombre: p?.nombre ?? "",
    conTelefono: !!p?.telefono,
    telefono: p?.telefono ?? "",
    conLinea2: !!p?.linea2,
    linea2: p?.linea2 ?? "",
    fuente: p?.fuente ?? config.fuentes[0].id,
    tamLetra: p?.tamLetra ?? 1,
    letraWhatsapp: !!p?.letraWhatsapp,
    vistaImagen: p?.vista,
    imagenUrl: p?.imagenUrl,
    subida: p?.imagenUrl ? "ok" : "nada",
  };
}

/** Los diseños propios guardados (solo de las piezas que tenían uno distinto). Las demás no tienen: al pedir
 * "Diseño propio" arrancan como copia del común (así no se pierde lo que ya estaba hecho). */
function disenosIniciales(piezas: string[], valor?: Personalizacion) {
  const propios = propiosIniciales(piezas, valor);
  return Object.fromEntries(piezas.filter((pz) => propios[pz] && valor?.piezas?.[pz]).map((pz) => [pz, disenoDesde(valor!.piezas![pz])]));
}

/** Qué piezas tienen diseño propio al abrir: las que guardaron uno distinto del común. */
function propiosIniciales(piezas: string[], valor?: Personalizacion) {
  const comun = valor ? clavePersonalizacion({ ...valor, piezas: undefined, posiciones: undefined }) : "";
  return Object.fromEntries(piezas.map((pz) => [pz, !!valor?.piezas?.[pz] && clavePersonalizacion(valor.piezas[pz]!) !== comun]));
}

/** Qué piezas van personalizadas (cualquiera se puede dejar sin parche). */
function activasIniciales(piezas: string[], valor?: Personalizacion) {
  return Object.fromEntries(piezas.map((pz) => [pz, valor?.piezas ? valor.piezas[pz] !== null : true]));
}

/** La medida final de un diseño: dentro de lo que entra y con la proporción de su forma. */
function medidaDe(d: Diseno, max: { ancho: number; alto: number }) {
  const { minCm } = config.medidas;
  const proporcion = d.forma === "silueta" ? d.vistaImagen?.proporcionSilueta ?? null : proporcionForma(d.forma);
  const anchoMax = Math.max(minCm, Math.floor((proporcion ? Math.min(max.ancho, max.alto * proporcion) : max.ancho) * 2) / 2);
  return medidaFinal(d.forma, Math.min(Math.max(d.ancho, minCm), anchoMax), Math.min(Math.max(d.alto, minCm), max.alto), d.vistaImagen?.proporcionSilueta);
}

/**
 * Lo personalizado, pieza por pieza: el parche dibujado, la pieza y un renglón corto, con "Quitar" en cada una
 * (quitar la última saca toda la personalización). "Editar" abre el editor.
 */
function Resumen({
  producto,
  valor,
  onCambio,
  abrir,
  extra,
  compacto,
}: {
  producto: Producto;
  valor: Personalizacion;
  onCambio: (p: Personalizacion | undefined) => void;
  abrir: () => void;
  extra: string;
  compacto?: boolean;
}) {
  const piezas = piezasPersonalizables(producto);
  const { piezas: _p, posiciones: _pos, ...base } = valor;
  const porPieza: Record<string, DisenoPieza | null> = valor.piezas ?? Object.fromEntries(piezas.map((pz) => [pz, base]));
  const conParche = piezas.filter((pz) => porPieza[pz]);

  function quitar(pz: string) {
    const nuevo = { ...porPieza, [pz]: null };
    if (!piezas.some((x) => nuevo[x])) return onCambio(undefined);
    const primera = piezas.map((x) => nuevo[x]).find(Boolean)!;
    onCambio({ ...primera, posiciones: valor.posiciones, piezas: nuevo });
  }

  return (
    <div className="min-w-0 animate-entrada">
      <div className="flex items-baseline justify-between gap-3">
        <p className="eyebrow">
          Personalizado {extra && <span className="ml-1 normal-case tracking-normal text-tinta">{extra}</span>}
        </p>
        <button type="button" onClick={abrir} className="py-1 text-[11px] uppercase tracking-[0.12em] underline underline-offset-4">
          Editar
        </button>
      </div>
      <ul className={`mt-2 divide-y divide-tinta/10 ${compacto ? "" : "border-t border-tinta/10"}`}>
        {conParche.map((pz) => {
          const d = porPieza[pz]!;
          return (
            <li key={pz} className="flex items-center gap-3 py-2">
              <ParcheSolo diseno={disenoDe({ ...d, piezas: undefined })} className={compacto ? "h-8 w-12 shrink-0" : "h-10 w-16 shrink-0"} />
              <div className="min-w-0 flex-1">
                {piezas.length > 1 && <p className="text-[10px] uppercase tracking-[0.14em] text-tinta/60">{getProducto(pz)?.nombre ?? pz}</p>}
                <p className={`break-words leading-snug text-marron ${compacto ? "text-[12px]" : "text-[13px]"}`}>{textoCorto(d)}</p>
              </div>
              <button type="button" onClick={() => quitar(pz)} aria-label={`Quitar el parche de ${getProducto(pz)?.nombre ?? pz}`} className="shrink-0 py-1 text-[11px] uppercase tracking-[0.12em] text-tinta/60 underline underline-offset-4">
                Quitar
              </button>
            </li>
          );
        })}
      </ul>
      {piezas.length > 1 && conParche.length < piezas.length && (
        <p className="mt-1 text-[11px] text-tinta/50">
          Sin parche: {piezas.filter((pz) => !porPieza[pz]).map((pz) => getProducto(pz)?.nombre ?? pz).join(", ")}
        </p>
      )}
    </div>
  );
}

/** Posiciones guardadas (parte del ancho y alto de la foto) → píxeles de la foto de cada pieza. */
function aPixeles(pos?: Personalizacion["posiciones"]) {
  const out: Record<string, { x: number; y: number }> = {};
  for (const [pz, [x, y]] of Object.entries(pos ?? {})) {
    const c = config.piezas[pz];
    if (c) out[pz] = { x: x * c.tam.ancho, y: y * c.tam.alto };
  }
  return out;
}

/** Lo que el parche muestra a partir de la personalización guardada (resúmenes del carrito). */
function disenoDe(p: Personalizacion): DisenoParche {
  return { ...p, telefono: p.telefono ?? p.linea2 ?? "" };
}

/** Barra de medida en cm. */
function Medida({ etiqueta, valor, min, max, onCambio }: { etiqueta: string; valor: number; min: number; max: number; onCambio: (v: number) => void }) {
  const id = useId();
  const parte = max > min ? ((valor - min) / (max - min)) * 100 : 100;
  return (
    <div className="flex items-center gap-3">
      <label htmlFor={id} className="w-12 shrink-0 text-[11px] uppercase tracking-[0.12em] text-tinta/70">
        {etiqueta}
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={config.medidas.pasoCm}
        value={valor}
        onChange={(e) => onCambio(Number(e.target.value))}
        className="rango h-8 flex-1"
        style={{ "--parte": `${parte}%` } as React.CSSProperties}
      />
      <span className="w-14 shrink-0 text-right text-sm tabular-nums">{cm(valor)} cm</span>
    </div>
  );
}

/**
 * Botón "Personalizar" + editor del parche: material → forma → color → medida → qué grabamos (nombre con su letra,
 * o su imagen, que se sube en alta calidad para grabarla). Arriba, la vista previa sobre cada pieza.
 */
const PASOS = ["Qué grabamos", "Forma y color", "Medida", "Lugar"];

export function Personalizar({ producto, valor, onCambio, grande, comoLink, enCarrito }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const liberar = useRef<(() => void) | null>(null);
  useEffect(() => () => liberar.current?.(), []);
  const id = useId();
  const piezas = piezasPersonalizables(producto);
  const max = medidaMaxima(piezas);
  const { minCm, inicial } = config.medidas;

  // Un diseño común (el de todas las piezas) y, si alguna pieza lo pide, su diseño propio. Pasar una pieza a
  // "igual al resto" no borra su diseño propio: queda guardado por si vuelve. Cada pieza puede ir sin parche.
  const [comun, setComun] = useState<Diseno>(() => disenoDesde(valor));
  const [disenos, setDisenos] = useState<Record<string, Diseno>>(() => disenosIniciales(piezas, valor));
  const [propios, setPropios] = useState<Record<string, boolean>>(() => propiosIniciales(piezas, valor));
  const [activas, setActivas] = useState<Record<string, boolean>>(() => activasIniciales(piezas, valor));
  // La subida de la imagen de cada pieza (para esperarla al tocar Listo).
  const subiendo = useRef<Record<string, Promise<string | undefined>>>({});
  const [procesando, setProcesando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errores, setErrores] = useState<ErroresPersonalizacion>({});
  const [paso, setPaso] = useState(0);
  // Dónde dejó el parche en cada pieza (píxeles de la foto) y las zonas donde puede ir.
  const [posiciones, setPosiciones] = useState<Record<string, { x: number; y: number }>>({});
  const [zonas, setZonas] = useState<Record<string, Zona>>({});

  // Pestañas de la vista: una por pieza, más el 360° si está el arnés.
  const vistas = [
    ...piezas.map((p) => ({ id: p, texto: getProducto(p)?.nombre ?? p })),
    ...(vista360.activo && piezas.includes("arnes") ? [{ id: "360", texto: vista360.pestana360 }] : []),
  ];
  const [vista, setVista] = useState(vistas[0]?.id);
  // La pieza que se edita: la de la pestaña (si es el 360°, la primera).
  const piezaEdit = vista && piezas.includes(vista) ? vista : piezas[0];
  const efectivo = (pz: string) => (propios[pz] && disenos[pz] ? disenos[pz] : comun);
  const actual = efectivo(piezaEdit);
  const propio = !!propios[piezaEdit];
  const { forma, formaOtra, material, color, ancho, alto, modo, nombre, conTelefono, telefono, fuente, vistaImagen, imagenUrl, subida } = actual;
  const activa = activas[piezaEdit] !== false;

  /** Cambia el diseño de la pieza: el común (si va igual al resto) o el suyo propio. */
  function cambiar(cambio: Partial<Diseno>, pz = piezaEdit) {
    if (propios[pz]) setDisenos((ds) => ({ ...ds, [pz]: { ...(ds[pz] ?? comun), ...cambio } }));
    else setComun((c) => ({ ...c, ...cambio }));
  }
  const setForma = (v: string) => cambiar({ forma: v });
  const setFormaOtra = (v: string) => cambiar({ formaOtra: v });
  const setMaterial = (v: string) => cambiar({ material: v });
  const setColor = (v: string) => cambiar({ color: v });
  const setAncho = (v: number) => cambiar({ ancho: v });
  const setAlto = (v: number) => cambiar({ alto: v });
  const setModo = (v: Personalizacion["modo"]) => cambiar({ modo: v });
  const setNombre = (v: string) => cambiar({ nombre: v });
  const setConTelefono = (v: boolean) => cambiar({ conTelefono: v });
  const setTelefono = (v: string) => cambiar({ telefono: v });
  const setFuente = (v: string) => cambiar({ fuente: v });

  /** Diseño propio para esta pieza (arranca como el común) o igual al resto (el propio queda guardado). */
  function elegirPropio(si: boolean) {
    if (si && !disenos[piezaEdit]) setDisenos((ds) => ({ ...ds, [piezaEdit]: { ...comun } }));
    setPropios((p) => ({ ...p, [piezaEdit]: si }));
  }

  // Proporción de lo que se ve de la pieza: el ancho se ajusta para que el alto no pase de un tercio de pantalla.
  const piezaVista = vista ? config.piezas[vista] : undefined;
  const marco = piezaVista ? piezaVista.recorte ?? [0, 0, piezaVista.tam.ancho, piezaVista.tam.alto] : [0, 0, 1, 1];
  const proporcionVista = marco[2] / marco[3];

  function abrir() {
    setComun(disenoDesde(valor));
    setDisenos(disenosIniciales(piezas, valor));
    setPropios(propiosIniciales(piezas, valor));
    setActivas(activasIniciales(piezas, valor));
    setErrores({});
    setVista(vistas[0]?.id);
    setPaso(0);
    setPosiciones(aPixeles(valor?.posiciones));
    cargarZonas().then(setZonas);
    precargarPiezas(piezas.map((pz) => config.piezas[pz]).filter(Boolean));
    liberar.current?.();
    liberar.current = trabarScroll();
    ref.current?.showModal();
  }

  // Lugares fijos de la pieza que se está viendo, y cuál coincide con donde está el parche (si ninguno: "A mano").
  const lugaresVista = (vista && config.piezas[vista]?.lugares) || [];
  const posVista = vista ? posiciones[vista] : undefined;
  const lugarElegido = posVista ? lugaresVista.find((l) => Math.hypot(l.x - posVista.x, l.y - posVista.y) < 25)?.id : lugaresVista[0]?.id;

  /** Flechas: corre el parche un poquito (el arrastre y la zona lo vuelven a ajustar para que entre). */
  function moverFino(dx: number, dy: number) {
    if (!vista || !posVista) return;
    const c = config.piezas[vista];
    const paso = Math.max(c.tam.ancho, c.tam.alto) / 60;
    setPosiciones((x) => ({ ...x, [vista]: { x: posVista.x + dx * paso, y: posVista.y + dy * paso } }));
  }

  /** Ir a un paso tocándolo: hacia adelante pasa por la misma revisión que "Siguiente". */
  function irAPaso(i: number) {
    if (i > paso && PASOS.indexOf("Qué grabamos") >= paso && PASOS.indexOf("Qué grabamos") < i && activa) {
      const e = validarPersonalizacion(
        { forma, material, color, ancho: final.ancho, alto: final.alto, modo, nombre, telefono: modo === "nombre" && conTelefono ? telefono : undefined, linea2: modo === "nombre" && actual.conLinea2 ? actual.linea2 : undefined, fuente, vista: vistaImagen, imagenUrl, letraWhatsapp: actual.letraWhatsapp },
        { pedirImagen: true },
      );
      if (e.nombre || e.telefono || e.linea2 || e.imagen || e.fuente) {
        setPaso(PASOS.indexOf("Qué grabamos"));
        setErrores({ nombre: e.nombre, telefono: e.telefono, linea2: e.linea2, imagen: e.imagen, fuente: e.fuente });
        return;
      }
    }
    setErrores({});
    setPaso(i);
  }

  // La pieza que sigue (en kits): al terminar una se sigue con la próxima sin volver atrás.
  const siguientePieza = piezas.slice(piezas.indexOf(piezaEdit) + 1).find((pz) => activas[pz] !== false);
  function seguirConPieza(pz: string) {
    setVista(pz);
    // Cada pieza nueva arranca desde el paso 1.
    setPaso(0);
    setErrores({});
  }

  function siguiente() {
    // En "¿Qué grabamos?" no se sigue sin nombre o imagen.
    if (PASOS[paso] === "Qué grabamos" && activa) {
      const e = validarPersonalizacion(
        { forma, material, color, ancho: final.ancho, alto: final.alto, modo, nombre, telefono: modo === "nombre" && conTelefono ? telefono : undefined, linea2: modo === "nombre" && actual.conLinea2 ? actual.linea2 : undefined, fuente, vista: vistaImagen, imagenUrl, letraWhatsapp: actual.letraWhatsapp },
        { pedirImagen: true },
      );
      const delPaso = { nombre: e.nombre, telefono: e.telefono, linea2: e.linea2, imagen: e.imagen, fuente: e.fuente };
      if (delPaso.nombre || delPaso.telefono || delPaso.linea2 || delPaso.imagen || delPaso.fuente) {
        setErrores(delPaso);
        return;
      }
    }
    setErrores({});
    setPaso((p) => p + 1);
  }

  // Proporción de la forma elegida (la silueta usa la de su imagen). null = libre.
  const proporcion = forma === "silueta" ? vistaImagen?.proporcionSilueta ?? null : proporcionForma(forma);
  // Con forma fija, el ancho no puede pasar lo que deja el alto máximo.
  const anchoMax = Math.max(minCm, Math.floor((proporcion ? Math.min(max.ancho, max.alto * proporcion) : max.ancho) * 2) / 2);
  const anchoOk = Math.min(Math.max(ancho, minCm), anchoMax);
  const altoOk = Math.min(Math.max(alto, minCm), max.alto);
  const final = medidaFinal(forma, anchoOk, altoOk, vistaImagen?.proporcionSilueta);

  function elegirModo(m: Personalizacion["modo"]) {
    if (m === modo) return;
    // Con su imagen el parche se recorta por su contorno ("Su silueta"); al volver a nombre, vuelve la forma que tenía.
    if (m === "imagen") cambiar({ modo: m, formaAntes: forma === "silueta" ? actual.formaAntes : forma, forma: "silueta" });
    else cambiar({ modo: m, forma: actual.formaAntes && actual.formaAntes !== "silueta" ? actual.formaAntes : config.formas[0].id });
  }

  async function listo() {
    // Si alguna imagen todavía se está subiendo, la esperamos (el botón dice "Guardando imagen…").
    let urls: Record<string, string | undefined> = {};
    if (Object.values(subiendo.current).length) {
      setGuardando(true);
      urls = Object.fromEntries(await Promise.all(Object.entries(subiendo.current).map(async ([pz, pr]) => [pz, await pr] as const)));
      setGuardando(false);
    }
    const aDiseno = (pz: string): DisenoPieza => {
      const d = efectivo(pz);
      const enImagen = d.modo === "imagen";
      const m = medidaDe(d, max);
      return {
        forma: d.forma,
        formaOtra: d.forma === "otra" ? d.formaOtra.trim().replace(/\s+/g, " ") : undefined,
        material: d.material,
        color: d.color,
        ancho: m.ancho,
        alto: m.alto,
        modo: d.modo,
        nombre: enImagen ? "" : d.nombre.trim().replace(/\s+/g, " "),
        telefono: !enImagen && d.conTelefono ? d.telefono.trim() : undefined,
        linea2: !enImagen && d.conLinea2 ? d.linea2.trim() : undefined,
        fuente: d.fuente,
        tamLetra: !enImagen && d.fuente !== "propia" ? tamLetraValido(d.tamLetra) : undefined,
        letraWhatsapp: !enImagen && d.fuente === "propia" && d.letraWhatsapp ? true : undefined,
        imagenUrl: enImagen || d.fuente === "propia" ? urls[pz] ?? d.imagenUrl : undefined,
        vista: enImagen || d.fuente === "propia" ? d.vistaImagen : undefined,
      };
    };
    const porPieza = Object.fromEntries(piezas.map((pz) => [pz, activas[pz] !== false ? aDiseno(pz) : null])) as Record<string, DisenoPieza | null>;
    // Todas con parche y ninguna con diseño propio = el mismo en todas (más simple para el pedido).
    const mismo = piezas.every((pz) => activas[pz] !== false && !propios[pz]);
    const base = porPieza[piezaEdit] ?? Object.values(porPieza).find(Boolean) ?? aDiseno(piezaEdit);
    const p: Personalizacion = {
      ...base,
      piezas: mismo ? undefined : porPieza,
      // Las piezas que no miró también quedan ubicadas (donde arranca o lo más cerca que entre).
      posiciones: Object.fromEntries(
        piezas.flatMap((pz) => {
          const d = porPieza[pz];
          if (!d) return [];
          const c = config.piezas[pz];
          const z = zonas[pz] && recortarZona(zonas[pz], c.recorte ?? [0, 0, c.tam.ancho, c.tam.alto]);
          const l = colocar(c, d.ancho, d.alto, posiciones[pz], z, esRedonda(d.forma));
          return [[pz, [Math.round((l.x / c.tam.ancho) * 1000) / 1000, Math.round((l.y / c.tam.alto) * 1000) / 1000]]];
        }),
      ),
    };
    // Valida pieza por pieza: si una tiene un error, la muestra.
    for (const pz of piezas) {
      const d = porPieza[pz];
      if (!d) continue;
      const e = validarPersonalizacion(d, { pedirImagen: true });
      if (Object.keys(e).length > 0) {
        setVista(pz);
        setErrores(e);
        setPaso(PASOS.indexOf(e.nombre || e.telefono || e.linea2 || e.imagen || e.fuente ? "Qué grabamos" : e.medida ? "Medida" : "Forma y color"));
        return;
      }
    }
    if (!Object.values(porPieza).some(Boolean)) {
      setErrores({ forma: "Personalizá al menos una pieza." });
      return;
    }
    setErrores({});
    onCambio(p);
    ref.current?.close();
  }

  // Cualquier imagen → cómo quedaría grabada (en el navegador, al instante) y, en paralelo,
  // la original se sube en alta calidad para grabarla.
  async function subirImagen(archivo?: File) {
    if (!archivo) return;
    const pz = piezaEdit;
    setProcesando(true);
    cambiar({ imagenUrl: undefined, subida: "subiendo" }, pz);
    subiendo.current[pz] = (async () => {
      try {
        const datos = new FormData();
        datos.append("imagen", await imagenParaSubir(archivo));
        const res = await fetch("/api/imagen", { method: "POST", body: datos });
        const json = (await res.json()) as { ok: boolean; url?: string };
        if (!json.ok || !json.url) throw new Error("Sin link");
        cambiar({ imagenUrl: json.url, subida: "ok" }, pz);
        return json.url;
      } catch {
        cambiar({ subida: "error" }, pz);
        return undefined;
      }
    })();
    try {
      cambiar({ vistaImagen: await aGrabadoLaser(archivo) }, pz);
      setErrores((x) => ({ ...x, imagen: undefined, forma: undefined }));
    } catch {
      cambiar({ subida: "nada" }, pz);
      setErrores((x) => ({ ...x, imagen: "No pudimos leer esa imagen. Probá con otra (JPG o PNG)." }));
    } finally {
      setProcesando(false);
    }
  }

  const precio = piezas.reduce((t, pz) => (activas[pz] !== false ? t + precioPieza({ ...efectivo(pz), ...medidaDe(efectivo(pz), max) }) : t), 0);
  const extra = precio > 0 ? `+ ${formatearPrecio(precio)}` : "";
  const extraGuardado = valor ? precioPersonalizacion(producto, valor) : 0;
  const textoExtraGuardado = extraGuardado > 0 ? `+ ${formatearPrecio(extraGuardado)}` : "";
  const colorElegido = colorPorId(color) ?? config.colores[0];
  const tramo = tramoTamano(final.ancho, final.alto);
  const tamTexto = grande ? "text-sm" : "text-[11px]";
  const diseno: DisenoParche = {
    forma,
    color,
    ancho: final.ancho,
    alto: final.alto,
    modo,
    nombre,
    // Segunda línea: el teléfono o el texto libre.
    telefono: conTelefono ? telefono : actual.conLinea2 ? actual.linea2 : "",
    fuente,
    tamLetra: actual.tamLetra,
    vista: modo === "imagen" || fuente === "propia" ? vistaImagen : undefined,
  };
  const muestra = nombre.trim() || "Toto";
  const linkAyuda = `https://wa.me/${sitio.whatsapp.numero}?text=${encodeURIComponent(config.mensajeAyuda)}`;

  // Un solo div raíz: así el space-y del padre no le pone margen al <dialog>.
  return (
    <div>
      {enCarrito ? (
        valor ? (
          <Resumen producto={producto} valor={valor} onCambio={onCambio} abrir={abrir} extra={textoExtraGuardado} compacto />
        ) : (
          <button
            type="button"
            onClick={abrir}
            className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-dashed border-tinta/40 px-3 py-1.5 text-[11px] uppercase tracking-[0.12em] text-tinta/80 transition-transform duration-200 active:scale-95"
          >
            <span aria-hidden="true" className="text-marron">+</span>
            {config.boton}
          </button>
        )
      ) : valor ? (
        <div className={`border border-tinta/20 bg-lino/50 ${grande ? "p-4" : "p-3"}`}>
          <Resumen producto={producto} valor={valor} onCambio={onCambio} abrir={abrir} extra={textoExtraGuardado} />
        </div>
      ) : comoLink ? (
        <button type="button" onClick={abrir} className="mx-auto block py-1 text-[15px] text-marron">
          {config.link.pregunta} <span className="font-normal underline underline-offset-4">{config.link.accion}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={abrir}
          className={`btn border border-dashed border-tinta/60 text-tinta w-full ${grande ? "py-4 text-sm" : "px-3 py-2.5 text-[11px]"}`}
        >
          {config.boton}
        </button>
      )}

      <dialog
        ref={ref}
        aria-labelledby={`${id}-titulo`}
        onClose={() => {
          liberar.current?.();
          liberar.current = null;
        }}
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

          {/* La vista queda fija arriba para ver los cambios mientras elige. */}
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
            {/* El ancho sale de la proporción de la pieza: anchas (correa, collar) a todo el ancho, altas (poo bag) más angostas. */}
            <div className="mx-auto [--alto-vista:32dvh] sm:[--alto-vista:52vh]" style={{ width: `min(100%, calc(var(--alto-vista) * ${proporcionVista}))` }}>
              {vista === "360" ? (
                <Visor360 />
              ) : vista && config.piezas[vista] ? (
                <VistaPieza
                  key={vista}
                  oculto={!activa}
                  pieza={config.piezas[vista]}
                  nombrePieza={getProducto(vista)?.nombre ?? vista}
                  diseno={diseno}
                  zona={zonas[vista]}
                  posicion={posiciones[vista]}
                  onMover={(p) => setPosiciones((x) => ({ ...x, [vista]: p }))}
                />
              ) : null}
            </div>
            <p className="pb-3 pt-2 text-center text-[11px] text-tinta/60">
              {cm(final.ancho)} × {cm(final.alto)} cm{piezas.length > 1 ? ` · va en ${piezas.length} piezas, todas menos el moño` : ""}
            </p>
          </div>

          <div className="relative flex-1 space-y-7 overflow-y-auto px-4 py-6 sm:col-start-2 sm:row-start-2 sm:px-6">
            {/* Kits y combos: cada pieza con parche o sin, y con el diseño de todas o uno propio. Nada se borra. */}
            {piezas.length > 1 && (
              <div className="space-y-2 border border-tinta/15 p-3">
                <p className="text-[13px]">
                  Estás en <span className="font-normal">{getProducto(piezaEdit)?.nombre ?? piezaEdit}</span>
                  <span className="ml-1 text-[11px] text-tinta/60">· cambiá de pieza arriba</span>
                </p>
                <label className="flex cursor-pointer items-center justify-between gap-3 text-[12px] uppercase tracking-[0.1em]">
                  Lleva parche
                  <input
                    type="checkbox"
                    checked={activa}
                    onChange={(e) => setActivas((a) => ({ ...a, [piezaEdit]: e.target.checked }))}
                    className="h-5 w-5 accent-[rgb(var(--tinta))]"
                  />
                </label>
                {activa && (
                  <div className="relative grid grid-cols-2 rounded-full bg-lino p-1">
                    <span
                      aria-hidden="true"
                      className={`absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-tinta transition-transform duration-500 ease-suave ${propio ? "translate-x-full" : ""}`}
                    />
                    {(
                      [
                        [false, "Igual al resto"],
                        [true, "Diseño propio"],
                      ] as const
                    ).map(([v, texto]) => (
                      <button
                        key={texto}
                        type="button"
                        onClick={() => elegirPropio(v)}
                        className={`relative h-9 text-[10px] uppercase tracking-[0.12em] transition-colors duration-500 ${propio === v ? "text-crema" : "text-tinta/70"}`}
                      >
                        {texto}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Pasos (estilo Away): uno por pantalla, con la vista siempre arriba. */}
            {/* Los pasos se pueden tocar para ir a cualquiera (también al cambiar de pieza). */}
            <div className="grid grid-cols-4 gap-1.5" role="tablist" aria-label="Pasos">
              {PASOS.map((p, i) => (
                <button
                  key={p}
                  type="button"
                  role="tab"
                  aria-selected={paso === i}
                  onClick={() => irAPaso(i)}
                  className="group flex flex-col gap-1.5 text-left"
                >
                  <span className={`h-[3px] w-full rounded-full transition-colors duration-500 ${i <= paso ? "bg-tinta" : "bg-tinta/15"}`} />
                  <span className={`text-[9px] uppercase leading-tight tracking-[0.1em] ${paso === i ? "text-tinta" : "text-tinta/50"}`}>
                    {i + 1} · {p === "Forma y color" ? "Forma" : p}
                  </span>
                </button>
              ))}
            </div>

            {!activa ? (
              <p className="animate-entrada text-[13px] text-tinta/70">Esta pieza va sin personalizar. Tocá otra pestaña para seguir con las demás.</p>
            ) : (
            <div key={paso} className="animate-entrada space-y-7">
              {PASOS[paso] === "Lugar" && (
                <fieldset>
                  <legend className="eyebrow mb-3">¿Dónde lo ponemos?{piezas.length > 1 && vista && vista !== "360" ? ` · ${getProducto(vista)?.nombre ?? vista}` : ""}</legend>
                  {lugaresVista.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {lugaresVista.map((l) => {
                        const elegido = lugarElegido === l.id;
                        return (
                          <button
                            key={l.id}
                            type="button"
                            onClick={() => vista && setPosiciones((x) => ({ ...x, [vista]: { x: l.x, y: l.y } }))}
                            className={`flex h-12 items-center justify-center border text-[11px] uppercase tracking-[0.12em] transition-colors duration-300 active:scale-[0.98] ${elegido ? "border-tinta bg-tinta text-crema" : "border-tinta/20"}`}
                          >
                            {l.nombre}
                          </button>
                        );
                      })}
                      <span className={`flex h-12 items-center justify-center border border-dashed text-[11px] uppercase tracking-[0.12em] ${lugarElegido ? "border-tinta/20 text-tinta/50" : "border-tinta text-tinta"}`}>
                        A mano
                      </span>
                    </div>
                  ) : (
                    <p className="text-[13px] text-tinta/70">Arrastralo sobre la pieza hasta donde lo quieras.</p>
                  )}
                  {/* Mover fino con flechas (además de arrastrar con el dedo). */}
                  {vista && posVista && (
                    <div className="mt-3 flex items-center justify-center gap-2">
                      {(
                        [
                          ["←", -1, 0, "Mover a la izquierda"],
                          ["↑", 0, -1, "Mover arriba"],
                          ["↓", 0, 1, "Mover abajo"],
                          ["→", 1, 0, "Mover a la derecha"],
                        ] as const
                      ).map(([flecha, dx, dy, etiqueta]) => (
                        <button
                          key={flecha}
                          type="button"
                          aria-label={etiqueta}
                          onClick={() => moverFino(dx, dy)}
                          className="flex h-11 w-11 items-center justify-center rounded-full border border-tinta/25 text-lg transition-transform active:scale-90"
                        >
                          {flecha}
                        </button>
                      ))}
                    </div>
                  )}
                  <p className="mt-3 text-[12px] leading-relaxed text-tinta/60">
                    Tocá un lugar o arrastralo sobre la foto, donde quieras dentro de la tela.
                    {""}
                  </p>
                </fieldset>
              )}
              {PASOS[paso] === "Qué grabamos" && (
                <>
                <fieldset>
                  <legend className="eyebrow mb-3">¿Qué grabamos?</legend>
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
                        <input type="radio" name={`${id}-modo`} checked={modo === m} onChange={() => elegirModo(m)} className="peer sr-only" />
                        <span
                          className={`flex h-10 items-center justify-center text-[11px] uppercase tracking-[0.12em] transition-colors duration-500 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-marron ${
                            modo === m ? "text-crema" : "text-tinta/70"
                          }`}
                        >
                          {texto}
                          {m === "imagen" && config.precioImagen > 0 && <span className="ml-1 normal-case tracking-normal opacity-70">+ {formatearPrecio(config.precioImagen)}</span>}
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
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => {
                          subirImagen(e.target.files?.[0]);
                          // Así se puede volver a elegir el mismo archivo (otra pieza, o después de cambiarla).
                          e.target.value = "";
                        }}
                      />
                      <span className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md" style={{ background: colorElegido.color }}>
                        {vistaImagen ? (
                          <span
                            aria-label="Tu imagen grabada"
                            className="block h-full w-full"
                            style={{
                              background: colorElegido.grabado,
                              WebkitMaskImage: `url(${vistaImagen.grabado})`,
                              maskImage: `url(${vistaImagen.grabado})`,
                              WebkitMaskSize: "contain",
                              maskSize: "contain",
                              WebkitMaskRepeat: "no-repeat",
                              maskRepeat: "no-repeat",
                              WebkitMaskPosition: "center",
                              maskPosition: "center",
                            }}
                          />
                        ) : (
                          <span aria-hidden="true" className="text-2xl font-light text-crema/80 mix-blend-difference">
                            +
                          </span>
                        )}
                        {procesando && <span className="absolute inset-0 animate-pulse bg-crema/60" />}
                      </span>
                      <span className="text-[13px] leading-snug">
                        <span className="block uppercase tracking-[0.12em]">{vistaImagen ? "Cambiar imagen" : "Subir imagen"}</span>
                        <span className="mt-0.5 block text-tinta/60">
                          {procesando ? "Grabando…" : "Cualquier foto, dibujo o logo. Te mostramos cómo queda grabado."}
                        </span>
                      </span>
                    </label>
                    {errores.imagen && <p className="mt-1.5 text-sm text-marron">{errores.imagen}</p>}
                    {/* Ideas para que se animen: lo que imaginen se puede grabar. */}
                    {!vistaImagen && (
                      <div className="mt-3">
                        <p className="text-[12px] text-tinta/60">Ideas: lo que imagines se graba.</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {config.ideasImagen.map((idea) => (
                            <span key={idea} className="rounded-full bg-lino px-3 py-1.5 text-[11px] text-tinta/80">
                              {idea}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {vistaImagen && (
                      <p className="mt-3 flex items-center gap-2 text-[12px] leading-relaxed text-tinta/70" aria-live="polite">
                        {subida === "subiendo" && (
                          <>
                            <span aria-hidden="true" className="h-3 w-3 shrink-0 animate-spin rounded-full border border-tinta/30 border-t-tinta" />
                            Guardando tu imagen en alta calidad…
                          </>
                        )}
                        {subida === "ok" && (
                          <>
                            <span aria-hidden="true" className="text-marron">✓</span>
                            {config.avisoImagen}
                          </>
                        )}
                        {subida === "error" && <span className="text-marron">{config.avisoImagenSinSubir}</span>}
                      </p>
                    )}
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
                        className="campo"
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
    
                    {/* min-w-0: el fieldset no se estira con el recuadro de "Tu letra". */}
                    <fieldset className="min-w-0">
                      <legend id={`${id}-fuente`} tabIndex={-1} className="eyebrow mb-3">
                        Letra
                      </legend>
                      {/* Cada letra muestra su nombre escrito con ella: se elige viendo. */}
                      <div className="sin-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0">
                        {config.fuentes.map((f) => {
                          const { familia: fam, peso } = familia(f.id);
                          return (
                            <label key={f.id} className="min-w-0 shrink-0 cursor-pointer">
                              <input type="radio" name={`${id}-fuente`} value={f.id} checked={fuente === f.id} onChange={() => setFuente(f.id)} className="peer sr-only" />
                              <span className="flex h-16 w-full min-w-[6.5rem] flex-col items-center justify-center gap-1 overflow-hidden border border-tinta/20 px-2 sm:min-w-0 transition-colors peer-checked:border-tinta peer-checked:bg-lino peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-marron">
                                {f.propia ? (
                                  <span className="block w-full max-w-[8rem] truncate text-center text-lg leading-none" style={{ fontFamily: familia("caveat").familia, fontWeight: 600 }}>
                                    {muestra}
                                  </span>
                                ) : (
                                  <span
                                    className="block w-full max-w-[8rem] truncate text-center text-lg leading-none"
                                    style={{ fontFamily: fam, fontWeight: peso, letterSpacing: f.mayusculas ? "0.06em" : undefined }}
                                  >
                                    {f.mayusculas ? muestra.toUpperCase() : muestra}
                                  </span>
                                )}
                                <span className="text-[9px] uppercase tracking-[0.14em] text-tinta/60">{f.nombre}</span>
                              </span>
                            </label>
                          );
                        })}
                      </div>
                      {/* "Tu letra": escribe el nombre con el dedo y se graba tal cual. */}
                      {config.fuentes.find((x) => x.id === fuente)?.propia && (
                        <div className="mt-3">
                          <div className="mb-3 grid grid-cols-2 gap-2">
                            {(
                              [
                                [false, "Escribirla acá"],
                                [true, "Mandarla por WhatsApp"],
                              ] as const
                            ).map(([v, texto]) => (
                              <button
                                key={texto}
                                type="button"
                                onClick={() => {
                                  cambiar({ letraWhatsapp: v });
                                  setErrores((x) => ({ ...x, fuente: undefined }));
                                }}
                                className={`h-11 border text-[10px] uppercase tracking-[0.12em] transition-colors ${actual.letraWhatsapp === v ? "border-tinta bg-tinta text-crema" : "border-tinta/20"}`}
                              >
                                {texto}
                              </button>
                            ))}
                          </div>
                          {actual.letraWhatsapp ? (
                            <p className="animate-entrada text-[12px] leading-relaxed text-tinta/70">
                              Escribí el nombre en un papel con birome o fibra negra, sacale una foto bien de frente y mandala por WhatsApp después del pedido, con tu número de pedido. Mientras, en la vista previa lo mostramos con una letra a mano.
                            </p>
                          ) : (
                            <PadEscritura key={piezaEdit} hayDibujo={!!vistaImagen} onListo={(archivo) => subirImagen(archivo)} />
                          )}
                          {errores.fuente && <p className="mt-1.5 text-sm text-marron">{errores.fuente}</p>}
                        </div>
                      )}
                    </fieldset>

                    {/* Tamaño de la letra: de la mitad a lo más grande que entra en el parche. */}
                    {!config.fuentes.find((x) => x.id === fuente)?.propia && (
                      <div>
                        <label htmlFor={`${id}-tam-letra`} className="eyebrow mb-3 flex items-baseline justify-between">
                          Tamaño de letra
                          <span className="normal-case tracking-normal text-tinta/60">{Math.round(actual.tamLetra * 100)} %</span>
                        </label>
                        <div className="flex items-center gap-3">
                          <span aria-hidden="true" className="text-[11px] text-tinta/60">A</span>
                          <input
                            id={`${id}-tam-letra`}
                            type="range"
                            min={TAM_LETRA.min}
                            max={TAM_LETRA.max}
                            step={TAM_LETRA.paso}
                            value={actual.tamLetra}
                            onChange={(e) => cambiar({ tamLetra: Number(e.target.value) })}
                            className="h-8 w-full cursor-pointer accent-tinta"
                          />
                          <span aria-hidden="true" className="text-lg leading-none text-tinta/60">A</span>
                        </div>
                      </div>
                    )}
    
                    <fieldset>
                      <legend className="eyebrow mb-3">¿Sumamos otra línea abajo?</legend>
                      <div className="grid grid-cols-3 gap-2">
                        {(
                          [
                            ["nada", "Solo nombre"],
                            ["telefono", "Teléfono"],
                            ["texto", "Otro texto"],
                          ] as const
                        ).map(([v, texto]) => {
                          const elegido = v === "telefono" ? conTelefono : v === "texto" ? actual.conLinea2 : !conTelefono && !actual.conLinea2;
                          return (
                            <button
                              key={v}
                              type="button"
                              onClick={() => {
                                cambiar({ conTelefono: v === "telefono", conLinea2: v === "texto" });
                                setErrores((x) => ({ ...x, telefono: undefined, linea2: undefined }));
                              }}
                              className={`flex h-11 items-center justify-center border text-[10px] uppercase tracking-[0.1em] transition-colors ${elegido ? "border-tinta bg-tinta text-crema" : "border-tinta/20"}`}
                            >
                              {texto}
                            </button>
                          );
                        })}
                      </div>
                      {actual.conLinea2 && (
                        <div className="mt-4 animate-entrada">
                          <label htmlFor={`${id}-linea2`} className="eyebrow flex justify-between">
                            <span>Otro texto</span>
                            <span className="tracking-normal">{actual.linea2.length}/28</span>
                          </label>
                          <input
                            id={`${id}-linea2`}
                            className="campo"
                            maxLength={28}
                            autoComplete="off"
                            placeholder="Ej. Palermo, CABA · @toto.dog"
                            value={actual.linea2}
                            onChange={(e) => {
                              cambiar({ linea2: e.target.value });
                              setErrores((x) => ({ ...x, linea2: undefined }));
                            }}
                            aria-invalid={!!errores.linea2}
                          />
                          {errores.linea2 && <p className="mt-1.5 text-sm text-marron">{errores.linea2}</p>}
                        </div>
                      )}
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
                </>
              )}
              {PASOS[paso] === "Forma y color" && (
                <>
                {config.materiales.filter((m) => !m.proximamente).length > 1 && (
                  <fieldset>
                    <legend id={`${id}-material`} tabIndex={-1} className="eyebrow mb-3">
                      Material
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
                          <span className="flex h-11 flex-col items-center justify-center border border-tinta/20 text-[11px] uppercase tracking-[0.12em] transition-colors peer-checked:border-tinta peer-checked:bg-tinta peer-checked:text-crema peer-disabled:opacity-45 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-marron">
                            {m.nombre}
                            {m.proximamente && <span className="mt-0.5 text-[9px] tracking-[0.14em] text-tinta/70">Muy pronto</span>}
                            {!m.proximamente && m.precioExtra > 0 && <span className="mt-0.5 text-[9px] tracking-normal opacity-80">+ {formatearPrecio(m.precioExtra)}</span>}
                          </span>
                        </label>
                      ))}
                    </div>
                    {errores.material && <p className="mt-2 text-sm text-marron">{errores.material}</p>}
                  </fieldset>
                )}
    
                {modo === "imagen" ? (
                  <fieldset>
                    <legend className="eyebrow mb-3">Forma</legend>
                    <div className="flex items-center gap-3 border border-tinta/15 p-3">
                      <span className="w-16 shrink-0">
                        <MiniForma forma="silueta" color={colorElegido} vista={vistaImagen} />
                      </span>
                      <p className="text-[13px] leading-snug">Su silueta: recortamos el parche siguiendo el contorno de tu imagen.</p>
                    </div>
                    <p className="mt-3 text-[12px] leading-relaxed text-tinta/60">
                      ¿Querés otra forma o ayuda con el diseño?{" "}
                      <a href={linkAyuda} target="_blank" rel="noreferrer" className="text-tinta underline underline-offset-4">
                        Escribinos por WhatsApp
                      </a>{" "}
                      y lo armamos con vos.
                    </p>
                  </fieldset>
                ) : (
                <fieldset>
                  <legend className="eyebrow mb-3">Forma</legend>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {config.formas.filter((f) => f.especial !== "silueta").map((f, i) => {
                      const bloqueada = f.especial === "silueta"; // acá estamos con nombre: la silueta es de "Tu imagen"
                      return (
                        <label key={f.id} className={bloqueada ? "cursor-not-allowed opacity-40" : "cursor-pointer"}>
                          <input
                            id={i === 0 ? `${id}-forma` : undefined}
                            type="radio"
                            name={`${id}-forma`}
                            value={f.id}
                            checked={forma === f.id}
                            // La silueta sale de una imagen: con nombre no se elige (antes cambiaba a imagen y borraba lo escrito).
                            disabled={bloqueada}
                            onChange={() => {
                              setForma(f.id);
                              setErrores((x) => ({ ...x, forma: undefined, formaOtra: undefined }));
                            }}
                            className="peer sr-only"
                          />
                          <span className="flex flex-col items-center gap-1 border border-tinta/20 px-1 pb-2 pt-1.5 transition-colors peer-checked:border-tinta peer-checked:bg-lino peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-marron">
                            {f.especial === "otra" ? (
                              <span aria-hidden="true" className="flex h-12 items-center text-2xl font-light text-tinta/60">
                                ?
                              </span>
                            ) : (
                              <MiniForma forma={f.id} color={colorElegido} vista={vistaImagen} />
                            )}
                            <span className="text-center text-[10px] uppercase leading-tight tracking-[0.12em]">{f.nombre}</span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  {forma === "otra" && (
                    <div className="mt-3 animate-entrada">
                      <label htmlFor={`${id}-formaOtra`} className="eyebrow block">
                        ¿Qué forma querés?
                      </label>
                      <input
                        id={`${id}-formaOtra`}
                        className="campo"
                        maxLength={120}
                        autoComplete="off"
                        placeholder="Ej. huellita, estrella, la cabeza de un caniche"
                        value={formaOtra}
                        onChange={(e) => {
                          setFormaOtra(e.target.value);
                          setErrores((x) => ({ ...x, formaOtra: undefined }));
                        }}
                        aria-invalid={!!errores.formaOtra}
                      />
                      <p className="mt-1.5 text-[12px] leading-relaxed text-tinta/60">
                        La recortamos a medida (la vista previa la muestra redondeada). Si querés ayuda con el diseño u otra silueta,{" "}
                        <a href={linkAyuda} target="_blank" rel="noreferrer" className="text-tinta underline underline-offset-4">
                          escribinos por WhatsApp
                        </a>{" "}
                        y te ayudamos.
                      </p>
                    </div>
                  )}
                  {errores.forma && <p className="mt-2 text-sm text-marron">{errores.forma}</p>}
                  {errores.formaOtra && <p className="mt-2 text-sm text-marron">{errores.formaOtra}</p>}
                </fieldset>
                )}
    
                <fieldset>
                  <legend className="eyebrow mb-3">
                    Color <span className="ml-1 normal-case tracking-normal text-tinta/60">{colorElegido.nombre}</span>
                  </legend>
                  <div className="flex flex-wrap gap-x-1 gap-y-3">
                    {config.colores.map((c) => {
                      const no = c.disponible === false;
                      return (
                        <label key={c.id} className={`flex w-[4.1rem] flex-col items-center ${no ? "cursor-not-allowed" : "cursor-pointer"}`} title={c.nombre}>
                          <input
                            type="radio"
                            name={`${id}-color`}
                            value={c.id}
                            checked={color === c.id}
                            disabled={no}
                            onChange={() => setColor(c.id)}
                            className="peer sr-only"
                            aria-label={no ? `${c.nombre} (agotado)` : c.nombre}
                          />
                          {/* Muestra con el mismo grano del parche; al elegirla, un aro y un pequeño salto. Sin stock: apagada y con una raya. */}
                          <span className="relative block rounded-full p-[3px] ring-1 ring-tinta/15 transition-transform duration-300 ease-suave peer-checked:scale-110 peer-checked:ring-2 peer-checked:ring-tinta peer-disabled:opacity-40 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-marron">
                            <svg viewBox="-20 -20 40 40" className="block h-9 w-9 rounded-full" aria-hidden="true">
                              <ParcheMuestra color={c.id} />
                            </svg>
                            {no && <span aria-hidden="true" className="absolute left-1/2 top-1/2 h-px w-[2.6rem] -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-tinta/60" />}
                          </span>
                          <span className={`mt-1.5 text-center text-[9px] uppercase leading-tight tracking-[0.1em] ${no ? "text-tinta/45" : "text-tinta/80"}`}>
                            {c.nombre}
                            {no && <span className="mt-0.5 block normal-case tracking-normal">Agotado</span>}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
                </>
              )}
              {PASOS[paso] === "Medida" && (
                <>
                <fieldset>
                  <legend className="eyebrow mb-3">
                    Medida
                    <span className="ml-1 normal-case tracking-normal text-tinta/60">
                      {tramo?.nombre}
                      {tramo && tramo.precioExtra > 0 && ` · + ${formatearPrecio(tramo.precioExtra)}`}
                    </span>
                  </legend>
                  <div className="space-y-1">
                    <Medida etiqueta="Ancho" valor={anchoOk} min={minCm} max={anchoMax} onCambio={setAncho} />
                    {proporcion === null && <Medida etiqueta="Alto" valor={altoOk} min={minCm} max={max.alto} onCambio={setAlto} />}
                  </div>
                  <p className="mt-2 text-[12px] text-tinta/60">
                    {proporcion !== null ? `Esta forma mantiene su proporción: ${cm(final.ancho)} × ${cm(final.alto)} cm. ` : ""}
                    {piezas.length > 1 ? "En las piezas más chicas se ajusta a lo que entra." : ""}
                  </p>
                  {/* A más grande, más caro: los tramos a la vista, con el actual marcado. */}
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {config.tamanos.map((t) => {
                      const es = tramo?.nombre === t.nombre;
                      return (
                        <div
                          key={t.nombre}
                          className={`flex h-14 flex-col items-center justify-center border text-[11px] uppercase tracking-[0.12em] transition-colors duration-300 ${es ? "border-tinta bg-tinta text-crema" : "border-tinta/15 text-tinta/60"}`}
                        >
                          {t.nombre}
                          <span className="mt-0.5 text-[10px] normal-case tracking-normal opacity-80">+ {formatearPrecio(t.precioExtra)}{piezas.length > 1 ? " c/u" : ""}</span>
                        </div>
                      );
                    })}
                  </div>
                </fieldset>
                </>
              )}
            </div>
            )}
          </div>

          <div className="border-t border-tinta/10 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:col-start-2 sm:row-start-3 sm:px-6">
            {paso === PASOS.length - 1 && siguientePieza && (
              <button type="button" onClick={listo} disabled={guardando || procesando} className="mb-2 block w-full text-center text-[11px] uppercase tracking-[0.12em] text-tinta/70 underline underline-offset-4">
                {guardando ? "Guardando imagen…" : `Terminar ya${extra ? ` · ${extra}` : ""}`}
              </button>
            )}
            <div className="flex gap-2">
              {paso > 0 && (
                <button type="button" onClick={() => setPaso((p) => p - 1)} className="btn w-28 shrink-0 border border-tinta/30 py-4 text-tinta">
                  Atrás
                </button>
              )}
              {paso < PASOS.length - 1 ? (
                <button type="button" onClick={siguiente} disabled={procesando} className="btn-primario flex-1 py-4 disabled:opacity-70">
                  {/* Con "Atrás" al lado no entra el precio: va en el primer paso y en "Listo". */}
                  Siguiente{extra && paso === 0 ? ` · ${extra}` : ""}
                </button>
              ) : siguientePieza ? (
                <button type="button" onClick={() => seguirConPieza(siguientePieza)} className="btn-primario flex-1 py-4">
                  Seguir con {getProducto(siguientePieza)?.nombre ?? siguientePieza}
                </button>
              ) : (
                <button type="button" onClick={listo} disabled={guardando || procesando} className="btn-primario flex-1 py-4 disabled:opacity-70">
                  {guardando ? "Guardando imagen…" : `Listo${extra ? ` · ${extra}` : ""}`}
                </button>
              )}
            </div>
          </div>
        </div>
      </dialog>
    </div>
  );
}

/** Circulito de muestra de un color, con el grano y el veteado de la cuerina. */
function ParcheMuestra({ color }: { color: string }) {
  return <Parche forma="circulo" w={42} h={42} color={colorPorId(color) ?? config.colores[0]} pxCm={8} />;
}
