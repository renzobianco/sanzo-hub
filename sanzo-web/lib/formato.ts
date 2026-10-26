import type { EstadoEnvio } from "./carrito";

const ars = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export function formatearPrecio(monto: number) {
  return ars.format(monto);
}


export function textoEnvio(envio: EstadoEnvio) {
  switch (envio.tipo) {
    case "gratis":
      return "Gratis";
    case "sin-zona":
      return "Elegí tu provincia";
    case "cotizar":
      return "A cotizar";
    case "precio":
      return envio.monto === 0 ? "Gratis" : formatearPrecio(envio.monto);
  }
}

/** "Patagonia · a sucursal": zona y tipo de entrega del envío, si ya se sabe la zona. */
export function detalleEnvio(envio: EstadoEnvio) {
  if (envio.tipo !== "precio" && envio.tipo !== "cotizar") return "";
  return `${envio.zona.nombre} · ${envio.entrega === "sucursal" ? "a sucursal" : "a domicilio"}`;
}
