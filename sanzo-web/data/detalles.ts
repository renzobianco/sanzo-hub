import datos from "./detalles.json";

/**
 * Detalles señalados sobre la primera foto de la ficha (estilo ficha técnica), por id de producto.
 * Se editan a mano desde la web en tu compu: `npm run dev` → abrir la ficha con `?editar` en la dirección
 * (ej. localhost:3010/?editar). Se guardan en `detalles.json`.
 *
 * Coordenadas en % de la foto tal como se ve en la ficha (cuadrada).
 * x, y: el puntito sobre la pieza. tx, ty: donde empieza la etiqueta (sale hacia el lado contrario al puntito).
 * texto: título corto. sub: una línea que explica para qué sirve (opcional).
 * SOLO cosas que se ven y son reales: nada de material ni durabilidad hasta que estén confirmados.
 */
export interface Detalle {
  x: number;
  y: number;
  tx: number;
  ty: number;
  texto: string;
  sub?: string;
}

export const detalles = datos as Record<string, Detalle[]>;

export function detallesDe(id: string): Detalle[] {
  return detalles[id] ?? [];
}
