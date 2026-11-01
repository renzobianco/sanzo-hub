---
name: web
description: Hacer cambios en la tienda de clientes de Sanzo (sanzo-web, Next.js en Vercel) - productos, precios, envíos, textos, fotos, carrito, checkout o diseño. Usar cuando el pedido es sobre "la web", "la tienda", "la página" o sanzo-web.
---

# /web — cambios en la tienda (sanzo-web)

El pedido del usuario viene en los argumentos. Trabajar en la carpeta `sanzo-web/`.

## 1. Antes de tocar nada

1. Leer `sanzo-web/CLAUDE.md` (reglas de marca, copy, paleta, celular primero) y respetarlas.
2. Leer `sanzo-web/MEJORAS.md`: hoja de ruta, decisiones ya tomadas y correcciones de Santi. No deshacer algo que figure ahí como decidido sin avisar.
3. Ubicar dónde vive lo que se pide. Casi todo el contenido es data, no componentes:
   - Productos, precios, fotos, links de pago, `envioGratis`, textos generales (`sitio`), FAQ (`preguntas`): `sanzo-web/data/products.ts`
   - Zonas y precios de envío, envío gratis por monto (`envioInfo.gratisDesde`): `sanzo-web/data/envios.ts`
   - Puntitos de detalle en las fotos: `sanzo-web/data/detalles.json`
   - Lógica de carrito y envío: `sanzo-web/lib/carrito.ts`; combos que se arman solos: `sanzo-web/lib/promos.ts`

## 2. Hacer el cambio

- Cambiar la data primero; tocar componentes solo si hace falta.
- Buscar con grep el mismo concepto en todos lados (data, componentes, `app/layout.tsx` metadata, FAQ, `README.md`) para que no queden textos que prometan algo que ya no es así.
- Copy: voseo, frases cortas. Prohibido "cuero", "stock", "resistente". Nada de % off ni carteles llamativos.
- Diseñar y revisar a ~390px de ancho. Nada que dependa de hover.

## 3. Verificar

```bash
cd sanzo-web && npm install && npm run build
```

Tiene que pasar antes de pushear. Si el cambio es visual, levantar `npm run dev` y mirarlo a 390px.

## 4. Anotar y publicar

1. Sumar una línea a `sanzo-web/MEJORAS.md` con la fecha y qué se cambió (y por qué, si lo pidió alguien).
2. Commit con el prefijo `sanzo-web: ` y una descripción corta en castellano.
3. Push. Lo que llega a `main` y toca `sanzo-web/` se publica solo en https://sanzo-web.vercel.app.
4. Contarle al usuario en una o dos frases qué cambió y dónde se ve.
