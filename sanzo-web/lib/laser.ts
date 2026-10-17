/**
 * Convierte cualquier imagen en cómo se vería grabada con láser sobre el parche:
 * escala de grises con niveles automáticos → lo oscuro queda "quemado" (marrón muy oscuro)
 * y lo claro desaparece (transparente). Una foto de Messi no se ve como foto: se ve grabada.
 * Devuelve un PNG chico (data URL) para la vista previa.
 */
export async function aGrabadoLaser(archivo: File, lado = 420): Promise<string> {
  const bmp = await createImageBitmap(archivo);
  const k = Math.min(1, lado / Math.max(bmp.width, bmp.height));
  const w = Math.max(1, Math.round(bmp.width * k));
  const h = Math.max(1, Math.round(bmp.height * k));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Sin canvas");
  ctx.drawImage(bmp, 0, 0, w, h);
  bmp.close();

  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
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

  for (let i = 0; i < w * h; i++) {
    const l = Math.min(1, Math.max(0, (lum[i] - negro) / rango));
    // Curva: los medios tonos se queman menos que lo oscuro, como el láser real.
    const quemado = Math.pow(1 - l, 1.4);
    // Granito sutil del grabado.
    const grano = (Math.random() - 0.5) * 0.08;
    d[i * 4] = 58;
    d[i * 4 + 1] = 32;
    d[i * 4 + 2] = 18;
    d[i * 4 + 3] = Math.round(Math.min(1, Math.max(0, quemado + grano)) * 235);
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL("image/png");
}
