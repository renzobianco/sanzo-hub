# Hoja de estilo — reels de Sanzo (v2, 2026-11-01)

> Además de esta hoja: aplicar `METODO-CALIDAD.md` (ángulos y tamaños de plano variados, pocos frontales, siempre algo en movimiento, movimientos de cámara con motivo, sujeto a 38/62, paleta por escena chequeada en blanco y negro, reacciones escalonadas).

Se va puliendo: cada vez que Santino o Renzo digan "esto me gusta / esto no", se anota acá.

## LA IDEA PRINCIPAL (manda sobre todo lo demás)

**No hacemos publicidad.** Nada de "te vendo esto, es hiper resistente". Hacemos videos que alguien sin perro, o sin ganas de comprar, se queda mirando porque son interesantes. La marca aparece recién al final, como remate.

Referencia madre: `2-referencias/ig-DfFXRshS0Pe.mp4` (Agrimporta, "Del poste a la casilla de operar"). Cómo funciona:
- **Cadena problema → solución**: "Si hacés X… *pero* pasa Y. *Entonces* le ponés Z. *Eso se llama* [nombre técnico]." Se repite 6–8 veces y el objeto va evolucionando pieza por pieza, de lo más básico al producto final.
- Cada vuelta enseña algo real ("galvanizado en caliente", "antirretroceso"): el que mira aprende y se siente más inteligente.
- **Animación 3D low-poly** simple (muñequitos, colores planos), cámara que se mueve sin parar, el objeto se arma delante tuyo.
- Voz en off continua, frases cortas, ritmo parejo. Subtítulos palabra por palabra en blanco con borde, centro-abajo; título fijo arriba en el primer segundo ("Del poste a la casilla de operar").
- **Remate**: "¡Felicitaciones! Armaste una casilla de operar." Recién ahí: "En Agrimporta este es el tipo de producto que ofrecemos…" + logo chico arriba.
- CTA que invita a comentar el próximo ("¿Qué armamos la próxima?") y a mandárselo a alguien.
- 90 s aprox. Funciona largo porque cada vuelta abre una pregunta nueva.

Para Sanzo: la paleta y el logo van **solo en el remate y en detalles** (los colores de la cuerina, el herraje). El resto del video es del tema, no de la marca. Las ideas de guiones están en `GUIONES.md`.

## Herramientas para este formato

- 3D low-poly: `@remotion/three` (Three.js dentro de Remotion) en `animaciones/`. Modelos simples hechos con primitivas (cajas, cilindros), sin texturas.
- Voz: la graba Santino/Renzo con el celu (lo más auténtico) o una voz IA si la piden. Primero va la voz, después se anima al ritmo de la voz usando los tiempos del `.srt`.

---

(Lo de abajo es la v1, sacada de reels "explicativos" de Claude. Sigue valiendo para subtítulos, etiquetas y ritmo, pero el enfoque de contenido es el de arriba.)

## Qué tienen en común las referencias (lo que copiamos)

1. **Un "mundo" propio y constante.** Cada reel tiene un fondo fijo que no cambia en todo el video (hoja cuadriculada clara, azul noche, escena pixel-art). Las cosas aparecen *sobre* ese fondo, no hay cortes bruscos de escenario.
2. **Gancho de texto grande en el primer segundo.** 2 a 5 palabras gigantes ("5 proyectos con Claude", "Claude acaba de matar a CapCut").
3. **Subtítulos palabra por palabra abajo**, en blanco/oscuro, con **la palabra clave en el color de acento**.
4. **Palabras clave en "etiquetas"**: rectángulo de color con el texto adentro, levemente inclinado a veces ("top 1%", "24 horas", "biblioteca infinita").
5. **Estructura por pasos con progreso visible**: "PASO 1", "1 de 5", puntitos ●●○○○ o una lista que se va tildando. El que mira sabe cuánto falta.
6. **Un personaje/mascota** que acompaña y reacciona (carita dibujada, robotito, zorrito pixel-art).
7. **Elementos de interfaz animados**: tarjetas, buscadores que se escriben solos, barras que se llenan, checks, contadores que suben (el reel de la palta: número grande arriba que sube sin parar).
8. **Cierre con CTA de comentario**: "Comentá FINDE y te mando…".
9. Duración 35–80 s, voz en off continua, algo en movimiento todo el tiempo (nunca más de ~1,5 s quieto).

## Traducido a Sanzo

**Mundo:** fondo **crema `#F4EDE3`** con textura sutil de lino (o grilla muy suave en `#E8DCCB`). Es el "papel" de Sanzo, igual que la web. Las tomas reales (perro con el collar, manos armando, producto) entran como **tarjetas con bordes redondeados y sombra suave** sobre ese fondo, no a pantalla completa (salvo tomas muy lindas del perro).

**Paleta** (la de la web, Pantone):
| Uso | Color |
|---|---|
| Fondo | crema `#F4EDE3` |
| Fondo secundario / tarjetas | lino `#E8DCCB` |
| Texto | tinta `#251D16` |
| Acento: palabra clave, etiquetas, checks | marrón `#946037` (Pantone 4635 C) |
| Detalles, líneas, textos secundarios | topo `#A39282` (Pantone 4745 C) |

Nada de colores saturados. Si hace falta un tercer acento, usar blanco.

**Tipografía:** **Jost** (la de la web). Títulos en mayúsculas, peso liviano (300) y letras separadas, como el logo. Gancho y números grandes en Jost 600. Subtítulos en Jost 500.

**Subtítulos:** 2–3 palabras por vez, en tinta sobre el fondo claro (o blanco con sombra si van sobre una toma real), a ~70% de la altura, palabra clave en marrón. Usar `herramientas/subtitular.py` para los tiempos y armar el estilo en Remotion.

**Etiquetas:** fondo marrón, texto crema en mayúsculas espaciadas, bordes redondeados (como los botones de la web), entrada con un pequeño rebote.

**Mascota:** el perrito del logo. Aparece en el gancho, reacciona en los pasos y despide en el CTA. (Pendiente: definir si usamos el dibujo del logo o uno más expresivo.)

**Progreso:** cuando el reel tenga pasos o productos, mostrar "1 de 3" o puntitos en la parte de arriba, en topo/marrón.

**Animaciones típicas Sanzo:**
- Chapita que se graba sola (el nombre del perro aparece letra por letra, como en el personalizador de la web).
- Collar/correa en "vista desarmada" (piezas separándose con etiquetas: cuerina, herraje, chapita) — idea del video de X.
- Contador que sube ("+120 perros ya tienen su chapita").
- Buscador / DM que se escribe solo para el CTA.

**Música:** acústica/lofi cálida, baja debajo de la voz. Cortes y entradas de elementos sincronizados al beat (`npx hyperframes beats`).

**Cierre:** CTA de comentario ("Comentá CHAPITA y te mando…") o "Link en la bio", con la mascota y el logo. Confirmar con Santino qué palabra usar antes de publicar.

## Lo que NO hacemos

- Fondos oscuros o neón (no es Sanzo).
- Fuentes pixeladas o muy "gamer".
- Textos de precios o promos sin confirmar.
- Transiciones de plantilla de CapCut (zoom brusco, glitch).

## Historial de ajustes

- v1 (2026-11-01): primera versión desde las 4 referencias.

## Nivel Blender (referencias `2-referencias/nivel-*.mp4`, nov 2026)

Lo que hacen bien (30–60 s, plano nuevo cada 2–3 s, voz continua):
- **Fumiga (dron)**: diorama 3D simple con luz de sol y sombras; **etiquetas con línea guía** que apuntan a la pieza ("Agua limpia", "Bomba y mangueras") y **círculo amarillo** que resalta la parte de la que se habla. Subtítulo en tarjeta oscura arriba, palabra clave en color. Barrita de progreso finita abajo. Cierre: "¿Qué querés que te explique?" + logo.
- **Sistemia (veterinaria)**: ciudad isométrica nocturna, números grandes que comparan (4 vs 1 visitas/año), interfaces de celular que se arman solas, palabra clave en recuadro de color.
- **Fábrica de porqués**: tarjetas planas sobre fondo liso, contador gigante (+3.943.367) en el gancho, checklist que se tilda, cruces rojas para lo que "no hacés".
- Gancho de 2 s: siempre una pregunta o un número grande + movimiento.

Lo que hacemos MEJOR:
- Pepe realista con luz cálida de atardecer, profundidad de campo y cámara suave (ellos usan low-poly plano y cámara fija o lineal).
- Escenario argentino reconocible (baldosas, jacarandás, mate, kiosco, colectivo) en vez de fondos genéricos.
- Tomamos de ellos: etiquetas con línea guía + círculo de resaltado sobre la pieza, barrita de progreso, contador/medidor en los problemas, cierre con pregunta para comentar.
- Subtítulos: seguimos con las reglas de Santino (Jost blanca con sombra, sin recuadro, clave en dorado subrayada).
