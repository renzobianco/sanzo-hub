import { chapita, ofertaChapita, personalizacion, type Producto } from "@/data/products";
import { tamLetraValido } from "./personalizacion";

/** Lo que el cliente pidió grabar en la chapita: la cara de su perro u otra imagen, el nombre, el teléfono (al menos uno). */
export interface Grabado {
  tipo: string;
  /** La cara de su perro: nos manda la foto por WhatsApp después del pedido y la grabamos. */
  foto: boolean;
  /** Otra imagen (un dibujo, un logo…): también nos la manda por WhatsApp. No va junto con `foto`. */
  imagen?: boolean;
  nombre: string;
  telefono: string;
  /** id de una letra de `personalizacion.fuentes` (la misma lista que los parches, sin "Tu letra"). Vacío = la de la marca. */
  letra?: string;
  /** Tamaño de la letra: 0,5 a 2 veces el de siempre, sin pasar los bordes (vacío o 1 = el de siempre). */
  tamLetra?: number;
}

export type ErroresGrabado = Partial<Record<"tipo" | "nombre" | "telefono", string>>;

const NOMBRE = /^[\p{L}\p{N} .'-]+$/u;
const TELEFONO = /^[\d +-]+$/;
const SEP = " · ";
/** El teléfono va marcado para no confundirlo con un nombre: "Corazón · Coco · Tel. 11 2345 6789". */
const TEL = "Tel. ";
/** Marca de la foto en la opción: "Circular · Con su foto · Coco". */
const FOTO = "Con su foto";
/** Marca de otra imagen: "Placa · Con tu imagen · Tel. 11 2345 6789". */
const IMAGEN = "Con tu imagen";
/** Letra elegida, al final de la opción: "Placa · Coco · Letra Clásica". La de la marca no se escribe. */
const LETRA = "Letra ";
/** Tamaño de letra, al final de todo: "… · Tamaño 80 %" o "… · Tamaño 150 %". El de siempre (100 %) no se escribe. */
const TAM = "Tamaño ";
const textoTam = (t?: number) => (t && t !== 1 ? `${TAM}${Math.round(t * 100)} %` : "");

/** Letras para grabar la chapita: las mismas de los parches, menos "Tu letra" (a mano). */
export const letrasChapita = personalizacion.fuentes.filter((f) => !f.propia);
const LETRA_BASE = letrasChapita[0]?.id ?? "jost";

export function esChapita(productoId: string) {
  return productoId === chapita.id;
}

export function tipoChapita(id: string) {
  return ofertaChapita.tipos.find((t) => t.id === id);
}

const limpiarNombre = (s: string) => s.trim().replace(/\s+/g, " ");
const limpiarTelefono = (s: string) => s.trim().replace(/\s+/g, " ");

export function validarGrabado(g: Grabado): ErroresGrabado {
  const e: ErroresGrabado = {};
  if (!tipoChapita(g.tipo)) {
    e.tipo = "Elegí una chapita.";
    return e;
  }
  const nombre = limpiarNombre(g.nombre);
  const tel = limpiarTelefono(g.telefono);
  if (!g.foto && !g.imagen && !nombre && !tel) {
    e.nombre = "Elegí una imagen, poné su nombre o tu teléfono.";
    return e;
  }
  if (nombre.length > ofertaChapita.maxNombre) e.nombre = `Hasta ${ofertaChapita.maxNombre} letras.`;
  else if (nombre && !NOMBRE.test(nombre)) e.nombre = "Usá solo letras y números.";
  if (tel) {
    const digitos = tel.replace(/\D/g, "").length;
    if (!TELEFONO.test(tel) || digitos < 8 || digitos > 13) e.telefono = "Revisá el teléfono (ej. 11 2345 6789).";
  }
  return e;
}

/** Grabado → texto de la opción de la línea: "Huesito · Kala", "Circular · Con su foto", "Placa · Coco · Tel. 11 2345 6789". */
export function textoGrabado(g: Grabado) {
  const nombre = limpiarNombre(g.nombre);
  const tel = limpiarTelefono(g.telefono);
  const letra = g.letra && g.letra !== LETRA_BASE ? letrasChapita.find((f) => f.id === g.letra) : undefined;
  const tam = nombre || tel ? textoTam(tamLetraValido(g.tamLetra)) : "";
  return [g.tipo, g.foto ? FOTO : g.imagen && IMAGEN, nombre, tel && `${TEL}${tel}`, letra && `${LETRA}${letra.nombre}`, tam].filter(Boolean).join(SEP);
}

/** Revisa la opción que llega del carrito (o del pedido). Devuelve el texto limpio o null si no sirve. */
export function normalizarOpcionChapita(opcion?: string): string | null {
  if (!opcion) return null;
  const [tipo, ...conTam] = opcion.split(SEP).map((p) => p.trim());
  // El tamaño de letra va al final de todo ("Tamaño 80 %"); tiene que ser uno de los que se pueden elegir.
  let tamLetra: number | undefined;
  const ultimaTam = conTam[conTam.length - 1];
  if (ultimaTam?.startsWith(TAM)) {
    const m = /^Tamaño (\d+) %$/.exec(ultimaTam);
    tamLetra = m ? tamLetraValido(Number(m[1]) / 100) : undefined;
    if (!tamLetra || textoTam(tamLetra) !== ultimaTam) return null;
  }
  const todas = tamLetra ? conTam.slice(0, -1) : conTam;
  // La letra va al final; si no es una de la lista, la opción no sirve.
  const ultima = todas[todas.length - 1];
  const conLetra = !!ultima?.startsWith(LETRA);
  const letra = conLetra ? letrasChapita.find((f) => `${LETRA}${f.nombre}` === ultima) : undefined;
  if (conLetra && !letra) return null;
  const partes = conLetra ? todas.slice(0, -1) : todas;
  const foto = partes[0] === FOTO;
  const imagen = partes[0] === IMAGEN;
  const resto = foto || imagen ? partes.slice(1) : partes;
  if (!tipoChapita(tipo) || resto.length > 2 || (!foto && !imagen && resto.length === 0)) return null;
  const tels = resto.filter((p) => p.startsWith(TEL));
  const nombres = resto.filter((p) => !p.startsWith(TEL));
  if (tels.length > 1 || nombres.length > 1) return null;
  const g: Grabado = { tipo, foto, imagen, nombre: nombres[0] ?? "", telefono: tels[0]?.slice(TEL.length) ?? "", letra: letra?.id, tamLetra };
  if (Object.keys(validarGrabado(g)).length > 0) return null;
  return textoGrabado(g);
}

/** La chapita suelta o un combo que la trae (Combo Identidad). */
export function llevaChapita(producto: Producto) {
  return esChapita(producto.id) || (producto.tipo === "combo" && producto.incluye.includes(chapita.id));
}

/**
 * Combo con chapita: la opción es el talle y después el grabado ("M · Corazón · Coco").
 * Devuelve el texto limpio o null si el talle o el grabado no sirven.
 */
export function normalizarOpcionComboChapita(combo: Producto, opcion?: string): string | null {
  if (!opcion) return null;
  const i = opcion.indexOf(SEP);
  if (i === -1) return null;
  const talle = opcion.slice(0, i).trim();
  if (combo.opcion && !combo.opcion.valores.includes(talle)) return null;
  const grabado = normalizarOpcionChapita(opcion.slice(i + SEP.length));
  return grabado ? `${talle}${SEP}${grabado}` : null;
}

/** Lleva una chapita con la cara de su perro u otra imagen (hay que pedírsela por WhatsApp). */
export function chapitaConFoto(producto: Producto, opcion?: string) {
  return llevaChapita(producto) && !!opcion && opcion.split(SEP).some((p) => p.trim() === FOTO || p.trim() === IMAGEN);
}

/** Foto para la línea del carrito/checkout: en la chapita, la forma elegida sobre el lino; en el resto, la primera foto. */
export function fotoDeLinea(producto: Producto, opcion?: string) {
  if (esChapita(producto.id) && opcion) {
    const t = tipoChapita(opcion.split(SEP)[0]);
    if (t) return t.linea;
  }
  return producto.imagenes[0];
}
