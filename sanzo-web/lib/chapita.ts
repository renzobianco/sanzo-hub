import { chapita, ofertaChapita, type Producto } from "@/data/products";

/** Lo que el cliente pidió grabar en la chapita: el nombre, el teléfono o los dos. */
export interface Grabado {
  tipo: string;
  nombre: string;
  telefono: string;
}

export type ErroresGrabado = Partial<Record<"tipo" | "nombre" | "telefono", string>>;

const NOMBRE = /^[\p{L}\p{N} .'-]+$/u;
const TELEFONO = /^[\d +-]+$/;
const SEP = " · ";
/** El teléfono va marcado para no confundirlo con un nombre: "Corazón · Coco · Tel. 11 2345 6789". */
const TEL = "Tel. ";

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
  if (!nombre && !tel) {
    e.nombre = "Poné su nombre, tu teléfono o los dos.";
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

/** Grabado → texto de la opción de la línea: "Huesito · Kala", "Placa · Tel. 11 2345 6789", "Corazón · Coco · Tel. 11 2345 6789". */
export function textoGrabado(g: Grabado) {
  const nombre = limpiarNombre(g.nombre);
  const tel = limpiarTelefono(g.telefono);
  return [g.tipo, nombre, tel && `${TEL}${tel}`].filter(Boolean).join(SEP);
}

/** Revisa la opción que llega del carrito (o del pedido). Devuelve el texto limpio o null si no sirve. */
export function normalizarOpcionChapita(opcion?: string): string | null {
  if (!opcion) return null;
  const [tipo, ...resto] = opcion.split(SEP).map((p) => p.trim());
  if (!tipoChapita(tipo) || resto.length === 0 || resto.length > 2) return null;
  const tels = resto.filter((p) => p.startsWith(TEL));
  const nombres = resto.filter((p) => !p.startsWith(TEL));
  if (tels.length > 1 || nombres.length > 1) return null;
  const g: Grabado = { tipo, nombre: nombres[0] ?? "", telefono: tels[0]?.slice(TEL.length) ?? "" };
  if (Object.keys(validarGrabado(g)).length > 0) return null;
  return textoGrabado(g);
}

/** Foto para la línea del carrito/checkout: en la chapita, la forma elegida; en el resto, la primera foto. */
export function fotoDeLinea(producto: Producto, opcion?: string) {
  if (esChapita(producto.id) && opcion) {
    const t = tipoChapita(opcion.split(SEP)[0]);
    if (t) return t.imagen;
  }
  return producto.imagenes[0];
}
