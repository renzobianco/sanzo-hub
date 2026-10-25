// Zonas donde se puede apoyar el parche en cada pieza (public/productos/personalizar/zonas.json):
// una grilla de celdas sobre la foto; 1 = tela libre (sin ribete, logo ni herrajes, con un margen al borde).

export interface Zona {
  celda: number;
  cols: number;
  filas: number;
  ok: Uint8Array;
}

type Punto = { x: number; y: number };

let cargando: Promise<Record<string, Zona>> | null = null;

/** Se baja una sola vez, la primera vez que se abre el personalizador. */
export function cargarZonas(): Promise<Record<string, Zona>> {
  cargando ??= fetch("/productos/personalizar/zonas.json")
    .then((r) => r.json())
    .then((j: { celda: number } & Record<string, { cols: number; filas: number; bits: string }>) => {
      const out: Record<string, Zona> = {};
      for (const [id, z] of Object.entries(j)) {
        if (typeof z !== "object") continue;
        const bin = atob(z.bits);
        const ok = new Uint8Array(z.cols * z.filas);
        for (let i = 0; i < ok.length; i++) ok[i] = (bin.charCodeAt(i >> 3) >> (i & 7)) & 1;
        out[id] = { celda: j.celda, cols: z.cols, filas: z.filas, ok };
      }
      return out;
    })
    .catch(() => {
      cargando = null;
      return {};
    });
  return cargando;
}

function libre(z: Zona, x: number, y: number) {
  const cx = Math.floor(x / z.celda);
  const cy = Math.floor(y / z.celda);
  return cx >= 0 && cy >= 0 && cx < z.cols && cy < z.filas && z.ok[cy * z.cols + cx] === 1;
}

/**
 * ¿Entra un parche de w × h centrado en (x, y), girado `giro` grados? Revisa una grilla de puntos del parche.
 * La zona ya viene achicada un margen, así que el borde del parche puede llegar justo hasta el de la tela.
 */
export function cabe(z: Zona, { x, y }: Punto, w: number, h: number, giro = 0, redondo = false) {
  const margen = z.celda * 1.5;
  const mw = Math.max(0, w / 2 - margen);
  const mh = Math.max(0, h / 2 - margen);
  const nx = Math.max(2, Math.ceil((mw * 2) / z.celda));
  const ny = Math.max(2, Math.ceil((mh * 2) / z.celda));
  const r = (giro * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  for (let i = 0; i <= nx; i++) {
    for (let j = 0; j <= ny; j++) {
      const dx = -mw + (mw * 2 * i) / nx;
      const dy = -mh + (mh * 2 * j) / ny;
      // Forma redondeada: las esquinas de la caja no son parche, no se revisan.
      if (redondo && mw > 0 && mh > 0 && (dx * dx) / (mw * mw) + (dy * dy) / (mh * mh) > 1.02) continue;
      if (!libre(z, x + dx * c - dy * s, y + dx * s + dy * c)) return false;
    }
  }
  return true;
}

/** El lugar más cercano a `pref` donde entra el parche, o null si no entra en ningún lado. */
export function ubicar(z: Zona, pref: Punto, w: number, h: number, giro = 0, redondo = false): Punto | null {
  if (cabe(z, pref, w, h, giro, redondo)) return pref;
  const candidatos: [number, Punto][] = [];
  for (let cy = 0; cy < z.filas; cy += 2) {
    for (let cx = 0; cx < z.cols; cx += 2) {
      if (!z.ok[cy * z.cols + cx]) continue;
      const p = { x: (cx + 0.5) * z.celda, y: (cy + 0.5) * z.celda };
      candidatos.push([(p.x - pref.x) ** 2 + (p.y - pref.y) ** 2, p]);
    }
  }
  candidatos.sort((a, b) => a[0] - b[0]);
  for (const [, p] of candidatos) if (cabe(z, p, w, h, giro, redondo)) return p;
  return null;
}

/**
 * Arrastrar: va hacia `destino` sin salirse de la zona. Si no entra ahí, se desliza por el borde
 * (prueba solo en x, solo en y) y si no, avanza lo más que puede en línea recta.
 */
export function mover(z: Zona, desde: Punto, destino: Punto, w: number, h: number, giro = 0, redondo = false): Punto {
  if (cabe(z, destino, w, h, giro, redondo)) return destino;
  const soloX = { x: destino.x, y: desde.y };
  const soloY = { x: desde.x, y: destino.y };
  if (cabe(z, soloX, w, h, giro, redondo)) return soloX;
  if (cabe(z, soloY, w, h, giro, redondo)) return soloY;
  let a = 0;
  let b = 1;
  for (let k = 0; k < 8; k++) {
    const m = (a + b) / 2;
    if (cabe(z, { x: desde.x + (destino.x - desde.x) * m, y: desde.y + (destino.y - desde.y) * m }, w, h, giro, redondo)) a = m;
    else b = m;
  }
  return { x: desde.x + (destino.x - desde.x) * a, y: desde.y + (destino.y - desde.y) * a };
}

/** La zona como imagen (para mostrarla suave mientras arrastran). */
export function imagenZona(z: Zona): string {
  const canvas = document.createElement("canvas");
  canvas.width = z.cols;
  canvas.height = z.filas;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  const img = ctx.createImageData(z.cols, z.filas);
  for (let i = 0; i < z.ok.length; i++) {
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = 255;
    img.data[i * 4 + 3] = z.ok[i] ? 255 : 0;
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL("image/png");
}

/**
 * Dónde y a qué escala va el parche (ancho × alto en cm) en una pieza. Si no entra (cm máximos de la pieza
 * o la zona), se achica hasta que entre. pref: dónde lo dejaron (o el lugar de arranque de la pieza).
 */
export function colocar(
  pieza: { pxCm: number; inicial: Punto; giro?: number; cm: { ancho: number; alto: number } },
  ancho: number,
  alto: number,
  pref: Punto | undefined,
  z: Zona | undefined,
  redondo = false,
): Punto & { k: number; w: number; h: number } {
  let k = Math.min(1, pieza.cm.ancho / ancho, pieza.cm.alto / alto);
  const inicio = pref ?? pieza.inicial;
  for (let intento = 0; intento < 12; intento++) {
    const w = ancho * k * pieza.pxCm;
    const h = alto * k * pieza.pxCm;
    if (!z) return { ...inicio, k, w, h };
    const p = ubicar(z, inicio, w, h, pieza.giro, redondo);
    if (p) return { ...p, k, w, h };
    k *= 0.88;
  }
  return { ...pieza.inicial, k, w: ancho * k * pieza.pxCm, h: alto * k * pieza.pxCm };
}

/** La zona, pero solo dentro de lo que se ve de la foto (x, y, ancho, alto). */
export function recortarZona(z: Zona, [vx, vy, vw, vh]: number[]): Zona {
  const ok = new Uint8Array(z.ok.length);
  for (let cy = 0; cy < z.filas; cy++) {
    for (let cx = 0; cx < z.cols; cx++) {
      const x = (cx + 0.5) * z.celda;
      const y = (cy + 0.5) * z.celda;
      const i = cy * z.cols + cx;
      ok[i] = z.ok[i] && x > vx + z.celda && x < vx + vw - z.celda && y > vy + z.celda && y < vy + vh - z.celda ? 1 : 0;
    }
  }
  return { ...z, ok };
}

/** Formas que no llenan su caja (círculo, corazón, silueta…): para ver si entran se usa la elipse de adentro. */
export const esRedonda = (forma: string) => !["rectangulo", "redondeado", "capsula", "banderin", "otra"].includes(forma);
