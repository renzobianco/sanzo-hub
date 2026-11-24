// =============================================================================
// Zonas de envío. Precio en pesos o null → "A cotizar".
// =============================================================================

export const PROVINCIAS = [
  "Ciudad Autónoma de Buenos Aires",
  "Buenos Aires",
  "Catamarca",
  "Chaco",
  "Chubut",
  "Córdoba",
  "Corrientes",
  "Entre Ríos",
  "Formosa",
  "Jujuy",
  "La Pampa",
  "La Rioja",
  "Mendoza",
  "Misiones",
  "Neuquén",
  "Río Negro",
  "Salta",
  "San Juan",
  "San Luis",
  "Santa Cruz",
  "Santa Fe",
  "Santiago del Estero",
  "Tierra del Fuego",
  "Tucumán",
] as const;

export type Provincia = (typeof PROVINCIAS)[number];

export type TipoEntrega = "domicilio" | "sucursal";

/** Cómo lo recibe: por Correo (domicilio o sucursal) o lo retira gratis en persona. */
export type Entrega = TipoEntrega | "retiro";

export interface PuntoRetiro {
  id: string;
  direccion: string;
}

/** Retiro gratis en persona, en lo de Renzo o lo de Santi (Renzo, 2026-11-05). El día se coordina por WhatsApp. */
export const retiro = {
  activo: true,
  texto: "Retiro gratis en CABA",
  puntos: [
    { id: "scalabrini", direccion: "Av. Scalabrini Ortiz 2083, CABA" },
    { id: "moldes", direccion: "Moldes 1375, CABA" },
  ] as PuntoRetiro[],
  horarios: "Miércoles, jueves y viernes de 11 a 16 h. Sábados de 12 a 15 h.",
  aviso: "Después de comprar coordinamos el día y la hora por WhatsApp.",
  /** Mensaje que se arma en /gracias ({numero} y {direccion}). */
  mensajeWhatsapp: "Hola sanzo! Hice el pedido {numero} y lo quiero retirar en {direccion}. ¿Qué día y horario puedo pasar?",
};

export function puntoRetiro(id?: string): PuntoRetiro {
  return retiro.puntos.find((p) => p.id === id) ?? retiro.puntos[0];
}

/**
 * De dónde salen las tarifas. Son valores de referencia cargados a mano: no hay cotización en vivo
 * (la integración con la API de Correo Argentino del Hub genera envíos, pero no cotiza).
 * Cuando cambien las tarifas de Fácil Uno, se actualizan los números de `zonas`.
 */
export const cotizacion = {
  /**
   * Franja de peso que se cobra hoy (kg). Todos los pedidos van a la tarifa de hasta 1 kg hasta que
   * se carguen los pesos reales de cada producto (Renzo, 2026-11-24). Ahí se usan los escalones de `porPeso`.
   */
  pesoKg: 1,
  /** Desde dónde despachamos. */
  cpOrigen: "1414",
  fuente: "Correo Argentino vía Fácil Uno, despachando desde CABA, vigentes desde noviembre 2026",
  /** Lo que tarda el Correo (se muestra en el cotizador). */
  plazo: "2 a 5 días hábiles",
};

export interface ZonaEnvio {
  /** Las tres zonas de Fácil Uno. */
  id: 1 | 2 | 3;
  nombre: string;
  detalle: string;
  /** Precio en pesos por tipo de entrega, paquete de hasta 1 kg (`cotizacion.pesoKg`); null → "A cotizar". */
  precio: Record<TipoEntrega, number | null>;
  /**
   * Escalones para pedidos más pesados (hasta 3 kg y hasta 5 kg). Todavía NO se usan: falta el peso de
   * cada producto. Fácil Uno pasó solo la tarifa a domicilio; la de sucursal queda en null hasta tenerla.
   */
  porPeso: { hastaKg: number; domicilio: number; sucursal: number | null }[];
}

export const zonas: ZonaEnvio[] = [
  {
    id: 1,
    nombre: "AMBA",
    detalle: "Ciudad de Buenos Aires y Gran Buenos Aires.",
    precio: { domicilio: 7830, sucursal: 5510 },
    porPeso: [
      { hastaKg: 3, domicilio: 12179, sucursal: null },
      { hastaKg: 5, domicilio: 16096, sucursal: null },
    ],
  },
  {
    id: 2,
    nombre: "Interior",
    detalle: "El resto del país, incluido el interior de la provincia de Buenos Aires (sin Patagonia).",
    precio: { domicilio: 10226, sucursal: 7526 },
    porPeso: [
      { hastaKg: 3, domicilio: 15842, sucursal: null },
      { hastaKg: 5, domicilio: 23942, sucursal: null },
    ],
  },
  {
    id: 3,
    nombre: "Patagonia",
    detalle: "Neuquén, Río Negro, Chubut, Santa Cruz y Tierra del Fuego.",
    precio: { domicilio: 10301, sucursal: 7862 },
    porPeso: [
      { hastaKg: 3, domicilio: 16901, sucursal: null },
      { hastaKg: 5, domicilio: 26411, sucursal: null },
    ],
  },
];

const [AMBA, INTERIOR, PATAGONIA_ZONA] = zonas;

export const envioInfo = {
  correo: "Correo Argentino",
  texto: "Enviamos a todo el país por Correo Argentino, a domicilio o a sucursal. En CABA también lo podés retirar gratis.",
  /** Envío gratis para pedidos desde este monto (en pesos). null → solo el kit viaja gratis. */
  gratisDesde: null as number | null,
  /** Si eligen la provincia de Buenos Aires sin código postal (se cobra Interior hasta saber si es GBA). */
  avisoBuenosAires: "¿Estás en el Gran Buenos Aires? Poné tu código postal y te sale más barato.",
};

const PATAGONIA: string[] = ["Neuquén", "Río Negro", "Chubut", "Santa Cruz", "Tierra del Fuego"];

/**
 * Gran Buenos Aires por código postal (los 4 números, o el CPA B1636ABC): 1600–1899 (Vicente López,
 * San Isidro, Tigre, Pilar, Moreno, Merlo, La Matanza, Lomas, Quilmes, Berazategui, Varela, Ezeiza…).
 * Es aproximado: La Plata (1900) y el resto de la provincia van como Interior.
 */
export function esGBA(cp: string) {
  const m = /^B?(\d{4})(?:[A-Z]{3})?$/.exec(cp.trim().toUpperCase());
  const n = m ? Number(m[1]) : NaN;
  return n >= 1600 && n < 1900;
}

/**
 * Zona según la provincia. Provincia de Buenos Aires: AMBA si el código postal es del GBA; si no hay
 * código postal (o es del interior), Interior.
 */
export function zonaPorProvincia(provincia: string, cp = ""): ZonaEnvio | null {
  if (provincia === "Ciudad Autónoma de Buenos Aires") return AMBA;
  if (provincia === "Buenos Aires") return esGBA(cp) ? AMBA : INTERIOR;
  if (PATAGONIA.includes(provincia)) return PATAGONIA_ZONA;
  if ((PROVINCIAS as readonly string[]).includes(provincia)) return INTERIOR;
  return null;
}

/** Letra de provincia del CPA (C1425ABC) → zona. B (provincia de Buenos Aires) depende de los números. */
const LETRA_PATAGONIA = ["Q", "R", "U", "Z", "V"];

/**
 * Zona según el código postal. Con el CPA (C1425ABC) es exacta por la letra (y los números para
 * Buenos Aires). Con los 4 números es aproximada: 1000–1499 CABA y 1600–1899 GBA → AMBA;
 * 8300–8599 y 9000–9999 → Patagonia; el resto → Interior.
 */
export function zonaPorCP(cp: string): ZonaEnvio | null {
  const t = cp.trim().toUpperCase();
  const cpa = /^([A-HJ-NP-Z])\d{4}[A-Z]{3}$/.exec(t);
  if (cpa) {
    const letra = cpa[1];
    if (letra === "C") return AMBA;
    if (letra === "B") return esGBA(t) ? AMBA : INTERIOR;
    return LETRA_PATAGONIA.includes(letra) ? PATAGONIA_ZONA : INTERIOR;
  }
  if (!/^\d{4}$/.test(t)) return null;
  const n = Number(t);
  if (n < 1000) return null;
  if (n < 1500 || esGBA(t)) return AMBA;
  if ((n >= 8300 && n < 8600) || n >= 9000) return PATAGONIA_ZONA;
  return INTERIOR;
}
