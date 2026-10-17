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
  opcion?: { nombre: string; valores: string[]; colores?: Record<string, string>; fotos?: Record<string, number> };
  /** Cartelito arriba de la foto, ej. "Más vendido". Vacío → no aparece. */
  etiqueta?: string;
}

/**
 * Pieza que se puede personalizar (todas menos el moño) y cómo se ve la vista previa:
 * la foto del artículo con el parche elegido encima y el nombre escrito.
 * Medidas en píxeles de la foto. El arnés usa sus fotos con cada parche (`estilos`), no esto.
 */
export interface PiezaPersonalizable {
  imagen: string;
  tam: { ancho: number; alto: number };
  /** Parte de la foto que se muestra (x, y, ancho, alto), para acercar el parche. Vacío → la foto entera. */
  recorte?: [number, number, number, number];
  /** true → la foto tiene fondo blanco y se funde con el fondo de la vista. */
  fondoBlanco?: boolean;
  /** Dónde va el parche: centro (x, y), ancho y giro en grados. */
  parche: { x: number; y: number; ancho: number; giro?: number };
}

/** Material del parche. proximamente: se muestra pero todavía no se puede elegir. */
export interface MaterialParche {
  id: string;
  nombre: string;
  /** Suma al precio por cada pieza personalizada (además de `precioExtra`). 0 = nada. */
  precioExtra: number;
  proximamente?: boolean;
}

/** Forma de parche. */
export interface EstiloParche {
  id: string;
  nombre: string;
  /** Foto del parche solo, sin fondo (PNG transparente). Se usa en el botón y en la vista previa. */
  parche: string;
}

/** Tamaño del parche. escala: parte del espacio máximo de cada pieza (1 = lo más grande que entra). */
export interface TamanoParche {
  id: string;
  nombre: string;
  escala: number;
  /** Suma al precio por cada pieza personalizada. A más grande, más caro. 0 = nada. */
  precioExtra: number;
}

/** Todo lo que lleva talle (arnés, collar, kit y combos) viene solo en S y M. */
const TALLES = ["S", "M"];
const TALLES_ARNES = TALLES;

// -----------------------------------------------------------------------------
// Textos generales
// -----------------------------------------------------------------------------
export const sitio = {
  barraSuperior: "ENVÍO GRATIS EN EL KIT COMPLETO",
  hero: {
    titulo: "SACALO COMO SE MERECE",
    /** Fotos de la portada: van cambiando solas. La primera es la que carga primero. */
    imagenes: ["/productos/hero/1.jpg", "/productos/hero/2.jpg", "/productos/hero/3.jpg", "/productos/hero/4.jpg"],
  },
  /** Chips fijos arriba mientras se recorre la tienda. id = id de la sección. */
  secciones: [
    { id: "kit", label: "Kit completo" },
    { id: "combos", label: "Combos" },
    { id: "productos", label: "Individuales" },
  ],
  kit: {
    bajada: "Todo lo que necesita para salir. Combinado.",
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
// Personalización: parche con el nombre del perro (y su teléfono, si quieren).
// Se puede personalizar todo menos el moño: el botón aparece en cada producto que tenga
// alguna pieza en `piezas` (o el arnés). En kits y combos se personalizan todas sus piezas.
// Precio: `precioExtra` por cada pieza personalizada + el extra del material. 0 = sin costo extra.
// -----------------------------------------------------------------------------
export const personalizacion: {
  boton: string;
  titulo: string;
  bajada: string;
  precioExtra: number;
  /** Lo que suma por pieza si sube su propia imagen. 0 = nada. */
  precioImagen: number;
  /** Texto que se muestra al subir una imagen (cómo nos la manda en buena calidad). */
  avisoImagen: string;
  maxNombre: number;
  estilos: EstiloParche[];
  materiales: MaterialParche[];
  tamanos: TamanoParche[];
  piezas: Record<string, PiezaPersonalizable>;
} = {
  boton: "Personalizar",
  titulo: "Hacelo suyo",
  bajada: "Elegí el parche, el tamaño y poné su nombre o tu imagen.",
  /**
   * Lo que suma personalizar CADA pieza (un kit con 5 piezas personalizables suma 5 veces).
   * PENDIENTE: poner el precio. 0 = sin costo extra (no se muestra).
   */
  precioExtra: 0,
  /** PENDIENTE: precio por subir imagen propia (grabado láser de la imagen). */
  precioImagen: 0,
  avisoImagen: "Es una vista previa de cómo queda grabada. Después del pedido nos mandás la imagen original por WhatsApp.",
  /** Máximo de letras del nombre. */
  maxNombre: 12,
  /** Los estilos, en el orden en que se muestran. */
  estilos: [
    { id: "cinta", nombre: "Cinta", parche: "/productos/arnes/parche-cinta.png" },
    { id: "hueso", nombre: "Hueso", parche: "/productos/arnes/parche-hueso.png" },
    { id: "clasica", nombre: "Clásica", parche: "/productos/arnes/parche-clasica.png" },
    { id: "redondeada", nombre: "Redondeada", parche: "/productos/arnes/parche-redondeada.png" },
  ],
  /** Materiales del parche, en orden. El primero disponible queda elegido de entrada. */
  materiales: [
    { id: "cuerina", nombre: "Cuerina", precioExtra: 0 },
    { id: "bordado", nombre: "Bordado", precioExtra: 0, proximamente: true },
  ],
  /** Tamaños, del más chico al máximo. PENDIENTE: precios (a más grande, más caro). */
  tamanos: [
    { id: "chico", nombre: "Chico", escala: 0.7, precioExtra: 0 },
    { id: "mediano", nombre: "Mediano", escala: 0.85, precioExtra: 0 },
    { id: "grande", nombre: "Grande", escala: 1, precioExtra: 0 },
  ],
  /**
   * Vista previa de cada pieza (fotos del artículo sin logo). `parche` = el espacio MÁXIMO del parche
   * en esa pieza (el tamaño "Grande"). Ajustalo si queda corrido.
   */
  piezas: {
    arnes: { imagen: "/productos/piezas/arnes.png", tam: { ancho: 927, alto: 1152 }, recorte: [150, 150, 627, 784], fondoBlanco: true, parche: { x: 460, y: 335, ancho: 175 } },
    correa: { imagen: "/productos/piezas/correa.jpg", tam: { ancho: 1798, alto: 576 }, recorte: [1010, 200, 540, 400], fondoBlanco: true, parche: { x: 1262, y: 397, ancho: 175 } },
    collar: { imagen: "/productos/piezas/collar.jpg", tam: { ancho: 1557, alto: 352 }, recorte: [930, 0, 580, 352], fondoBlanco: true, parche: { x: 1217, y: 196, ancho: 265 } },
    bandana: { imagen: "/productos/piezas/bandana.jpg", tam: { ancho: 1146, alto: 912 }, recorte: [380, 400, 600, 480], fondoBlanco: true, parche: { x: 668, y: 686, ancho: 190, giro: -32 } },
    "poo-bag": { imagen: "/productos/piezas/poo-bag.jpg", tam: { ancho: 928, alto: 1152 }, recorte: [180, 330, 600, 520], parche: { x: 425, y: 618, ancho: 140, giro: -22 } },
    gorra: { imagen: "/productos/solo/gorra/1.jpg", tam: { ancho: 1080, alto: 1350 }, recorte: [240, 280, 680, 700], parche: { x: 560, y: 560, ancho: 190, giro: -12 } },
    piluso: { imagen: "/productos/solo/piluso/1.jpg", tam: { ancho: 1080, alto: 1350 }, recorte: [260, 400, 560, 560], parche: { x: 540, y: 845, ancho: 170 } },
  },
};

// -----------------------------------------------------------------------------
// Guía de talles (modal). Completá las medidas; vacío se muestra como "—".
// -----------------------------------------------------------------------------
export const guiaTalles = {
  nota: "Medí a tu perro con una cinta métrica, sin ajustar de más.",
  filas: [
    { talle: "S", pecho: "", cuello: "" },
    { talle: "M", pecho: "", cuello: "" },
  ],
};

// -----------------------------------------------------------------------------
// Kit completo (el protagonista)
// -----------------------------------------------------------------------------
export const kit: Producto = {
  id: "kit-completo",
  nombre: "Kit completo Sanzo",
  tipo: "kit",
  descripcion: "Arnés, correa, collar, moño, bandana y porta bolsitas. Todo lo que necesita para salir. Combinado.",
  incluye: ["arnes", "correa", "collar", "mono", "bandana", "poo-bag"],
  precio: 59999,
  imagenes: ["/productos/arnes/1.jpg", "/productos/kit-1.jpg", "/productos/kit-2.jpg", "/productos/kit-3.jpg"],
  envioGratis: true,
  linkPago: "",
  disponible: true,
  opcion: { nombre: "Talle", valores: TALLES_ARNES },
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
    opcion: { nombre: "Talle", valores: TALLES },
  },
  {
    id: "combo-estilo",
    nombre: "Combo Estilo",
    tipo: "combo",
    descripcion: "Para que salga con onda. Y se note.",
    incluye: ["collar", "mono", "bandana"],
    precio: 24499,
    imagenes: ["/productos/combo-estilo/1.jpg", "/productos/combo-estilo/2.jpg", "/productos/combo-estilo/3.jpg"],
    envioGratis: false,
    linkPago: "",
    disponible: true,
    opcion: { nombre: "Talle", valores: TALLES },
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
    opcion: { nombre: "Talle", valores: TALLES_ARNES },
  },
];

// -----------------------------------------------------------------------------
// Productos individuales (fotos: SOLO el producto, sin perros)
// -----------------------------------------------------------------------------
export const individuales: Producto[] = [
  {
    id: "arnes",
    miniatura: "/productos/piezas/arnes.png",
    nombre: "Arnés",
    tipo: "individual",
    descripcion: "Terracota, liviano y a su medida.",
    incluye: [],
    precio: 18999,
    imagenes: ["/productos/solo/arnes/1.jpg", "/productos/solo/arnes/2.jpg"],
    envioGratis: false,
    linkPago: "",
    disponible: true,
    opcion: { nombre: "Talle", valores: TALLES_ARNES },
  },
  {
    id: "correa",
    miniatura: "/productos/piezas/correa.jpg",
    nombre: "Correa",
    tipo: "individual",
    descripcion: "La que combina con todo lo demás.",
    incluye: [],
    precio: 12499,
    imagenes: ["/productos/solo/correa/1.jpg", "/productos/solo/correa/2.jpg"],
    envioGratis: false,
    linkPago: "",
    disponible: true,
  },
  {
    id: "collar",
    miniatura: "/productos/piezas/collar.jpg",
    nombre: "Collar",
    tipo: "individual",
    descripcion: "Simple, prolijo, a su medida.",
    incluye: [],
    precio: 10499,
    imagenes: ["/productos/solo/collar/1.jpg", "/productos/solo/collar/2.jpg"],
    envioGratis: false,
    linkPago: "",
    disponible: true,
    opcion: { nombre: "Talle", valores: TALLES },
  },
  {
    id: "mono",
    miniatura: "/productos/piezas/mono.jpg",
    nombre: "Moño",
    tipo: "individual",
    descripcion: "El detalle que le cambia la cara al paseo.",
    incluye: [],
    precio: 9499,
    imagenes: ["/productos/solo/mono/1.jpg", "/productos/solo/mono/2.jpg"],
    envioGratis: false,
    linkPago: "",
    disponible: true,
  },
  {
    id: "bandana",
    miniatura: "/productos/piezas/bandana.jpg",
    nombre: "Bandana",
    tipo: "individual",
    descripcion: "Al cuello, sobre el pecho. Como tiene que ir.",
    incluye: [],
    precio: 10499,
    imagenes: ["/productos/solo/bandana/1.jpg", "/productos/solo/bandana/2.jpg"],
    envioGratis: false,
    linkPago: "",
    disponible: true,
  },
  {
    id: "poo-bag",
    miniatura: "/productos/piezas/poo-bag.jpg",
    nombre: "Poo bag",
    tipo: "individual",
    descripcion: "Porta bolsitas. Siempre a mano, en la correa.",
    incluye: [],
    precio: 10499,
    imagenes: ["/productos/solo/poo-bag/1.jpg", "/productos/solo/poo-bag/2.jpg"],
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
    precio: 10999,
    imagenes: ["/productos/solo/gorra/1.jpg", "/productos/solo/gorra/2.jpg"],
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
    precio: 10999,
    imagenes: ["/productos/solo/piluso/1.jpg", "/productos/solo/piluso/2.jpg"],
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
// Promos del carrito: "llevá más, pagá menos".
// El carrito sugiere la pieza que falta para completar una promo y, cuando está
// completa, aplica el ahorro solo. Usan ids de productos individuales.
//   tipo "ahorro": llevando todo `lleva`, se descuenta `monto` (null → promo apagada).
//   tipo "regalo": llevando todo `lleva`, `regalo` (que tiene que estar en `lleva`) sale gratis.
// Si llevan varias promos con las mismas piezas, gana la primera de la lista.
// -----------------------------------------------------------------------------
export interface Promo {
  id: string;
  lleva: string[];
  tipo: "ahorro" | "regalo";
  monto?: number | null;
  regalo?: string;
}

export const promos: Promo[] = [
  { id: "correa-mono", lleva: ["correa", "mono"], tipo: "ahorro", monto: 4499 },
  { id: "collar-bandana", lleva: ["collar", "bandana"], tipo: "ahorro", monto: 3999 },
  { id: "arnes-collar-poo", lleva: ["arnes", "collar", "poo-bag"], tipo: "ahorro", monto: 7998 },
];

// -----------------------------------------------------------------------------
// "¿Por qué sanzo?" — grilla tipo bento: una foto grande + tarjetas cortas.
// La primera razón va destacada (tarjeta oscura). Envío gratis y cuotas se suman solas
// si están cargados (`envioInfo.gratisDesde`, `confianza.cuotasSinInteres`).
// video: ruta en /public (vertical). Si hay, reemplaza a la foto.
// -----------------------------------------------------------------------------
export const porQue = {
  eyebrow: "Pensado para salir juntos",
  titulo: "¿Por qué sanzo?",
  foto: "/productos/arnes/3.jpg",
  video: "",
  /** Frase sobre la foto grande. */
  frase: "Accesorios que combinan entre sí, para que cada salida se vea linda.",
  razones: [
    { icono: "combina", titulo: "Todo combina", texto: "Arnés, correa, collar, moño y bandana de la misma línea." },
    { icono: "reloj", titulo: "Se pone en segundos", texto: "Sin vueltas, para salir apenas te mira." },
    { icono: "garantia", titulo: "Garantía por un año", texto: "Comprás tranquilo." },
    { icono: "cambio", titulo: "Cambio de talle", texto: "¿No le quedó? Lo cambiamos sin vueltas." },
    { icono: "envio", titulo: "Envíos a todo el país", texto: "Te llega a tu casa." },
  ] as { icono: "garantia" | "cambio" | "combina" | "envio" | "paseo" | "reloj" | "cuotas"; titulo: string; texto: string }[],
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
export const cinta = ["Envíos a todo el país", "Cambio de talle sin vueltas", "Todo combina con todo"];

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
  activo: true,
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
    pregunta: "¿Me puedo arrepentir de la compra?",
    respuesta: "Sí. Tenés 10 días corridos desde que lo recibís. Usá el botón de arrepentimiento al pie de la página y lo coordinamos.",
  },
  {
    pregunta: "¿Tienen garantía?",
    respuesta: "Sí, un año. Si algo falla, escribinos y lo resolvemos.",
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
// Helpers (no hace falta tocar)
// -----------------------------------------------------------------------------
export const todosLosProductos: Producto[] = [kit, ...combos, ...individuales];

export function getProducto(id: string): Producto | undefined {
  return todosLosProductos.find((p) => p.id === id);
}
