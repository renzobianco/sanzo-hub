# Correcciones de Santino (leer ANTES de cualquier video)

Cada corrección que Santino haga se anota acá con fecha, para no repetir errores. Manda sobre todo lo demás junto con "Reglas de Santino" de `CLAUDE.md`.

## 2026-11-02 — "La pelea estelar" (gorra)

**Técnica / estilo**
- Blender: descartado (los videos 3D salieron mal).
- 3D hecho con código (three.js en Remotion): también descartado. El bulldog y las gorras 3D quedaron "horribles".
- Nada de herramientas pagas de IA (no tiene Higgsfield): solo herramientas de código (JavaScript/SVG en Remotion).
- Los videos 2D anteriores (`correa_2d`, `bolsitas_2d`) "se ven muy poco profesionales": personajes chiquitos, contornos finos y desparejos, colores planos sin luz, fondos vacíos. No volver a eso.
- Un 2D "pulido de vector" con degradés tampoco gustó ("horrible el dibujo").
- Estilo elegido: el **5 de la lámina** `2-referencias/REFERENCIAS-estilos-2d.jpg` (Long Steven, birdboxstudio): dibujo a lápiz, colores apagados, buena narración.
- Sello elegido: **trazo vivo a 12 fps** (líneas que tiemblan, movimiento "de a dos").

**Personajes**
- Pepe ahora es **salchicha negro y fuego** (el frenchie se descartó: "parece hecho de bolas", no gustó la cara).
- Nunca armar personajes pegando esferas o bolas.
- Gorras: **océano y beige** (confirmado). Pana (corderoy), copa baja, visera curva, agujeros a los costados para las orejas con elástico fruncido, cordón elástico negro con traba bajo el mentón. Copiar de `sanzo-web/public/productos/solo/gorra/`.

**Composición**
- Errores de capas prohibidos: nada atraviesa paredes ni barandas (ej. vecinos que "traspasan" la terraza).
- Usar elementos que sumen en cada plano; ver algo plano o siempre lo mismo aburre.
- El arranque tiene que **frenar el scroll**: algo que haga "click" en el primer segundo.
- El gancho tiene que **generar duda**: "¿por qué pasa esto?, ¿qué es esto?, quiero ver qué pasa". Si no hay pregunta, no se queda.

**Proceso**
- Cuando hay que elegir, mostrar las opciones en **una imagen con números**.
- Anotar todas las correcciones en este archivo.
- Gancho elegido: **2 (afiche de boxeo tipo Luna Park, "PEPE vs. RULO")**. Gustó la composición del afiche.
- No gustaron los perros del estilo lápiz (Pepe = tubo largo con cabeza chica; Rulo = mesa con patas de palito) ni cómo les queda la gorra (flotando arriba de la cabeza, plana, no calzada).
- Diseños de Pepe a lápiz (tierno / libro ilustrado / tira cómica): el que más se acercó fue el **libro ilustrado** (más real y elegante), pero **ninguno convenció**. Próximo paso: elegir un diseño de salchicha a partir de referencias reales numeradas.
- Diseño de Pepe elegido: **el 1 de `2-referencias/REFERENCIAS-salchichas.jpg`** (el perro de Long Steven): simple, ojos saltones juntos, patitas finas, trazo a mano.
- Para dibujos de personajes y fondos: usar **ChatGPT de Sanzo o Nano Banana** (los genera Santino con los prompts de `2-referencias/para-chatgpt/PROMPTS.md`); Claude anima, sincroniza, subtitula y arma el cierre. Las imágenes van en `1-crudos/<video>/`.
- Storyboard de "La pelea estelar" aprobado ("está bien, tengo que ver cómo queda"). Sumar **elementos de juego de pelea y anime** (estilo Street Fighter / Naruto, sin copiar logos ni personajes): barras de vida con nombres, "ROUND 1… ¡PELEEN!", bola de fuego, líneas de velocidad, aura y chispas, "¡APARECE UN NUEVO RETADOR!", "EMPATE" con las barras a la mitad.
- Al guion de "La pelea estelar" no le tiene mucha fe, pero se hace igual. Para los próximos: ganchos más fuertes (que generen duda).
- Diseño de personajes: único y original, **ni hiperrealista, ni hiperdetallado, ni hiperinfantil**. Guía y bloque de estilo en `ESTILO-SANZO.md`.
- **Fondos SIN IA**: los hace Claude en código con estilo propio (desde el video 2). A ChatGPT solo se le piden personajes y objetos sueltos en fondo blanco.
- Cada video tiene su carpeta `video N. imagenes para el video/` con `PROMPTS.md`, `PEGAR-EN-CLAUDE-CHROME.txt`, `referencias/` y `resultados/`.

## 2026-11-02 — correcciones a "La pelea estelar" v1
- "Está bien pero le falta mucho".
- **Mostrar a Momo y Maurito** para que se entienda la referencia (sin caras reales: de espaldas, con el nombre en la bata, o en un afiche).
- **El zoom inicial es muy pobre**: no hacer ganchos de "zoom al afiche".
- **El fondo no pega con el video** (fondos detallados de IA contra personajes simples) y **los perros flotan**: los fondos tienen que ser del MISMO estilo que los personajes (hechos en código), con piso en perspectiva y sombras de contacto; los pies apoyan en el piso.
- **Las transiciones son malísimas**: hacer transiciones con motivo y en estilo (tinta, papel, corte por forma), nada de fundidos o barridos genéricos.
- **La parte de "le quedaba enorme" se veía con bugs**.
- **Nunca deformar/estirar a los perros** para dar sensación de movimiento (queda horrible).
- **La bola de fuego quedó fuera de contexto**: si va, tiene que estar dibujada con ChatGPT en el mismo estilo (o sacarla).
- La v1 fue "muy básica". En 2D ser **hipercreativo**: fondos buenos y distintivos (uno propio por escena), escenas únicas, planos ideales, más humor, elementos que sumen y un **filtro propio** (grano/ruido).
- El fondo dibujado en código "toma demasiada atención y está mal hecho": **los fondos los hace ChatGPT** (vuelve a valer), pero **tranquilos, de poco contraste y en el mismo estilo que los personajes**, con el piso libre para apoyarlos. Claude hace en código solo gráficos (tarjetas, carteles, HUD, efectos, transiciones). Pedidos de la v2 en `video 1. imagenes para el video/PROMPTS-v2.md`.
- La v1 "le falta dinamismo y creatividad": aplicar `DINAMISMO.md` en todos los videos. El **estilo artístico** de los dibujos (Long Steven por ChatGPT) **no le gusta, parece de principiante**: elegir un nivel profesional en `2-referencias/REFERENCIAS-nivel-profesional.jpg` y pasarle a ChatGPT un cuadro de esa referencia como imagen.
- **El estilo artístico queda como está** (ya definido). Lo que falta es **puesta en escena**: no 'personaje + fondo y listo', sino jugar con perspectivas (cenital, de espaldas, subjetivo, primerísimo plano, contrapicado), elementos gráficos, capas con paralaje y composiciones creativas.

## 2026-11-02 — correcciones al storyboard v2
- Mejoró. **Menos San Telmo**: es una referencia chiquita, no todo el video. El fondo del patio de ChatGPT no termina de gustar.
- **La escena 1 (gancho) es la más importante**: la más trabajada, con un fondo que acompañe.
- Fondos de las fichas (2 y 3, lunares) no convencen.
- 4 (cámara de seguridad) encanta, pero **tiene que entenderse que Rulo le robó la gorra**.
- 5: no se entiende que rompe la pantalla ni por qué la rompería → sacar ese recurso si no tiene lógica.
- **5, 7 y 8 las peores: hacerlas más cinematográficas** (luz, contraluz, contraplanos, cámara lenta, enfoque).
- 9 (diario): sumar **referencias a la actualidad argentina** en titulares secundarios (tipo "Emilia Mernes sacó un tema que se iguala con Noche de Fama de Olga"), chistes de estar boludeando.
- Si hacen falta más imágenes, pedirlas a ChatGPT sin miedo (después se descartan).
- **Proceso**: antes de animar, Santino tiene que dar el OK al **plan visual de cada escena** (storyboard armado con las imágenes reales). Sin ese OK no se anima nada.
- Storyboard del video 2 (transmisión de fútbol): "puede ser", con dos condiciones: **imágenes muy buenas** y **efectos de sonido generados con ElevenLabs** (no los sintéticos de `sfx.ps1`). Herramienta: `herramientas/sfx_eleven.py LISTA.json CARPETA` (no regenera los que ya existen; ver crédito con `--credito`).
- Regular bien el volumen de los efectos de sonido (normalizarlos y mezclarlos por debajo de la voz, nada que tape la narración).
- Storyboard final del video 2 aprobado ("ok, seguí con el resto de videos"). Santino se fue de casa: avanzar solo con los videos que siguen.

## 2026-11-03 — correcciones al video 2 v1 ("¿Qué mirás, bobo?")
- Escena 1 y 2: **el perro y el gato flotan** (Pepe sobre el fondo de la parrilla, el gato con su pedazo de pared encima del techo). Siempre apoyarlos en el piso/borde real del fondo, con sombra de contacto, o taparlos con el borde (el gato asomando DETRÁS de las tejas).
- "¿Qué mirás, bobo?" está raro: abre la boca y de golpe salta a la escena con el diálogo arriba. Hacer el diálogo en continuidad (mismo plano o un corte en la acción bien anticipado).
- El primer plano del cuello con el moño se nota cortado (no tiene cabeza ni pecho): **los recortes parciales van dentro de un círculo tipo iris "estilo Batman"** (o cualquier marco que justifique el corte), nunca flotando sobre el fondo.

## 2026-11-03 — correcciones al video 1 v3 ("está mucho mejor")
- Momo vs. Maurito: la imagen está **mal pegada en la tele** → encajarla en la pantalla (bordes redondeados, curvatura) y sumar **filtro de tele**. Momo y Maurito tienen que estar **dentro del ring**.
- Contraplano "pelea estelar" y "en esta esquina": **perros mal recortados** (se ven los bordes del recorte).
- Rulo apoyado en una **pared que no tiene continuación**, en el medio de la nada → apoyarlo en una pared real del fondo.
- En la cámara de seguridad **Pepe se mueve mientras duerme**: tiene que quedarse quieto (misma posición en los tres momentos).
- **Alargar el efecto de sonido** de cuando aparece el dueño.
- La escena de la sombra (antes del dueño) está mal recortada; en el duelo se ve **el final del cuello** de los dos perros.
- Regla general: **ningún recorte se ve cortado** (bordes del dibujo fuera de cuadro, tapados por algo del fondo, o dentro de un marco/iris).

## 2026-11-03 — más correcciones al video 2 (sobre los cuadros corregidos)
- La escena del gato está horrible → **rehacerla con una imagen nueva de ChatGPT** (gato integrado en el techo).
- El **humo del asado hecho en código se ve mal** → sacarlo (usar el humo que ya trae el dibujo, o uno dibujado por ChatGPT).
- "¿Qué mirás, bobo?": **sacar el primer plano de la boca** y volver a la escena del diálogo (Pepe señalando con el globo).
- **Falta animación, todo se ve muy estático**: sumar movimiento a los personajes (respiración, balanceo, saltitos, cambios de pose, parpadeo) sin deformarlos, y pedir a ChatGPT cuadros extra de animación cuando haga falta.

## 2026-11-03 — qué se aplicó (pendiente de OK antes de re-renderizar)
- Video 1: tele con filtro (barrido, vidrio, bordes oscuros) y pantalla con bordes redondeados; Momo y Maurito dentro del ring con las cuerdas delante; perros recortados con IA (rembg isnet-anime, `herramientas/recortar_ia.py`) y apoyados en el sillón y el puf; Rulo contra la pared derecha del callejón; Pepe quieto en el robo; sombra del dueño dibujada + `sombra-larga`/`coro-largo`; primeros planos del duelo con el cuello fuera de cuadro; subtítulos que no tapan caras.
- Video 2: todos los sprites recortados de nuevo con IA (copia de los viejos en `public/mono/sprites_viejo`); sin humo de código; diálogo en plano abierto (Pepe mira → señala hablando con el globo → el gato sale volando, mismo encuadre); personajes con respiración/balanceo a 12 fps, pose orgullosa con brillo en el asado, familia aplaudiendo con cambio de pose, Pepe salta con el chorizo; cierre con látigo en vez de humo. Escena del gato: espera la imagen nueva (`video 2. imagenes para el video/PROMPTS-v3.md`).

## 2026-11-03 — correcciones (tarde)
- **Subtítulos SIEMPRE en el mismo lugar** (y = 1480 en todos los videos). No moverlos por escena.
- Video 1 v4: "lo veo bien" → render completo enviado para revisión.
- Video 2: la parte del Dibu → **fondo de cancha** y referencias a **Argentina vs. Francia** (final 2022: banderas ARG/FRA en el ojo contra ojo, tanda de penales real 4-2 con ¡ATAJÓ!, 120+3').
- Video 2: el primer plano del moño tenía **el cuello invisible** (recorte de IA borró el pecho) → recortado de nuevo por color, pecho sólido.
- Video 2: **no repetir casi igual el plano del moño** → la mira ahora apunta a Pepe entero sentado; el primer plano del moño queda solo en "NO HAY CAMBIO".
- Santino: "la clave es crear muchísimas imágenes, ser críticos, agregar escenas y gráficos interesantes y que sobre todo esté perfectamente animado". Las imágenes las hace Claude entrando a ChatGPT por Chrome (perfil Sanzo).

## 2026-11-03 (noche) — correcciones al video 1 v4 y al video 2 v2
Video 1:
- Cámara de seguridad: **Rulo está cortado** (se ve el rectángulo del recorte) y la fecha "DOM 02/11…" queda pegada a los subtítulos → subir la fecha.
- **El video suena muy fuerte** (bajar todo: efectos y mezcla final).
- **Recortes mal hechos: usar la web https://removebackground.now/en** (Santino: "los hace perfectos"), no rembg local.
- Segundo 17: **sonidos pegados raros** (varios efectos encimados).
- **Loop**: el final del video tiene que empalmar con el comienzo. **El final dura demasiado** → acortarlo.
Video 2:
- Cuando el gato hace "miau" **tiene que abrir la boca**.
- **El sonido sigue muy fuerte.**
- **Falta la voz de "¿Qué mirás, bobo? Andá pa' allá"** (el hueco quedó mudo) → generarla.
- Cuando el Dibu ataja: **fondo del arco** (cancha).
- Segundo 19 (brindis): **manos mal recortadas, falta el brazo** → agregar brazos o elementos gráficos que justifiquen el corte.
- Mismo que video 1: **final más corto y loop**.
Regla nueva: **todos los videos terminan en loop** (el último cuadro empalma con el primero) y con un cierre corto.

## 2026-11-05 — correcciones al video 1 v5
- **Recortes siguen mal**: halo blanco alrededor de la línea negra (sillón, Pepe, Rulo). **Usar SIEMPRE removebackground.now**, nunca otro método.
- Rulo: ojos recortados y el hueco entre la tira de la gorra y el cuello quedó blanco (no se recortó).
- Pepe en la ficha: está parado sobre un almohadón superpuesto a OTRO almohadón del fondo → o sin almohadón propio o sacar el del fondo. Nunca duplicar un objeto del fondo.
- Cámara de seguridad: Rulo saliendo con la gorra, mal recortado (parche blanco en la boca).
- Rulo en la puerta verde: tiene que estar más arriba; queda una mancha blanca en el marco de la puerta sin sentido.
- Escena "PEPE vs. RULO" (paneles): falta un efecto de sonido apropiado (golpe de pelea).
- Cámara de seguridad: Pepe durmiendo estaba en el borde del almohadón → centrado en el medio.
- **Recortes: removebackground.now pide pagar para descargar** (0 créditos, plan ARS 845/7 días). Método que funcionó: subir el dibujo a ChatGPT y pedir "Use the image generation tool (do NOT use Python)… redraw identical on a TRANSPARENT background" → PNG con alfa real, sin halo. Después `herramientas/recorte_listo.py NUEVOS SPRITES` (recorta y guarda backup). Gemini también sirve (fondo magenta), pero sus descargas tardan.

## 2026-11-05 (tarde) — correcciones video 1 v6 y video 2 v3
Video 1:
- Primer cuadro de la cámara de seguridad salió con el fondo negro (no cargó).
- En la cámara, Pepe cambia de posición y se achica entre un momento y otro → mismo lugar y tamaño siempre.
- "OCÉANO" / "BEIGE" quedan tapados por el subtítulo → ponerlos ARRIBA y que se entienda que es el color de la gorra (flecha u otro recurso).
Video 2:
- Falta que se escuche "Andá pa' allá".
- El gato sentado arriba de la parrilla no tiene sentido → ubicarlo en un lugar lógico.
- Sacar la escena de la familia con Pepe y el chorizo.
- "Combina con todo": que aparezca Pepe y se vayan cambiando cosas para demostrar que combina con todo, con elementos gráficos; que eso encadene con "hasta con el asado" (la escena de la mesa vista de arriba quedó horrible).
- Borrar las versiones viejas de los videos (dejar solo la última de cada uno).

## 2026-11-05 (noche) — correcciones video 1 v7 y video 2 v4
Video 1:
- "Entonces apareció" (dueño a contraluz) queda medio vacío → sumar elementos.
- Que el sonido de la escena siguiente entre levemente antes, para anticiparla (pre-lap de sonido).
- En "colores", bajar el cartel (está muy arriba).
- Pasar referencias de música del momento de TikTok; Santino elige (la música la pone él en la app).
Video 2:
- "Combina con todo" gusta, pero "con el asado" tiene que seguir en el MISMO formato: solo la parrilla/el asado al lado del perro (sin cortar al patio).
- Sacar guirnalda y silla: no tiene sentido que el moño combine con eso (y estaban mal recortadas).

## 2026-11-05 — imágenes generadas (ChatGPT Sanzo Co., en paralelo)
- Video 2: f3-gato-boca, f3-gato-vacio, f5-cancha-arco, pepe-senala-2 → listas para el v3.
- Video 3: 6 fondos (f1–f6) y 11 personajes/objetos (p1–p11) → `resultados/`.
- Video 4: 5 fondos (f1–f5) y 11 personajes/objetos (p1–p11, con Lola y Toto) → `resultados/`.
- Hojas de contacto para revisar: `_nuevas-05-11.jpg` (video 2) y `_resultados-05-11.jpg` (videos 3 y 4). Falta el OK de Santino al plan visual antes de animar.

## 2026-11-05 (noche 2) · v1
- NO agregar cosas que no pidió: en 'entonces apareció' le había sumado barra 'EL DUEÑO / JEFE FINAL', polvito y Pepe y Rulo de espaldas. Se enojó: pedía SOLO anticipar el sonido de la escena siguiente. Volví la escena a como estaba.
- Una sola versión del render, sin copia liviana. Música la elige él en la plataforma.


## 2026-11-05 (noche 3) · v2
- El humo dibujado en el fondo de la parrilla quedaba debajo/delante de Pepe: sacarlo del fondo (retocado por código, original en _f1-parrilla-macro-con-humo.png).
- Desenfoque con corte duro (clipPath recto) se ve pésimo: usar máscaras con degradado.
- El gato del techo (f3-gato-techo/boca) tiene demasiado detalle, no sigue la estética plana de Pepe: rehacer más simple.
- Música de fondo inaudible a -31 LUFS: dejarla a ~-23 antes del ducking.


## 2026-11-05 (noche 4) · v2
- Gato del techo: ni 'simplificado' ni redibujado 'con el estilo del fondo' (hiperdetallado). Lo que va: el MISMO sprite de personaje del resto del video (gato-asoma) sobre un fondo sin gato. Regla: los personajes siempre son los sprites del video, el fondo va aparte.
- Parrilla sonaba dos veces (+ ambiente patio) y muy alta: una sola vez, 0.06.

## 2026-11-08 · imágenes video 3 (EXTRA 2)
- **Generar imágenes en ChatGPT con VARIAS PESTAÑAS A LA VEZ, nunca de a una** (Santino: "usa varias pestañas a la vez, en vez solo usar una... más rápido"). Un chat por pestaña, lanzar varios pedidos y bajarlos cuando terminan.
- Pedir personajes SOLOS, sin objetos del fondo pegados (puerta, vitrina): si no, se duplican con el fondo y complican el recorte.
- Revisar siempre ojos dobles y patas de más: Santino marcó ojos dobles en P12.
- F7 y F9 "no van con el estilo que manejamos". Ni hiperdetallados (primera versión) ni extremadamente simples (segunda, formas grandes casi vacías): punto medio. Elegida la opción 1 de `video 3. imagenes para el video/opciones-fondo/_OPCIONES-numeradas.jpg`: detalle intermedio, línea oscura como la de Pepe, colores planos apagados. Usarla como referencia de fondos.
- Ojos cerrados: el párpado va lleno del color de la piel, nunca blanco (P28, cuadro del medio).

## 2026-11-08 · plan visual video 3 v1 ("muchísimos errores")
- **Recortes: Pepe mal recortado en casi todas las escenas, se le ve el final del pecho.** El corte de abajo del dibujo tiene que quedar fuera de cuadro o tapado. Aunque sea un plan visual, usar recortes de verdad (PNG con transparencia), nunca recorte rápido por código: rompe los ojos.
- Ojos buggeados.
- Tiene que haber una referencia a Luisito Comunica sí o sí, y el final (plano 18) tiene que hacer referencia al final de sus videos.
- Plano 3: puerta sin fondo no tiene sentido. Rehacer un fondo con esa puerta integrada.
- Planos 5, 6, 10, 11, 13: personajes mal recortados. En el 10 además el piso no coincide.
- Plano 14: letras en el ángulo perfecto de la chapita, bien animado, láser bien recortado.
- Plano 15: no se entiende.
- Planos 16 y 17: números mal puestos y mal animado.
- Plan v2: gráficos hechos en código (cartel del canal, "Vamo' a darle", flechas, texto del ticket) quedan horribles: pedirlos dibujados a ChatGPT en el estilo. Ticket nunca flotando: atado a la chapita.
- Si un personaje se acerca a algo, cambia el fondo al contraplano (lupa: visto desde adentro de la vitrina).
- Láser: la chapita va acostada sobre la mesa y la máquina arriba; no pueden tener el mismo ángulo.
- Tragamonedas: solo números, sin signo $, con tantas ventanas como dígitos, y con sus efectos de sonido. Perro de ese plano "horrible".
- Plano 17: sin el fondo del taller, perros bien colocados, elementos gráficos.
- Video 3 v1: sacar "Vamo' a darle"; apertura como banner del canal. Plano 2 igual al 1 no tiene sentido (que hable o mire otra cosa). Caminata a la puerta poco profesional. El vendedor no se entiende. PLOT TWIST horrible: sacarlo. Video demasiado rápido: darle aire. Letras del láser sobre la chapita. 3x2 más trabajado. Sacar pata que tapa la cámara y videos recomendados. Final: banner Sanzo de siempre y loop. Fotos de chapitas: las grabadas, no las solas.
- **Abrirle en pantalla el resultado cada vez que se termina algo** (Santino: "abrime cada vez que terminás el trabajo, sino no me entero").
- El pelo de Luisito es rizado, con mucho volumen, no lacio: usar `video 3. imagenes para el video/referencias/luisito-ref-pelo.png` como referencia solo de la forma.
- Santino: "al principio debería notarse que estamos parodiando a Luisito"; sumar elementos gráficos; "si te faltan imágenes hacé más, no escatimes". Decisión: Pepe con peluca negra, canal parodia "PEPITO COMUNICA", y cierre con pantalla final de YouTube de ese canal.


## 2026-11-10 · video 15 "Modo fácil" (lo marcó el revisor independiente, no Santino)
- v1: zoom por escena que volvía a cero en cada corte → el fondo saltaba. Ahora un solo empuje continuo por mitad.
- v1: fundidos de luz entre horas del mismo cuarto → cortes secos y simultáneos en las dos mitades.
- v1: 85 % de silencio digital → ambiente muy bajo siempre (cuarto −52 dB, aeropuerto −41 dB), también en el cierre y el loop.
- v1: el filtro retro (achica ×3) borra logos chicos → el parche se pega nítido después del filtro.
- v1/v2: el chaleco de Toby distinto en el cuarto y en el aeropuerto → igualar objetos que se repiten entre lugares.
- v1: un rótulo arriba a la izquierda pisaba al policía → el rótulo de abajo va al lado del reloj.
- v3/v4: al pedirle a ChatGPT "la cucha vacía", cambió la cucha (tamaño y lugar). Solución: pedir primero la base vacía, después la luz, y pegar encima al personaje con máscara.
- El despertador tiene que sonar mientras se ve sonando. El golpe no puede ser el sonido más fuerte.

## 2026-11-10 (tarde) · video 15 v5 RECHAZADA por Santino
- "Muy muy mal el video": con imágenes quietas (aunque cambien de pose) no se entiende. Los videos estilo @unemployed_corp necesitan **movimiento real** (imagen → video), no alcanza con zoom y cambios de pose.
- Que el revisor diga PASA en lo técnico no alcanza: el primer pase "como espectador" tiene que preguntar también si se ve vivo o parece una presentación de diapositivas.
- Flow (Veo) en el video 14: descartado porque la calidad era floja y agregaba animaciones de más. El 10-nov pidió probarlo de nuevo. Estado y cómo seguir: `video 15. imagenes para el video\ESTADO.md`.

## 2026-11-11 · unboxing POV "Kit Paseo Sanzo" (IMG_0066) — lo marcó el revisor, no Santino
- En videos reales revisar DATOS PERSONALES: la tarjeta de agradecimiento trae el nombre de la clienta y las chapitas traen teléfonos. Difuminar (borrón que sigue al objeto) o no usar esas tomas.
- Nada de flash blanco al aparecer cada producto: se ve como parpadeo. Alcanza con un empujón de zoom suave.
- Promediar cuadros solo en cámara rápida (x2 o más); a x1.2–1.5 deja fantasmas.
- Al unir audio con ffmpeg NO usar `-shortest` con `-c:v copy`: cortó los últimos cuadros y rompió el loop. Usar `-af apad,atrim=0:DUR`.
- Script: `3-listos/_tmp/kit/render_kit.py` + `sonido_kit.py` (checklist arriba, rótulo dorado en SUBY, chip x3, cierre con logo).
- 2026-11-11 (Santino): la TARJETA de agradecimiento con el nombre de la clienta SE MUESTRA (primer plano), no difuminarla. Efectos con ElevenLabs (`animaciones/public/kit/sfx/`), no sintéticos.
- Pidió música bajada de YouTube: usar temas libres de derechos (en `2-material/musica/`). Mezcla que pasó: música comprimida a −20 LUFS en un tramo parejo, efectos encima, ducking suave (−3 dB, no en los pops), limitador `alimiter` con `latency=1` (sin eso mete 8 ms de silencio y un clic en el loop), final a −16 LUFS. La música del final se funde con lo que suena justo antes de su punto de inicio, para que el loop siga de corrido. Script: `3-listos/_tmp/kit/sonido_kit2.py`.
- 2026-11-11 (Santino, ronda 2): título "ASMR kit completo"; panel "KIT COMPLETO SANZO" (no "Kit Paseo") y sin pixelado → dibujar gráficos con PIL al triple y achicar (PIL no suaviza bordes de rectángulos/círculos). Tarjeta: mostrar frente y dorso. Mostrar acciones clave a velocidad normal (sacar de la bolsita, abrochar/desabrochar, correa estirada) y acelerar solo lo de en medio. Pidió "mejores efectos": estilo ASMR = manos al frente (crujidos, ziploc, telas, clics), ambiente de casa y lofi ~12 LU abajo. Los crujidos agudos pasan 0 dBFS al codificar AAC: limitador en 0.6 (`sonido_kit3.py`).
- 2026-11-11 (Santino, ronda 3): no le gustó el texto subrayado. Eligió de `3-listos/_opciones-texto-unboxing.jpg`: título tipo 1/4 → "KIT COMPLETO" (Anton) letra por letra + línea dorada + "UNBOXING · SANZO"; productos → opción 5: nombre blanco (Montserrat ExtraBold) letra por letra abajo a la izquierda + flecha dibujada a mano que sigue al producto (`_tmp/kit/textos_animados.py`, OBJ_KF medidos por toma). Flecha blanca necesita contorno oscuro para verse sobre fondos claros.
- Sonidos rechazados: roce de tela suave (sonaba a "error"), cuero, "cinta" (sonaba a cadena/metal), hebillas del arnés (metálico), ambiente de casa (pitido). Nada metálico salvo chapitas. El crujido de bolsa termina cuando el producto sale de la bolsita.
- 2026-11-11 (Santino, rondas 4-5): portada = 18d de `_portadas-variantes-14-18-24.jpg` ("KIT COMPLETO" Playfair + "SANZO"), borde de revista que se dibuja; al salir el borde "se come" desde abajo hasta el punto inicial y las letras se borran tipo máquina de escribir, con tecleo. Sin código de barras (no aportaba). Nada de flechas: el producto se marca en el panel con pastilla que se desliza; los productos arrancan CENSURADOS (barras) y se revelan letra por letra al salir (intriga). Logo final animado letra por letra, nunca una capa que barre. Le gusta el sonido `arnes-hebillas` al dar vuelta el arnés. La caja que cae de la bolsa necesita su golpe audible.
- 2026-11-11 (Santino): "falta la portada, te estaba poniendo a prueba". TODA entrega de video incluye portada (PNG 1080x1920 en `3-listos/`, texto dentro del recorte 3:4 de la grilla, y=240–1680) y descripción (1-2 emojis máximo). Ofrecerlas sin que las pida. Para el unboxing: `_tmp/kit/portada_final.py`. Previews de sonido antes de renderizar (`_preview-…`), para no re-renderizar todo.
