# sanzo — tienda

Landing de venta de un solo scroll con checkout propio. Next.js + TypeScript + Tailwind, lista para Vercel.

## 1. Correrlo en local

```bash
npm install
npm run dev
```

Abrí http://localhost:3000. Sin variables de entorno, los pedidos se imprimen en la terminal en vez de mandarse por mail.

## 2. Fotos

- Subí las fotos a `public/productos/` (podés armar carpetas: `public/productos/kit/1.jpg`).
- En `data/products.ts`, en el producto que corresponda, poné las rutas **sin** `public`:

```ts
imagenes: ["/productos/kit/1.jpg", "/productos/kit/2.jpg"],
```

- La primera foto es la principal; si hay varias, van cambiando solas. En productos individuales, solo fotos del producto (sin perros).
- Proporción recomendada: 4:5 vertical (ej. 1080×1350). Combos: 5:4.
- Fotos del hero (van rotando): `sitio.hero.imagenes` en `data/products.ts`.
- Logo: subí `public/logo-sanzo.png` y aparece solo (hasta entonces se muestra el texto "sanzo").
- Imagen para compartir en redes (Open Graph): para usar una foto, borrá `app/opengraph-image.tsx` y poné `app/opengraph-image.jpg` (1200×630).

## 3. Precios, links de pago, envíos y contador

Todo en `data/`:

| Qué | Dónde |
|---|---|
| Precio de cada producto | `data/products.ts` → `precio: 45000` (`null` = "Precio próximamente" y botón deshabilitado) |
| Link de Mercado Pago | `data/products.ts` → `linkPago: "https://mpago.la/..."` |
| Contador "Quedan X de 50 kits" | `data/products.ts` → `contadorKits.restantes` (`null` lo oculta) |
| Guía de talles | `data/products.ts` → `guiaTalles` |
| Textos (barra superior, hero, FAQ, redes, mail) | `data/products.ts` → `sitio` y `preguntas` |
| Producto disponible o no | `data/products.ts` → `disponible: false` |
| Precio de envío por zona | `data/envios.ts` → `zonas[].precio` (`null` = "A cotizar") |

Si el carrito tiene el kit completo, el envío es gratis para todo el pedido.

**Cobro con Mercado Pago (Checkout Pro):** con `MP_ACCESS_TOKEN` cargado en Vercel, al confirmar el pedido el cliente va a la página de pago de Mercado Pago con el total exacto del carrito (productos, personalización y envío). Ahí paga con tarjeta de crédito, débito (sin cuenta) o con su cuenta de MP, y vuelve a `/gracias`. El número de pedido llega a MP como referencia externa. Si el envío está "a cotizar", no hay total cerrado: el pedido se registra y le escribís con el link.

Sin `MP_ACCESS_TOKEN`, solo redirige al `linkPago` fijo del producto cuando el pedido es un único producto, 1 unidad, sin envío a cobrar; en cualquier otro caso muestra "Pedido recibido".

## 4. Variables de entorno en Vercel

Settings → Environment Variables:

| Variable | Para qué |
|---|---|
| `RESEND_API_KEY` | API key de [Resend](https://resend.com) para mandar el mail de cada pedido |
| `PEDIDOS_EMAIL` | Mail donde llegan los pedidos (podés poner varios separados por coma) |
| `PEDIDOS_FROM` | Opcional. Remitente, ej. `sanzo <pedidos@tudominio.com>`. Tiene que ser de un dominio verificado en Resend. Si no lo ponés, se usa `onboarding@resend.dev`, que **solo** manda al mail de tu cuenta de Resend |
| `MP_ACCESS_TOKEN` | Access Token de **producción** de Mercado Pago (Tus integraciones → tu aplicación → Credenciales de producción). Activa el pago online. Después de cargarlo, hacé Redeploy |
| `NEXT_PUBLIC_SITE_URL` | Opcional. URL final del sitio (ej. `https://sanzo.com.ar`) para las previews en redes |

Si el mail falla, el pedido igual queda en los logs de Vercel (Runtime Logs).
