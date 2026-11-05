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
    case "retiro":
      return "Gratis";
    case "sin-zona":
      return "Elegí tu provincia";
    case "cotizar":
      return "A cotizar";
    case "precio":
      return envio.monto === 0 ? "Gratis" : formatearPrecio(envio.monto);
  }
}

/** "Patagonia · a sucursal" o "Retiro en Moldes 1375, CABA": cómo llega, si ya se sabe. */
export function detalleEnvio(envio: EstadoEnvio) {
  if (envio.tipo === "retiro") return `Retiro en ${envio.punto.direccion}`;
  if (envio.tipo !== "precio" && envio.tipo !== "cotizar") return "";
  return `${envio.zona.nombre} · ${envio.entrega === "sucursal" ? "a sucursal" : "a domicilio"}`;
}
