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

- 2026-10-16 · Sección "Miralo de todos lados" (`Seccion360`, datos en `vista360`): frente/espalda en 3D que se gira con el dedo, botones Frente/Espalda/Girar, balanceo suave. Fotos: `public/productos/360/` (de items-sin-logo). Cuando estén las fotos de la vuelta completa, cargarlas en `vista360.cuadros` y pasa a 360° real cuadro por cuadro.

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

## 2026-10-16 (tarde) · Correcciones de Santi

- Footer: redes solo con el logo; WhatsApp con logo y número.
- Talles del arnés (y kit / Combo Aventura): solo S y M (`TALLES_ARNES`).
- **Precios PROVISORIOS** (puestos por Claude para que funcione "Agregar"; Santi dijo "después los ajustamos"):
  kit $67.000 (Renzo) · arnés $29.000 · correa $16.000 · collar $14.000 · moño $8.000 · bandana $9.000 · poo bag $8.000 · gorra/piluso $15.000 ·
  Combo Paseo $33.000 · Combo Estilo $27.000 · Combo Aventura $39.000 · promos: correa+moño −$2.000, collar+bandana −$2.000, arnés+collar → poo bag de regalo.
  Los sueltos suman $84.000 a propósito: el kit ($67.000) y los combos convienen más.
- Clientes: "+150 y sumando" + carrusel vertical tipo reels para **videos de clientes usándolos** (`clientes.videos`). Hoy muestra fotos de IG; cuando haya videos, se cargan ahí y se reproducen solos.
- Fotos que van cambiando solas (portada, combos y productos), con fundido y solo a fotos ya cargadas.
- Productos: **solo fotos del producto, sin perros** (`public/productos/solo/`). Correa: recortes de la foto real del kit (falta una foto linda de la correa sola).
- PC: portada partida (texto a la izquierda, foto a la derecha), clientes en fila de 6, combos más angostos, tarjetas que se levantan al pasar el mouse.
- Más vida: header que se esconde al bajar y vuelve al subir, bolsa que salta al agregar, subrayado animado en el menú, tira de fotos "Salen con sanzo" que se mueve sola, piezas del kit que aparecen una por una.

### Falta
- [x] Precios reales (regla de combos, terminados en 999).
- [x] Legales: botón de arrepentimiento (/arrepentimiento, con código de trámite y mail) y link a Defensa del Consumidor en el footer (2026-10-16).
- [ ] Videos de clientes → `clientes.videos[].video`.
- [ ] Foto linda de la correa sola (estilo "artículo").

## 2026-10-16 · Precios con la regla de combos (Santi)

- Base = precios de venta del Sanzo Hub (Productos): arnés 15.000, correa 10.000, collar 8.500, moño 7.500, bandana 8.500, portabolsa 8.500, gorra/piluso 11.000.
- **Combos = suma de la base**: Paseo 27.000 · Estilo 24.500 · Aventura 25.000.
- **Sueltos = base +25%** (redondeado a $500): arnés 19.000 · correa 12.500 · collar 10.500 · moño 9.500 · bandana 10.500 · poo bag 10.500. Gorra y piluso quedan a 11.000 (no entran en combos).
- Promos del carrito = lo que se ahorra frente a la base: correa+moño −4.500 · collar+bandana −4.000 · arnés+collar+poo bag −8.000.
- [x] Kit $59.999 (Santi). Todos los precios terminan en 999: kit 59.999 · combos 26.999 / 24.499 / 24.999 · sueltos 18.999 / 12.499 / 10.499 / 9.499 / 10.499 / 10.499 · gorra y piluso 10.999. Promos: −4.499 / −3.999 / −7.998 (dejan el par en la base del Hub −1).
- [ ] Actualizar en el Hub el precio de los sueltos si se publican estos (hoy el Hub tiene la base).

## 2026-10-16 · Colores y talles
- Arreglado: el botón flotante de WhatsApp tapaba los clics abajo a la derecha (por eso no andaba "Jade" ni otros botones de esa zona).
- Botones de color con muestra del color (`opcion.colores`) y la foto de la tarjeta pasa al color elegido (`opcion.fotos`). Gorra: beige/celeste. Piluso: granate/jade.
- Todo lo que tiene talle (arnés, collar, kit, combos) solo en S y M. Guía de talles con S y M (faltan las medidas).

## 2026-10-17 · Reformulación de la home (pedido de Santi: "parece de baja calidad")

- **Orden nuevo**: portada → cinta → **kit completo → combos → individuales** → clientes → ¿por qué sanzo? → reseñas → preguntas.
- **Chips fijos "Kit completo · Combos · Individuales"** (`NavTienda`, datos en `sitio.secciones`): quedan arriba mientras recorrés la tienda, marcan dónde estás con una píldora que se desliza y llevan a cada sección con un toque. "Productos" pasó a llamarse **Individuales** (también en el menú).
- **"Incluye 6 piezas"**: sacadas las fotos con logo; ahora muestra el artículo solo (`miniatura` de cada individual, fotos de `items-sin-logo` en `public/productos/piezas/`). **Son provisorias**: reemplazar por las fotos definitivas en `miniatura`.
- **360° adentro de Personalizar**: ya no es sección aparte. En el editor hay un control "Su diseño | 360°" (`Visor360`, datos en `vista360`). Se borró `Seccion360`.
- **Clientes**: tira de 15 fotos (clientes + las de la galería y la portada) que corre sola de izquierda a derecha, sin fin; se frena al tocarla. La galería oscura "Salen con sanzo" se sacó (sus fotos pasaron acá).
- **"¿Por qué nuestro arnés?" → "¿Por qué sanzo?"** en grilla tipo bento (`porQue`): foto grande con frase, "Todo combina" destacada en oscuro y tarjetas de garantía, cambio de talle, envíos, "se pone en segundos". Envío gratis y cuotas se suman solas cuando se carguen. Absorbe la franja de confianza (se borró `FranjaValor`). Se sacó "Cuatro talles" (era falso: solo S y M).
- **Bug arreglado**: el carrusel de combos ensanchaba toda la página en el celu (se veía achicada/desprolija). Ahora mide 390 px justos.
- Ideas de namethatui usadas: chips con scrollspy, control segmentado, marquee, bento grid.

### Falta
- [ ] Fotos definitivas de cada pieza → `miniatura` en `data/products.ts`.
- [ ] Videos de clientes → `clientes.videos[].video`.
- [ ] Ideas para seguir subiendo calidad (a decidir): título de la portada con palabra que rota, ficha de producto en hoja deslizable (sheet) al tocar una tarjeta, tipografía de títulos menos "IA".

## 2026-10-17 (tarde) · Kit, personalización para todo y zoom

- **Kit: ahorro en una línea discreta** debajo del precio: "Por separado ~~$72.494~~ · ahorrás $12.495". Se calcula solo con los precios reales de las piezas sueltas (Santi pidió "100 mil y pico", pero la suma real es $72.494; poner un precio de referencia inventado es publicidad engañosa). Primero hice una etiqueta marrón "Ahorrás" y a Santi no le gustó: muy llamativa.
- **Kit "Más vendido"**: cartelito sobre la foto (`kit.etiqueta`; sirve para cualquier producto).
- **Ícono de "Se pone en segundos"**: huellas → cronómetro (`IconoReloj`).
- **Personalizar todo menos el moño**: el botón aparece en cada producto con alguna pieza personalizable (arnés, correa, collar, bandana, poo bag, gorra, piluso, kit y combos). En kits/combos el parche va en todas sus piezas y en la vista hay pestañas por pieza (+ 360° si está el arnés).
  - Vista previa de cada pieza: foto del artículo sin logo con el parche elegido encima y el nombre (`personalizacion.piezas`: posición, tamaño y giro del parche). El arnés sigue con sus fotos reales. **Gorra, piluso y poo bag: posición estimada, revisar.**
  - **Material del parche** (`personalizacion.materiales`): Cuerina (elegible) y Bordado ("Muy pronto"). Cada uno puede sumar precio.
  - **Precio**: `precioExtra` se cobra por cada pieza personalizada (un kit con 5 piezas suma 5 veces) + el extra del material. **PENDIENTE: poner los montos** (hoy 0, no se muestra).
  - El material va en el carrito, checkout, mail y Mercado Pago (texto de la personalización).
- **Zoom en las fotos** (`ConZoom`): ícono de lupa en kit, combos e individuales; al tocar se abre a pantalla completa con todas las fotos; tocás y se acerca donde tocaste, movés el dedo para recorrerla, otro toque la aleja.

### Falta
- [ ] Montos de personalización (`precioExtra`, y por material).
- [ ] Revisar/ajustar la posición del parche en gorra, piluso y poo bag (`personalizacion.piezas`).
- [ ] **Pros de cada ítem** (pedido de Santi): 2-3 líneas simples por producto (calidad, material, detalle útil). Cargarlas en `data/products.ts` y mostrarlas en la tarjeta. Solo cosas reales del producto.
- [ ] Confirmar que "Más vendido" sea real.
- 2026-10-17 · Editor de Personalizar más grande en PC: dos columnas (vista grande a la izquierda, formulario a la derecha). Las fotos de las piezas llenan todo el recuadro (sin rectángulo gris).
- [ ] Santi va a pasar las fotos buenas para la vista previa de cada pieza: cargarlas en `personalizacion.piezas` y ajustar posición/tamaño del parche. Por ahora la función queda andando con fotos provisorias.

## 2026-10-17 (noche) · Tamaño del parche e imagen propia con grabado láser

- **Bug del scroll arreglado** (Santi confirmó): el servidor local se caía generando fotos de 3840 px (sobre todo las del zoom). Ahora `deviceSizes` llega a 1920, las fotos del zoom se cargan recién al abrirlo, los chips fijos no usan desenfoque y la tira de clientes se pausa fuera de pantalla.
- **Editor de Personalizar en dos columnas desde 640 px** (antes desde 768 y en pantallas medianas se veía chico).
- **Tamaño del parche** (`personalizacion.tamanos`): Chico / Mediano / Grande. Grande = el espacio máximo de cada pieza (`piezas[x].parche`). Cada tamaño puede sumar precio (PENDIENTE: montos, a más grande más caro).
- **"¿Qué grabamos?" → Su nombre | Tu imagen**: sube cualquier imagen y la vista previa la muestra como quedaría grabada con láser (escala de grises con niveles automáticos, lo oscuro quemado en marrón y lo claro transparente; `lib/laser.ts`). Aviso: "Después del pedido nos mandás la imagen original por WhatsApp" (`avisoImagen`). La vista previa queda en el carrito del navegador; al pedido llega "Imagen propia" (sin la imagen). PENDIENTE: `precioImagen`.
- Todas las piezas (también el arnés) usan ahora el mismo sistema de vista previa (`Vista.tsx`). Se borró `VistaArnes` y los datos de las fotos del arnés con cada parche (las fotos siguen en `public/productos/arnes/` por si se vuelven a usar).

### Falta
- [ ] Precios: `precioImagen` y `tamanos[].precioExtra`.
- [ ] Cuando entre un pedido con "Imagen propia", pedirle la imagen por WhatsApp. Más adelante: subirla directo en el checkout (necesita guardar archivos, ej. Supabase Storage).
- [ ] Fotos buenas de cada pieza para la vista previa (Santi las pasa).

## 2026-10-18 · Portada con la frase sobre la foto y Combo Sol

- **Portada**: "Sacalo — como se merece" pasó arriba de la foto, en crema, abajo a la izquierda, con una sombra suave para que se lea; "Ver el kit" debajo de la frase. La página arranca directo con la foto. En PC la foto es apaisada (16/7) para que la frase entre en la primera pantalla. Santi eligió este formato después de ver 4 opciones sobre la web real (centrada, en una fila, sobre la foto, grande).
- **Combo Sol** (`combo-sol`): gorra + piluso a $21.999 (regla de combos: base del Hub 11.000 + 11.000, terminado en 999). Se elige la combinación de colores (Beige/Océano + Granate/Jade).

### Falta
- [ ] Fotos propias del Combo Sol (hoy usa las de la gorra y el piluso sueltos).
