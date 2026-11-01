---
name: videos
description: Crear videos para Sanzo (redes, reels, promos) con la paleta de marca, usando Remotion en sanzo-videos/. Usar cuando el pedido es sobre "un video", "un reel" o "/videos".
---

# /videos — crear videos de Sanzo con Remotion

El video se genera con código (Remotion/React) y se renderiza acá, en `sanzo-videos/`. El pedido del usuario viene en los argumentos: puede ser una idea suelta ("un video de presentación", "un reel para el combo de verano") o algo más específico (texto, duración, producto).

## 1. Antes de tocar nada

1. Leer `sanzo-videos/src/marca.ts`: tiene la paleta oficial (marrón, topo, crema, lino, tinta) y la tipografía. Es un espejo de `sanzo-web/app/globals.css` — si la paleta cambió ahí, actualizar este archivo primero.
2. Mirar `sanzo-videos/src/compositions/` para ver qué composiciones ya existen y reusar patrones (animaciones con `interpolate`, `AbsoluteFill`, etc.) en vez de reinventar.
3. Si el pedido necesita fotos o videos reales de producto, están en la raíz del repo (`foto_portada.jpeg`, `foto_renzo.jpeg`, `foto_santino.jpeg`, `logo_sanzo.png`) o hay que pedírselos al usuario. No hay acceso a la PC del usuario salvo que conecte una carpeta por Remote Control — si el pedido depende de material que solo está ahí, avisar y pedirlo.

## 2. Armar la composición

- Formato por defecto: vertical 1080x1920 a 30fps (reels/stories). Si el pedido pide otro formato (cuadrado, horizontal), ajustar `width`/`height` en `Composition`.
- Una composición nueva por idea de video, en `sanzo-videos/src/compositions/<Nombre>.tsx`, registrada en `sanzo-videos/src/Root.tsx`.
- Usar siempre los colores de `marca.ts`, nunca hardcodear hex nuevos. Fondos típicos: `crema` o `lino`; texto/acentos: `marron` o `tinta`; texto secundario: `topo`.
- Animaciones suaves (`suave` cubic-bezier de `marca.ts`), nada brusco ni con mucho texto en pantalla a la vez — mismo criterio minimalista que la web.
- Voseo y frases cortas si hay texto en cámara, mismo tono que `sanzo-web/CLAUDE.md`.

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
