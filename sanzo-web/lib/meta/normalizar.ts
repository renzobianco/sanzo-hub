import { createHash } from "node:crypto";

// Normalización y hasheo SHA-256 de los datos de la persona, como pide Meta para la API de Conversiones
// (developers.facebook.com/docs/marketing-api/conversions-api/parameters/customer-information-parameters).
// Si un dato no se puede normalizar bien, se devuelve undefined y no se manda (mejor nada que un dato roto).

export const sha256 = (s: string) => createHash("sha256").update(s, "utf8").digest("hex");

/** Minúscula, sin tildes ni diéresis (ñ → n). */
function sinTildes(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function normalizarEmail(email: string) {
  const e = email.trim().toLowerCase().replace(/\s+/g, "");
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e) ? e : undefined;
}

/**
 * Celular argentino → 549 + área + número (13 dígitos), sin el 0 ni el 15.
 * "11 5555-4444" → 5491155554444 · "0351 15 555-4444" → 5493515554444 · "+54 9 11 5555 4444" → 5491155554444.
 */
export function normalizarTelefonoAR(tel: string) {
  let d = tel.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("54") && d.length >= 12) {
    d = d.slice(2);
    if (d.startsWith("9")) d = d.slice(1);
  }
  d = d.replace(/^0+/, "");
  // Con el 15 después del código de área: área + 15 + número = 12 dígitos.
  // Buenos Aires es la única área de 2 dígitos (11); el resto tiene 3 o 4.
  if (d.length === 12) {
    const largos = d.startsWith("11") ? [2] : [3, 4];
    const l = largos.find((n) => d.slice(n, n + 2) === "15");
    if (l) d = d.slice(0, l) + d.slice(l + 2);
  }
  return d.length === 10 ? `549${d}` : undefined;
}

/** Nombre y apellido de un solo campo: primera palabra y última palabra. Minúscula, sin tildes ni signos. */
export function separarNombre(completo: string) {
  const partes = sinTildes(completo)
    .replace(/[^a-z\s'-]/g, " ")
    .replace(/['-]/g, "")
    .split(/\s+/)
    .filter(Boolean);
  return { fn: partes[0], ln: partes.length > 1 ? partes[partes.length - 1] : undefined };
}

/** Localidad / provincia: minúscula, sin tildes, sin espacios ni signos ("Ciudad Autónoma de Buenos Aires" → ciudadautonomadebuenosaires). */
export function normalizarLugar(s: string) {
  const l = sinTildes(s).replace(/[^a-z]/g, "");
  return l || undefined;
}

/** Código postal: los 4 dígitos (el CPA "C1414ABC" queda 1414). */
export function normalizarCP(cp: string) {
  const m = cp.match(/\d{4}/);
  return m ? m[0] : undefined;
}

/** Hashea si hay valor. */
export const hash = (v: string | undefined) => (v ? sha256(v) : undefined);
