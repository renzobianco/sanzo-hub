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

- [x] Que +150 clientes y la garantía de un año sean reales (Santi, 2026-10-19: son reales).
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
- 2026-10-18 · Gorra y piluso sueltos subieron a $11.999 (Santi).
- 2026-10-18 · **Combos: fotos pieza por pieza y un color por pieza** (Santi: no le gustaban las 4 opciones "Beige + Granate…" escalonadas).
  - La foto de cada combo ahora se desliza con el dedo, una pieza por foto, con el nombre abajo ("Gorra · Océano") y "1 / 3" arriba (`GaleriaPiezas`). Al entrar en pantalla hace un amague corto para que se note que se desliza.
  - Si una pieza del combo tiene colores (gorra, piluso), aparece un renglón por pieza para elegirlo. Al elegir, la foto se desliza sola a esa pieza y cambia al color con un fundido.
  - Al carrito, checkout, mail y Mercado Pago llega "Gorra Océano · Piluso Jade" (`lib/combos.ts`).
  - **Fotos de cada combo**: hoy usa las fotos de las piezas sueltas. Para poner las correctas: `fotosPiezas` en el combo, con clave "pieza" o "pieza:Color" (ej. `"gorra:Beige": "/productos/combo-sol/gorra-beige.jpg"`).
  - Las fotos propias de los combos (`imagenes`, las de perros) ya no se ven en la tarjeta; siguen en el carrito.

### Falta
- [ ] Fotos correctas de cada pieza en cada combo → `fotosPiezas`.

## 2026-10-19 · Repaso en el celu

- [x] Santi confirmó que son reales: "+150 clientes", "Garantía por un año" y "Más vendido".
- [x] **Combos sin hueco**: el recuadro toma el alto del combo que se ve (antes todos medían como el Combo Sol, con sus renglones de color) y cambia de alto con una transición suave.
- Barra fija del kit abajo (foto, precio, talle y "Comprar"): se hizo y **se sacó** (Santi: "no me gusta"). No volver a proponer una barra fija de compra.
- [x] **Ficha en hoja que sube** (`FichaProducto`): tocando la foto o el nombre de un individual sube una hoja con fotos grandes que se deslizan (tocás una → zoom), descripción, pros y para agregar. Se cierra con la X, tocando afuera o arrastrándola para abajo. Al agregar, se va y se abre el carrito. El ícono de la tarjeta pasó de lupa a "+".
- [x] **WhatsApp**: se esconde sobre el footer, ya no tapa los legales (`lib/flotantes.ts`).
- [ ] **Pros de cada ítem** → `pros: ["...", "..."]` en cada individual de `data/products.ts`. Ya se ven en la ficha apenas se cargan. Solo cosas reales.
- [ ] Individuales: fondos de foto mezclados (arnés estudio blanco, correa foto real). Falta foto "artículo" de cada uno.

## 2026-10-19 · Carrito: combos que se arman solos y personalizar cada ítem

- **Las promos sueltas viejas se sacaron** (correa + moño, collar + bandana, arnés + collar + poo bag). Ahora el carrito trabaja con los **combos reales y el kit** (`lib/promos.ts`, textos en `carritoCombos` de `data/products.ts`).
- **Recomienda**: si agregás un individual, aparece "Armá el Combo X · Ahorrás $Y" con las piezas (las que tenés marcadas, las que faltan apagadas), "1 / 3", una barrita que se llena y "Sumar" en cada pieza que falta (elige talle o color ahí mismo). Hasta 2 combos, primero los que menos piezas les faltan. El kit solo se sugiere si le faltan 1 o 2.
- **Arma el combo**: con todas las piezas, aparece "✓ Armaste el Combo X · Ahorrás $Y", cada pieza lleva la etiqueta del combo y en los totales se descuenta. Ahorro = suma de las piezas sueltas − precio del combo (sale solo de los precios: Paseo $6.498, Estilo $5.998, Aventura $6.499, Sol $1.999, kit $12.495). Pagás lo mismo que comprando el combo.
- **Kit armado con piezas sueltas = envío gratis**, igual que el kit.
- El mail del pedido dice "Armó el Combo X: − $Y".
- **Personalizar en cada ítem del carrito**: "+ Personalizar" en cada línea personalizable (abre el mismo editor). Ya personalizado muestra el detalle con Editar / Quitar. Si queda igual a otra línea, se juntan.
- [ ] Ojo: con sugerencias, la parte de los ítems del carrito queda chica en el celu (el selector de envío y los totales ocupan mucho abajo). Se podría compactar.

## 2026-10-19 (tarde) · El combo reemplaza a las piezas (corrección de Santi)

- Santi: "si ponés las piezas y armás el combo, que en el carrito solo esté el combo". Antes quedaban las piezas sueltas con un descuento; **ahora se reemplazan por una sola línea del combo** (`armarCombos` en `lib/carrito.ts`, corre en `CarritoProvider` cada vez que cambia el carrito). Arriba aparece unos segundos "✓ Armaste el Combo X · Ahorrás $Y".
- **Combo → combo más grande**: si tenés un combo y sumás lo que le falta para uno más grande, pasa a ese (ej. Combo Aventura + collar, moño, bandana y poo bag → Kit completo; Aventura + Estilo + poo bag → Kit). El carrito lo sugiere: "Pasá tu Combo Aventura al Kit completo" / "Pasá tus combos al Kit completo", con las piezas que faltan.
- Talle y colores salen de lo que se junta. Si los talles no coinciden (ej. arnés M y collar S) o las personalizaciones son distintas, no fuerza ese combo: arma el que se pueda, y si no queda ninguno, quedan sueltas con el descuento igual.
- Las fotitos de las piezas en la sugerencia se achican para que entren las 6 del kit.

## 2026-10-20 · Oferta de chapita personalizada (Renzo)

- Al tocar "Comprar el kit" o "Agregar" aparece un cartel (`OfertaChapita`, datos en `ofertaChapita` y `chapita` de `data/products.ts`): "¿Le sumamos su chapita?" con la imagen de las 3 chapitas, **$6.000** y "$8.000" tachado, "Solo sumándola a tu compra".
- Tipos: **Huesito** (nombre), **Circular** (su cara: nos manda la foto por WhatsApp después del pedido; nombre opcional) y **Rectangular** (nombre + teléfono).
- El grabado viaja como la opción de la línea ("Huesito · KALA") y llega así al carrito, checkout, mail y Mercado Pago. El carrito la cobra $6.000 si va con otro producto; sola, $8.000 (`lib/carrito.ts`, `lib/chapita.ts`).
- Si ya tiene una chapita o dijo "No, gracias", no se vuelve a ofrecer en esa visita.
- La imagen (`public/productos/chapitas/oferta.jpg`) es un render armado por Claude (las chapitas todavía no tienen foto). La cara está hecha con una foto nuestra pasada a tramado tipo grabado láser.

### Falta
- [ ] Foto real de las chapitas cuando estén → reemplazar `oferta.jpg` (misma proporción 1200×620).

## 2026-10-23 · Medidas y guía de talles (oficiales del proveedor)

- Campos nuevos en cada producto: `medidas` (una fila por talle o una sola) y `guiaTalle` (data/products.ts). Se ven en la ficha que sube al tocar un individual, bajo "Medidas"; cada medida no se corta entre renglones.
- Cargadas: arnés S y M (cuello, pecho, tira de 2 cm, regulable) + guía para elegir talle; collar M; correa; bandana; moño; poo bag (portabolsas).
- Guía de talles del kit (`guiaTalles`): tabla con pecho y cuello del arnés S/M y la misma explicación. Columna "Contorno de pecho" → "Pecho".
- [ ] **Pendientes de medidas** (no inventar): gorra y piluso. (Collar S ya no se vende.)
- [ ] Revisar la descripción del arnés: dice "liviano" (no está en las medidas del proveedor).
- [ ] Combos y kit: la ficha no muestra las medidas de sus piezas (solo la guía de talles del kit).

## 2026-10-23 · Talles agotados

- **Talle L agotado** en todo lo que lleva talle (arnés, collar, kit y combos con talle): se ve apagado y tachado, no se puede tocar (`TALLES_AGOTADOS` y `opcion.agotados` en data/products.ts).
- **Collar S agotado** (Santi: "ya no quedan más"): el collar se compra solo en M; S y L apagados. Carritos viejos con collar S lo pierden solo.
- [ ] **Decidir**: kit, Combo Paseo y Combo Estilo en talle S llevan collar. ¿Qué collar va? (el M regula 33 a 51 cm, entra en el cuello del arnés S: 35 a 44 cm). Hoy se siguen vendiendo en S.
- [ ] Para volver a habilitar un talle: pasarlo de `agotados` a `valores`.

## 2026-10-23 · Combos en carrusel y poo bag con rollito

- **Combos en carrusel circular** (idea de Santi, con dibujo; después de Sol viene Paseo, nunca termina — 3 vueltas seguidas y salto invisible a la del medio): la tarjeta del medio enfocada y las de los costados asomando, más chicas, apagadas y desenfocadas, para que se note que hay más. Se desliza con el dedo, tocando una de los costados o con las solapas de Renzo (quedaron arriba, sincronizadas). Al entrar en pantalla hace un amague corto. Puntitos abajo. Las fotos de cada combo cambian solas (no se deslizan, para no pelear con el carrusel). Si no convence, se vuelve atrás.
- **Poo bag trae un rollito de bolsitas**: en la descripción del individual y, chiquito, "con rollito" debajo del poo bag en combos, ficha y en la lista de piezas del kit (`incluyeExtra` en data/products.ts).

## 2026-10-23 · Zoom más suave

- Santi: "el zoom está re trabado". Causa: con cada movimiento del dedo se re-dibujaba todo el visor y la foto perseguía al dedo con una animación de 0,5 s. Ahora (`FotoZoom` en ConZoom.tsx) el movimiento va directo al estilo: arrastre 1 a 1, **pellizco para acercar/alejar** (hasta 4x, centrado entre los dedos), tocar acerca donde tocaste (2,5x) y otro toque aleja, con animación suave solo en esos toques. El tope es la foto (no se ven las franjas vacías). Si el pellizco la deja casi en su tamaño, vuelve sola.
- Ojo: algunas fotos son chicas (ej. `arnes/1.jpg` mide 421 px de ancho): acercadas se ven blandas. Para un zoom nítido hacen falta fotos de 1500 px o más.
- Combo Estilo ya no dice "Más vendido" (Santi). Queda solo en el kit.

## 2026-10-23 · Detalles señalados en la foto (idea de Santi, referencia tipo ficha técnica)

- Al abrir la ficha de un individual, la primera foto muestra puntitos con líneas negras que se dibujan solas y una etiqueta corta (`Detalles.tsx`, datos en `detalles` de cada producto). No tapan el zoom.
- Cargado: **arnés** (tiras regulables, personalizable, hebillas de traba rápida), **collar** (hebilla, regula de 33 a 51 cm, argolla para la correa), **correa** (manija, 152 cm de largo · 2 cm de ancho), **poo bag** (rollito de bolsitas, mosquetón, cierre para recargar).
- Santi propuso frases como "anilla de alta durabilidad" y "material de neoprene": **no se pusieron** porque chocan con las reglas (material sin confirmar, nada de durabilidad). Si se confirma el material, se cambia el texto en `detalles`.
- [ ] Moño, bandana, gorra y piluso: falta ver bien en fotos cómo se enganchan antes de señalar algo.
- [ ] **360° "bien chupetón"** del arnés: sigue pendiente hasta tener las fotos reales dando la vuelta (24-36 fotos o un video lento).
- Decidido (Santi): **el kit talle S lleva collar S** (quedan para kits aunque el collar S suelto esté agotado). Falta confirmar si Combo Paseo y Combo Estilo en S también.

## 2026-10-23 · Carrito: cada combo debajo de su producto

- Santi: con gorra + poo bag las sugerencias quedaban todas al final. Ahora cada producto del carrito lleva debajo su combo a medio armar (gorra → "Armá el Combo Sol, te falta piluso"; poo bag → "Armá el Combo Paseo, te faltan correa y collar"). Una sugerencia por producto, sin repetir; ya no se cortan en 2.
- Las fotitos de las piezas en la sugerencia quedan (todavía faltan las fotos definitivas de los individuales).

## 2026-10-23 · Ahorro en cada combo y opciones pendientes

- **Cada combo muestra cuánto ahorrás** (Santi): "Ahorrás $Y" en recuadro fino marrón junto al precio y "Por separado ~~$X~~" debajo, igual que el kit, con los precios reales de las piezas (Paseo $6.498, Estilo $5.998, Aventura $6.499, Sol $1.999). Regla de CLAUDE.md actualizada.
- [ ] **Elegir** (Santi vio 3 opciones de cada una en el chat):
  - Cartel "Más vendido": A píldora clara / B texto sobre la foto / C arriba del nombre. (Hoy: píldora negra con estrella; no le gusta.)
  - Talle agotado: A raya en diagonal / B la palabra "agotado" adentro / C "L agotado" al lado. (Hoy: tachado; "no se entiende".)
  - Solapas de combos: A nombres con rayita que se desliza / B nombres abajo en lugar de los puntitos / C contador "1 / 4" al lado del título. (Hoy: píldoras; "no termina de quedar integrado".)
- [x] Combo Sol con talle (2026-10-23): gorra S ancho 16 cm / M 18 cm; piluso S 21 cm / M 23 cm; L agotado.
- 2026-10-23 · **Poo bag: "+ rollito" como etiqueta** (Santi: el texto "con rollito" debajo quedaba mal). Ahora es una etiquetita oscura sobre el círculo del poo bag, en combos, ficha y en la fila de piezas del kit; se sacó de la línea de texto del kit. La descripción del poo bag suelto sigue diciendo "con un rollito adentro".
- 2026-10-23 · **Hecho con las opciones recomendadas** (Santi: "no cambiaste nada"): "Más vendido" del kit pasó a la línea de arriba del nombre ("Más vendido · 6 piezas · envío gratis"), sin cartel sobre la foto; en tarjetas/combos, si llevan etiqueta, es una píldora clara sin estrella. Talle agotado: letra apagada, borde punteado y "agotado" chiquito adentro (sin tachado). Solapas de combos: texto con una rayita fina que crece debajo del elegido.
- 2026-10-23 · **Talle agotado como texto** (Santi: el cuadrito con "agotado" quedaba horrible): ahora solo están los talles que se pueden elegir y al lado un texto chico "L agotado" (o "S y L agotados" en el collar).
- 2026-10-23 · **Gorra y piluso con talle además del color** (`opcionTalle`): se elige color y talle, al carrito va "Beige · M" (se lee "Color Beige · Talle M"). Medidas: gorra S ancho 16 cm / M 18 cm; piluso S 21 cm / M 23 cm (Santi). L agotado.
- **Combo Sol con talle** (uno para las dos piezas) + color de cada una. Gorra + piluso del mismo talle sueltos en el carrito se juntan en el Combo Sol. El "Sumar" de la sugerencia pide color y después talle.
- Ojo: carritos viejos con gorra o piluso sin talle pierden esa línea (ya no es una opción válida).
