# sanzo-web — tienda para clientes

Landing de venta de Sanzo (Next.js + TypeScript + Tailwind). Online en https://sanzo-web.vercel.app.
Vive en el mismo repo que `sanzo-hub/` (panel interno) pero es otro proyecto de Vercel (root directory `sanzo-web`).
Cada push a `main` que toque esta carpeta se publica solo.

## Reglas
- **Exclusivamente para celular** (tráfico de IG/TikTok). Diseñar y probar a ~390px; nada que dependa de hover; fotos verticales.
- Todo lo editable (productos, precios, fotos, links de Mercado Pago, textos, FAQ, contador de kits) va en `data/products.ts`; envíos en `data/envios.ts`. No hardcodear contenido en componentes.
- Marca: logo en minúscula, nunca dibujarlo ni recrearlo (imagen en `public/logo-sanzo.png`). Jost liviana con tracking. Paleta solo con los tokens `marron`, `topo`, `crema`, `lino`, `tinta` (definidos en `app/globals.css`). Sin blanco puro.
- Copy: voseo, frases cortas. Prohibido "cuero", "stock", "resistente". Material: solo en el personalizador (elegir material del parche) y, cuando se carguen, en los pros de cada ítem.
- Descuentos: promos del carrito (`promos`) y, solo en el kit, una línea discreta "Por separado ~~$X~~ · ahorrás $Y" calculada con los precios reales de las piezas (nunca un precio de referencia inventado). Nada de % off ni carteles llamativos.
- Fotos: las de `public/productos/` salen de las piezas de IG ya aprobadas (`D:\CLAUDIO\sanzo\salidas\`, las "sin texto"). Nada de fotos de fábrica, bolsas o maniquí con fondo desprolijo.
- Antes de pushear: `npm run build` tiene que pasar.

Cómo cargar fotos, precios y variables de entorno: ver `README.md`.
