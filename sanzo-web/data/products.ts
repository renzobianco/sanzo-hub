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
  envioGratis: boolean;
  linkPago: string;
  disponible: boolean;
  /** Opción que el cliente elige al agregar (talle o color). Opcional. */
  opcion?: { nombre: string; valores: string[] };
  /** true → muestra el botón "Personalizar" (pieza con el nombre sobre el arnés). */
  personalizable?: boolean;
}

/** Un estilo de parche = una foto del arnés con ese parche puesto. */
export interface EstiloParche {
  id: string;
  nombre: string;
  /** Foto del arnés de frente con este parche (mismo encuadre en todas). */
  imagen: string;
  /** Foto del parche solo, sin fondo (PNG transparente). Se muestra en el botón para elegirlo. */
  parche: string;
  /** Zona del parche donde se escribe el nombre, en píxeles de la foto: centro (x, y), ancho y alto. */
  texto: { x: number; y: number; ancho: number; alto: number };
}

const TALLES = ["XS", "S", "M", "L"];
/** El arnés (y lo que lo incluye) viene solo en S y M. */
const TALLES_ARNES = ["S", "M"];

// -----------------------------------------------------------------------------
// Textos generales
// -----------------------------------------------------------------------------
export const sitio = {
  barraSuperior: "ENVÍO GRATIS EN EL KIT COMPLETO · GARANTÍA POR UN AÑO",
  hero: {
    titulo: "SACALO COMO SE MERECE",
    subtitulo: "Accesorios para perros, pensados para salir juntos.",
    boton: "Ver el kit",
    /** Fotos de la portada: van cambiando solas. La primera es la que carga primero. */
    imagenes: ["/productos/hero/1.jpg", "/productos/hero/2.jpg", "/productos/hero/3.jpg", "/productos/hero/4.jpg"],
  },
  kit: {
    bajada: "Todo lo que necesita para salir. Combinado.",
    boton: "Comprar el kit",
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
// Se activa por producto con `personalizable: true`.
// -----------------------------------------------------------------------------
export const personalizacion: {
  boton: string;
  titulo: string;
  bajada: string;
  imagenArnes: string;
  tamFoto: { ancho: number; alto: number };
  zoom: number;
  precioExtra: number;
  maxNombre: number;
  estilos: EstiloParche[];
} = {
  boton: "Personalizar",
  titulo: "Hacelo suyo",
  bajada: "Elegí el parche y poné su nombre.",
  /** Foto del arnés que se ve antes de elegir un estilo. */
  imagenArnes: "/productos/arnes/frente.png",
  /** Tamaño en píxeles de las fotos de los estilos (todas iguales). */
  tamFoto: { ancho: 1125, alto: 1398 },
  /** Acerca la foto (1 = tal cual). Sirve si la foto tiene mucho margen alrededor del arnés. */
  zoom: 1.2,
  /** Lo que suma la personalización al precio de cada unidad. 0 = sin costo extra. */
  precioExtra: 0,
  /** Máximo de letras del nombre. */
  maxNombre: 12,
  /** Los estilos, en el orden en que se muestran. */
  estilos: [
    { id: "cinta", nombre: "Cinta", imagen: "/productos/arnes/estilo-cinta.jpg", parche: "/productos/arnes/parche-cinta.png", texto: { x: 578, y: 873, ancho: 230, alto: 56 } },
    { id: "hueso", nombre: "Hueso", imagen: "/productos/arnes/estilo-hueso.jpg", parche: "/productos/arnes/parche-hueso.png", texto: { x: 550, y: 840, ancho: 150, alto: 52 } },
    { id: "clasica", nombre: "Clásica", imagen: "/productos/arnes/estilo-clasica.jpg", parche: "/productos/arnes/parche-clasica.png", texto: { x: 550, y: 855, ancho: 175, alto: 52 } },
    { id: "redondeada", nombre: "Redondeada", imagen: "/productos/arnes/estilo-redondeada.jpg", parche: "/productos/arnes/parche-redondeada.png", texto: { x: 561, y: 856, ancho: 210, alto: 54 } },
  ],
};

// -----------------------------------------------------------------------------
// Guía de talles (modal). Completá las medidas; vacío se muestra como "—".
// -----------------------------------------------------------------------------
export const guiaTalles = {
  nota: "Medí a tu perro con una cinta métrica, sin ajustar de más.",
  filas: [
    { talle: "XS", pecho: "", cuello: "" },
    { talle: "S", pecho: "", cuello: "" },
    { talle: "M", pecho: "", cuello: "" },
    { talle: "L", pecho: "", cuello: "" },
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
  precio: 67000,
  imagenes: ["/productos/arnes/1.jpg", "/productos/kit-1.jpg", "/productos/kit-2.jpg", "/productos/kit-3.jpg"],
  envioGratis: true,
  linkPago: "",
  disponible: true,
  opcion: { nombre: "Talle", valores: TALLES_ARNES },
  personalizable: true,
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
    precio: 27000,
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
    precio: 24500,
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
    precio: 25000,
    imagenes: ["/productos/combo-aventura/1.jpg", "/productos/combo-aventura/2.jpg"],
    envioGratis: false,
    linkPago: "",
    disponible: true,
    opcion: { nombre: "Talle", valores: TALLES_ARNES },
    personalizable: true,
  },
];

// -----------------------------------------------------------------------------
// Productos individuales (fotos: SOLO el producto, sin perros)
// -----------------------------------------------------------------------------
export const individuales: Producto[] = [
  {
    id: "arnes",
    nombre: "Arnés",
    tipo: "individual",
    descripcion: "Terracota, liviano y a su medida.",
    incluye: [],
    precio: 19000,
    imagenes: ["/productos/solo/arnes/1.jpg", "/productos/solo/arnes/2.jpg"],
    envioGratis: false,
    linkPago: "",
    disponible: true,
    opcion: { nombre: "Talle", valores: TALLES_ARNES },
    personalizable: true,
  },
  {
    id: "correa",
    nombre: "Correa",
    tipo: "individual",
    descripcion: "La que combina con todo lo demás.",
    incluye: [],
    precio: 12500,
    imagenes: ["/productos/solo/correa/1.jpg", "/productos/solo/correa/2.jpg"],
    envioGratis: false,
    linkPago: "",
    disponible: true,
  },
  {
    id: "collar",
    nombre: "Collar",
    tipo: "individual",
    descripcion: "Simple, prolijo, a su medida.",
    incluye: [],
    precio: 10500,
    imagenes: ["/productos/solo/collar/1.jpg", "/productos/solo/collar/2.jpg"],
    envioGratis: false,
    linkPago: "",
    disponible: true,
    opcion: { nombre: "Talle", valores: TALLES },
  },
  {
    id: "mono",
    nombre: "Moño",
    tipo: "individual",
    descripcion: "El detalle que le cambia la cara al paseo.",
    incluye: [],
    precio: 9500,
    imagenes: ["/productos/solo/mono/1.jpg", "/productos/solo/mono/2.jpg"],
    envioGratis: false,
    linkPago: "",
    disponible: true,
  },
  {
    id: "bandana",
    nombre: "Bandana",
    tipo: "individual",
    descripcion: "Al cuello, sobre el pecho. Como tiene que ir.",
    incluye: [],
    precio: 10500,
    imagenes: ["/productos/solo/bandana/1.jpg", "/productos/solo/bandana/2.jpg"],
    envioGratis: false,
    linkPago: "",
    disponible: true,
  },
  {
    id: "poo-bag",
    nombre: "Poo bag",
    tipo: "individual",
    descripcion: "Porta bolsitas. Siempre a mano, en la correa.",
    incluye: [],
    precio: 10500,
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
    precio: 11000,
    imagenes: ["/productos/solo/gorra/1.jpg", "/productos/solo/gorra/2.jpg"],
    envioGratis: false,
    linkPago: "",
    disponible: true,
    opcion: { nombre: "Color", valores: ["Beige", "Celeste"] },
  },
  {
    id: "piluso",
    nombre: "Piluso",
    tipo: "individual",
    descripcion: "Para el sol de la plaza.",
    incluye: [],
    precio: 11000,
    imagenes: ["/productos/solo/piluso/1.jpg", "/productos/solo/piluso/2.jpg"],
    envioGratis: false,
    linkPago: "",
    disponible: true,
    opcion: { nombre: "Color", valores: ["Granate", "Jade"] },
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
  { id: "correa-mono", lleva: ["correa", "mono"], tipo: "ahorro", monto: 4500 },
  { id: "collar-bandana", lleva: ["collar", "bandana"], tipo: "ahorro", monto: 4000 },
  { id: "arnes-collar-poo", lleva: ["arnes", "collar", "poo-bag"], tipo: "ahorro", monto: 8000 },
];

// -----------------------------------------------------------------------------
// "¿Por qué nuestro arnés?" — video corto + razones.
// video: ruta en /public (ej. "/videos/arnes.mp4", vertical 4:5 o 9:16). Vacío → placeholder.
// -----------------------------------------------------------------------------
export const porQue = {
  eyebrow: "Pensado para salir",
  titulo: "¿Por qué nuestro arnés?",
  video: "",
  /** Foto que se muestra si no hay video (y portada del video si hay). */
  poster: "/productos/arnes/3.jpg",
  razones: [
    { titulo: "Se pone en segundos", texto: "Sin vueltas, para salir apenas te mira." },
    { titulo: "A su medida", texto: "Cuatro talles y una guía para no errarle." },
    { titulo: "Combina con todo", texto: "Correa, collar, moño y bandana de la misma línea." },
  ],
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
  items: [
    { icono: "garantia", texto: "Garantía por un año" },
    { icono: "cambio", texto: "Cambio de talle sin vueltas" },
    { icono: "combina", texto: "Todo combina con todo" },
    { icono: "envio", texto: "Envíos a todo el país" },
  ] as { icono: "garantia" | "cambio" | "combina" | "envio" | "paseo"; texto: string }[],
};

// -----------------------------------------------------------------------------
// Cinta que corre debajo del hero. Vacía → no aparece.
// -----------------------------------------------------------------------------
export const cinta = ["Garantía por un año", "Envíos a todo el país", "Cambio de talle sin vueltas", "Todo combina con todo"];

// -----------------------------------------------------------------------------
// Galería "Salen con sanzo": fotos verticales 4:5 con el producto que se ve.
// -----------------------------------------------------------------------------
export const galeria = {
  eyebrow: "Salen con sanzo",
  titulo: "Cada paseo, con estilo",
  fotos: [
    { imagen: "/productos/galeria/1.jpg", producto: "collar" },
    { imagen: "/productos/galeria/2.jpg", producto: "bandana" },
    { imagen: "/productos/galeria/3.jpg", producto: "collar" },
    { imagen: "/productos/galeria/4.jpg", producto: "piluso" },
    { imagen: "/productos/galeria/5.jpg", producto: "gorra" },
  ],
};

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
   * Videos de clientes usándolos (verticales 9:16, cortos, sin sonido): ruta en /public, ej. "/videos/clientes/lola.mp4".
   * `foto` se muestra mientras carga el video, o sola si todavía no hay video.
   * `perro`: nombre y barrio, ej. "Lola · Caballito". Opcional.
   */
  videos: [
    { video: "", foto: "/productos/clientes/1.jpg", perro: "" },
    { video: "", foto: "/productos/clientes/2.jpg", perro: "" },
    { video: "", foto: "/productos/clientes/3.jpg", perro: "" },
    { video: "", foto: "/productos/clientes/4.jpg", perro: "" },
    { video: "", foto: "/productos/clientes/5.jpg", perro: "" },
    { video: "", foto: "/productos/clientes/6.jpg", perro: "" },
  ] as { video: string; foto: string; perro: string }[],
};

// -----------------------------------------------------------------------------
// Preguntas frecuentes (placeholders: revisalas antes de publicar)
// -----------------------------------------------------------------------------
export const preguntas: { pregunta: string; respuesta: string }[] = [
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
