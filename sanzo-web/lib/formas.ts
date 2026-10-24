// Dibujo de cada forma de parche (`personalizacion.formas` en data/products.ts).
// Todo en píxeles y centrado en (0, 0), así la vista lo mueve y gira sin hacer cuentas.

/** Zona útil adentro de la forma (parte del ancho y alto, y corrimiento vertical): donde va el grabado. */
type Zona = { ancho: number; alto: number; dy?: number };

interface DefForma {
  /** Ancho / alto fijo. Sin esto la forma es libre: se estira con ancho y alto por separado. */
  proporcion?: number;
  trazo: (w: number, h: number) => string;
  texto: Zona;
  imagen: Zona;
}

const n = (v: number) => Math.round(v * 100) / 100;

/** Rectángulo con las puntas redondeadas (r = parte del lado más corto). */
function redondeado(w: number, h: number, r: number) {
  const x = -w / 2;
  const y = -h / 2;
  const k = n(Math.min(w, h) * r);
  return `M${n(x + k)},${n(y)}H${n(x + w - k)}A${k},${k} 0 0 1 ${n(x + w)},${n(y + k)}V${n(y + h - k)}A${k},${k} 0 0 1 ${n(x + w - k)},${n(y + h)}H${n(x + k)}A${k},${k} 0 0 1 ${n(x)},${n(y + h - k)}V${n(y + k)}A${k},${k} 0 0 1 ${n(x + k)},${n(y)}Z`;
}

function elipse(w: number, h: number) {
  const rx = n(w / 2);
  const ry = n(h / 2);
  return `M${-rx},0A${rx},${ry} 0 1 0 ${rx},0A${rx},${ry} 0 1 0 ${-rx},0Z`;
}

/** Escala un trazo dibujado en una caja de `ancho` × `alto` (centrada en 0,0) a w × h. */
function escalar(d: string, ancho: number, alto: number, w: number, h: number) {
  const sx = w / ancho;
  const sy = h / alto;
  let i = 0;
  return d.replace(/-?\d+(\.\d+)?/g, (num) => String(n(Number(num) * (i++ % 2 === 0 ? sx : sy))));
}

const FORMAS: Record<string, DefForma> = {
  rectangulo: { trazo: (w, h) => redondeado(w, h, 0.07), texto: { ancho: 0.84, alto: 0.66 }, imagen: { ancho: 0.84, alto: 0.78 } },
  redondeado: { trazo: (w, h) => redondeado(w, h, 0.24), texto: { ancho: 0.8, alto: 0.64 }, imagen: { ancho: 0.8, alto: 0.76 } },
  capsula: { trazo: (w, h) => redondeado(w, h, 0.5), texto: { ancho: 0.74, alto: 0.6 }, imagen: { ancho: 0.72, alto: 0.72 } },
  ovalo: { trazo: elipse, texto: { ancho: 0.68, alto: 0.56 }, imagen: { ancho: 0.66, alto: 0.66 } },
  circulo: { proporcion: 1, trazo: elipse, texto: { ancho: 0.7, alto: 0.44 }, imagen: { ancho: 0.68, alto: 0.68 } },
  hueso: {
    proporcion: 2.3,
    // Barra del medio + cuatro bolitas en las puntas (se pintan como una sola forma).
    trazo: (w, h) => {
      const r = h * 0.29;
      const cx = w / 2 - r;
      const cy = h / 2 - r;
      const bolita = (x: number, y: number) => `M${n(x - r)},${n(y)}A${n(r)},${n(r)} 0 1 1 ${n(x + r)},${n(y)}A${n(r)},${n(r)} 0 1 1 ${n(x - r)},${n(y)}Z`;
      const barra = `M${n(-cx)},${n(-h * 0.24)}H${n(cx)}V${n(h * 0.24)}H${n(-cx)}Z`;
      return [barra, bolita(-cx, -cy), bolita(cx, -cy), bolita(-cx, cy), bolita(cx, cy)].join("");
    },
    texto: { ancho: 0.6, alto: 0.42 },
    imagen: { ancho: 0.5, alto: 0.46 },
  },
  corazon: {
    proporcion: 1.12,
    trazo: (w, h) =>
      escalar("M0,-22C0,-40 -18,-48 -32,-42C-50,-34 -52,-10 -38,8C-26,24 -8,36 0,46C8,36 26,24 38,8C52,-10 50,-34 32,-42C18,-48 0,-40 0,-22Z", 102, 91, w, h),
    texto: { ancho: 0.6, alto: 0.34, dy: -0.06 },
    imagen: { ancho: 0.5, alto: 0.5, dy: -0.06 },
  },
  escudo: {
    proporcion: 0.86,
    trazo: (w, h) => escalar("M-43,-42Q0,-56 43,-42L43,0C43,28 22,42 0,52C-22,42 -43,28 -43,0Z", 86, 104, w, h),
    texto: { ancho: 0.7, alto: 0.38, dy: -0.06 },
    imagen: { ancho: 0.66, alto: 0.56, dy: -0.05 },
  },
  banderin: {
    // Cinta con las dos puntas en V hacia adentro.
    trazo: (w, h) => {
      const v = Math.min(h * 0.32, w * 0.15);
      return `M${n(-w / 2)},${n(-h / 2)}H${n(w / 2)}L${n(w / 2 - v)},0L${n(w / 2)},${n(h / 2)}H${n(-w / 2)}L${n(-w / 2 + v)},0Z`;
    },
    texto: { ancho: 0.66, alto: 0.6 },
    imagen: { ancho: 0.62, alto: 0.74 },
  },
};
// "Otra": se ve como redondeado mientras la describen. "Su silueta": se dibuja con su imagen (Vista.tsx).
FORMAS.otra = FORMAS.redondeado;
FORMAS.silueta = { trazo: (w, h) => redondeado(w, h, 0.24), texto: FORMAS.redondeado.texto, imagen: { ancho: 1, alto: 1 } };

export function defForma(id: string): DefForma {
  return FORMAS[id] ?? FORMAS.rectangulo;
}

/** null = forma libre (ancho y alto por separado). */
export function proporcionForma(id: string): number | null {
  return defForma(id).proporcion ?? null;
}

/** Ancho y alto finales en cm: las formas fijas toman su proporción a partir del ancho. */
export function medidaFinal(forma: string, ancho: number, alto: number, proporcionSilueta?: number) {
  const p = forma === "silueta" ? proporcionSilueta : proporcionForma(forma);
  return p ? { ancho, alto: Math.round((ancho / p) * 10) / 10 } : { ancho, alto };
}
