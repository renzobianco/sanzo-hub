import { personalizacion as config, type Producto } from "@/data/products";

export interface Personalizacion {
  /** id de un estilo de `personalizacion.estilos`. */
  estilo: string;
  /** id de un material de `personalizacion.materiales`. */
  material: string;
  /** id de un tamaño de `personalizacion.tamanos`. */
  tamano: string;
  /** "nombre": grabado con el nombre (y teléfono). "imagen": sube su propia imagen. */
  modo: "nombre" | "imagen";
  /** Solo en modo nombre (en modo imagen va vacío). */
  nombre: string;
  /** Opcional: va grabado debajo del nombre. */
  telefono?: string;
  /**
   * Vista previa del grabado de su imagen (PNG chico, data URL). Solo vive en el navegador
   * (carrito y vista previa): al pedido no se manda; la imagen original nos la pasa por WhatsApp.
   */
  imagen?: string;
}

export type ErroresPersonalizacion = Partial<Record<"estilo" | "material" | "tamano" | "imagen" | "nombre" | "telefono", string>>;

// Letras (con tildes y ñ), números, espacios y . ' -  — lo que se puede grabar prolijo.
const NOMBRE = /^[\p{L}\p{N} .'-]+$/u;
const TELEFONO = /^[\d +-]+$/;

export function estiloPorId(id: string) {
  return config.estilos.find((e) => e.id === id);
}

export function materialPorId(id: string) {
  return config.materiales.find((m) => m.id === id);
}

export function tamanoPorId(id: string) {
  return config.tamanos.find((t) => t.id === id);
}

/** El material que queda elegido de entrada: el primero que se puede pedir. */
export function materialInicial() {
  return config.materiales.find((m) => !m.proximamente)?.id ?? "";
}

/** Tamaño de entrada: el más grande (el espacio máximo de cada pieza). */
export function tamanoInicial() {
  return config.tamanos[config.tamanos.length - 1]?.id ?? "";
}

/** ¿Esta pieza se puede personalizar? Las que tienen vista previa en `piezas`. El moño no. */
function piezaPersonalizable(id: string) {
  return id in config.piezas;
}

/** Piezas que se personalizan al personalizar este producto (en kits y combos, todas las que se puede). */
export function piezasPersonalizables(producto: Producto): string[] {
  const ids = producto.tipo === "individual" ? [producto.id] : producto.incluye;
  return ids.filter(piezaPersonalizable);
}

/** El botón de personalizar solo aparece si el producto trae arnés (suelto, en combo o en el kit). */
export function esPersonalizable(producto: Producto) {
  const ids = producto.tipo === "individual" ? [producto.id] : producto.incluye;
  return ids.includes("arnes");
}

/** Lo que suma la personalización a una unidad: (base + material + tamaño + imagen propia) × piezas personalizadas. */
export function precioPersonalizacion(producto: Producto, p?: Partial<Pick<Personalizacion, "material" | "tamano" | "modo">>) {
  const porPieza =
    config.precioExtra +
    (materialPorId(p?.material ?? materialInicial())?.precioExtra ?? 0) +
    (tamanoPorId(p?.tamano ?? tamanoInicial())?.precioExtra ?? 0) +
    (p?.modo === "imagen" ? config.precioImagen : 0);
  return porPieza * piezasPersonalizables(producto).length;
}

/** pedirImagen: en el editor exige la imagen; en el carrito y el servidor no (ahí no viaja). */
export function validarPersonalizacion(p: Personalizacion, { pedirImagen = false } = {}): ErroresPersonalizacion {
  const e: ErroresPersonalizacion = {};
  if (!estiloPorId(p.estilo)) e.estilo = "Elegí un parche.";
  const m = materialPorId(p.material);
  if (!m || m.proximamente) e.material = "Elegí un material.";
  if (!tamanoPorId(p.tamano)) e.tamano = "Elegí un tamaño.";

  if (p.modo === "imagen") {
    if (pedirImagen && !p.imagen) e.imagen = "Subí una imagen.";
    return e;
  }

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
  if (!esPersonalizable(producto) || !p || typeof p !== "object") return null;
  const { estilo, material, tamano, modo, nombre, telefono, imagen } = p as Record<string, unknown>;
  if (typeof estilo !== "string") return null;
  if (telefono !== undefined && typeof telefono !== "string") return null;
  const enImagen = modo === "imagen";
  if (!enImagen && typeof nombre !== "string") return null;
  const limpio: Personalizacion = {
    estilo,
    // Carritos guardados antes de que existieran material, tamaño o modo: quedan los de entrada.
    material: typeof material === "string" && material ? material : materialInicial(),
    tamano: typeof tamano === "string" && tamano ? tamano : tamanoInicial(),
    modo: enImagen ? "imagen" : "nombre",
    nombre: enImagen ? "" : String(nombre).trim().replace(/\s+/g, " "),
    telefono: enImagen ? undefined : telefono?.trim().replace(/\s+/g, " ") || undefined,
    imagen: enImagen && typeof imagen === "string" && imagen.startsWith("data:image/") ? imagen : undefined,
  };
  if (Object.keys(validarPersonalizacion(limpio)).length > 0) return null;
  return limpio;
}

export function clavePersonalizacion(p?: Personalizacion) {
  if (!p) return "";
  // Dos imágenes distintas = dos líneas distintas en el carrito (huella corta de la vista previa).
  const huella = p.imagen ? `${p.imagen.length}-${p.imagen.slice(-24)}` : "";
  return `${p.estilo}|${p.material}|${p.tamano}|${p.modo}|${p.nombre.toLowerCase()}|${p.telefono ?? ""}|${huella}`;
}

/** "Hueso · Cuerina · Grande · TOTO · 11 2345 6789"  /  "Hueso · Cuerina · Mediano · Imagen propia" */
export function textoPersonalizacion(p: Personalizacion) {
  const grabado = p.modo === "imagen" ? ["Imagen propia"] : [p.nombre.toUpperCase(), p.telefono];
  return [estiloPorId(p.estilo)?.nombre ?? p.estilo, materialPorId(p.material)?.nombre, tamanoPorId(p.tamano)?.nombre, ...grabado]
    .filter(Boolean)
    .join(" · ");
}

/** Lo que se manda al servidor: sin la vista previa de la imagen (pesa y no hace falta). */
export function sinImagen(p?: Personalizacion): Personalizacion | undefined {
  if (!p) return undefined;
  const { imagen: _imagen, ...resto } = p;
  return resto;
}
