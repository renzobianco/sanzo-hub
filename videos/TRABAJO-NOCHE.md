# Trabajo de la noche (2026-11-01 → 02) — Claude de la terminal

Santino se va a dormir y te deja laburando solo toda la noche. Nadie va a contestar preguntas hasta la mañana: **no te frenes a preguntar**. Si algo no se puede, anotalo en `INFORME-NOCHE.md` y seguí con lo siguiente.

Leé antes: `CLAUDE.md` (sobre todo "Reglas de Santino"), `HOJA-DE-ESTILO.md`, `blender/PLAN-blender.md` (sección "Hecho"), `GUIONES-blender.md`, `2-referencias/LINKS-nivel-objetivo.md`.

## Permiso especial para esta noche
- Santino autoriza renderizar los videos COMPLETOS sin esperar su OK (solo esta noche). A la mañana él revisa y manda correcciones.
- Los datos de producto sin confirmar (✔?) NO se dicen en el video: reescribí esa frase para que no afirme el dato (ej. "una manija cómoda" en vez de "acolchada"; nada de "destorcedor" si no está confirmado) y anotá la duda en el informe.

## Respuestas de Santino (2026-11-02) — mandan sobre los guiones
- Correa: NO tiene nada reflectivo (no mencionarlo). Manija acolchada y mosquetón giratorio: sin confirmar → no afirmarlos.
- Porta bolsitas: SÍ se engancha a la correa con un mosquetón.
- Chapita: grabado láser, puede llevar lo que quieras. Usar "PEPE" + un teléfono ficticio que no se lea completo (ej. "11 •••• ••••").
- Pepe: blanco con manchas negras (hocico/máscara también al estilo del Pepe anterior, no todo negro). Look realista de Blender, no facetado (para estos videos manda esto sobre la regla de "facetado").
- Orden: arrancar por el guion 1 (correa).
- Dueño: solo manos, brazos y piernas (nunca la cara ni una persona entera).
- Cierre: "Ya disponible en nuestra web" + nombre del producto animado, como el del collar.
- TEXTOS FINALES DE LA VOZ: `2-material/voz/correa.txt`, `chapita.txt`, `bolsitas.txt`. Santino los genera en ElevenLabs y deja `correa.mp3`, `chapita.mp3`, `bolsitas.mp3` en esa carpeta. Si el mp3 ya está, usalo directo (tiempos con Whisper) en vez de edge-tts. Ajustá los planos de cada guion a estos textos (mandan sobre `GUIONES-blender.md`).

## Orden de trabajo
1. **Referencias** (máx. 30 min): hacé lo de `2-referencias/LINKS-nivel-objetivo.md`. Si Instagram no deja bajar, salteá y anotalo.
2. **Biblioteca de recursos** en `2-material/assets/` (una carpeta por tipo: `cielo/`, `animales/`, `personas/`, `props/`, `texturas/`, `hdri/`):
   - Solo licencias libres: **CC0** primero (Poly Haven: HDRIs de cielo/atardecer, texturas de vereda/pasto/ladrillo, modelos; Quaternius y Kenney: animales low-poly, personas, props, palomas/pájaros), después **CC-BY** (Sketchfab, sesión sanzopets ya abierta en Chrome).
   - Nunca modelos "Standard/Editorial" ni sin licencia. Nada que pida tarjeta o crear cuentas.
   - Cada archivo que bajes va a `2-material/assets/CREDITOS.md`: nombre, autor, link, licencia. Los CC-BY van en la descripción del reel.
   - Necesarios: cielo con nubes (HDRI), palomas/pájaros, una persona o al menos manos/brazos (rig), correa/mosquetón (o modelalo vos), tacho de basura, bolsa de súper, árbol de jacarandá o similar, colectivo, auto, banco de plaza, farol.
3. **Pepe caminando y corriendo**: ciclo de caminata y de carrera con el rig de `pepe_prueba.blend` (guía `recursos/ClaudeAnimationBase/ANIMATION_GUIDE.md`). Probá con cuadros sueltos antes de usarlo en escenas.
4. **Videos**, en este orden: guion 1 (correa), 2 (chapita), 3 (bolsitas) de `GUIONES-blender.md`. Para cada uno:
   - voz con `herramientas/voz.py` (edge-tts es-AR, voz actual) → tiempos de cada palabra
   - escenas en Blender (Eevee, 1080x1920, 30 fps), un plano distinto por frase
   - hoja de contacto + tira de cuadros seguidos del mp4 real para buscar titileos, cosas atravesando al perro o planos grotescos. Si hay errores, arreglar y volver a renderizar esa escena (máx. 2 intentos; si sigue mal, anotarlo).
   - subtítulos, overlays (medidores, onomatopeyas) y cierre con Remotion, como en los videos anteriores
   - guardar en `3-listos/2026-11-02_<nombre>_blender_v1.mp4` + `_sin-audio.mp4` + copia liviana `_liviano.mp4` (<20 MB)
5. **Si sobra tiempo**: escribí 3 guiones nuevos en `GUIONES-blender.md` (mismo formato, temas de la lista de `GUIONES.md` u otros que se te ocurran: collar, bandana, gorra, combo) y hacé el que te parezca mejor. Después rehacé "Por qué tu perro tose cuando tira" en Blender con `animaciones/guiones/arnes.json`.

## Para no trabarte ni romper nada
- Todo dentro de `D:\CLAUDIO\sanzo-hub\videos`. No toques `1-crudos/` ni la web (`sanzo-web`). No borres videos de `3-listos/` (solo tu `_tmp`).
- Rutas: en Bash usá rutas absolutas (`/d/CLAUDIO/sanzo-hub/videos/...`). La prueba anterior guardó en `C:\3-listos` por error.
- Comandos cortos y de a uno (sin `cd X && rm ...` encadenados): los compuestos piden permiso manual y a la noche nadie lo da.
- Renders largos en segundo plano y por tandas de cuadros (si se corta, que se pueda retomar).
- Voz: Santino va a generar él mismo la voz en la web de ElevenLabs y mandar los mp3 (uno por guion, a `2-material/voz/<nombre>.mp3`). Esta noche usá edge-tts como voz **provisoria**, pero armá todo para que cambiarla sea fácil: tiempos de escenas y subtítulos sacados de un `tiempos.json`, y un script/paso documentado para que, cuando llegue su mp3, se transcriba con Whisper (`subtitular.py --solo-srt`), se regeneren los tiempos y se re-renderice. Guardá también cada guion final en texto plano (`2-material/voz/<nombre>.txt`) para que él lo pegue en ElevenLabs. **Vos no usás ElevenLabs ni iniciás sesión en ninguna cuenta.**
- Si se acaba el límite de uso, no pasa nada: lo que quedó guardado sirve. Por eso guardá avances seguido.

## Al terminar (o antes de quedarte sin uso)
Escribí `INFORME-NOCHE.md`: qué videos quedaron (rutas), qué recursos bajaste, qué falló, qué datos tiene que confirmar Santino, y qué harías después. Corto y en castellano simple.
