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

export interface ZonaEnvio {
  id: 1 | 2 | 3;
  nombre: string;
  detalle: string;
  precio: number | null;
}

export const zonas: ZonaEnvio[] = [
  {
    id: 1,
    nombre: "CABA y GBA",
    detalle: "Ciudad de Buenos Aires y Gran Buenos Aires.",
    precio: null,
  },
  {
    id: 2,
    nombre: "Interior cercano",
    detalle: "Resto de la provincia de Buenos Aires, Córdoba, Santa Fe, Entre Ríos y La Pampa.",
    precio: null,
  },
  {
    id: 3,
    nombre: "Interior lejano y Patagonia",
    detalle: "Todas las demás provincias.",
    precio: null,
  },
];

export const envioInfo = {
  correo: "Correo Argentino",
  texto: "Enviamos a todo el país por Correo Argentino. Elegí entrega a domicilio o retiro en sucursal.",
};

const ZONA_2: string[] = ["Buenos Aires", "Córdoba", "Santa Fe", "Entre Ríos", "La Pampa"];

/**
 * Zona según provincia. Para "Buenos Aires" hace falta saber si es GBA:
 * si `enGBA` es null todavía no se sabe y devuelve null.
 */
export function zonaPorProvincia(provincia: string, enGBA: boolean | null): ZonaEnvio | null {
  if (!provincia) return null;
  if (provincia === "Ciudad Autónoma de Buenos Aires") return zonas[0];
  if (provincia === "Buenos Aires") {
    if (enGBA === null) return null;
    return enGBA ? zonas[0] : zonas[1];
  }
  if (ZONA_2.includes(provincia)) return zonas[1];
  if ((PROVINCIAS as readonly string[]).includes(provincia)) return zonas[2];
  return null;
}
