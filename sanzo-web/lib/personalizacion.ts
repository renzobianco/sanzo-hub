import { personalizacion as config, type FormaPieza, type Producto } from "@/data/products";

export interface Personalizacion {
  estilo: FormaPieza;
  nombre: string;
  /** Opcional: va grabado debajo del nombre. */
  telefono?: string;
}

export type ErroresPersonalizacion = Partial<Record<"estilo" | "nombre" | "telefono", string>>;

// Letras (con tildes y ñ), números, espacios y . ' -  — lo que se puede grabar prolijo.
const NOMBRE = /^[\p{L}\p{N} .'-]+$/u;
const TELEFONO = /^[\d +-]+$/;

export function estiloPorId(id: string) {
  return config.estilos.find((e) => e.id === id);
}

export function validarPersonalizacion(p: { estilo: string; nombre: string; telefono?: string }): ErroresPersonalizacion {
  const e: ErroresPersonalizacion = {};
  if (!estiloPorId(p.estilo)) e.estilo = "Elegí un estilo.";

  const nombre = p.nombre.trim();
  if (!nombre) e.nombre = "Poné el nombre de tu perro.";
  else if (nombre.length > config.maxNombre) e.nombre = `Hasta ${config.maxNombre} letras.`;
  else if (!NOMBRE.test(nombre)) e.nombre = "Usá solo letras y números.";

  if (p.telefono !== undefined) {
    const tel = p.telefono.trim();
    const digitos = tel.replace(/\D/g, "").length;
    if (!tel) e.telefono = "Poné el teléfono o elegí solo nombre.";
    else if (!TELEFONO.test(tel) || digitos < 8 || digitos > 13) e.telefono = "Revisá el teléfono (ej. 11 2345 6789).";
  }
  return e;
}

/**
 * Devuelve la personalización lista para usar, o null si no es válida para ese producto.
 * Se usa en el carrito y en el servidor (los datos pueden venir de localStorage o de la red).
 */
export function normalizarPersonalizacion(producto: Producto, p: unknown): Personalizacion | null {
  if (!producto.personalizable || !p || typeof p !== "object") return null;
  const { estilo, nombre, telefono } = p as Record<string, unknown>;
  if (typeof estilo !== "string" || typeof nombre !== "string") return null;
  if (telefono !== undefined && typeof telefono !== "string") return null;
  const limpio = {
    estilo: estilo as FormaPieza,
    nombre: nombre.trim().replace(/\s+/g, " "),
    telefono: telefono?.trim().replace(/\s+/g, " ") || undefined,
  };
  if (Object.keys(validarPersonalizacion(limpio)).length > 0) return null;
  return limpio;
}

export function clavePersonalizacion(p?: Personalizacion) {
  return p ? `${p.estilo}|${p.nombre.toLowerCase()}|${p.telefono ?? ""}` : "";
}

/** "Hueso · TOTO · 11 2345 6789" */
export function textoPersonalizacion(p: Personalizacion) {
  return [estiloPorId(p.estilo)?.nombre ?? p.estilo, p.nombre.toUpperCase(), p.telefono].filter(Boolean).join(" · ");
}
