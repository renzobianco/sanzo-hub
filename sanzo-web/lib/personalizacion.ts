import { getProducto, personalizacion as config, type Producto } from "@/data/products";
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
  /** Opcional (en lugar del teléfono): otro texto libre debajo del nombre (barrio, Instagram…). */
  linea2?: string;
  /** id de una letra de `personalizacion.fuentes` (solo en modo nombre). */
  fuente: string;
  /** Tamaño de la letra, como parte del máximo que entra en el parche (0,5 a 1). Sin esto: 1, lo más grande. */
  tamLetra?: number;
  /** "Tu letra" sin escribir en el celu: el nombre escrito a mano lo manda por WhatsApp. */
  letraWhatsapp?: boolean;
  /** La imagen original ya subida (link público de Supabase Storage). Va con el pedido y se ve en el Hub. */
  imagenUrl?: string;
  /** Dónde va el parche en cada pieza: centro como parte del ancho y alto de su foto (0 a 1). Lo eligen arrastrando. */
  posiciones?: Record<string, [number, number]>;
  /** Vista previa del grabado de su imagen. Solo vive en el navegador (carrito y editor): no viaja al servidor. */
  vista?: Grabado;
  /**
   * Kits y combos con un diseño distinto por pieza: el diseño de cada pieza, o null si esa pieza va sin personalizar.
   * Sin esto, el diseño de arriba va igual en todas las piezas.
   */
  piezas?: Record<string, DisenoPieza | null>;
}

/** El diseño de una pieza (lo mismo que una personalización, sin posiciones ni diseños por pieza). */
export type DisenoPieza = Omit<Personalizacion, "piezas" | "posiciones">;

export type ErroresPersonalizacion = Partial<
  Record<"forma" | "formaOtra" | "material" | "color" | "medida" | "imagen" | "nombre" | "telefono" | "linea2" | "fuente", string>
>;

// Letras (con tildes y ñ), números, espacios y . ' - & ♥ — lo que se puede grabar prolijo.
const NOMBRE = /^[^\p{C}<>{}\\|`~^]+$/u;
const MAX_LINEA2 = 28;
const TELEFONO = /^[\d +-]+$/;
const IMAGEN_URL = /^https:\/\/[^/\s]+\/storage\/v1\/object\/public\/sanzo-pedidos\/[\w\-/.]+$/;

export const formaPorId = (id: string) => config.formas.find((f) => f.id === id);
export const materialPorId = (id: string) => config.materiales.find((m) => m.id === id);
export const colorPorId = (id: string) => config.colores.find((c) => c.id === id);
export const fuentePorId = (id: string) => config.fuentes.find((f) => f.id === id);

/** El color que queda elegido de entrada: el primero disponible. */
export function colorInicial() {
  return (config.colores.find((c) => c.disponible !== false) ?? config.colores[0]).id;
}

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

/**
 * ¿Lleva botón de personalizar? Sueltos: solo el arnés. Kit y combos: todos los que traen alguna pieza
 * personalizable (Santi, 2026-10-30: "agregar personalizar en todos los combos").
 */
export function esPersonalizable(producto: Producto) {
  if (producto.tipo === "individual") return producto.id === "arnes";
  return piezasPersonalizables(producto).length > 0;
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

/** Lo que suma personalizar UNA pieza: base + material + tamaño (a más grande, más caro) + imagen propia. */
export function precioPieza(d?: Partial<Pick<Personalizacion, "material" | "ancho" | "alto" | "modo">>) {
  const { ancho, alto } = { ...config.medidas.inicial, ...d };
  return (
    config.precioExtra +
    (materialPorId(d?.material ?? materialInicial())?.precioExtra ?? 0) +
    (tramoTamano(ancho!, alto!)?.precioExtra ?? 0) +
    (d?.modo === "imagen" ? config.precioImagen : 0)
  );
}

/** El diseño de cada pieza personalizada del producto (las que van sin personalizar no aparecen). */
export function disenosPorPieza(producto: Producto, p: Personalizacion): [string, DisenoPieza][] {
  return piezasPersonalizables(producto).flatMap((pz) => {
    const d = p.piezas ? p.piezas[pz] : p;
    return d ? [[pz, d] as [string, DisenoPieza]] : [];
  });
}

/** Lo que suma la personalización a una unidad: la suma de cada pieza personalizada. */
export function precioPersonalizacion(producto: Producto, p?: Partial<Pick<Personalizacion, "material" | "ancho" | "alto" | "modo">> & { piezas?: Personalizacion["piezas"] }) {
  if (p?.piezas) return disenosPorPieza(producto, p as Personalizacion).reduce((s, [, d]) => s + precioPieza(d), 0);
  return precioPieza(p) * piezasPersonalizables(producto).length;
}

/** pedirImagen: en el editor exige haber elegido una imagen; en el carrito y el servidor no. */
export function validarPersonalizacion(p: DisenoPieza & { piezas?: Personalizacion["piezas"] }, { pedirImagen = false } = {}): ErroresPersonalizacion {
  if (p.piezas) {
    const disenos = Object.values(p.piezas).filter((d): d is DisenoPieza => !!d);
    if (!disenos.length) return { forma: "Personalizá al menos una pieza." };
    for (const d of disenos) {
      const e = validarPersonalizacion(d, { pedirImagen });
      if (Object.keys(e).length) return e;
    }
    return {};
  }
  const e: ErroresPersonalizacion = {};
  const forma = formaPorId(p.forma);
  if (!forma) e.forma = "Elegí una forma.";
  else if (forma.especial === "silueta" && p.modo !== "imagen") e.forma = "Su silueta va con una imagen: subí una o elegí otra forma.";
  else if (forma.especial === "otra" && !p.formaOtra?.trim()) e.formaOtra = "Contanos qué forma querés.";
  const m = materialPorId(p.material);
  if (!m || m.proximamente) e.material = "Elegí un material.";
  if (colorPorId(p.color)?.disponible === false || !colorPorId(p.color)) e.color = "Elegí un color.";

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
  else if (fuentePorId(p.fuente)?.propia && !p.letraWhatsapp && pedirImagen && !p.vista && !p.imagenUrl) e.fuente = "Escribí el nombre en el recuadro (o elegí mandarlo por WhatsApp).";
  const nombre = p.nombre.trim();
  if (!nombre) e.nombre = "Poné el nombre de tu perro.";
  else if (nombre.length > config.maxNombre) e.nombre = `Hasta ${config.maxNombre} letras.`;
  else if (!NOMBRE.test(nombre)) e.nombre = "Hay un símbolo que no se puede grabar.";

  if (p.linea2 !== undefined) {
    const l2 = p.linea2.trim();
    if (!l2) e.linea2 = "Escribí el texto o elegí solo nombre.";
    else if (l2.length > MAX_LINEA2) e.linea2 = `Hasta ${MAX_LINEA2} caracteres.`;
    else if (!NOMBRE.test(l2)) e.linea2 = "Hay un símbolo que no se puede grabar.";
  }

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

/** Tamaño de letra: de la mitad a lo más grande que entra, de a 5 %. 1 (o nada) = lo más grande. */
export const TAM_LETRA = { min: 0.5, max: 1, paso: 0.05 };
export function tamLetraValido(v: unknown): number | undefined {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  if (!Number.isFinite(n)) return undefined;
  const t = Math.round(Math.min(TAM_LETRA.max, Math.max(TAM_LETRA.min, n)) / TAM_LETRA.paso) * TAM_LETRA.paso;
  return t >= TAM_LETRA.max ? undefined : Math.round(t * 100) / 100;
}

const num = (v: unknown) => (typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN);
const redondear = (v: number) => Math.round(v * 10) / 10;

function posicionesValidas(v: unknown): Personalizacion["posiciones"] {
  if (!v || typeof v !== "object") return undefined;
  const out: Record<string, [number, number]> = {};
  for (const [pz, p] of Object.entries(v as Record<string, unknown>)) {
    if (!(pz in config.piezas) || !Array.isArray(p) || p.length !== 2) continue;
    const [x, y] = p.map(Number);
    if (x >= 0 && x <= 1 && y >= 0 && y <= 1) out[pz] = [Math.round(x * 1000) / 1000, Math.round(y * 1000) / 1000];
  }
  return Object.keys(out).length ? out : undefined;
}

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
  const base = normalizarDiseno(p);
  if (!base) return null;
  const o = p as Record<string, unknown>;
  const limpio: Personalizacion = { ...base, posiciones: posicionesValidas(o.posiciones) };
  if (o.piezas && typeof o.piezas === "object") {
    const piezas: Record<string, DisenoPieza | null> = {};
    for (const pz of piezasPersonalizables(producto)) {
      const d = (o.piezas as Record<string, unknown>)[pz];
      if (d === null) piezas[pz] = null;
      else {
        const n = d ? normalizarDiseno(d) : null;
        if (!n) return null;
        piezas[pz] = n;
      }
    }
    if (!Object.values(piezas).some(Boolean)) return null;
    limpio.piezas = piezas;
  }
  return limpio;
}

/** Un diseño válido a partir de datos de afuera (localStorage o la red), o null. */
function normalizarDiseno(p: unknown): DisenoPieza | null {
  if (!p || typeof p !== "object") return null;
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
  // "Tu letra": el nombre escrito a mano viaja como imagen (igual que "Tu imagen").
  const conDibujo = !enImagen && o.fuente === "propia";
  const limpio: DisenoPieza = {
    forma,
    formaOtra: forma === "otra" && typeof o.formaOtra === "string" ? o.formaOtra.trim().replace(/\s+/g, " ").slice(0, 120) : undefined,
    material: typeof o.material === "string" && o.material ? o.material : materialInicial(),
    // Un color que dejó de estar disponible (carritos viejos) pasa al de entrada.
    color: typeof o.color === "string" && colorPorId(o.color) && colorPorId(o.color)?.disponible !== false ? o.color : colorInicial(),
    ancho: redondear(ancho),
    alto: redondear(alto),
    modo: enImagen ? "imagen" : "nombre",
    nombre: enImagen ? "" : String(o.nombre).trim().replace(/\s+/g, " "),
    telefono: enImagen ? undefined : (o.telefono as string | undefined)?.trim().replace(/\s+/g, " ") || undefined,
    linea2: enImagen || typeof o.linea2 !== "string" ? undefined : o.linea2.trim().replace(/\s+/g, " ").slice(0, 40) || undefined,
    fuente: typeof o.fuente === "string" && o.fuente ? o.fuente : config.fuentes[0].id,
    tamLetra: enImagen || conDibujo ? undefined : tamLetraValido(o.tamLetra),
    letraWhatsapp: conDibujo && o.letraWhatsapp === true ? true : undefined,
    imagenUrl: enImagen || conDibujo ? imagenUrl : undefined,
    vista: enImagen || conDibujo ? vistaValida(o.vista) : undefined,
  };
  if (Object.keys(validarPersonalizacion(limpio)).length > 0) return null;
  return limpio;
}

export function clavePersonalizacion(p?: Personalizacion): string {
  if (!p) return "";
  if (p.piezas) {
    const partes = Object.entries(p.piezas).map(([pz, d]) => `${pz}:${d ? clavePersonalizacion(d) : "-"}`);
    return [...partes, JSON.stringify(p.posiciones ?? {})].join("||");
  }
  // Dos imágenes distintas = dos líneas distintas en el carrito.
  const huella = p.imagenUrl ?? (p.vista ? `${p.vista.grabado.length}-${p.vista.grabado.slice(-24)}` : "");
  return [p.forma, p.formaOtra ?? "", p.material, p.color, p.ancho, p.alto, p.modo, p.nombre, p.telefono ?? "", p.linea2 ?? "", p.modo === "nombre" ? p.fuente : "", p.tamLetra ?? "", huella, JSON.stringify(p.posiciones ?? {})].join("|");
}

const cm = (v: number) => String(v).replace(".", ",");

/**
 * "Hueso · Tabaco envejecido · 6 × 2,6 cm · Letra Clásica · Toto · 11 2345 6789"  /  "… · Imagen propia".
 * Con un diseño por pieza: "Arnés: … / Correa: … / Collar: sin personalizar".
 */
export function textoPersonalizacion(p: Personalizacion): string {
  if (p.piezas) {
    return Object.entries(p.piezas)
      .map(([pz, d]) => `${getProducto(pz)?.nombre ?? pz}: ${d ? textoPersonalizacion(d) : "sin personalizar"}`)
      .join(" / ");
  }
  const forma = p.forma === "otra" ? `Forma a medida: "${p.formaOtra ?? ""}"` : formaPorId(p.forma)?.nombre ?? p.forma;
  const material = config.materiales.filter((m) => !m.proximamente).length > 1 ? materialPorId(p.material)?.nombre : "";
  const fuente = fuentePorId(p.fuente);
  const grabado =
    p.modo === "imagen"
      ? ["Imagen propia"]
      : [fuente?.propia ? (p.letraWhatsapp ? "Letra a mano: la manda por WhatsApp" : "Escrito a mano por el cliente") : `Letra ${fuente?.nombre ?? p.fuente}${p.tamLetra ? ` al ${Math.round(p.tamLetra * 100)} %` : ""}`, fuente?.mayusculas ? p.nombre.toUpperCase() : p.nombre, p.telefono, p.linea2];
  return [forma, material, colorPorId(p.color)?.nombre, `${cm(p.ancho)} × ${cm(p.alto)} cm`, ...grabado].filter(Boolean).join(" · ");
}

/** Un renglón corto por pieza: "Hueso · Camel · 6 × 3 cm · TOTO" / "… · Su imagen" / "… · Letra a mano". */
export function textoCorto(d: DisenoPieza) {
  const forma = d.forma === "otra" ? "Forma a medida" : formaPorId(d.forma)?.nombre ?? d.forma;
  const fuente = fuentePorId(d.fuente);
  const grabado = d.modo === "imagen" ? "Su imagen" : fuente?.propia ? `Letra a mano${d.nombre ? ` (${d.nombre})` : ""}` : fuente?.mayusculas ? d.nombre.toUpperCase() : d.nombre;
  return [forma, colorPorId(d.color)?.nombre, `${cm(d.ancho)} × ${cm(d.alto)} cm`, grabado].filter(Boolean).join(" · ");
}

/** Lo que se manda al servidor: sin la vista previa de la imagen (pesa y no hace falta). */
export function sinImagen(p?: Personalizacion): Personalizacion | undefined {
  if (!p) return undefined;
  const { vista: _vista, piezas, ...resto } = p;
  if (!piezas) return resto;
  return { ...resto, piezas: Object.fromEntries(Object.entries(piezas).map(([pz, d]) => [pz, d ? (({ vista: _v, ...r }) => r)(d) : null])) };
}

/** Las imágenes para grabar del pedido, con la pieza en la que van ("" = en todas). */
export function imagenesPersonalizacion(p: Personalizacion): { pieza: string; url?: string }[] {
  if (p.piezas) {
    return Object.entries(p.piezas).flatMap(([pz, d]) => (d && conImagen(d) ? [{ pieza: (getProducto(pz)?.nombre ?? pz) + (d.modo === "imagen" ? "" : ", letra a mano"), url: d.imagenUrl }] : []));
  }
  return conImagen(p) ? [{ pieza: p.modo === "imagen" ? "" : "letra a mano", url: p.imagenUrl }] : [];
}

/** ¿Lleva una imagen para grabar? (su imagen, o el nombre escrito a mano) */
function conImagen(d: DisenoPieza) {
  return d.modo === "imagen" || !!fuentePorId(d.fuente)?.propia;
}
