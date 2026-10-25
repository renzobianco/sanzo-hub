# Sanzo Hub

App de gestión interna de **Sanzo**, accesorios premium para perros. Ventas, gastos, stock, pedidos a China, gráficos, objetivos y clientes, con las dos monedas (USD / ARS) y tipo de cambio configurable.

## Cómo correrla

```bash
npm install
npm run dev
```

Abrí `http://localhost:5173`. Para generar una versión estática (carpeta `dist/`) que se puede subir a Vercel, Netlify o cualquier hosting:

```bash
npm run build
```

Desde el celular en la misma red Wi-Fi: `npm run dev -- --host` y entrá a la IP que muestra la consola.

## Datos y backups

- Los datos del negocio (ventas, gastos, calendario de contenido, etc.) viven en una base **Supabase compartida** entre Santino y Renzo, con un caché en `localStorage` para arrancar rápido y como resguardo si se corta la conexión. Ver `src/context/AppContext.jsx` y `supabase/schema.sql`.
- **Exportar backup** (barra lateral o menú del perfil) descarga un JSON con todos esos datos, fotos incluidas.
- **Importar backup** (botón "Importar" arriba a la derecha) reemplaza todo lo que hay en la base compartida por ese JSON. Lo ven los dos.
- Si pasan más de 7 días sin exportar, aparece un aviso.
- Las fotos se reducen a 900 px y se guardan en base64 dentro del backup.
- La clave de API de Buffer (ver más abajo) es la única excepción: vive solo en el `localStorage` de cada navegador, nunca en Supabase, y por eso **no** sale en el backup.

## Secciones

| Sección | Qué hace |
| --- | --- |
| Inicio | KPIs del mes, tendencia de 30 días, últimos movimientos, fase actual, tipo de cambio (con historial y mini-tarjeta "Dólar hoy"), foto de portada, "Contenido de hoy". |
| Ventas | Alta/edición/baja con descuento automático de stock, filtros, totales del período y ticket promedio. |
| Pedidos web | Lo que entra por la tienda (sanzo-web). Pagado con Mercado Pago → se pasa solo a Ventas (descuenta stock, suma a la ganancia); "a coordinar" → botón Confirmar venta. Necesita `supabase/migrations/005_web_orders.sql`. |
| Gastos | ARS o USD, guardando la cotización del día del gasto (histórico) y mostrando también cuánto valdría hoy; categorías, gastos fijos mensuales con recordatorio para cargarlos. |
| Productos y stock | Costo USD, precio ARS, margen, stock con alerta configurable, ajustes con motivo e historial, valor del inventario. |
| Calendario | Planificador de contenido (Reels, Historias, carruseles, fotos) con estados, pilares, racha y cadencia, y programación directa en Buffer. |
| Gráficos | Ventas, gastos, recupero de inversión y estadísticas del calendario de contenido. |
| Pedidos a China | Órdenes al proveedor con FOB, flete y otros; costo unitario final prorrateado; guarda la cotización del día del pedido; al recibir suma stock y registra el gasto. |
| Objetivos y fases | Fases 01/02/03 con progreso, metas automáticas y manuales, seguidores semanales por red, punto de equilibrio. |
| Clientes | Se arma sola desde las ventas; filtros "2+ compras" e "interesados"; carga manual desde DMs. |
| Ajustes | Conexión con la API de Buffer, fuente del tipo de cambio (oficial/blue automático o manual). |

## Integración con Buffer

El Calendario puede programar publicaciones directo en [Buffer](https://buffer.com) (API GraphQL, `https://api.buffer.com`) en vez de copiar y pegar a mano.

**Configuración:** cada socio pega su clave de Buffer (Buffer → Settings → API) en **Ajustes**. La clave se guarda en el `localStorage` de ese navegador — nunca en Supabase, nunca en el backup.

**Por qué hay un proxy:** la documentación de Buffer pide explícitamente no llamar a la API desde el navegador ("*API calls should be made from your server, not from a browser or mobile app*"), y además el endpoint bloquea CORS. Por eso el cliente (`src/lib/buffer.js`) nunca llama a `api.buffer.com` directo: llama a `/api/buffer`, que reenvía la request tal cual (agregando solo el header `Authorization` que ya mandó el navegador):

- **En desarrollo**, ese reenvío lo hace el proxy de Vite (`vite.config.js`, `server.proxy`), que redirige `/api/buffer` → `https://api.buffer.com`.
- **En producción (Vercel)**, lo hace la función serverless `api/buffer.js` (se despliega sola por convención de Vercel, no necesita configuración extra).

En ningún punto la clave queda hardcodeada en el proxy: siempre viaja en el header que arma el cliente a partir de lo guardado en `localStorage`.

**Qué hace cada botón:**
- **Copiar para Buffer**: caption + hashtags al portapapeles (siempre disponible, no depende de la API).
- **Programar en Buffer**: valida fecha/hora/caption/redes, arma el texto y llama a `createPost` una vez por canal (Buffer solo acepta un canal por llamada). Si hay al menos un éxito, la publicación pasa a "Cargado en Buffer" y guarda el/los ID de post de Buffer.
- **Programar semana en Buffer**: toma las publicaciones "Listo para publicar" de los próximos 7 días que ya tengan URL de archivo cargada y las programa todas, mostrando un resumen.
- Si una publicación ya programada se edita, avisa que el cambio no se refleja solo en Buffer y ofrece borrarla de Buffer (`deletePost`) para reprogramarla.

**Subir el video/imagen:** en el formulario de cada publicación se puede elegir un archivo directo (se sube a un bucket público de **Supabase Storage**, `sanzo-content-media` — hace falta correr `supabase/migrations/003_content_media_storage.sql` una vez) o pegar un link público a mano (Drive, etc.) con el botón "o pegá un link". El bucket es público a propósito: Buffer necesita poder descargar el archivo desde una URL pública para programarlo. Al borrar una publicación, o al reemplazar/cancelar una subida sin guardar, el archivo se borra del bucket para no acumular basura contra el límite de espacio del plan (1 GB en el free tier de Supabase).

## Tipo de cambio: DolarApi.com

El tipo de cambio que usa toda la app (Gastos, Productos, Pedidos a China, Dashboard, Gráficos) puede venir de tres fuentes, elegibles en **Ajustes** o tocando el chip "USD 1 = $…" del Dashboard:

- **Oficial (automático)** — default.
- **Blue (automático)**.
- **Manual** — el comportamiento histórico: lo carga el usuario a mano.

En modo automático, `src/services/dolar.js` trae oficial + blue de una sola vez desde [DolarApi.com](https://dolarapi.com/docs) (`GET https://dolarapi.com/v1/dolares`, gratis y sin API key) y guarda el resultado en caché (`localStorage`, 45 min) para no pegarle de más. `src/context/AppContext.jsx` mantiene `settings.exchangeRate` — el valor que ya usa toda la app — sincronizado con la cotización elegida cada vez que llega una nueva; en modo manual no lo toca. Si la API falla, se usa el último valor guardado en caché (marcado como desactualizado) en vez de romper algo; si nunca hubo caché ni respuesta, la app sigue con lo último que había en `settings.exchangeRate`.

**Sobre CORS: no hace falta proxy.** A diferencia de Buffer, probamos la llamada directa desde el navegador (`curl` con `Origin` seteado) y DolarApi.com responde con `Access-Control-Allow-Origin: *`, así que el cliente le pega directo tanto en desarrollo como en producción — no hay `server.proxy` en `vite.config.js` ni función serverless para esto, y no hace falta tocar nada al desplegar en Vercel.

**Costos históricos vs. valor de hoy:** un gasto o pedido en USD guarda la cotización del día en que se cargó (`expense.rate` / `order.rate`, ya existía para gastos, se agregó para pedidos). Eso evita que los totales históricos cambien solos cada vez que se mueve el dólar. Gastos y Pedidos muestran ambos números cuando difieren: lo que costó ese día y lo que valdría a la cotización vigente. Los gastos viejos sin cotización guardada usan la vigente como estimación y lo aclaran.

## Cómo se calcula el recupero de inversión

Se usa la **ganancia bruta acumulada**: por cada venta, precio cobrado menos el costo unitario en USD del producto (cargado en Productos) al tipo de cambio actual. Cuando esa ganancia iguala la inversión inicial (USD 2.000 por defecto, editable en el menú del perfil), la curva cruza la línea y el punto de equilibrio marca "inversión cubierta".

## Stack

React 19 + Vite, Recharts para los gráficos, CSS propio con la paleta de la marca (`src/index.css`). Supabase como base compartida (`src/lib/supabase.js`, `supabase/schema.sql`), sin backend propio salvo el proxy serverless de Buffer (`api/buffer.js`).

## Correo Argentino (envíos de Pedidos web)

En cada pedido web, **Generar envío** lo da de alta en Correo Argentino (API PAQ.AR v1, manual "Plataforma de Integración – Api 2.0") con los datos del cliente, guarda el número de seguimiento en el pedido (`envioCorreo`) y deja bajar la **etiqueta 10x15 en PDF**. Si retira en sucursal, se elige la sucursal de una lista que trae la API. **Anular** cancela el envío mientras no se haya despachado.

- Todo pasa por la función serverless `api/correo.js` (en `npm run dev` no existe: usar `vercel dev`). Los datos del envío los lee del pedido en Supabase, no del navegador.
- **Credenciales** (las da el área Comercial de Correo Argentino), en Vercel → proyecto sanzo-hub → Environment Variables: `CORREO_AGREEMENT` (número de acuerdo) y `CORREO_API_KEY`. Opcionales: `CORREO_SERVICIO` (tipo de servicio, default `CP`) y `CORREO_TEST=1` para usar el ambiente de prueba. Después, Redeploy.
- **Remitente y paquete por defecto** (medidas en cm, peso en gramos): Ajustes → Correo Argentino. Ahí también se ve si la conexión anda.
- La API no cotiza precios: el precio del envío que paga el cliente sale de `sanzo-web/data/envios.ts`.
