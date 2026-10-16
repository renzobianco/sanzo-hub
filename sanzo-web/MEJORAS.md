# sanzo-web — mejoras

Hoja de ruta de la web de clientes. La lee `/web` antes de tocar nada. Anotar acá cada idea nueva, cada decisión y cada cosa que Santi corrija.

**Norte (de los apuntes de Santi): FÁCIL y RÁPIDA desde el celu.**

## Datos fijos del producto

- El arnés es **color camel, uno solo**. No hay otras telas/colores de arnés.
- Nunca dibujar el producto: siempre fotos reales.

## Hecho

- 2026-10-16 · **Adelanto "Ponele su etiqueta"** (`SeccionEtiqueta`, datos en `etiqueta` de `data/products.ts`): boceto "muy pronto", sin compra, para acordarnos de hacerlo.
- 2026-10-16 · **"¿Por qué nuestro arnés?"** con lugar para video vertical + 3 razones (`porQue`).
- 2026-10-16 · **Reseñas / videos de clientes** (`resenas`): la sección aparece sola cuando se carga la primera. Solo reseñas reales.
- 2026-10-16 · **Franja de confianza** editable (`confianza`): cambio de talle, envío gratis desde $X, cuotas sin interés (aparece solo si se carga el número).
- 2026-10-16 · **Envío gratis desde un monto** (`data/envios.ts` → `envioInfo.gratisDesde`), con aviso "te faltan $X" en el carrito.
- 2026-10-16 · Sacadas de la página las tarjetas de zonas de envío (Santi: "sacalo"). El carrito sigue calculando por zona.
- 2026-10-16 · Sacado el sello giratorio de "envío gratis" (a Santi no le gustó). Los precios vacíos ya no muestran "Precio próximamente".
- 2026-10-16 · **Promos del carrito "llevá más, pagá menos"** (`promos` en `data/products.ts`, lógica en `lib/promos.ts`): el carrito sugiere la pieza que falta ("Sumalo y ahorrás $X" / "te lo regalamos") y aplica el ahorro solo; aparece en carrito, checkout y mail. Promos de ejemplo: correa + moño, collar + bandana (ahorro) y arnés + correa → poo bag de regalo. Se prenden cuando tengan precio.
- 2026-10-16 · **Look premium**: fotos reales de IG en hero, kit (galería deslizable con puntitos), combos y productos; cinta que corre bajo el hero; galería oscura "Salen con sanzo"; zoom lento en el hero; foto en "¿Por qué nuestro arnés?" (el video de fábrica se sacó por no ser premium).
- 2026-10-16 · **Seguridad**: "+150 clientes satisfechos" con contador animado (`clientes`), garantía por un año (franja, cinta y FAQ). La franja de confianza subió justo después del kit.

- 2026-10-16 · **Movimiento tipo iPhone**: aparición con desenfoque, títulos que suben palabra por palabra (`Palabras`), fotos que se destapan como telón, portada con parallax al scrollear, galería tipo cover-flow (`CarruselVivo`), botones que se hunden al tocarlos, fotos que aparecen con fundido al cargar (y placeholder si fallan). Todo se apaga con "reducir movimiento".
- 2026-10-16 · "+150 clientes satisfechos · y sumando" con puntito que late.
- 2026-10-16 · Sacados "primera tanda limitada" y el contador de kits (Santi: nada de tanda limitada ni contadores).
- 2026-10-16 · **Botón flotante de WhatsApp** (`BotonWhatsapp`, datos en `sitio.whatsapp`): aparece al pasar la portada, abre una tarjeta con preguntas rápidas que llegan escritas al chat. **Falta el número** → `sitio.whatsapp.numero`; vacío no se muestra.

## Falta confirmar

- [ ] Que +150 clientes y la garantía de un año sean reales.
- [x] Número de WhatsApp de Sanzo: +54 9 11 5969-4816 (cargado).
- [x] Redes: @sanzo_pets en Instagram, TikTok y X (cargadas).
- [ ] Precios: subir los individuales y cargar los combos y los montos de cada promo.

## Próximo grande: personalizador de etiqueta (cuando llegue el arnés)

Lo que definió Santi (2026-10-16):
- Es una **etiqueta** que se agrega al producto. Por ahora de cuerina (no decirlo en la web: regla de no hablar de material), pegada o cosida; más adelante quizás bordado.
- Se puede poner en **cualquier producto menos el moño**.
- **Dos modos:**
  - a. **Prediseñado**: lugares prefijados (para que no sobrepiense) y 3 formas, ej. rectángulo, huesito… (confirmar la tercera).
  - b. **Libertad total**: sube la imagen que quiera (ej. la cara de Messi), elige tamaño y lugar. A más grande, más caro.
- **Vista previa** de cómo queda, fácil desde el celu, sobre **fotos reales** del producto.
- Falta: precios de cada modo/tamaño, lugares prefijados por producto, cómo nos manda la imagen en buena calidad.

## Arnés 360° (real)

- Con fotos del arnés real: base giratoria + celu en trípode, misma luz y distancia, 24-36 fotos dando la vuelta (o un video lento de una vuelta y se sacan los cuadros).
- En la web: visor que cambia de foto al deslizar el dedo. Falta: las fotos (el arnés todavía no llegó).

## Falta cargar (datos, no código)

- [ ] Video lindo del arnés (no el de fábrica) → `public/videos/` y `porQue.video`.
- [ ] Monto de envío gratis → `envioInfo.gratisDesde`.
- [ ] Cuotas sin interés: activarlas en la configuración de Mercado Pago (opción de ofrecer cuotas sin interés; el costo lo absorbemos nosotros, revisar cuánto cobra) y después poner `confianza.cuotasSinInteres`.
- [ ] Links de Instagram/TikTok y mail → `sitio.redes`, `sitio.email`.

## Ideas pendientes / a decidir

- [ ] **Chapitas personalizadas** (producto nuevo): meterlas en algún combo, ej. con el collar.
- [ ] **Combos "más ítems, más barato"**: choca con la regla de no mostrar descuentos. Se puede resolver con precios de combo ya bajos sin mostrar el "ahorro". Decidir con Renzo.
- [ ] **Certificaciones / garantías**: no hay certificaciones reales todavía. No inventar.
- [ ] Santi dijo que "la letra se nota IA" — falta aclarar si son los textos o la tipografía.
- [ ] Mercado Pago Checkout Pro para cobrar cualquier carrito (ver `TODO` en `app/api/pedido/route.ts`).
