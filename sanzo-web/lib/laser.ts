/** Resultado de pasar una imagen a "grabado láser", listo para la vista previa. */
export interface Grabado {
  /** Lo quemado: blanco con transparencia (PNG data URL). La vista lo pinta del color del grabado de cada cuerina. */
  grabado: string;
  /** Ancho / alto del grabado (ya recortado a lo que tiene dibujo). */
  proporcion: number;
  /** Contorno para recortar el parche siguiendo el dibujo ("Su silueta"): blanco lleno, con un margen alrededor. */
  silueta: string;
  proporcionSilueta: number;
  /** Margen de la silueta alrededor del grabado (parte del ancho y del alto de la silueta). */
  margen: { x: number; y: number };
}

function lienzo(w: number, h: number) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Sin canvas");
  return { canvas, ctx };
}

/** Desenfoque gaussiano separable (para las líneas y el relleno del grabado). */
function desenfocar(src: Float32Array, w: number, h: number, sigma: number) {
  const r = Math.max(1, Math.ceil(sigma * 3));
  const nucleo = new Float32Array(r * 2 + 1);
  let suma = 0;
  for (let i = -r; i <= r; i++) suma += nucleo[i + r] = Math.exp(-(i * i) / (2 * sigma * sigma));
  for (let i = 0; i < nucleo.length; i++) nucleo[i] /= suma;
  const tmp = new Float32Array(w * h);
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let v = 0;
      for (let i = -r; i <= r; i++) v += src[y * w + Math.min(w - 1, Math.max(0, x + i))] * nucleo[i + r];
      tmp[y * w + x] = v;
    }
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let v = 0;
      for (let i = -r; i <= r; i++) v += tmp[Math.min(h - 1, Math.max(0, y + i)) * w + x] * nucleo[i + r];
      out[y * w + x] = v;
    }
  return out;
}

const percentil = (vals: number[], p: number) => {
  const o = [...vals].sort((a, b) => a - b);
  return o[Math.min(o.length - 1, Math.floor(o.length * p))] ?? 0;
};

/** Modelo para sacar el fondo (ISNet general, 8 bits, 1024×1024). Se baja la primera vez que alguien sube una foto. */
const MODELO_FONDO = "/modelos/isnet-q8.onnx";
const LADO_MODELO = 1024;
let sesionFondo: Promise<import("onnxruntime-web/wasm").InferenceSession> | null = null;

/**
 * Qué parte de la imagen es lo importante (el perro, la persona, el logo) y qué es fondo: 1 = sujeto, 0 = fondo,
 * del tamaño w×h. null si no se pudo (sin red, celular sin memoria…): entonces se graba la imagen entera.
 */
async function mascaraSujeto(bmp: ImageBitmap, w: number, h: number): Promise<Float32Array | null> {
  try {
    const ort = await import("onnxruntime-web/wasm");
    if (!sesionFondo) {
      // El motor (wasm) va servido por la web, en public/ort (copiado de onnxruntime-web/dist, misma versión).
      ort.env.wasm.wasmPaths = "/ort/";
      ort.env.wasm.numThreads = 1;
      sesionFondo = ort.InferenceSession.create(MODELO_FONDO, { executionProviders: ["wasm"] });
      sesionFondo.catch(() => (sesionFondo = null));
    }
    const sesion = await sesionFondo;
    const L = LADO_MODELO;
    const { ctx } = lienzo(L, L);
    ctx.drawImage(bmp, 0, 0, L, L);
    const px = ctx.getImageData(0, 0, L, L).data;
    const entrada = new Float32Array(3 * L * L);
    for (let i = 0; i < L * L; i++) {
      entrada[i] = px[i * 4] / 255 - 0.5;
      entrada[L * L + i] = px[i * 4 + 1] / 255 - 0.5;
      entrada[2 * L * L + i] = px[i * 4 + 2] / 255 - 0.5;
    }
    const res = await sesion.run({ [sesion.inputNames[0]]: new ort.Tensor("float32", entrada, [1, 3, L, L]) });
    const salida = res[sesion.outputNames[0]].data as Float32Array;
    let mn = Infinity, mx = -Infinity;
    for (const v of salida) {
      if (v < mn) mn = v;
      if (v > mx) mx = v;
    }
    const rango = Math.max(1e-6, mx - mn);
    // A w×h con el canvas (escala bien y rápido).
    const m = lienzo(L, L);
    const img = m.ctx.createImageData(L, L);
    for (let i = 0; i < L * L; i++) {
      const v = Math.round(((salida[i] - mn) / rango) * 255);
      img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
      img.data[i * 4 + 3] = 255;
    }
    m.ctx.putImageData(img, 0, 0);
    const chico = lienzo(w, h);
    chico.ctx.drawImage(m.canvas, 0, 0, w, h);
    const dm = chico.ctx.getImageData(0, 0, w, h).data;
    const mascara = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) mascara[i] = dm[i * 4] / 255;
    return mascara;
  } catch {
    return null;
  }
}

/**
 * Convierte cualquier imagen en cómo se vería grabada con láser. Una foto (`foto`): se le saca el fondo solo y
 * queda en líneas y relleno, como un grabado de verdad (Santi, 2026-10-30: "no solo el filtro modo gris").
 * Un dibujo a mano (`foto: false`): lo oscuro se quema tal cual. Además recorta los bordes vacíos y arma
 * el contorno para la forma "Su silueta".
 */
export async function aGrabadoLaser(archivo: File, { lado = 480, foto = true }: { lado?: number; foto?: boolean } = {}): Promise<Grabado> {
  const bmp = await createImageBitmap(archivo);
  const k = Math.min(1, lado / Math.max(bmp.width, bmp.height));
  const w = Math.max(1, Math.round(bmp.width * k));
  const h = Math.max(1, Math.round(bmp.height * k));
  const { ctx } = lienzo(w, h);
  ctx.drawImage(bmp, 0, 0, w, h);
  const mascara = foto ? await mascaraSujeto(bmp, w, h) : null;
  bmp.close();

  const d = ctx.getImageData(0, 0, w, h).data;
  const lum = new Float32Array(w * h);
  // Luminancia (lo transparente cuenta como blanco: no se graba).
  for (let i = 0; i < w * h; i++) {
    const a = d[i * 4 + 3] / 255;
    const l = (0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]) / 255;
    lum[i] = l * a + (1 - a);
  }
  // Lo que es sujeto (sin máscara: toda la imagen, salvo lo transparente).
  const adentro = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) adentro[i] = (mascara ? mascara[i] > 0.5 : d[i * 4 + 3] > 128) ? 1 : 0;
  const delSujeto: number[] = [];
  for (let i = 0; i < w * h; i++) if (adentro[i]) delSujeto.push(lum[i]);
  const base = delSujeto.length > 50 ? delSujeto : Array.from(lum);
  // Niveles automáticos: estira entre el 2% más oscuro y el 2% más claro del sujeto para que se lea bien.
  const negro = percentil(base, 0.02);
  const rango = Math.max(0.05, percentil(base, 0.98) - negro);
  const gn = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) gn[i] = Math.min(1, Math.max(0, (lum[i] - negro) / rango));

  const quemado = new Float32Array(w * h);
  if (foto) {
    // Líneas (diferencia de desenfoques: los bordes oscuros) + relleno (lo más oscuro del sujeto) + el contorno.
    const fino = desenfocar(gn, w, h, 1.2);
    const grueso = desenfocar(gn, w, h, 2.4);
    const suave = desenfocar(gn, w, h, 1.5);
    const umbralRelleno = percentil(base.map((v) => Math.min(1, Math.max(0, (v - negro) / rango))), 0.22);
    const sujeto = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) sujeto[i] = adentro[i];
    const borde = mascara ? desenfocar(sujeto, w, h, 1.5) : null;
    const crudo = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) {
      const linea = grueso[i] - fino[i] > 0.04;
      const relleno = suave[i] < umbralRelleno;
      const contorno = !!borde && borde[i] > 0.2 && borde[i] < 0.8;
      crudo[i] = ((linea || relleno) && adentro[i]) || contorno ? 1 : 0;
    }
    // Sin puntitos sueltos: se suaviza y se vuelve a cortar.
    const limpio = desenfocar(crudo, w, h, 0.8);
    for (let i = 0; i < w * h; i++) quemado[i] = limpio[i] > 0.45 ? 1 : 0;
  } else {
    // Curva: los medios tonos se queman menos que lo oscuro, como el láser real.
    for (let i = 0; i < w * h; i++) quemado[i] = Math.pow(1 - gn[i], 1.4);
  }

  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let i = 0; i < w * h; i++) {
    if (quemado[i] > 0.12) {
      const x = i % w;
      const y = (i / w) | 0;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  // Sin nada oscuro (imagen en blanco): se usa entera.
  if (x1 < 0) [x0, y0, x1, y1] = [0, 0, w - 1, h - 1];
  const cw = x1 - x0 + 1;
  const ch = y1 - y0 + 1;

  // Grabado recortado: blanco con la transparencia de lo quemado, con un granito sutil.
  const g = lienzo(cw, ch);
  const img = g.ctx.createImageData(cw, ch);
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      const q = quemado[(y + y0) * w + x + x0];
      const o = (y * cw + x) * 4;
      img.data[o] = img.data[o + 1] = img.data[o + 2] = 255;
      img.data[o + 3] = Math.round(Math.min(1, Math.max(0, q + (Math.random() - 0.5) * 0.08)) * 240);
    }
  }
  g.ctx.putImageData(img, 0, 0);

  // Silueta: lo que tiene dibujo, engordado con un margen redondo (en una grilla chica, alcanza).
  const ks = Math.min(1, 140 / Math.max(cw, ch));
  const sw = Math.max(1, Math.round(cw * ks));
  const sh = Math.max(1, Math.round(ch * ks));
  const r = Math.max(3, Math.round(Math.max(sw, sh) * 0.07));
  const pw = sw + r * 2;
  const ph = sh + r * 2;
  const lleno = new Uint8Array(sw * sh);
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      lleno[y * sw + x] = quemado[(y0 + Math.floor(y / ks)) * w + x0 + Math.floor(x / ks)] > 0.12 ? 1 : 0;
    }
  }
  const s = lienzo(pw, ph);
  const sil = s.ctx.createImageData(pw, ph);
  const disco: [number, number][] = [];
  for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (dx * dx + dy * dy <= r * r) disco.push([dx, dy]);
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      if (!lleno[y * sw + x]) continue;
      for (const [dx, dy] of disco) sil.data[((y + r + dy) * pw + x + r + dx) * 4 + 3] = 255;
    }
  }
  for (let i = 0; i < pw * ph; i++) sil.data[i * 4] = sil.data[i * 4 + 1] = sil.data[i * 4 + 2] = 255;
  s.ctx.putImageData(sil, 0, 0);

  return {
    grabado: g.canvas.toDataURL("image/png"),
    proporcion: cw / ch,
    silueta: s.canvas.toDataURL("image/png"),
    proporcionSilueta: pw / ph,
    margen: { x: r / pw, y: r / ph },
  };
}

/**
 * La imagen original para grabar, lista para subir: si pesa más de lo que acepta el servidor,
 * se achica (lado máximo 3000 px, JPG de buena calidad). Si no, va tal cual.
 */
export async function imagenParaSubir(archivo: File, maxBytes = 4_000_000): Promise<Blob> {
  if (archivo.size <= maxBytes) return archivo;
  const bmp = await createImageBitmap(archivo);
  const k = Math.min(1, 3000 / Math.max(bmp.width, bmp.height));
  const { canvas, ctx } = lienzo(Math.round(bmp.width * k), Math.round(bmp.height * k));
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close();
  return new Promise((ok, mal) => canvas.toBlob((b) => (b ? ok(b) : mal(new Error("No se pudo achicar"))), "image/jpeg", 0.9));
}
