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

/**
 * Lo que se cotizó y con qué paquete. Cuando midan el peso real del paquete o abran la cuenta
 * comercial de MiCorreo (ahí suelen bajar los precios), se recotiza y se cambian las tarifas de abajo.
 */
export const cotizacion = {
  /** Peso del paquete con el que se cotizó (kg). 0,6 es estimado: falta pesar un pedido armado. */
  pesoKg: 0.6,
  /** Desde dónde despachamos. */
  cpOrigen: "1414",
  fuente: "Tarifas públicas de MiCorreo (PAQ.AR Clásico), octubre 2026",
  /** Lo que tarda PAQ.AR Clásico (se muestra en el cotizador). */
  plazo: "2 a 5 días hábiles",
};

export interface ZonaEnvio {
  id: 1 | 2 | 3 | 4;
  nombre: string;
  detalle: string;
  /** Precio en pesos por tipo de entrega; null → "A cotizar". */
  precio: Record<TipoEntrega, number | null>;
}

export const zonas: ZonaEnvio[] = [
  {
    id: 1,
    nombre: "CABA",
    detalle: "Ciudad de Buenos Aires.",
    precio: { domicilio: 8046, sucursal: 5428 },
  },
  {
    id: 2,
    nombre: "Buenos Aires",
    detalle: "Gran Buenos Aires y el resto de la provincia de Buenos Aires.",
    precio: { domicilio: 9648, sucursal: 6739 },
  },
  {
    id: 3,
    nombre: "Centro y Norte",
    detalle: "Todas las provincias que no son Buenos Aires ni Patagonia.",
    precio: { domicilio: 9648, sucursal: 6739 },
  },
  {
    id: 4,
    nombre: "Patagonia",
    detalle: "Neuquén, Río Negro, Chubut, Santa Cruz y Tierra del Fuego.",
    precio: { domicilio: 10586, sucursal: 7745 },
  },
];

export const envioInfo = {
  correo: "Correo Argentino",
  texto: "Enviamos a todo el país por Correo Argentino. Elegí entrega a domicilio o retiro en sucursal.",
  /** Envío gratis para pedidos desde este monto (en pesos). null → solo el kit viaja gratis. */
  gratisDesde: null as number | null,
};

const PATAGONIA: string[] = ["Neuquén", "Río Negro", "Chubut", "Santa Cruz", "Tierra del Fuego"];

export function zonaPorProvincia(provincia: string): ZonaEnvio | null {
  if (provincia === "Ciudad Autónoma de Buenos Aires") return zonas[0];
  if (provincia === "Buenos Aires") return zonas[1];
  if (PATAGONIA.includes(provincia)) return zonas[3];
  if ((PROVINCIAS as readonly string[]).includes(provincia)) return zonas[2];
  return null;
}

/** Letra de provincia del CPA (C1425ABC) → zona. */
const LETRA_ZONA: Record<string, number> = { C: 0, B: 1, Q: 3, R: 3, U: 3, Z: 3, V: 3 };

/**
 * Zona según el código postal. Con el CPA (C1425ABC) es exacta por la letra. Con los 4 números es
 * aproximada: 1000–1499 CABA; 1500–1999, 6000–8199 provincia de Buenos Aires; 8300–8599 y
 * 9000–9999 Patagonia; el resto Centro y Norte. Buenos Aires y Centro hoy cuestan lo mismo.
 */
export function zonaPorCP(cp: string): ZonaEnvio | null {
  const t = cp.trim().toUpperCase();
  const cpa = /^([A-HJ-NP-Z])\d{4}[A-Z]{3}$/.exec(t);
  if (cpa) return zonas[LETRA_ZONA[cpa[1]] ?? 2];
  if (!/^\d{4}$/.test(t)) return null;
  const n = Number(t);
  if (n < 1000) return null;
  if (n < 1500) return zonas[0];
  if (n < 2000 || (n >= 6000 && n < 8200)) return zonas[1];
  if ((n >= 8300 && n < 8600) || n >= 9000) return zonas[3];
  return zonas[2];
}
