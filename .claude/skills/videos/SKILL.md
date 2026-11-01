---
name: videos
description: Crear videos para Sanzo (redes, reels, promos) con la paleta de marca, usando Remotion en sanzo-videos/. Usar cuando el pedido es sobre "un video", "un reel" o "/videos".
---

# /videos — crear videos de Sanzo con Remotion

El video se genera con código (Remotion/React) y se renderiza acá, en `sanzo-videos/`. El pedido del usuario viene en los argumentos: puede ser una idea suelta ("un video de presentación", "un reel para el combo de verano") o algo más específico (texto, duración, producto).

Son videos de **motion graphics puro armado con fotos fijas reales de producto**, no edición de video filmado ni generación de video con IA. El nivel "profesional" sale de: grading de color consistente entre fotos, cortes con transición (no corte seco), tipografía con reveal tipo máscara, y respetar las reglas de marca al pie de la letra — no de usar más fotos.

## 1. Antes de tocar nada

1. Leer `sanzo-videos/src/marca.ts`: paleta oficial (marrón, topo, crema, lino, tinta), tipografía y el filtro `grade` que unifica el color de fotos distintas. Es un espejo de `sanzo-web/app/globals.css` — si la paleta cambió ahí, actualizar este archivo primero.
2. Leer `sanzo-web/CLAUDE.md` y respetarlo también acá: el logo (`public/logo-sanzo.png`) nunca se redibuja ni se recrea con texto/CSS, siempre se muestra la imagen real; sin blanco puro en ningún fondo; paleta solo con los tokens de marca; copy en voseo, frases cortas, nada de "cuero"/"stock"/"resistente" ni % de descuento ni carteles llamativos.
3. Reusar los componentes de `sanzo-videos/src/mograph/` en vez de reinventar animaciones:
   - `EscenaFoto`: foto con grading, Ken Burns (zoom lento) y viñeta — base de casi cualquier escena con imagen.
   - `LineaReveal`: texto que entra con reveal tipo máscara (igual a la animación `subir` que ya usa sanzo-web), no solo fade.
   - `FlashCut`: destello de color entre escenas para que el corte se sienta hecho a propósito, no un corte seco.
   - `Acento`: línea fina que se dibuja, para subrayar un titular.
   - `Textura` (`Grano`, `Vineta`): grano sutil y viñeta para que no se vea "plano".
4. Fotos reales de producto: `sanzo-web/public/productos/` (carpetas `hero/`, `galeria/`, `combo-*`, `piezas/`, `clientes/`) — son las piezas de IG ya aprobadas. Mirarlas antes (con el tool de leer imagen) y elegir 3-5 que armen una historia con arco (detalle → producto en uso → emoción), no cualquiera al azar. Copiarlas a `sanzo-videos/public/` con un nombre descriptivo antes de usarlas con `staticFile()`.
5. Si el pedido necesita material que no está en `sanzo-web/public/productos/` (fotos nuevas, más variedad), no hay acceso a la PC del usuario salvo que conecte una carpeta por Remote Control — avisar y pedirlo, no inventar ni usar placeholders.

## 2. Armar la composición

- Formato por defecto: vertical 1080x1920 a 30fps (reels/stories). Si el pedido pide otro formato (cuadrado, horizontal), ajustar `width`/`height` en `Composition`.
- Una composición nueva por idea de video, en `sanzo-videos/src/compositions/<Nombre>.tsx`, registrada en `sanzo-videos/src/Root.tsx` con la `durationInFrames` real (sumar los `from`/`durationInFrames` de las escenas).
- Armar la pieza como una secuencia de 3-5 escenas cortas (1.5-4s cada una) con `Sequence`, no una sola toma larga — el ritmo de cortes es lo que la hace sentir "comercial" y no "diapositiva".
- Usar siempre los colores de `marca.ts`, nunca hardcodear hex nuevos. Fondos típicos: `crema` o `lino`; texto/acentos: `marron` o `tinta`; texto secundario: `topo`.
- Copy real tomado de `sanzo-web/data/products.ts` o del tono de la marca, nunca inventar frases que prometan algo que no es así.

## 3. Verificar

Previsualizar con Remotion Studio o renderizar un fragmento corto antes de dar el video completo por bueno:

```bash
cd sanzo-videos && npm install
npx remotion render src/index.ts <IdDeLaComposicion> /tmp/<nombre>.mp4 --frames=0-30
```

Mandar ese clip corto de prueba al usuario con la paleta aplicada antes de renderizar la versión final completa.

## 4. Render final y entrega

```bash
cd sanzo-videos && npx remotion render src/index.ts <IdDeLaComposicion> /tmp/<nombre-final>.mp4
```

Enviar el archivo final al usuario (no se commitea: `sanzo-videos/.gitignore` ya excluye `*.mp4`/`*.mov`/`out/`). Si el usuario pide guardar la composición para reusarla, sí commitear el código de `src/`.
