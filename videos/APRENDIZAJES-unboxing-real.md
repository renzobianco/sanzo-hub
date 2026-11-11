# Unboxing con video real: receta y aprendizajes (nov 2026)

Sale del "Unboxing kit completo" (crudo `IMG_0066.MOV`, POV de 2:09 → reel de 47 s). Santino lo corrigió en 8 rondas; acá queda lo que funcionó y lo que no, para que el próximo salga en 1 a 3 rondas.

Scripts: `herramientas/unboxing-kit/` (copias de los que se usaron en `3-listos/_tmp/kit/`).
- `render_kit.py`: cortes, velocidades, encuadre, panel, portada animada y cierre (Python + OpenCV + PIL + ffmpeg).
- `textos_animados.py`: título de portada y textos animados letra por letra.
- `sonido_kit3.py`: mezcla de efectos de ElevenLabs con la música.
- `portada_final.py` y `portada_tiktok.py`: portadas.
- `portadas25.py` y `portadas_var.py`: hojas de opciones numeradas.

## 1. Cómo se arma
1. Primero sacar hojas de cuadros (cada 2 s, después cada 0,5 s y cada 0,25 s en los momentos clave) y anotar el segundo exacto de cada acción: sale de la bolsita, abrocha, estira, apoya.
2. Por toma: tramos de la fuente con su velocidad. Lo aburrido (buscar en bolsitas) va x2 a x3,5 con el chip "x3". **Las acciones clave van a velocidad normal**: sacar el producto de la bolsita, abrochar y desabrochar, estirar la correa o la bandana. La bandana estirada va en cámara lenta (0,7).
3. Promediar cuadros (desenfoque de movimiento) **solo en cámara rápida (x2 o más)**: a x1,2–1,5 deja fantasmas.
4. Cuando la búsqueda acelerada sigue en el producto, el corte va **de corrido**: mismo encuadre, sin golpe de zoom y sin flash blanco. El flash se ve como un parpadeo y el salto de encuadre se ve como un recorte mal hecho.
5. Formato: 1080x1920, 30 fps, x264 crf 18, AAC, `-movflags +faststart`. Loop: fundido de 5 cuadros al primer cuadro.

## 2. Gráficos (lo que quedó)
- **Portada**: tapa de revista (opción 18d). Borde crema que se dibuja desde arriba al centro, "KIT COMPLETO" en Playfair que baja letra por letra, línea fina y "SANZO" espaciado. **Salida**: el borde se "come" desde abajo hasta el punto donde arrancó y las letras se borran tipo máquina de escribir, con cursor. Lleva sonido de tecla por letra.
- **Panel arriba** ("KIT COMPLETO SANZO", contador 0/6, barra de progreso). Una pastilla marrón se desliza al producto que se está viendo y sus letras dan un saltito. Los nombres arrancan **pixelados** y se aclaran al salir el producto (hay versión sin pixelado). Al final suma el renglón "+ Chapitas grabadas".
- **Cierre**: el logo **sale del logo impreso en la caja** (último cuadro), cada letra viaja en arco al centro y la caja se funde con el crema. Después "Kit completo" letra por letra y la pastilla "Ya disponible en nuestra web" con rebote.
- Todo gráfico hecho con PIL se dibuja **al triple de tamaño y se achica**: PIL no suaviza los bordes de rectángulos ni círculos, y sin esto Santino lo ve pixelado.

## 3. Lo que NO va
- Subrayado dorado en los nombres ("no me gusta el texto").
- Flechas a mano señalando cada producto (descartadas aunque seguían al objeto).
- Censura con barras que tapan ("horrible"). Si se censura, que sea **pixelado**, no taparlo.
- Títulos "¿Qué trae el kit completo?" o "ASMR kit completo".
- Código de barras en la portada ("no entiendo qué es"): nada decorativo que no diga algo.
- Logo revelado con una capa que barre de izquierda a derecha ("re pobre"): siempre **letra por letra**.
- **No censurar NADA** que no pida él: ni la tarjeta con el nombre de la clienta (tiene que verse, frente y dorso), ni las chapitas con teléfono, ni el fondo.

## 4. Sonido (ASMR)
- Efectos con ElevenLabs (`herramientas/sfx_eleven.py`), en `animaciones/public/kit/sfx/`. Cada uno normalizado por energía (RMS −20 dBFS) y ubicado con los segundos de la fuente pasados a tiempo de video (`t_src`).
- Gustaron: crujido de bolsitas (solo mientras el producto **está** en la bolsita), ziploc, golpe de la caja al caer de la bolsa (audible, y en el momento exacto), tapa que abre y cierra, tarjeta **de madera** (no papel), clics de hebilla al abrochar, desabrochar y abrochar, tela de la bandana **cuando ya la estira**, `arnes-hebillas` al dar vuelta el arnés, chapitas, tecleo de la portada y la correa con `correa-a` ("tensión de tela") al agarrar la manija y estirarla.
- Rechazados: pop o ding al aparecer cada producto, roce de tela suave (sonaba a "error"), cuero, "cinta" (sonaba a cadena), cualquier sonido **metálico** salvo las chapitas, ambiente de casa generado (tenía un **pitido** fijo en 2,2/4,4 kHz: analizar el espectro antes de usar un ambiente), cartón "rascando" en la caja y un ziploc al agarrar el arnés.
- Si una corrección es de sonido, **mandar primero clips cortos con 3 a 5 candidatos** (carpeta `_preview-…`) y recién después volver a mezclar. Cambiar solo el audio es un minuto; el render entero son 15.
- Mezcla: efectos al frente y el lofi ("Marshmallow", Lukrembo, libre con crédito) unos 12 LU debajo, en un tramo parejo de la canción (desde el segundo 28) y comprimido. El final de la música se funde con lo que suena justo antes de su punto de inicio, así el loop sigue de corrido. Limitador `alimiter` con `latency=1` y techo 0,52 (los crujidos agudos pasan 0 dBFS al codificar AAC). Final a −16 LUFS.
- Al unir audio y video **no usar `-shortest` con `-c:v copy`** (corta cuadros y rompe el loop): usar `-af apad,atrim=0:DUR`.

## 5. Proceso
- Cuando hay que elegir un estilo (portada, textos, censura), **hoja de opciones numerada sobre cuadros reales ANTES de renderizar**. Él elige y mezcla: "18d pero que diga…".
- Revisor independiente después de cada render (subagente que solo marca). Sirvió para sincronías, picos, loop y flechas desfasadas. Cuidado: marcó como "metálico" un sonido que a Santino le gustaba. Las reglas de Santino mandan.
- Entrega completa **sin que la pida**: video + portada (Instagram) + **portada para TikTok** (todo, incluido el borde, dentro del recorte 3:4 del perfil, y 240–1680) + descripción con 1 o 2 emojis y el crédito de la música.
- Carpetas: una por video en `3-listos/<fecha> <nombre>/` (solo la última versión + portada). Al publicar, a `videos ya publicados/<nombre>/`. Lo que sobra va a `3-listos/_para-borrar/` y lo borra él.
- Abrirle en pantalla cada resultado al terminar.
