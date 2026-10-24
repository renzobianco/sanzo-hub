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

/**
 * Convierte cualquier imagen en cómo se vería grabada con láser: escala de grises con niveles automáticos,
 * lo oscuro queda "quemado" y lo claro desaparece. Una foto de Messi no se ve como foto: se ve grabada.
 * Además recorta los bordes vacíos y arma el contorno para la forma "Su silueta".
 */
export async function aGrabadoLaser(archivo: File, lado = 480): Promise<Grabado> {
  const bmp = await createImageBitmap(archivo);
  const k = Math.min(1, lado / Math.max(bmp.width, bmp.height));
  const w = Math.max(1, Math.round(bmp.width * k));
  const h = Math.max(1, Math.round(bmp.height * k));
  const { ctx } = lienzo(w, h);
  ctx.drawImage(bmp, 0, 0, w, h);
  bmp.close();

  const d = ctx.getImageData(0, 0, w, h).data;
  const lum = new Float32Array(w * h);
  // Luminancia (lo transparente cuenta como blanco: no se graba).
  for (let i = 0; i < w * h; i++) {
    const a = d[i * 4 + 3] / 255;
    const l = (0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]) / 255;
    lum[i] = l * a + (1 - a);
  }
  // Niveles automáticos: estira entre el 2% más oscuro y el 2% más claro para que se lea bien.
  const orden = Array.from(lum).sort((x, y) => x - y);
  const negro = orden[Math.floor(orden.length * 0.02)];
  const blanco = orden[Math.floor(orden.length * 0.98)];
  const rango = Math.max(0.05, blanco - negro);

  // Curva: los medios tonos se queman menos que lo oscuro, como el láser real.
  const quemado = new Float32Array(w * h);
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let i = 0; i < w * h; i++) {
    const l = Math.min(1, Math.max(0, (lum[i] - negro) / rango));
    quemado[i] = Math.pow(1 - l, 1.4);
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
