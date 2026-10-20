import { chapita, ofertaChapita } from "@/data/products";

/** Lo que el cliente pidió grabar en la chapita. */
export interface Grabado {
  tipo: string;
  nombre: string;
  telefono?: string;
}

export type ErroresGrabado = Partial<Record<"tipo" | "nombre" | "telefono", string>>;

const NOMBRE = /^[\p{L}\p{N} .'-]+$/u;
const TELEFONO = /^[\d +-]+$/;
const SEP = " · ";
const CARA = "Su cara";

export function esChapita(productoId: string) {
  return productoId === chapita.id;
}

export function tipoChapita(id: string) {
  return ofertaChapita.tipos.find((t) => t.id === id);
}

export function validarGrabado(g: Grabado): ErroresGrabado {
  const e: ErroresGrabado = {};
  const tipo = tipoChapita(g.tipo);
  if (!tipo) {
    e.tipo = "Elegí una chapita.";
    return e;
  }
  const nombre = g.nombre.trim();
  // En la circular el nombre es opcional (va su cara).
  if (!nombre && tipo.pide !== "cara") e.nombre = "Poné el nombre de tu perro.";
  else if (nombre.length > ofertaChapita.maxNombre) e.nombre = `Hasta ${ofertaChapita.maxNombre} letras.`;
  else if (nombre && !NOMBRE.test(nombre)) e.nombre = "Usá solo letras y números.";
  if (tipo.pide === "telefono") {
    const tel = (g.telefono ?? "").trim();
    const digitos = tel.replace(/\D/g, "").length;
    if (!tel) e.telefono = "Poné el teléfono.";
    else if (!TELEFONO.test(tel) || digitos < 8 || digitos > 13) e.telefono = "Revisá el teléfono (ej. 11 2345 6789).";
  }
  return e;
}

/** Grabado → texto de la opción de la línea: "Huesito · KALA", "Circular · Su cara · TOTO", "Rectangular · COCO · 11 2345 6789". */
export function textoGrabado(g: Grabado) {
  const tipo = tipoChapita(g.tipo);
  const nombre = g.nombre.trim().replace(/\s+/g, " ").toUpperCase();
  const partes = [g.tipo];
  if (tipo?.pide === "cara") partes.push(CARA);
  if (nombre) partes.push(nombre);
  if (tipo?.pide === "telefono" && g.telefono) partes.push(g.telefono.trim().replace(/\s+/g, " "));
  return partes.join(SEP);
}

/** Revisa la opción que llega del carrito (o del pedido). Devuelve el texto limpio o null si no sirve. */
export function normalizarOpcionChapita(opcion?: string): string | null {
  if (!opcion) return null;
  const partes = opcion.split(SEP).map((p) => p.trim());
  const tipo = tipoChapita(partes[0]);
  if (!tipo) return null;
  const resto = tipo.pide === "cara" && partes[1] === CARA ? partes.slice(2) : partes.slice(1);
  const g: Grabado = { tipo: tipo.id, nombre: resto[0] ?? "", telefono: tipo.pide === "telefono" ? resto[1] : undefined };
  if (resto.length > (tipo.pide === "telefono" ? 2 : 1)) return null;
  if (Object.keys(validarGrabado(g)).length > 0) return null;
  return textoGrabado(g);
}
