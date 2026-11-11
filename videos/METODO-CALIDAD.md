# Método de calidad para videos (aprobado por Santino, 6-nov-2026)

Se suma a todas las reglas de videos (`CLAUDE.md`, `/video`, `SERIE-DIARIO-DE-UN-SALCHICHA.md`, `HOJA-DE-ESTILO.md`, `DINAMISMO.md`). No reemplaza las reglas que ya están: el guion va antes de animar y el render necesita su OK.
Idea base, tomada de una guía de videos con IA: **frenar los errores antes de que cuesten**. Lo que se puede ver en el texto no tiene que llegar a la imagen, y lo que se puede ver en la imagen no tiene que llegar al render. No usamos Seedance.

## 1. Revisor independiente (subagente que no sabe nada)
- Antes de animar, antes de renderizar y antes de mostrar el render, abrir un **subagente nuevo**. Se le pasa solo el material (guion, imágenes o cuadros del render) y nada de lo que se habló. **Solo marca errores, no toca archivos.**
- Primer pase "como espectador": que cuente con sus palabras qué historia entendió. Si no la entiende, la historia no está clara.
- Después pregunta en cada giro: ¿por qué pasa esto? ¿de dónde sale este objeto? ¿se entiende en una frase qué quiere contar el video? ¿el arranque engancha?
- Cada problema va así: plano, problema y cómo arreglarlo. Termina con "pasa" o "no pasa".

## 2. Primer y último cuadro de cada plano
- Los objetos que se usan en el plano (gorra, moño, chapita, mate…) tienen que estar **en el primer y en el último cuadro**. Nada aparece de la nada.
- El fondo es el mismo en los dos cuadros: no cambia de color ni de tamaño ni cambia de lugar.
- Las imágenes de ChatGPT se revisan **con zoom** antes de usarlas, buscando líneas sueltas, objetos de más, bordes blancos o partes cortadas. También se miran achicadas a tamaño celular.

## 3. Ángulos, tamaños y movimiento
- Cambiar de **ángulo y de tamaño de plano** entre escenas: general, medio, primer plano. Usar pocos planos frontales; probar picado, contrapicado, de espaldas, sobre el hombro o a través de algo.
- **Siempre tiene que haber algo moviéndose**: el personaje, algo que entra o sale de cuadro, la cámara, el foco o algo en primer plano.
- Cada movimiento de cámara tiene un **motivo**: seguir algo, acercarse para un detalle o alejarse para revelar. Lo que tiene que estar quieto se deja quieto, así contrasta.

## 4. Composición y color
- Ubicar al sujeto (los ojos o la cabeza) a un **38 % o 62 % del ancho**, no en el centro. La excepción son los planos simétricos a propósito.
- Definir la **paleta de cada escena antes de dibujar** y anotarla como tabla en el plan del video.
- Chequear el **contraste en blanco y negro** (`ffmpeg -vf hue=s=0`). Si el personaje se pierde con el fondo, hay que ajustar los colores.

## 5. Reacciones escalonadas
- **Nunca dos personajes reaccionan en el mismo cuadro.** Uno reacciona y el otro lo hace 4 a 8 cuadros después.
- Cada gag tiene tres partes: problema, solución del protagonista y reacción de los demás.

## 6. Registro de errores por video
- Cada video tiene su sección en `CORRECCIONES.md`, con fecha y número de versión. Ahí va qué corrigió Santino y qué se aprendió.
- Antes de un video nuevo, leerlo entero para no repetir errores.

## 7. Revisión de cortes antes de mostrar
- Antes de mostrarle un render a Santino, sacar los **3 cuadros de antes y los 3 de después de cada corte** con ffmpeg y mirarlos. Ahí aparecen los saltos, los cuadros en negro, las imágenes que no cargaron y las transiciones toscas.
- Lo que no se puede comprobar, como el movimiento real o el sonido, hay que decírselo a Santino tal cual.
