# Editor de videos de Sanzo

Acá Claude edita los reels/TikToks de Sanzo (accesorios para perros, Argentina) a partir de lo que Santino o Renzo dejan en las carpetas. Hablales en castellano rioplatense y simple.

## Carpetas

- `1-crudos/` — lo que se grabó con el celu, sin tocar. Nunca modificar ni borrar estos archivos.
- `2-referencias/` — 3 a 5 reels que les gustan (de Sanzo o de otros) para copiar el estilo. Con eso Claude arma/actualiza `HOJA-DE-ESTILO.md` (ritmo de cortes, tipo y posición de subtítulos, colores, transiciones, música, gancho). Esa hoja manda sobre los "por defecto" de abajo.
- `2-material/` — cosas para sumar: `musica/`, `logos/` (está `logo_sanzo.png`), y cualquier foto o clip extra (b-roll).
- `3-listos/` — acá van los videos terminados. Un nombre claro por video, ej. `2026-11-02_collar-cuerina.mp4`.
  - Una carpeta por video: `3-listos/<fecha> <nombre>/` con SOLO la última versión + su portada. Hojas de opciones en `3-listos/_opciones/`. Nada suelto en la raíz de `3-listos/`.
  - Cuando se publica: mover a `videos ya publicados/<nombre>/` con `video final ….mp4`, `portada.png` y `descripcion.txt`.
  - Lo que haya que borrar (versiones viejas, intermedios) va a `3-listos/_para-borrar/` y lo borra Santino.
- `herramientas/` — scripts. Trabajos intermedios en `3-listos/_tmp/` y borrarlos al terminar.

## Herramientas instaladas

- `ffmpeg` / `ffprobe` (cortar, unir, recortar a 9:16, música, logo, velocidad, exportar).
- `python herramientas/subtitular.py ENTRADA SALIDA` — transcribe en español con Whisper y quema subtítulos estilo reel (blancos con borde, 3 palabras por pantalla). Deja también un `.srt` para corregir palabras y volver a quemar con `--desde-srt archivo.srt`. Primera vez descarga el modelo (~500 MB). Corre en CPU: un minuto de video tarda un par de minutos.
- `animaciones/` — proyecto **Remotion** (React → video) para placas de título, textos animados, precios, intros/outros. Colores, fondo y letra Jost de la marca están en `src/marca.jsx`: usarlos siempre. Ya tiene `Titulo` (logo, título, etiqueta marrón, puntitos de progreso). Render: `npx remotion render src/index.jsx Titulo ../3-listos/_tmp/titulo.mp4 --props='{"texto":"...","subtitulo":"..."}'`. Imágenes que use van en `animaciones/public/`. Crear nuevas composiciones en `src/` y registrarlas en `src/index.jsx`. Después se pegan al video con ffmpeg (concat o overlay).
- **HyperFrames** (instalado en `animaciones/`, `npx hyperframes --help`) — animaciones hechas en HTML/CSS. Útil para pantallas tipo "paso 1, paso 2" como el reel de ejemplo, capturas de la web de Sanzo (`npx hyperframes capture <url>`) y detectar beats de la música (`npx hyperframes beats`). Arrancar con `npx hyperframes init <nombre>` dentro de `animaciones/`.
- `herramientas/voz.py` — voz IA + tiempos por palabra (`public/<nombre>/tiempos.json`). Por defecto edge-tts (es-AR-TomasNeural); con `--motor elevenlabs [--voz-id ID]` usa ElevenLabs (clave en `herramientas/.elevenlabs-key`, nunca subirla; plan gratis = no comercial + crédito).
- `herramientas/recortar_objetos.py HOJA.png SALIDA prefijo` — recorte para objetos grises/claros (chapitas). `recortar_poses.py` y `recortar_ia.py` les borran la parte de abajo (regla de la sombrita gris), no usarlos para chapitas.
- `herramientas/sfx.ps1` — genera efectos de sonido propios (whoosh, pop, clic, bonk, láser, ding, rasquido, glup, tada, nervios) en `animaciones/public/sfx/`, sin derechos. En Remotion van con `<Sequence from><Audio>` en el momento del guion. Exportar también una pista "solo efectos" (`--codec=wav --props='{"voz":false}'`) para que Santino grabe su voz encima.
- `recursos/` — repos de referencia bajados (solo lectura, NO instalados todavía):
  - `lemo-opuscar/`: 66 estilos de video hechos con código, cada uno con su `styles/<slug>/STYLE.md`. Útiles para Sanzo: `teardown` (vista desarmada de producto), `glass-product` (render premium de producto), `tilt-shift`, `memphis-diorama`, `lowpoly-island`, `paper-popup`, `isometric-picture-book`. `TECHNIQUE.md` y `DIRECTOR.md` tienen buenas reglas de ritmo, sonido (sfx procedurales) y mezcla (−14 LUFS). Su instalación (`setup.sh deps`) pide WSL en Windows: no correrla sin preguntar.
  - `ClaudeAnimationBase/`: guía de animación de personajes (`ANIMATION_GUIDE.md`): anticipación, squash & stretch, timing "una lectura a la vez", reacciones con signos (! ? sudor). Leerla antes de animar a Pepe.
  - `whatif-3d-studio/`: guía (`whatif_guide.md`) del formato "patio cortado como torta" (You Built It, 13M vistas) hecho en Blender: candidato para pasar Pepe a Blender. Blender 4.5 LTS YA instalado (nov 2026): ver `blender/PLAN-blender.md` (Eevee, Rigify, modelo CC-BY y pasos).
  - `motion-prompt/`: 120 movimientos de cámara/UI/transiciones con su prompt, para mejorar el movimiento de cualquier video.
  - `3d-product/`: skill para films de producto premium con Blender + Cycles. Requiere instalar Blender (no está). Para cuando querramos tomas hiperrealistas del collar.
- `yt-dlp` para bajar un video de referencia si pasan un link público.
- Python: `C:\Users\santi\AppData\Local\Programs\Python\Python312\python.exe` (el `python` del PATH es el atajo de la Store y no anda).

## Cómo editar (por defecto, si no piden otra cosa)

1. Mirar qué hay en `1-crudos/` con `ffprobe` (duración, resolución, orientación) y, si hace falta entender el contenido, sacar algunos cuadros con `ffmpeg -ss T -frames:v 1` y mirarlos, y transcribir con `subtitular.py --solo-srt`.
2. Leer `HOJA-DE-ESTILO.md` si existe. Armar un storyboard corto (toma por toma: segundos, qué se ve, texto en pantalla, animación) y mostrarlo; arrancar sin esperar si el pedido es claro. Después ajustar con lo que digan, como con un editor humano.
3. Formato final: vertical 1080x1920, 30 fps, H.264 + AAC, `-movflags +faststart`. Duración ideal 15–45 s.
4. Cortar silencios y tomas muertas, que el ritmo sea ágil. Si hay música en `2-material/musica/`, bajarla debajo de la voz (~-18 dB respecto a la voz) o usarla sola si no hay voz.
5. Subtítulos si hay voz. Logo chico al final (o en una esquina) sólo si lo piden.
6. Guardar en `3-listos/`, decir dónde quedó y qué se hizo en pocas líneas.

## Reglas de Santino (aprendidas en "Del piolín al collar", nov 2026) — cumplirlas siempre

**Cómo se trabaja (cualquier video, cualquier cuenta): `FLUJO-DE-TRABAJO.md`** (guion → material en paralelo → armado → revisor independiente hasta PASA → entrega).
**Antes de cualquier video leer `CORRECCIONES.md`** (todas las correcciones con fecha; no repetir ninguna).
**Videos 2D de Pepe: seguir `SERIE-DIARIO-DE-UN-SALCHICHA.md`** (receta completa: imágenes, entrega, portada, descripción).
**Siempre aplicar `METODO-CALIDAD.md`** (revisor independiente, primer/último cuadro, ángulos y movimiento, 38/62 y paleta, reacciones escalonadas, registro de errores, revisar cortes).
**Y leer `DINAMISMO.md`** (ritmo, cámara, transiciones, actuación) y `ESTILO-SANZO.md`.

**Proceso**
- Antes de animar: pasarle el GUION en texto y esperar su OK. Antes de renderizar el video completo: esperar su OK explícito ("ok", "hacé el video").
- Leer TODOS sus mensajes nuevos antes de rehacer algo (manda varias correcciones seguidas). Juntar todo en una sola versión.
- Probar con cuadros sueltos (`npx remotion still`) y recién renderizar con OK. Después del render, revisar el MP4 real con tiras de cuadros seguidos (el titileo no se ve en cuadros sueltos).
- Mandar UNA sola versión (la del render, normalizada a -16 LUFS). NO hacer copia liviana (pedido de Santino, 5-nov-2026). Sin música: la pone él en la app.

- Ahorrar tokens: tocar SOLO las escenas que tienen corrección; no rehacer ni revisar lo que ya estaba aprobado.

- VOZ (nov 2026): la genera Santino en la web de ElevenLabs con una voz argentina y manda el mp3 (o lo deja en `1-crudos/`). Claude le pasa el guion en texto plano para pegar, y con el audio saca los tiempos por palabra con `python herramientas/tiempos_audio.py GUION.json AUDIO.mp3 animaciones/public/<nombre>` (Whisper + alineado con el guion; deja voz.mp3 y tiempos.json en el mismo formato que voz.py). No usar la API de ElevenLabs para voces de la biblioteca (el plan gratis no lo permite). Vale para Remotion y para Blender.

**Contenido**
- Nada de publicidad directa: contenido interesante y la marca recién al final.
- Datos del producto reales: herrajes de PLÁSTICO (hebilla, argolla, regulador), cuerpo de cinta tejida + forro acolchado, la cuerina es SOLO el parche personalizado pegado. No decir acero ni "collar de cuerina".
- Guion con lógica de historia (ej: arranca con un cachorro y después ese mismo cachorro crece).
- No repetir conectores ("entonces" en cada frase cansa): variar "así que", "la solución", "por eso", o ir directo.
- Tampoco repetir fórmulas ("eso se llama X" en cada frase): variar ("le dicen", "el famoso", solo el nombre con dos puntos, un remate con humor).
- Ritmo entretenido, no "acelerar por acelerar": alternar momentos rápidos (cortes seguidos en los problemas) con una pausa corta antes de cada revelación, cámara lenta en momentos clave, y que los cortes caigan con la voz.

**Visual**
- Cada frase con un plano distinto (dron, frontal, contrapicado, perfil, macro, cenital, subjetivo, rayos X, corte). Nunca el mismo ángulo seguido.
- Cada acción tiene que VERSE, no solo decirse: la hebilla se abre y engancha con ¡CLIC!, el regulador corre y afloja, la pata rasca el cuello, flechas que muestran cómo se reparte la fuerza.
- Exagerar como dibujo animado: cara roja si lo ahorca, venita roja de enojo (como anime) si le molesta, signos de pregunta y gotita de miedo, ojos saltones, temblor.
- **Pepe ahora es SALCHICHA negro y fuego** (nov 2026, "La pelea estelar"): Santino rechazó el frenchie low-poly ("horrible", "parece hecho de bolas", no le gustó la cara). Modelo en `animaciones/src/pelea/Pepe.jsx`: cuerpo y cabeza de una sola pieza (tubos con `tuboGeo`), ojos de dibujo con blanco e iris marrón, cejas de fuego, sonrisa. Nunca armar personajes pegando esferas.
- Perro: bulldog francés blanco con manchas negras. Ojos sobre la cara. (DESCARTADO, ver arriba) La chapita cuelga centrada de la argolla D, de frente. El láser graba letra por letra.
- Subtítulos: letra Jost blanca con sombra, SIN recuadro, palabras clave en dorado y subrayadas.
- Nada de "vistas desarmadas" que se ven como bug.
- Para explicar algo interno (capas, materiales), mejor una lupa 2D clara con capas rotuladas que un objeto 3D flotando.
- El perro va FACETADO y más cuadrado (low-poly), no redondeado: Santino probó el suave y le gustó menos (`Liso` en false).
- Nada puede atravesar el cuerpo del perro (piolín, collar): si algo aprieta, el cuello se afina con eso.
- Efectos de sonido: bajos respecto de la voz (~19 dB por debajo en promedio), sin repetir el mismo sonido igual (variar tono o saltear), y no sumar un efecto en cada evento.
- Tiene que sentirse PREMIUM: nada de planos grotescos (primerísimos planos donde el modelo low-poly llena la pantalla, ángulos raros que deforman). Preferir planos con aire, movimientos de cámara suaves, luz cálida y prolija, fondo desenfocado en los detalles.

- Fondos: SIEMPRE con algo que haga referencia a Argentina (jacarandás, bandera, colectivo, kiosco con filete, mate, Obelisco, baldosas de vereda). Paisaje con sombras y lo más realista posible dentro del low-poly.
- Logo de Sanzo: usar la imagen real (`animaciones/public/arnes/logo-texto.png`), nunca dibujarlo. En el arnés va estampado en la pechera.
- Arnés Sanzo: pechera MARRÓN con BORDE BEIGE (forma de reloj de arena) y etiqueta rectangular beige con el logo adentro, cintas marrones, 2 reguladores arriba de la pechera y abajo 1 regulador + 1 sola hebilla de encastre (corregido por Santino, nov 2026), argolla de la correa en la espalda. Todo pegado al cuerpo (nada separado).
- Sumar elementos de reel en cada video (medidores, barra de progreso, contadores, etiquetas), no solo el 3D.
- Sonidos importantes (ej. tos) tienen que entenderse: reforzar con onomatopeya en pantalla ("¡COF!").

**Técnico (Remotion + three)**
- Materiales que cambian de modo (con/sin textura, transparente o no) necesitan `key` distinto por modo; si no, en el render en paralelo el objeto desaparece en algunos cuadros (titileo).
- PowerShell 5 guarda con BOM: escribir archivos con UTF-8 sin BOM.
- Imágenes como textura en three: cargarlas a nivel módulo con `new Image()` + delayRender/continueRender (TextureLoader dentro del árbol de R3F no llegaba a tiempo y no se veían).
- En ffmpeg `bandpass=w=` es Q por defecto: usar `width_type=h` (si no, el efecto queda casi mudo; pasó con whoosh y rasca hasta nov 2026).

## Ojo

- No inventar texto de producto ni precios en pantalla sin confirmación.
- Si el audio de una toma tiene la voz de alguien diciendo algo que no corresponde, preguntar antes de usarla.

- Antes de quemar subtítulos, revisar el .srt: Whisper a veces escribe mal nombres (el script ya corrige 'Sanzou' -> 'Sanzo').
- Si 'ffmpeg' no aparece en una terminal vieja, sumar al PATH: $env:LOCALAPPDATA\Microsoft\WinGet\Links
