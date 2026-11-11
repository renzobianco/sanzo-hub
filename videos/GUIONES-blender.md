# Guiones para Blender (Pepe realista) — nov 2026

Para el Claude de la terminal: estos son los guiones para los primeros videos en Blender. Antes de arrancar leé `CLAUDE.md` (sobre todo "Reglas de Santino") y `blender/PLAN-blender.md`. Cuando Santino diga "hacé uno", empezá por el que elija (si no elige, el 1). Pasos: mostrarle el guion final en texto y esperar su OK → voz (`herramientas/voz.py`) → escenas en Blender (Eevee) → hoja de contacto → OK → render completo → subtítulos y cierre con Remotion → copia liviana <20 MB.

Lo que vale para los tres:
- Pepe: el bulldog de `2-material/modelos/bulldog-frances.glb`, recoloreado blanco con manchas negras. Mismo perro en toda la serie.
- Todo pasa en Buenos Aires: vereda con baldosas, jacarandás, kiosco con filete, colectivo de fondo, mate en algún plano.
- Look premium: luz cálida de atardecer, fondo desenfocado en los detalles, cámara suave (ideas en `recursos/motion-prompt`). Nada de primerísimos planos que deformen.
- Cada frase con un plano distinto (el plano va entre corchetes). Exageraciones de dibujito animado (venita, gotita, signos) como overlay 2D.
- Sanzo solo al final, con fotos reales del producto (`sanzo-web/public/productos/<producto>/`).
- Lo marcado (✔?) hay que confirmarlo con Santino antes de decirlo en el video.
- Crédito del modelo en la descripción del reel: "Bulldog francés" by ElabcTepacha, CC BY 4.0.

---

## 1. "De la soga a la correa" (~55 s) — recomendado para arrancar

> Título en pantalla: De la soga a la correa, pieza por pieza

1. Primer paseo. Agarrás una soga del garaje y se la atás al collar. [dron bajando sobre la vereda: Pepe sentado en la puerta de casa, la soga cuelga]
2. Pero Pepe ve una paloma, sale disparado, y la soga te quema las manos. [cámara lenta, contrapicado: la soga se tensa, humito en las manos, ¡FIUM!]
3. Mejor una cinta plana: no quema y no se enrosca. [detalle con fondo desenfocado: la cinta reemplaza a la soga]
4. Pero en cada tirón, el brazo se te va para adelante. [perfil: el brazo se estira como chicle, ojos saltones]
5. La solución: una manija para agarrar firme sin lastimarte. [plano medio de la mano cerrándose sobre la manija] (✔? manija acolchada)
6. Pero Pepe da vueltas y la correa queda hecha un nudo. [cenital: Pepe girando, la correa se enrosca, signos de pregunta]
7. Por eso el mosquetón gira solo: el famoso destorcedor. [macro con fondo desenfocado: el mosquetón gira y la correa se desenrosca] (✔? mosquetón giratorio)
8. ¡Felicitaciones! Armaste la correa Sanzo. [plano abierto al atardecer bajo un jacarandá, paseo feliz]
9. Y combina con su collar. ¿Qué armamos la próxima? [fotos reales correa + collar, cierre "COLLARES Y CORREAS SANZO"]

## 2. "¿Por qué tu perro necesita chapita?" (curiosidad, ~45 s)

> Título en pantalla: La chapita que lo trae de vuelta

1. Pepe se escapó. La puerta quedó abierta un segundo. [subjetivo desde la puerta: Pepe corre por la vereda]
2. Un vecino lo encuentra… pero ¿de quién es? [plano medio del vecino agachado, signos de pregunta, Pepe ladeando la cabeza]
3. El microchip sirve, pero hay que ir a un veterinario con lector. [rayos X 2D: el chip en el lomo, un reloj de arena corre] (✔? dato del microchip)
4. Una chapita la lee cualquiera, al toque. [macro con fondo desenfocado: la chapita cuelga centrada de la argolla, se lee PEPE y un teléfono]
5. Así que la grabás con láser, letra por letra, para que no se borre. [macro: el láser escribe P-E-P-E, chispitas]
6. Un llamado, y Pepe vuelve a casa. [plano abierto: reencuentro en la puerta, cola moviéndose, corazones]
7. Chapitas grabadas Sanzo. ¿Tu perro tiene la suya? [fotos reales de collar + chapita, cierre animado]

## 3. "De la bolsa del súper a la bolsita" (humor, ~45 s)

> Título en pantalla: El problema que nadie quiere nombrar

1. Salís a pasear y, claro, Pepe hace lo suyo. [plano general en la plaza; Pepe mira a cámara con cejas arriba]
2. Y vos no trajiste nada. [primer plano del dueño congelado, gotita de sudor, ¡GLUP!]
3. Al día siguiente, una bolsa del súper en el bolsillo. [el bolsillo hace bulto y revienta]
4. Pero se rompe, o se la lleva el viento. [cámara lenta: la bolsa vuela por la plaza, pasa delante del kiosco]
5. La solución: un dispenser colgado de la correa. [detalle con fondo desenfocado: el porta bolsitas se engancha] (✔? cómo se engancha)
6. Con el rollo adentro, siempre a mano. [el rollo entra, ¡CLIC! de la tapa]
7. Sacás una, la usás, y al tacho: ¡ENCESTA! [cenital siguiendo la bolsita hasta el tacho]
8. Porta bolsitas Sanzo. ¿Qué armamos la próxima? [foto real del poo-bag, cierre animado]

---

Nota: el video del arnés y la tos ya existe hecho en Remotion (v3). Si sale bien el primero en Blender, se puede rehacer en Blender usando `animaciones/guiones/arnes.json`.
