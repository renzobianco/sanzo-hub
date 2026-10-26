// =============================================================================
// SANZO — todo lo editable de la tienda vive acá.
// Precios: number en pesos (sin puntos ni signo) o null → "Precio próximamente".
// Imágenes: rutas dentro de /public, ej. "/productos/kit/1.jpg". Array vacío → placeholder.
// linkPago: link de Mercado Pago del producto (vacío por ahora).
// =============================================================================

export type TipoProducto = "kit" | "combo" | "individual";

export interface Producto {
  id: string;
  nombre: string;
  tipo: TipoProducto;
  /** 1-2 líneas. */
  descripcion: string;
  /**
   * Piezas que incluye. Si un texto coincide con el `id` de un producto
   * individual, se muestra su foto en miniatura; si no, se muestra el texto.
   */
  incluye: string[];
  precio: number | null;
  imagenes: string[];
  /**
   * Foto del artículo solo (fondo claro, sin logo) para las miniaturas redondas de "Incluye X piezas".
   * Vacío → usa la primera de `imagenes`. Se reemplaza por la foto definitiva cuando esté.
   */
  miniatura?: string;
  envioGratis: boolean;
  linkPago: string;
  disponible: boolean;
  /**
   * Opción que el cliente elige al agregar (talle o color). Opcional.
   * colores: muestra de color de cada valor (hex). fotos: índice de `imagenes` que se muestra al elegir ese valor.
   */
  opcion?: {
    nombre: string;
    valores: string[];
    /** Se muestran apagados y sin poder tocar (ej. talle L agotado). No entran al carrito. */
    agotados?: string[];
    colores?: Record<string, string>;
    fotos?: Record<string, number>;
  };
  /**
   * Talle además del color (gorra, piluso): se elige aparte y va al carrito como "Beige · M".
   * agotados: se avisan con un texto chico ("L agotado"), no se pueden elegir.
   */
  opcionTalle?: { valores: string[]; agotados?: string[] };
  /**
   * Pros del ítem: 2-3 líneas simples y REALES (se ven en la ficha que sube al tocar la tarjeta).
   * Vacío → no aparece la lista.
   */
  pros?: string[];
  /**
   * Medidas oficiales del proveedor (se ven en la ficha). Una fila por talle, o una sola sin talle.
   * Sin cargar → no aparece. Nada de material ni de durabilidad acá: solo medidas.
   */
  medidas?: { talle?: string; texto: string }[];
  /** Cómo elegir el talle (texto corto, se ve en la ficha debajo de las medidas). */
  guiaTalle?: string;
  /** Lo que trae adentro, dicho corto (ej. "+ rollito"). Se ve como etiqueta chiquita sobre el círculo de la pieza en combos, ficha y kit. */
  incluyeExtra?: string;
  /** Foto chiquita de lo que trae adentro (ej. el rollito de bolsitas), va dentro de la etiqueta de incluyeExtra. */
  incluyeExtraFoto?: string;
  /** Cartelito arriba de la foto, ej. "Más vendido". Vacío → no aparece. */
  etiqueta?: string;
  /**
   * Solo combos: foto de cada pieza en la galería que se desliza. Clave "pieza" o "pieza:Color"
   * (ej. "gorra:Beige"). Sin cargar → usa la foto de la pieza suelta.
   */
  fotosPiezas?: Record<string, string>;
}

/**
 * Pieza que se puede personalizar (todas menos el moño) y cómo se ve la vista previa:
 * la foto del artículo con el parche elegido encima y el nombre escrito.
 * Medidas en píxeles de la foto.
 */
export interface PiezaPersonalizable {
  /** Foto real de la pieza. Sin fondo (PNG/WebP transparente) → se ve sobre lino con una sombra suave. */
  imagen: string;
  tam: { ancho: number; alto: number };
  /** Parte de la foto que se muestra (x, y, ancho, alto). Vacío → la foto entera. */
  recorte?: [number, number, number, number];
  /** true → la foto no tiene fondo. */
  sinFondo?: boolean;
  /** Cuántos píxeles de la foto es 1 cm en la pieza real (para dibujar el parche a escala). */
  pxCm: number;
  /** Dónde arranca el parche (centro, en píxeles de la foto). Después lo mueven arrastrando. */
  inicial: { x: number; y: number };
  /** Giro del parche en grados (para piezas fotografiadas en diagonal). */
  giro?: number;
  /** Lo máximo que entra en esta pieza, en cm. En las piezas con zona, además tiene que caber en la zona. */
  cm: { ancho: number; alto: number };
  /** Imagen suave de la zona donde puede ir el parche (se ve mientras lo arrastran). */
  zona?: string;
  /** Lugares fijos para elegir con un toque (estilo Away), en píxeles de la foto. Igual se puede arrastrar a mano. */
  lugares?: { id: string; nombre: string; x: number; y: number }[];
  /** Piezas largas (correa, collar): abajo de la pieza entera se ve un acercamiento del parche para moverlo fino. */
  lupa?: boolean;
}

/** Material del parche. proximamente: se muestra pero todavía no se puede elegir. */
export interface MaterialParche {
  id: string;
  nombre: string;
  /** Suma al precio por cada pieza personalizada (además de `precioExtra`). 0 = nada. */
  precioExtra: number;
  proximamente?: boolean;
}

/**
 * Forma del parche (la recorta el láser, así que puede ser cualquiera). El dibujo de cada id está en
 * `lib/formas.ts`. libre: se estira (ancho y alto por separado); si no, mantiene su proporción.
 */
export interface FormaParche {
  id: string;
  nombre: string;
  /** "silueta": sigue el contorno de su imagen (solo con imagen). "otra": la describe con sus palabras. */
  especial?: "silueta" | "otra";
}

/** Color de la cuerina. grabado: cómo se ve lo quemado por el láser; borde: el canto cortado (también se quema). */
export interface ColorParche {
  id: string;
  nombre: string;
  color: string;
  grabado: string;
  borde: string;
  /** Cuánto manchado/envejecido tiene la cuerina (0 = parejo, 1 = muy veteado). El grano va siempre. */
  veteado?: number;
}

/** Letra para el grabado. La fuente en sí se carga en `lib/fuentes.ts` (mismo id). */
export interface FuenteGrabado {
  id: string;
  nombre: string;
  /** true → se graba en mayúsculas (letras que solo quedan bien así). */
  mayusculas?: boolean;
  /** true → "Tu letra": el cliente escribe el nombre con el dedo y se graba eso. */
  propia?: boolean;
}

/** Precio según el tamaño: el primer tramo cuyo `hastaCm2` alcanza el área del parche (ancho × alto). */
export interface TramoTamano {
  nombre: string;
  hastaCm2: number;
  /** Suma al precio por cada pieza personalizada. */
  precioExtra: number;
}

/** Todo lo que lleva talle (arnés, collar, kit y combos) viene solo en S y M. */
const TALLES = ["S", "M"];
const TALLES_ARNES = TALLES;
/** Talles que se muestran apagados ("agotado"): se ven pero no se pueden tocar. */
const TALLES_AGOTADOS = ["L"];

// -----------------------------------------------------------------------------
// Textos generales
// -----------------------------------------------------------------------------
export const sitio = {
  barraSuperior: "ENVÍO GRATIS EN EL KIT COMPLETO",
  /**
   * Principio de la página: la frase grande arriba sobre el crema y abajo la foto con el botón.
   * Las fotos van cambiando solas con un fundido. link: a qué parte de la página lleva el botón.
   */
  hero: {
    /** El título va en dos partes: la primera palabra grande y el cierre más chico, en marrón. */
    titulo: "Sacalo",
    cierre: "como se merece",
    bajada: "Accesorios para perros, pensados para salir juntos.",
    boton: "Ver el kit",
    link: "#kit",
    fotos: ["/productos/hero/3.jpg", "/productos/hero/1.jpg", "/productos/hero/4.jpg", "/productos/hero/2.jpg"],
  },
  kit: {
    bajada: "",
    boton: "Comprar el kit",
    /** Precio de las piezas sueltas (se calcula solo, tachado) y cuánto se ahorra con el kit. */
    porSeparado: "Por separado",
    ahorro: "Ahorrás",
  },
  /** Redes que se muestran en el footer. Vacío → no se muestra. */
  redes: {
    instagram: "sanzo_pets", // usuario, sin @
    facebook: "", // link completo de la página, ej. "https://www.facebook.com/sanzo.pets"
    tiktok: "https://www.tiktok.com/@sanzo_pets",
    x: "https://x.com/sanzo_pets",
    /** Número de WhatsApp con código de área, sin 0 ni 15 (ej. "11 5969 4816"). */
    whatsapp: "11 5969 4816",
  },
  email: "", // mail de contacto que se muestra en el footer
  /**
   * Botón flotante de WhatsApp. numero: con código de país, sin + ni espacios (ej. "5491122334455").
   * Vacío → el botón no aparece.
   */
  whatsapp: {
    numero: "5491159694816",
    titulo: "¿Dudas?",
    texto: "Escribinos y te respondemos por WhatsApp.",
    mensaje: "Hola sanzo! Tengo una consulta",
    rapidas: ["¿Qué talle le va a mi perro?", "¿Cuánto tarda el envío?", "Quiero el kit completo"],
  },
};

// -----------------------------------------------------------------------------
// Contador de escasez del kit: "Quedan X de 50 kits".
// Poné `restantes: null` para ocultarlo.
// -----------------------------------------------------------------------------
export const contadorKits: { restantes: number | null; total: number } = {
  restantes: null,
  total: 50,
};

// -----------------------------------------------------------------------------
// Personalización: parche de cuerina recortado y grabado con láser, pegado a la pieza.
// Forma, color, medida, letra y grabado (nombre o imagen propia) a elección.
// En kits y combos el mismo parche va en todas sus piezas (menos el moño).
// Precio por pieza personalizada = precioExtra + material + tramo de tamaño + imagen propia.
// PRECIOS DE $100: provisorios, para acordarnos de ponerlos.
// -----------------------------------------------------------------------------
export const personalizacion: {
  boton: string;
  /** En el kit va como link debajo de "Comprar": pregunta + acción subrayada. */
  link: { pregunta: string; accion: string };
  titulo: string;
  bajada: string;
  precioExtra: number;
  /** Lo que suma por pieza si sube su propia imagen. 0 = nada. */
  precioImagen: number;
  /** Texto debajo de la imagen subida. */
  avisoImagen: string;
  /** Si la imagen no se pudo subir (sin internet, Hub sin configurar): cómo nos la manda. */
  avisoImagenSinSubir: string;
  /** Mensaje de WhatsApp cuando piden ayuda con el diseño u otra forma. */
  mensajeAyuda: string;
  /** Ejemplos que se muestran en "Tu imagen" para que se animen. */
  ideasImagen: string[];
  maxNombre: number;
  formas: FormaParche[];
  colores: ColorParche[];
  fuentes: FuenteGrabado[];
  materiales: MaterialParche[];
  /** Medida libre en cm: mínimo, de a cuánto se mueve y con cuál arranca. El máximo sale de cada pieza (`piezas[x].cm`). */
  medidas: { minCm: number; pasoCm: number; inicial: { ancho: number; alto: number } };
  tamanos: TramoTamano[];
  piezas: Record<string, PiezaPersonalizable>;
} = {
  boton: "Personalizar",
  link: { pregunta: "¿Con su nombre?", accion: "Personalizalo" },
  titulo: "Hacelo suyo",
  bajada: "Diseñá su parche: forma, color, medida y lo que quieras grabar.",
  /** Lo que suma personalizar CADA pieza (un kit con 5 piezas personalizables suma 5 veces). PROVISORIO. */
  precioExtra: 100,
  /** Por grabar su propia imagen, por pieza. PROVISORIO. */
  precioImagen: 100,
  avisoImagen: "Es una vista previa: la grabamos con tu imagen original, en alta calidad.",
  mensajeAyuda: "Hola sanzo! Quiero personalizar un parche y necesito ayuda con el diseño",
  ideasImagen: ["Una foto tuya con tu perro", "Su carita", "El escudo de tu club", "Su huellita", "Un dibujo de tus hijos", "Tu logo"],
  avisoImagenSinSubir: "No pudimos guardar la imagen original. Después del pedido mandala por WhatsApp con tu número de pedido.",
  /** Máximo de letras del nombre. */
  maxNombre: 14,
  /** Formas, en el orden en que se muestran (el dibujo de cada una está en lib/formas.ts). */
  formas: [
    { id: "rectangulo", nombre: "Rectángulo" },
    { id: "redondeado", nombre: "Redondeado" },
    { id: "capsula", nombre: "Cápsula" },
    { id: "ovalo", nombre: "Óvalo" },
    { id: "circulo", nombre: "Círculo" },
    { id: "hueso", nombre: "Hueso" },
    { id: "corazon", nombre: "Corazón" },
    { id: "escudo", nombre: "Escudo" },
    { id: "banderin", nombre: "Banderín" },
    { id: "huella", nombre: "Huellita" },
    { id: "estrella", nombre: "Estrella" },
    { id: "silueta", nombre: "Su silueta", especial: "silueta" },
    { id: "otra", nombre: "Otra", especial: "otra" },
  ],
  /** Colores de cuerina. `grabado` y `borde` son aproximados: ajustarlos con fotos de muestras reales. */
  colores: [
    { id: "tabaco", nombre: "Tabaco envejecido", color: "#8f5535", grabado: "#2b170c", borde: "#3a2213", veteado: 0.9 },
    { id: "chocolate", nombre: "Marrón chocolate", color: "#5b3a26", grabado: "#24140a", borde: "#2e1b10", veteado: 0.35 },
    { id: "camel", nombre: "Camel", color: "#c08a55", grabado: "#4a2a14", borde: "#6e4423", veteado: 0.4 },
    { id: "blanco", nombre: "Blanco", color: "#f1ece4", grabado: "#5a3a24", borde: "#8a6a50", veteado: 0.1 },
    { id: "negro", nombre: "Negro", color: "#2a2726", grabado: "#0c0b0a", borde: "#121010", veteado: 0.15 },
  ],
  /** Letras para el grabado (se cargan en lib/fuentes.ts). La primera queda elegida de entrada. */
  fuentes: [
    { id: "jost", nombre: "Moderna", mayusculas: true },
    { id: "playfair", nombre: "Clásica" },
    { id: "cinzel", nombre: "Romana", mayusculas: true },
    { id: "bebas", nombre: "Firme", mayusculas: true },
    { id: "fredoka", nombre: "Redonda" },
    { id: "courier", nombre: "Máquina" },
    { id: "greatvibes", nombre: "Cursiva" },
    { id: "pacifico", nombre: "Divertida" },
    { id: "caveat", nombre: "A mano" },
    { id: "propia", nombre: "Tu letra", propia: true },
  ],
  /** Materiales del parche, en orden. El primero disponible queda elegido de entrada. */
  materiales: [
    { id: "cuerina", nombre: "Cuerina", precioExtra: 0 },
    { id: "bordado", nombre: "Bordado", precioExtra: 0, proximamente: true },
  ],
  medidas: { minCm: 2, pasoCm: 0.5, inicial: { ancho: 6, alto: 3 } },
  /** Tramos de precio por tamaño (área = ancho × alto en cm²), del más chico al más grande. PROVISORIOS. */
  tamanos: [
    { nombre: "Chico", hastaCm2: 10, precioExtra: 100 },
    { nombre: "Mediano", hastaCm2: 20, precioExtra: 200 },
    { nombre: "Grande", hastaCm2: Infinity, precioExtra: 300 },
  ],
  /**
   * Vista previa de cada pieza: la foto real sin fondo (public/productos/personalizar/). El parche se mueve
   * arrastrando, solo dentro de la zona de cada pieza (`personalizar/zonas.json`: la tela, sin ribete, logo
   * ni herrajes; se arma con el script de la sesión 2026-10-24). PROVISORIO: `pxCm` y `cm` estimados, medir
   * las piezas reales.
   */
  piezas: {
    // Fotos de estudio HD (ChatGPT de Sanzo, a partir de las fotos reales de Santi) con el parche real pegado,
    // sin fondo. Zonas = todo lo marrón de frente. Lugares fijos: se eligen con un toque (estilo Away).
    // pxCm medido con el ancho real de cada tira (correa 2 cm, collar 2,5 cm) y la etiqueta del arnés. PROVISORIO: confirmar con medidas.
    arnes: {
      imagen: "/productos/personalizar/arnes.webp", zona: "/productos/personalizar/arnes-zona.webp", tam: { ancho: 1222, alto: 1204 }, sinFondo: true,
      pxCm: 42, inicial: { x: 605, y: 400 }, cm: { ancho: 10, alto: 7 },
      lugares: [{ id: "pecho", nombre: "Bajo el logo", x: 605, y: 400 }, { id: "abajo", nombre: "Abajo", x: 608, y: 915 }],
    },
    correa: {
      imagen: "/productos/personalizar/correa.webp", zona: "/productos/personalizar/correa-zona.webp", tam: { ancho: 1564, alto: 380 }, sinFondo: true, lupa: true,
      pxCm: 25, inicial: { x: 860, y: 113 }, cm: { ancho: 6, alto: 1.7 },
      lugares: [
        { id: "manija", nombre: "Cerca de la manija", x: 860, y: 113 },
        { id: "medio", nombre: "Al medio", x: 500, y: 294 },
        { id: "mosqueton", nombre: "Cerca del mosquetón", x: 990, y: 294 },
      ],
    },
    collar: {
      imagen: "/productos/personalizar/collar.webp", zona: "/productos/personalizar/collar-zona.webp", tam: { ancho: 1566, alto: 205 }, sinFondo: true, lupa: true,
      pxCm: 46, inicial: { x: 660, y: 117 }, cm: { ancho: 8, alto: 2.2 },
      lugares: [{ id: "logo", nombre: "Junto al logo", x: 660, y: 117 }, { id: "hebilla", nombre: "Antes de la hebilla", x: 930, y: 117 }],
    },
    bandana: {
      imagen: "/productos/personalizar/bandana.webp", zona: "/productos/personalizar/bandana-zona.webp", tam: { ancho: 1616, alto: 1104 }, sinFondo: true,
      pxCm: 27, inicial: { x: 808, y: 470 }, cm: { ancho: 10, alto: 8 },
      lugares: [{ id: "centro", nombre: "Centro", x: 808, y: 470 }, { id: "arriba", nombre: "Arriba", x: 808, y: 320 }],
    },
    "poo-bag": {
      // Acostado, con el cierre arriba (como lo pidió Santi).
      imagen: "/productos/personalizar/poo-bag.webp", zona: "/productos/personalizar/poo-bag-zona.webp", tam: { ancho: 1531, alto: 881 }, sinFondo: true,
      pxCm: 80, inicial: { x: 560, y: 590 }, cm: { ancho: 7, alto: 4.5 },
      lugares: [
        { id: "centro", nombre: "Centro", x: 560, y: 590 },
        { id: "izquierda", nombre: "Izquierda", x: 330, y: 590 },
        { id: "derecha", nombre: "Derecha", x: 790, y: 590 },
      ],
    },
    gorra: { imagen: "/productos/solo/gorra/1.jpg", tam: { ancho: 1080, alto: 1350 }, recorte: [240, 280, 680, 680], pxCm: 32, inicial: { x: 560, y: 560 }, giro: -12, cm: { ancho: 6, alto: 4 } },
    piluso: { imagen: "/productos/solo/piluso/1.jpg", tam: { ancho: 1080, alto: 1350 }, recorte: [260, 400, 560, 560], pxCm: 28, inicial: { x: 540, y: 845 }, cm: { ancho: 6, alto: 4 } },
  },
};

// -----------------------------------------------------------------------------
// Guía de talles (modal). Completá las medidas; vacío se muestra como "—".
// -----------------------------------------------------------------------------
export const guiaTalles = {
  nota: "Medí a tu perro con una cinta métrica blanda: el cuello en la base, donde iría el collar, y el pecho en la parte más ancha, justo detrás de las patas delanteras. Si queda en la zona donde entran los dos talles, elegí el M así tiene margen para ajustar.",
  // Medidas del arnés (el talle del kit y de los combos con arnés es el del arnés).
  filas: [
    { talle: "S", pecho: "41 a 54 cm", cuello: "35 a 44 cm" },
    { talle: "M", pecho: "46 a 61 cm", cuello: "39 a 51 cm" },
  ],
};

// -----------------------------------------------------------------------------
// Kit completo (el protagonista)
// -----------------------------------------------------------------------------
export const kit: Producto = {
  id: "kit-completo",
  nombre: "Kit Paseo Sanzo",
  tipo: "kit",
  descripcion: "Arnés, correa, collar, moño, bandana y porta bolsitas. Todo lo que necesita para salir. Combinado.",
  incluye: ["arnes", "correa", "collar", "mono", "bandana", "poo-bag"],
  precio: 59999,
  imagenes: ["/productos/kit/1.jpg", "/productos/kit/2.jpg", "/productos/kit/3.jpg", "/productos/kit/4.jpg"],
  envioGratis: true,
  linkPago: "",
  disponible: true,
  opcion: { nombre: "Talle", valores: TALLES_ARNES, agotados: TALLES_AGOTADOS },
  etiqueta: "Más vendido",
};

// -----------------------------------------------------------------------------
// Combos — REGLA: precio del combo = suma de los precios "base" de sus piezas (los del Hub).
// Los sueltos se venden más caros (Hub +25%) para que convenga llevar combo.
// -----------------------------------------------------------------------------
export const combos: Producto[] = [
  {
    id: "combo-paseo",
    nombre: "Combo Paseo",
    tipo: "combo",
    descripcion: "Lo justo para el paseo de todos los días.",
    incluye: ["correa", "collar", "poo-bag"],
    precio: 26999,
    imagenes: ["/productos/combo-paseo/1.jpg", "/productos/combo-paseo/2.jpg", "/productos/combo-paseo/3.jpg"],
    envioGratis: false,
    linkPago: "",
    disponible: true,
    opcion: { nombre: "Talle", valores: TALLES, agotados: TALLES_AGOTADOS },
  },
  {
    id: "combo-estilo",
    nombre: "Combo Estilo",
    tipo: "combo",
    descripcion: "Para que salga con onda. Y se note.",
    incluye: ["collar", "mono", "bandana"],
    precio: 24499,
    imagenes: ["/productos/combo-estilo/articulo.jpg", "/productos/combo-estilo/banco.jpg", "/productos/combo-estilo/1.jpg", "/productos/combo-estilo/2.jpg", "/productos/combo-estilo/3.jpg"],
    envioGratis: false,
    linkPago: "",
    disponible: true,
    opcion: { nombre: "Talle", valores: TALLES, agotados: TALLES_AGOTADOS },
  },
  {
    id: "combo-aventura",
    nombre: "Combo Aventura",
    tipo: "combo",
    descripcion: "Arnés y correa que van juntos a todos lados.",
    incluye: ["arnes", "correa"],
    precio: 24999,
    imagenes: ["/productos/combo-aventura/1.jpg", "/productos/combo-aventura/2.jpg"],
    envioGratis: false,
    linkPago: "",
    disponible: true,
    opcion: { nombre: "Talle", valores: TALLES_ARNES, agotados: TALLES_AGOTADOS },
  },
  {
    id: "combo-sol",
    nombre: "Combo Sol",
    tipo: "combo",
    descripcion: "Gorra y piluso, para cada día de sol.",
    incluye: ["gorra", "piluso"],
    precio: 21999,
    imagenes: ["/productos/solo/gorra/1.jpg", "/productos/solo/piluso/1.jpg", "/productos/solo/gorra/2.jpg", "/productos/solo/piluso/2.jpg"],
    envioGratis: false,
    linkPago: "",
    disponible: true,
    // Un talle para las dos piezas; el color de la gorra y el del piluso se eligen aparte (salen de cada pieza).
    opcion: { nombre: "Talle", valores: TALLES, agotados: TALLES_AGOTADOS },
  },
  {
    // Collar (base 8.500) + chapita (6.000, lo que sale sumada a una compra) → 14.499.
    // Al agregarlo se abre la personalización de la chapita; el grabado va en la opción: "M · Corazón · Coco".
    id: "combo-identidad",
    nombre: "Combo Identidad",
    tipo: "combo",
    descripcion: "Su collar y su chapita grabada. Para que siempre vuelva a casa.",
    incluye: ["collar", "chapita"],
    precio: 14499,
    imagenes: ["/productos/combo-identidad/1.jpg"],
    envioGratis: false,
    linkPago: "",
    disponible: true,
    // Mismos talles que el collar.
    opcion: { nombre: "Talle", valores: ["M"], agotados: ["S", ...TALLES_AGOTADOS] },
  },
];

// -----------------------------------------------------------------------------
// Productos individuales (fotos: SOLO el producto, sin perros)
// -----------------------------------------------------------------------------
export const individuales: Producto[] = [
  {
    id: "arnes",
    miniatura: "/productos/solo/arnes/1.jpg",
    nombre: "Arnés",
    tipo: "individual",
    descripcion: "Terracota, liviano y a su medida.",
    incluye: [],
    precio: 18999,
    imagenes: ["/productos/solo/arnes/1.jpg", "/productos/solo/arnes/2.jpg", "/productos/solo/arnes/3.jpg"],
    medidas: [
      { talle: "S", texto: "Cuello 35 a 44 cm · Pecho 41 a 54 cm · Tira de 2 cm · Regulable" },
      { talle: "M", texto: "Cuello 39 a 51 cm · Pecho 46 a 61 cm · Tira de 2 cm · Regulable" },
    ],
    guiaTalle:
      "Medí a tu perro con una cinta métrica blanda: el cuello en la base, donde iría el collar, y el pecho en la parte más ancha, justo detrás de las patas delanteras. Si queda en la zona donde entran los dos talles, elegí el M así tiene margen para ajustar.",
    envioGratis: false,
    linkPago: "",
    disponible: true,
    opcion: { nombre: "Talle", valores: TALLES_ARNES, agotados: TALLES_AGOTADOS },
  },
  {
    id: "correa",
    miniatura: "/productos/solo/correa/1.jpg",
    nombre: "Correa",
    tipo: "individual",
    descripcion: "La que combina con todo lo demás.",
    incluye: [],
    precio: 12499,
    imagenes: ["/productos/solo/correa/1.jpg", "/productos/solo/correa/2.jpg", "/productos/solo/correa/3.jpg"],
    medidas: [{ texto: "Largo 152 cm · Ancho 2 cm" }],
    envioGratis: false,
    linkPago: "",
    disponible: true,
  },
  {
    id: "collar",
    miniatura: "/productos/solo/collar/1.jpg",
    nombre: "Collar",
    tipo: "individual",
    descripcion: "Simple, prolijo, a su medida.",
    incluye: [],
    precio: 10499,
    imagenes: ["/productos/solo/collar/1.jpg", "/productos/solo/collar/2.jpg", "/productos/solo/collar/3.jpg"],
    medidas: [{ talle: "M", texto: "Regula de 33 a 51 cm · Ancho 2 cm" }],
    envioGratis: false,
    linkPago: "",
    disponible: true,
    // Collar S: no quedan más (Santi, 2026-10-23).
    opcion: { nombre: "Talle", valores: ["M"], agotados: ["S", ...TALLES_AGOTADOS] },
  },
  {
    id: "mono",
    miniatura: "/productos/solo/mono/1.jpg",
    nombre: "Moño",
    tipo: "individual",
    descripcion: "El detalle que le cambia la cara al paseo.",
    incluye: [],
    precio: 9499,
    imagenes: ["/productos/solo/mono/1.jpg", "/productos/solo/mono/2.jpg", "/productos/solo/mono/3.jpg"],
    medidas: [{ texto: "6 x 9 cm" }],
    envioGratis: false,
    linkPago: "",
    disponible: true,
  },
  {
    id: "bandana",
    miniatura: "/productos/solo/bandana/1.jpg",
    nombre: "Bandana",
    tipo: "individual",
    descripcion: "Al cuello, sobre el pecho. Como tiene que ir.",
    incluye: [],
    precio: 10499,
    imagenes: ["/productos/solo/bandana/1.jpg", "/productos/solo/bandana/2.jpg", "/productos/solo/bandana/3.jpg"],
    medidas: [{ texto: "49,5 cm de base · 34 cm por lado" }],
    envioGratis: false,
    linkPago: "",
    disponible: true,
  },
  {
    id: "poo-bag",
    miniatura: "/productos/solo/poo-bag/1.jpg",
    nombre: "Poo bag",
    tipo: "individual",
    descripcion: "Porta bolsitas con un rollito adentro. Siempre a mano, en la correa.",
    incluyeExtra: "+ rollito",
    incluye: [],
    precio: 10499,
    imagenes: ["/productos/solo/poo-bag/1.jpg", "/productos/solo/poo-bag/2.jpg", "/productos/solo/poo-bag/3.jpg"],
    medidas: [{ texto: "8 x 5 x 5 cm" }],
    envioGratis: false,
    linkPago: "",
    disponible: true,
  },
  {
    id: "gorra",
    nombre: "Gorra",
    tipo: "individual",
    descripcion: "Para vos. Que combine con el paseo.",
    incluye: [],
    precio: 11999,
    imagenes: ["/productos/solo/gorra/1.jpg", "/productos/solo/gorra/2.jpg"],
    medidas: [
      { talle: "S", texto: "Ancho 16 cm" },
      { talle: "M", texto: "Ancho 18 cm" },
    ],
    opcionTalle: { valores: TALLES, agotados: TALLES_AGOTADOS },
    envioGratis: false,
    linkPago: "",
    disponible: true,
    opcion: {
      nombre: "Color",
      valores: ["Beige", "Océano"],
      colores: { Beige: "#C9AE8B", Océano: "#A8C3DB" },
      fotos: { Beige: 0, Océano: 1 },
    },
  },
  {
    id: "piluso",
    nombre: "Piluso",
    tipo: "individual",
    descripcion: "Para el sol de la plaza.",
    incluye: [],
    precio: 11999,
    imagenes: ["/productos/solo/piluso/1.jpg", "/productos/solo/piluso/2.jpg"],
    medidas: [
      { talle: "S", texto: "Ancho 21 cm" },
      { talle: "M", texto: "Ancho 23 cm" },
    ],
    opcionTalle: { valores: TALLES, agotados: TALLES_AGOTADOS },
    envioGratis: false,
    linkPago: "",
    disponible: true,
    opcion: {
      nombre: "Color",
      valores: ["Granate", "Jade"],
      colores: { Granate: "#7B2331", Jade: "#8FBDB2" },
      fotos: { Granate: 0, Jade: 1 },
    },
  },
];

// -----------------------------------------------------------------------------
// Combos armados en el carrito: si llevás sueltas las piezas de un combo (o del kit),
// el carrito te sugiere las que faltan y, cuando están todas, arma el combo y descuenta
// lo que ahorrás. Sale solo de `combos`, `kit` y los precios sueltos (lib/promos.ts).
// Acá solo los textos.
// -----------------------------------------------------------------------------
export const carritoCombos = {
  /** Sugerencia: "Armá el Combo Paseo". */
  arma: "Armá el",
  /** Pasar de un combo a uno más grande: "Pasá tu Combo Aventura al Kit completo". */
  pasa: "Pasá tu",
  pasan: "Pasá tus combos",
  al: "al",
  /** "Te falta collar" / "Te faltan collar y poo bag". */
  falta: "Te falta",
  faltan: "Te faltan",
  ahorras: "Ahorrás",
  sumar: "Sumar",
  /** Combo completo: "Armaste el Combo Paseo". */
  armaste: "Armaste el",
};

// -----------------------------------------------------------------------------
// Reseñas y videos de clientes. SOLO reales (nada inventado).
// Lista vacía → la sección no aparece. video/foto: rutas en /public, opcionales.
// -----------------------------------------------------------------------------
export const resenas: { nombre: string; perro?: string; texto: string; video?: string; foto?: string }[] = [];

// -----------------------------------------------------------------------------
// Franja de confianza (garantías, envíos, pagos).
// cuotasSinInteres: cantidad de cuotas SOLO si están activadas en Mercado Pago; null → no se muestra.
// -----------------------------------------------------------------------------
export const confianza = {
  cuotasSinInteres: null as number | null,
};

// -----------------------------------------------------------------------------
// Cinta que corre debajo del hero. Vacía → no aparece.
// -----------------------------------------------------------------------------
export const cinta: string[] = [];

// -----------------------------------------------------------------------------
// Clientes: "+150 clientes satisfechos". El número tiene que ser REAL.
// numero: null → la sección no aparece.
// -----------------------------------------------------------------------------
export const clientes = {
  numero: 150 as number | null,
  texto: "clientes satisfechos",
  /** Al lado del número, con un puntito que late. Vacío → no aparece. */
  sumando: "y sumando",
  bajada: "Perros que ya salen con sanzo. Mirá cómo les queda.",
  /**
   * Tira de fotos/videos que corre sola de izquierda a derecha (sin fin).
   * Videos de clientes usándolos (verticales 9:16, cortos, sin sonido): ruta en /public, ej. "/videos/clientes/lola.mp4".
   * `foto` se muestra mientras carga el video, o sola si todavía no hay video.
   * `perro`: nombre y barrio, ej. "Lola · Caballito". Opcional.
   */
  videos: [
    { video: "", foto: "/productos/clientes/1.jpg", perro: "" },
    { video: "", foto: "/productos/galeria/1.jpg", perro: "" },
    { video: "", foto: "/productos/clientes/2.jpg", perro: "" },
    { video: "", foto: "/productos/hero/1.jpg", perro: "" },
    { video: "", foto: "/productos/clientes/3.jpg", perro: "" },
    { video: "", foto: "/productos/galeria/2.jpg", perro: "" },
    { video: "", foto: "/productos/clientes/4.jpg", perro: "" },
    { video: "", foto: "/productos/hero/2.jpg", perro: "" },
    { video: "", foto: "/productos/galeria/3.jpg", perro: "" },
    { video: "", foto: "/productos/clientes/5.jpg", perro: "" },
    { video: "", foto: "/productos/hero/3.jpg", perro: "" },
    { video: "", foto: "/productos/galeria/4.jpg", perro: "" },
    { video: "", foto: "/productos/clientes/6.jpg", perro: "" },
    { video: "", foto: "/productos/hero/4.jpg", perro: "" },
    { video: "", foto: "/productos/galeria/5.jpg", perro: "" },
  ] as { video: string; foto: string; perro: string }[],
};

// -----------------------------------------------------------------------------
// Vista 360° del arnés: pestaña "360°" dentro de "Personalizar" (al lado de la vista de su diseño).
// Hoy: frente y espalda, se gira arrastrando con el dedo.
// Cuando estén las fotos de la vuelta completa (24-36, en orden, mismo encuadre y fondo),
// ponelas en `cuadros` y el visor pasa solo a 360° real cuadro por cuadro.
// activo: false → no aparece la pestaña.
// -----------------------------------------------------------------------------
export const vista360 = {
  activo: false, // Santi (2026-10-25): sacarlo por ahora; después va un 360° por cada ítem.
  pestana360: "360°",
  frente: "/productos/360/frente.jpg",
  espalda: "/productos/360/espalda.jpg",
  cuadros: [] as string[],
};

// -----------------------------------------------------------------------------
// Legales (Argentina). Obligatorios en tiendas online:
// - Botón de arrepentimiento (Res. 424/2020): link visible en la home → /arrepentimiento.
// - Link a Defensa de las y los Consumidores (Res. 38/2017).
// -----------------------------------------------------------------------------
export const legal = {
  arrepentimiento: {
    boton: "Botón de arrepentimiento",
    titulo: "Botón de arrepentimiento",
    texto:
      "Tenés 10 días corridos desde que recibiste tu pedido para arrepentirte de la compra, sin dar explicaciones y sin costo. Completá el formulario y te respondemos para coordinar la devolución y el reintegro.",
    listo: "Recibimos tu pedido de arrepentimiento. Guardá este código de trámite:",
  },
  defensaConsumidor: {
    texto: "Defensa de las y los Consumidores. Para reclamos ingresá acá",
    url: "https://www.argentina.gob.ar/produccion/defensadelconsumidor/formulario",
  },
};

// -----------------------------------------------------------------------------
// Preguntas frecuentes (placeholders: revisalas antes de publicar)
// -----------------------------------------------------------------------------
export const preguntas: { pregunta: string; respuesta: string }[] = [
  {
    pregunta: "¿Por qué sanzo?",
    respuesta:
      "Porque todo combina entre sí (arnés, correa, collar, moño y bandana de la misma línea), se pone en segundos y hacemos envíos a todo el país, con envío gratis en el kit completo.",
  },
  {
    pregunta: "¿Cómo elijo el talle?",
    respuesta:
      "Medí el contorno de pecho y el cuello de tu perro y comparalo con la guía de talles. Si queda entre dos, escribinos y te ayudamos.",
  },
  {
    pregunta: "¿Cuánto tarda el envío?",
    respuesta:
      "Despachamos por Correo Argentino apenas se confirma el pago. Te pasamos el número de seguimiento para que lo sigas.",
  },
  {
    pregunta: "¿Cómo pago?",
    respuesta: "Con Mercado Pago: tarjeta de crédito, débito o dinero en cuenta.",
  },
  {
    pregunta: "¿Puedo cambiar el talle?",
    respuesta: "Sí. Escribinos y lo coordinamos con vos.",
  },
  {
    pregunta: "¿Hacen envíos a todo el país?",
    respuesta:
      "Sí, a todo el país por Correo Argentino: a domicilio o para retirar en sucursal. El kit completo tiene envío gratis.",
  },
];

// -----------------------------------------------------------------------------
// Chapita personalizada: se ofrece en un cartel al tocar "Comprar el kit" o "Agregar".
// Suelta sale `precio`; sumada a otra compra sale `oferta.precio` (lo calcula el carrito).
// El grabado viaja como la opción de la línea, ej. "Corazón · Coco · Tel. 11 2345 6789".
// -----------------------------------------------------------------------------
export const chapita: Producto = {
  id: "chapita",
  nombre: "Chapita personalizada",
  tipo: "individual",
  descripcion: "Grabada con láser, con su nombre y tu teléfono.",
  incluye: [],
  precio: 8000,
  miniatura: "/productos/piezas/chapita.jpg",
  imagenes: ["/productos/piezas/chapita.jpg"],
  envioGratis: false,
  linkPago: "",
  disponible: true,
};

export const ofertaChapita = {
  /** false → el cartel no aparece. */
  activa: true,
  /** Precio de la chapita cuando se suma a otra compra. */
  precio: 6000,
  imagen: "/productos/chapitas/oferta.jpg",
  /** Lo primero que se ve: la pieza de la chapita (ya trae título y precio) y abajo el botón `agregar`. */
  cartel: "/productos/chapitas/cartel.jpg",
  cartelAlt: "¿Le sumás una chapita personalizada? Grabá el nombre y el teléfono de tu perro. Por solo $6.000.",
  agregar: "Agregar",
  titulo: "Personalizá su chapita",
  bajada: "Elegí la forma y escribí lo que va grabado. Así se ve:",
  soloAhora: "Solo sumándola a tu compra",
  boton: "Sumar chapita",
  /** Combo Identidad: la chapita ya viene en el combo. */
  botonCombo: "Agregar al carrito",
  no: "No, gracias",
  maxNombre: 12,
  /**
   * Opción de grabar la foto de su perro: después de comprar nos la manda por WhatsApp y la pasamos a
   * grabado láser. En la vista previa se ve `ejemplo` (carita en línea, PNG blanco transparente).
   */
  foto: {
    texto: "Grabar la foto de tu perro",
    detalle: "Después de comprar nos la mandás por WhatsApp y la pasamos a grabado láser.",
    ejemplo: "/productos/chapitas/perro-grabado.png",
    ejemploTam: { ancho: 336, alto: 263 },
    /** Mensaje que se arma en /gracias para mandar la foto ({numero} = número de pedido). */
    mensajeWhatsapp: "Hola sanzo! Les mando la foto de mi perro para grabar en la chapita del pedido {numero}.",
  },
  /** Medida de las fotos de las chapitas (todas iguales), en píxeles. */
  fotoTam: { ancho: 541, alto: 722 },
  /**
   * Formas de chapita. Se graba la foto, el nombre, el teléfono o cualquier combinación (al menos uno).
   * zona: dónde va el grabado sobre la foto, en píxeles de la foto: centro (x, y) y lo que entra (ancho, alto).
   */
  tipos: [
    { id: "Huesito", texto: "Huesito", imagen: "/productos/chapitas/huesito.jpg", zona: { x: 300, y: 380, ancho: 250, alto: 120 } },
    { id: "Corazón", texto: "Corazón", imagen: "/productos/chapitas/corazon.jpg", zona: { x: 278, y: 350, ancho: 185, alto: 120 } },
    { id: "Circular", texto: "Circular", imagen: "/productos/chapitas/circular.jpg", zona: { x: 256, y: 390, ancho: 185, alto: 140 } },
    { id: "Placa", texto: "Placa", imagen: "/productos/chapitas/rectangular.jpg", zona: { x: 266, y: 365, ancho: 180, alto: 200 } },
  ] as { id: string; texto: string; imagen: string; zona: { x: number; y: number; ancho: number; alto: number } }[],
};

// -----------------------------------------------------------------------------
// Helpers (no hace falta tocar)
// -----------------------------------------------------------------------------
export const todosLosProductos: Producto[] = [kit, ...combos, ...individuales, chapita];

export function getProducto(id: string): Producto | undefined {
  return todosLosProductos.find((p) => p.id === id);
}
