import { PROVINCIAS } from "@/data/envios";

export type TipoEntrega = "domicilio" | "sucursal";

export interface DatosCheckout {
  nombre: string;
  dni: string;
  email: string;
  celular: string;
  entrega: TipoEntrega;
  calle: string;
  altura: string;
  pisoDepto: string;
  referencia: string;
  provincia: string;
  /** "si" | "no" | "" — solo si la provincia es Buenos Aires. */
  gba: string;
  localidad: string;
  codigoPostal: string;
  notas: string;
}

export const datosVacios: DatosCheckout = {
  nombre: "",
  dni: "",
  email: "",
  celular: "",
  entrega: "domicilio",
  calle: "",
  altura: "",
  pisoDepto: "",
  referencia: "",
  provincia: "",
  gba: "",
  localidad: "",
  codigoPostal: "",
  notas: "",
};

export type ErroresCheckout = Partial<Record<keyof DatosCheckout, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// CP viejo (4 dígitos) o CPA (letra + 4 dígitos + 3 letras), ej. C1425ABC.
const CP = /^(\d{4}|[A-Za-z]\d{4}[A-Za-z]{3})$/;

export function validarCheckout(d: DatosCheckout): ErroresCheckout {
  const e: ErroresCheckout = {};
  const nombre = d.nombre.trim();
  if (!nombre) e.nombre = "Contanos tu nombre y apellido.";
  else if (nombre.split(/\s+/).length < 2) e.nombre = "Poné nombre y apellido.";

  const dni = d.dni.replace(/\./g, "").trim();
  if (!dni) e.dni = "Ingresá tu DNI.";
  else if (!/^\d{7,8}$/.test(dni)) e.dni = "El DNI tiene que tener 7 u 8 números, sin puntos.";

  if (!d.email.trim()) e.email = "Ingresá tu email.";
  else if (!EMAIL.test(d.email.trim())) e.email = "Revisá el email, parece que falta algo.";

  const cel = d.celular.replace(/\D/g, "");
  if (!cel) e.celular = "Ingresá tu celular.";
  else if (cel.length < 8 || cel.length > 13) e.celular = "Revisá el celular (con código de área, ej. 11 2345 6789).";

  if (d.entrega === "domicilio") {
    if (!d.calle.trim()) e.calle = "Ingresá la calle.";
    if (!d.altura.trim()) e.altura = "Ingresá la altura.";
    else if (!/^\d{1,6}$/.test(d.altura.trim())) e.altura = "La altura tiene que ser un número.";
  }

  if (!d.provincia) e.provincia = "Elegí tu provincia.";
  else if (!(PROVINCIAS as readonly string[]).includes(d.provincia)) e.provincia = "Elegí una provincia de la lista.";
  if (d.provincia === "Buenos Aires" && d.gba !== "si" && d.gba !== "no") e.gba = "Contanos si estás en el GBA.";

  if (!d.localidad.trim()) e.localidad = "Ingresá tu localidad.";

  const cp = d.codigoPostal.trim();
  if (!cp) e.codigoPostal = "Ingresá el código postal.";
  else if (!CP.test(cp)) e.codigoPostal = "Usá 4 números (ej. 1425) o el formato CPA (ej. C1425ABC).";

  return e;
}
