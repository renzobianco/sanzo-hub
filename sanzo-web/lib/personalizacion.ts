import { personalizacion as config, type Producto } from "@/data/products";
import { medidaFinal } from "./formas";
import type { Grabado } from "./laser";

export interface Personalizacion {
  /** id de una forma de `personalizacion.formas`. */
  forma: string;
  /** Solo con la forma "otra": cómo la quiere, con sus palabras. */
  formaOtra?: string;
  /** id de un material de `personalizacion.materiales`. */
  material: string;
  /** id de un color de `personalizacion.colores`. */
  color: string;
  /** Medida final del parche en cm (las formas fijas ya vienen con el alto de su proporción). */
  ancho: number;
  alto: number;
  /** "nombre": grabado con el nombre (y teléfono). "imagen": sube su propia imagen. */
  modo: "nombre" | "imagen";
  /** Solo en modo nombre (en modo imagen va vacío). */
  nombre: string;
  /** Opcional: va grabado debajo del nombre. */
  telefono?: string;
  /** id de una letra de `personalizacion.fuentes` (solo en modo nombre). */
  fuente: string;
  /** La imagen original ya subida (link público de Supabase Storage). Va con el pedido y se ve en el Hub. */
  imagenUrl?: string;
  /** Vista previa del grabado de su imagen. Solo vive en el navegador (carrito y editor): no viaja al servidor. */
  vista?: Grabado;
}

export type ErroresPersonalizacion = Partial<
  Record<"forma" | "formaOtra" | "material" | "color" | "medida" | "imagen" | "nombre" | "telefono" | "fuente", string>
>;

// Letras (con tildes y ñ), números, espacios y . ' - & ♥ — lo que se puede grabar prolijo.
const NOMBRE = /^[\p{L}\p{N} .'&♥-]+$/u;
const TELEFONO = /^[\d +-]+$/;
const IMAGEN_URL = /^https:\/\/[^/\s]+\/storage\/v1\/object\/public\/sanzo-pedidos\/[\w\-/.]+$/;

export const formaPorId = (id: string) => config.formas.find((f) => f.id === id);
export const materialPorId = (id: string) => config.materiales.find((m) => m.id === id);
export const colorPorId = (id: string) => config.colores.find((c) => c.id === id);
export const fuentePorId = (id: string) => config.fuentes.find((f) => f.id === id);

/** El material que queda elegido de entrada: el primero que se puede pedir. */
export function materialInicial() {
  return config.materiales.find((m) => !m.proximamente)?.id ?? "";
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

/** Lo más grande que se puede pedir para estas piezas: lo que entra en la más grande (en las chicas se achica solo). */
export function medidaMaxima(piezas: string[]) {
  const cms = (piezas.length ? piezas : Object.keys(config.piezas)).map((p) => config.piezas[p]?.cm).filter(Boolean);
  return {
    ancho: Math.max(config.medidas.minCm, ...cms.map((c) => c!.ancho)),
    alto: Math.max(config.medidas.minCm, ...cms.map((c) => c!.alto)),
  };
}

/** El tramo de precio según el área del parche. */
export function tramoTamano(ancho: number, alto: number) {
  const area = ancho * alto;
  return config.tamanos.find((t) => area <= t.hastaCm2) ?? config.tamanos[config.tamanos.length - 1];
}

/** Lo que suma la personalización a una unidad: (base + material + tamaño + imagen propia) × piezas personalizadas. */
export function precioPersonalizacion(producto: Producto, p?: Partial<Pick<Personalizacion, "material" | "ancho" | "alto" | "modo">>) {
  const { ancho, alto } = { ...config.medidas.inicial, ...p };
  const porPieza =
    config.precioExtra +
    (materialPorId(p?.material ?? materialInicial())?.precioExtra ?? 0) +
    (tramoTamano(ancho!, alto!)?.precioExtra ?? 0) +
    (p?.modo === "imagen" ? config.precioImagen : 0);
  return porPieza * piezasPersonalizables(producto).length;
}

/** pedirImagen: en el editor exige haber elegido una imagen; en el carrito y el servidor no. */
export function validarPersonalizacion(p: Personalizacion, { pedirImagen = false } = {}): ErroresPersonalizacion {
  const e: ErroresPersonalizacion = {};
  const forma = formaPorId(p.forma);
  if (!forma) e.forma = "Elegí una forma.";
  else if (forma.especial === "silueta" && p.modo !== "imagen") e.forma = "Su silueta va con una imagen: subí una o elegí otra forma.";
  else if (forma.especial === "otra" && !p.formaOtra?.trim()) e.formaOtra = "Contanos qué forma querés.";
  const m = materialPorId(p.material);
  if (!m || m.proximamente) e.material = "Elegí un material.";
  if (!colorPorId(p.color)) e.color = "Elegí un color.";

  const max = medidaMaxima([]);
  const min = config.medidas.minCm;
  const ok = (v: number, hasta: number) => Number.isFinite(v) && v >= min - 0.01 && v <= hasta + 0.01;
  // Las formas fijas pueden pasarse un poco de alto por su proporción: se acepta hasta el doble del ancho máximo.
  if (!ok(p.ancho, max.ancho) || !ok(p.alto, Math.max(max.alto, max.ancho * 2))) e.medida = "Revisá la medida.";

  if (p.modo === "imagen") {
    if (pedirImagen && !p.vista && !p.imagenUrl) e.imagen = "Subí una imagen.";
    return e;
  }

  if (!fuentePorId(p.fuente)) e.fuente = "Elegí una letra.";
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

// Carritos guardados con la personalización vieja (4 parches fijos y 3 tamaños).
const FORMA_VIEJA: Record<string, string> = { clasica: "rectangulo", redondeada: "redondeado", cinta: "banderin", hueso: "hueso" };
const ANCHO_VIEJO: Record<string, number> = { chico: 4.5, mediano: 5.5, grande: 6.5 };

const num = (v: unknown) => (typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN);
const redondear = (v: number) => Math.round(v * 10) / 10;

function vistaValida(v: unknown): Grabado | undefined {
  if (!v || typeof v !== "object") return undefined;
  const g = v as Grabado;
  const img = (s: unknown) => typeof s === "string" && s.startsWith("data:image/");
  return img(g.grabado) && img(g.silueta) && g.proporcion > 0 && g.proporcionSilueta > 0 && g.margen ? g : undefined;
}

/**
 * Devuelve la personalización lista para usar, o null si no es válida para ese producto.
 * Se usa en el carrito y en el servidor (los datos pueden venir de localStorage o de la red).
 */
export function normalizarPersonalizacion(producto: Producto, p: unknown): Personalizacion | null {
  if (!esPersonalizable(producto) || !p || typeof p !== "object") return null;
  const o = p as Record<string, unknown>;
  const enImagen = o.modo === "imagen";
  if (!enImagen && typeof o.nombre !== "string") return null;
  if (o.telefono !== undefined && typeof o.telefono !== "string") return null;

  const forma = typeof o.forma === "string" ? o.forma : FORMA_VIEJA[String(o.estilo)] ?? "";
  let ancho = num(o.ancho);
  let alto = num(o.alto);
  if (!Number.isFinite(ancho)) {
    ancho = ANCHO_VIEJO[String(o.tamano)] ?? config.medidas.inicial.ancho;
    alto = medidaFinal(forma, ancho, ancho / 2).alto;
  }
  const imagenUrl = typeof o.imagenUrl === "string" && IMAGEN_URL.test(o.imagenUrl) ? o.imagenUrl : undefined;
  const limpio: Personalizacion = {
    forma,
    formaOtra: forma === "otra" && typeof o.formaOtra === "string" ? o.formaOtra.trim().replace(/\s+/g, " ").slice(0, 120) : undefined,
    material: typeof o.material === "string" && o.material ? o.material : materialInicial(),
    color: typeof o.color === "string" && o.color ? o.color : config.colores[0].id,
    ancho: redondear(ancho),
    alto: redondear(alto),
    modo: enImagen ? "imagen" : "nombre",
    nombre: enImagen ? "" : String(o.nombre).trim().replace(/\s+/g, " "),
    telefono: enImagen ? undefined : (o.telefono as string | undefined)?.trim().replace(/\s+/g, " ") || undefined,
    fuente: typeof o.fuente === "string" && o.fuente ? o.fuente : config.fuentes[0].id,
    imagenUrl: enImagen ? imagenUrl : undefined,
    vista: enImagen ? vistaValida(o.vista) : undefined,
  };
  if (Object.keys(validarPersonalizacion(limpio)).length > 0) return null;
  return limpio;
}

export function clavePersonalizacion(p?: Personalizacion) {
  if (!p) return "";
  // Dos imágenes distintas = dos líneas distintas en el carrito.
  const huella = p.imagenUrl ?? (p.vista ? `${p.vista.grabado.length}-${p.vista.grabado.slice(-24)}` : "");
  return [p.forma, p.formaOtra ?? "", p.material, p.color, p.ancho, p.alto, p.modo, p.nombre, p.telefono ?? "", p.modo === "nombre" ? p.fuente : "", huella].join("|");
}

const cm = (v: number) => String(v).replace(".", ",");

/** "Hueso · Tabaco envejecido · 6 × 2,6 cm · Letra Clásica · Toto · 11 2345 6789"  /  "… · Imagen propia" */
export function textoPersonalizacion(p: Personalizacion) {
  const forma = p.forma === "otra" ? `Forma a medida: "${p.formaOtra ?? ""}"` : formaPorId(p.forma)?.nombre ?? p.forma;
  const material = config.materiales.filter((m) => !m.proximamente).length > 1 ? materialPorId(p.material)?.nombre : "";
  const fuente = fuentePorId(p.fuente);
  const grabado =
    p.modo === "imagen"
      ? ["Imagen propia"]
      : [`Letra ${fuente?.nombre ?? p.fuente}`, fuente?.mayusculas ? p.nombre.toUpperCase() : p.nombre, p.telefono];
  return [forma, material, colorPorId(p.color)?.nombre, `${cm(p.ancho)} × ${cm(p.alto)} cm`, ...grabado].filter(Boolean).join(" · ");
}

/** Lo que se manda al servidor: sin la vista previa de la imagen (pesa y no hace falta). */
export function sinImagen(p?: Personalizacion): Personalizacion | undefined {
  if (!p) return undefined;
  const { vista: _vista, ...resto } = p;
  return resto;
}
