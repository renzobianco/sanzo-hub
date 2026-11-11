# Serie "Diario de un salchicha" (videos 2D de Pepe) — receta

Primer episodio publicado: **#1 La pelea estelar** (5-nov-2026, `animaciones/src/pelea2d/Pelea3.jsx`).
Cada video nuevo de este estilo se hace así, sin saltear pasos.

## 0. Método de calidad
- Aplicar `METODO-CALIDAD.md` en todo el proceso: el subagente revisor mira el guion, las imágenes y el render; se chequean el primer y el último cuadro; las imágenes de ChatGPT se miran con zoom; los ángulos varían; el sujeto va a 38/62; la paleta se define por escena y se mira en blanco y negro; las reacciones van escalonadas; los errores se registran en `CORRECCIONES.md`; se revisan los 3 cuadros de antes y de después de cada corte.

## 1. Guion y voz
- Pasar el guion en texto y esperar OK. Historia con lógica, humor, nada de publicidad (la marca al final).
- Voz: Santino la genera en ElevenLabs web y manda el mp3 → `herramientas/tiempos_audio.py`.

## 2. Imágenes (ChatGPT, cuenta "Sanzo Co." Plus)
- Usar el Chrome **"Browser 1"** (el que tiene la sesión Sanzo Co.). El "Browser 2" es ytmiani (plan gratis, límite de imágenes). Verificar con `chatgpt.com/api/auth/session`.
- Estilo: SIEMPRE adjuntar de referencia una imagen ya aprobada del mismo video (fondo + personaje). Pedir "exactly the same art style", no "más simple".
  - Fondos: trazo fino tinta, colores apagados (ej. `public/mono/f2-patio-asado.png`).
  - Personajes: Pepe salchicha negro y fuego, Rulo, gato atigrado (ej. `public/mono/sprites/gato-brazos.png`).
- Recortes: pedir "TRANSPARENT background (real alpha), no white halo" y pasar por `herramientas/recorte_listo.py`. Nada de borde blanco.
- Variantes (boca abierta, etc.): en el mismo chat, "EXACT same image, changing ONLY …".
- Nada dibujado en el fondo puede quedar debajo/delante de un personaje (ej. humo de la parrilla): sacarlo.

## 3. Animación (Remotion)
- Probar con stills, mostrar capturas, renderizar con el OK.
- Desenfoques: máscara con degradado, nunca corte recto.
- Textos/globos: cada frase aparece cuando se dice (no todo junto ni tarde).
- Efectos de sonido bajos; el ambiente del arranque no puede tapar la voz.
- Cambios: tocar SOLO lo que se pidió. No agregar elementos nuevos que no pidió.

## 4. Entrega
- UNA sola versión: render + `loudnorm=I=-16.3:TP=-1.5:LRA=11` en `3-listos/`. Sin copia liviana.
- Música: por defecto sin música (la elige Santino en TikTok). Con `herramientas/musica_codigo.py`: el **chiptune le gustó** (ep 1 se subió con eso), la cumbia quedó horrible. Música a ~-23 LUFS antes del ducking. No bajar temas con derechos.
- Mandar las versiones viejas a la Papelera.

## 5. Portada
- Composición `Portada` (`animaciones/src/portada/Portada.jsx`), plantilla **op 4 "Diario de un salchicha"**: hoja de cuaderno, "#N" y título en cinta amarilla.
- `npx remotion still src/index.jsx Portada 3-listos/portada-diario-NN-<titulo>.png --props='{"op":4,"ep":N,"titulo":"...","img":K}'`
- La imagen tiene que representar el video (ep 1 = nube de pelea `nube-2`). Si no hay una buena, crearla en ChatGPT (ej. Pepe con guantes `pepe-guantes`) y sumarla como `img` nuevo.

## 6. Descripción TikTok
- 1-2 líneas con gancho + pregunta para comentar + 3 a 5 hashtags. **Solo 1 o 2 emojis**: a Santino no le gustan muchos.
- Ej. ep 1: "La pelea más estelar del barrio 🥊🐾 Pepe vs. Rulo por UNA gorra… hasta que apareció el jefe final 😂 ¿Vos de qué equipo sos: Océano o Beige? 👇 #perrosgraciosos #salchicha #dachshund #humorperruno #argentina"

- Ej. ep 2: "Pepe se puso su moño para el asado del domingo y el gato del techo se lo quiso llevar 😾 Le salió el Dibu de adentro. ¿Ustedes también tienen un gato rival en el barrio? 👇" + mismos hashtags

## Episodios
| # | Título | Archivo | Estado |
|---|--------|---------|--------|
| 1 | La pelea estelar | 2026-11-05_pelea-estelar_v9 (+ chiptune) | publicado |
| 2 | ¿Qué mirás, bobo? | 2026-11-05_que-miras-bobo_v10.mp4 · portada-diario-02 (img 5) | listo para subir |
