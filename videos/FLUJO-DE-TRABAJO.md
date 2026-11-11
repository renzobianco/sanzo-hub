# Flujo de trabajo para cualquier video de Sanzo

Lo pidió Santino el 10-nov-2026. Cualquier Claude, de cualquier cuenta, sigue esto en cualquier video, sea cual sea el formato. Las reglas de estilo y las correcciones están en `CLAUDE.md`, `CORRECCIONES.md` y `METODO-CALIDAD.md`; este documento explica **cómo se trabaja**.

## La idea en una línea
Santino no tiene que encontrar errores. Claude genera, un revisor independiente verifica, Claude arregla y repite, y a Santino le llega solo lo que pasó la revisión. La meta es de 1 a 3 rondas con él por video, no de 7 a 10.

## Pasos

1. **Leer el contexto antes de arrancar**
   - `videos/CLAUDE.md`, `CORRECCIONES.md`, `METODO-CALIDAD.md`, `DINAMISMO.md` y `ESTILO-SANZO.md`.
   - Los aprendizajes del último video parecido. Por ejemplo, `video 14. imagenes para el video/APRENDIZAJES-video-ia-imagenes.md` para los videos de imágenes de ChatGPT.
   - La memoria del proyecto.

2. **Guion corto → OK de Santino**
   - Si hay referencia, mirarla primero. Bajar los reels con `yt-dlp` desde la compu, porque desde la nube Instagram bloquea.
   - Mandarle un guion de pocas líneas y esperar su OK antes de gastar en imágenes.

3. **Material en paralelo**
   - Las imágenes se hacen en ChatGPT Sanzo, verificando la cuenta con `/api/auth/session`: tiene que decir "Sanzo Co." y plan "plus". Si no, cambiar de Chrome.
   - Abrir **muchas pestañas a la vez**, un pedido en cada una.
   - Para que el fondo no cambie: generar una imagen base por lugar y hacer cada variante (luz, pose, boca, mano) en un **chat nuevo**, pegando la base y pidiendo "cambiá ÚNICAMENTE…".
   - Pedir cuadros intermedios para que se vea animado.
   - Revisar cada imagen con zoom antes de usarla.
   - Las voces las hace Santino en ElevenLabs: se le pasa el texto.

4. **Armado por código** (Python + OpenCV + ffmpeg; ejemplo: `video 15. imagenes para el video/edit/armar.py`)
   - Alinear cada variante a su base (ECC) e igualar el color. Pegar solo la zona que cambió, con borde suave, para que el fondo quede quieto.
   - Movimiento de cámara continuo, sin volver a cero en los cortes.
   - Cambios de pose al instante, un gesto por escena (ida y, como mucho, vuelta).
   - Cortes secos y sin fundidos de luz.
   - Filtro en toda la pantalla.
   - Logo real (nunca dibujado por la IA).
   - Loop de 0,5 s como máximo.
   - Sonido bajito y nunca silencio digital total (siempre un ambiente muy bajo).

5. **Revisión independiente (lo más importante)**
   - Después de cada render, abrir un **subagente nuevo** que no sepa nada de la charla.
   - Se le pasa solo el video, qué debería contar y la lista de errores que ya marcó Santino.
   - Revisa cuadro por cuadro (cortes ±6 cuadros, diferencias, alineación del fondo) y el audio (picos, RMS, chasquidos, silencios). Termina con "PASA" o "NO PASA".
   - **Solo marca, no toca archivos.**
   - Claude arregla todo lo que marca y se lo vuelve a mandar al mismo revisor hasta que diga PASA.
   - Si algo es una regla de Santino y el revisor la malinterpreta, se le aclara la regla. No se ignora sin pensar.

6. **Entregar**
   - Una sola versión en `3-listos/`, con dos o tres líneas de qué es.
   - Decir con honestidad lo que no se pudo comprobar.
   - Al terminar, anotar los aprendizajes en la carpeta del video y en `CORRECCIONES.md`.

## Modelos
- El modelo potente (el que orquesta) planifica, decide qué arreglar y hace la revisión final.
- Lo mecánico va a modelos más baratos y en paralelo: sacar cuadros, medir saltos, analizar el audio, bajar archivos. Se usa `model: "sonnet"` o `"haiku"` en el subagente.
- Los modelos de Claude no generan video con movimiento real. Para eso hace falta imagen→video, como Higgsfield, que es lo que usa @unemployed_corp. Es pago y por defecto usa Seedance, que está descartado; usar otro modelo, como Kling, y solo con el OK de Santino.

## Comunicación con Santino
- Mensajes cortos: qué está listo, qué falta y qué necesita de él.
- No mostrarle versiones con errores conocidos. Si una revisión no pasa, se arregla primero.
- Leer todos sus mensajes juntos antes de rehacer algo.
