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
}

const TALLES = ["XS", "S", "M", "L"];

// -----------------------------------------------------------------------------
// Textos generales
// -----------------------------------------------------------------------------
export const sitio = {
  barraSuperior: "ENVÍO GRATIS EN EL KIT COMPLETO · GARANTÍA POR UN AÑO",
  hero: {
    titulo: "SACALO COMO SE MERECE",
    subtitulo: "Accesorios para perros, pensados para salir juntos.",
    boton: "Ver el kit",
    /** Foto grande del hero, ej. "/productos/hero.jpg". Vacío → fondo placeholder. */
    imagen: "/productos/hero.jpg",
  },
  kit: {
    bajada: "Todo lo que necesita para salir. Combinado.",
    boton: "Comprar el kit",
  },
  redes: {
    instagram: "https://www.instagram.com/sanzo_pets/",
    tiktok: "https://www.tiktok.com/@sanzo_pets",
    x: "https://x.com/sanzo_pets",
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
  hechoEn: "Hecho en Buenos Aires",
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
  precio: null,
  imagenes: ["/productos/arnes.jpg", "/productos/kit-1.jpg", "/productos/kit-2.jpg", "/productos/kit-3.jpg"],
  envioGratis: true,
  linkPago: "",
  disponible: true,
  opcion: { nombre: "Talle", valores: TALLES },
};

// -----------------------------------------------------------------------------
// Combos
// -----------------------------------------------------------------------------
export const combos: Producto[] = [
  {
    id: "combo-paseo",
    nombre: "Combo Paseo",
    tipo: "combo",
    descripcion: "Lo justo para el paseo de todos los días.",
    incluye: ["correa", "collar", "poo-bag"],
    precio: null,
    imagenes: ["/productos/combo-paseo.jpg"],
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
    precio: null,
    imagenes: ["/productos/combo-estilo.jpg"],
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
    precio: null,
    imagenes: ["/productos/combo-aventura.jpg"],
    envioGratis: false,
    linkPago: "",
    disponible: true,
    opcion: { nombre: "Talle", valores: TALLES },
  },
];

// -----------------------------------------------------------------------------
// Productos individuales
// -----------------------------------------------------------------------------
export const individuales: Producto[] = [
  {
    id: "arnes",
    nombre: "Arnés",
    tipo: "individual",
    descripcion: "Terracota, liviano y a su medida.",
    incluye: [],
    precio: null,
    imagenes: ["/productos/arnes.jpg", "/productos/arnes-2.jpg"],
    envioGratis: false,
    linkPago: "",
    disponible: true,
    opcion: { nombre: "Talle", valores: TALLES },
  },
  {
    id: "correa",
    nombre: "Correa",
    tipo: "individual",
    descripcion: "La que combina con todo lo demás.",
    incluye: [],
    precio: null,
    imagenes: ["/productos/correa.jpg"],
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
    precio: null,
    imagenes: ["/productos/collar.jpg"],
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
    precio: null,
    imagenes: ["/productos/mono.jpg", "/productos/mono-2.jpg"],
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
    precio: null,
    imagenes: ["/productos/bandana.jpg", "/productos/bandana-2.jpg"],
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
    precio: null,
    imagenes: ["/productos/poo-bag.jpg"],
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
    precio: null,
    imagenes: ["/productos/gorra.jpg"],
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
    precio: null,
    imagenes: ["/productos/piluso.jpg"],
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
  { id: "correa-mono", lleva: ["correa", "mono"], tipo: "ahorro", monto: null },
  { id: "collar-bandana", lleva: ["collar", "bandana"], tipo: "ahorro", monto: null },
  { id: "arnes-correa-poo", lleva: ["arnes", "correa", "poo-bag"], tipo: "regalo", regalo: "poo-bag" },
];

// -----------------------------------------------------------------------------
// Etiqueta personalizada — POR AHORA SOLO UN ADELANTO ("muy pronto"), sin compra.
// Cuando llegue el arnés se arma el personalizador de verdad (ver MEJORAS.md).
// `activo: false` oculta la sección.
// -----------------------------------------------------------------------------
export const etiqueta = {
  activo: true,
  eyebrow: "Muy pronto",
  titulo: "Ponele su etiqueta",
  bajada: "En el producto que quieras, menos en el moño.",
  /** Formas del modo "elegís un diseño" (se dibujan como boceto). */
  formas: ["Rectángulo", "Huesito", "Círculo"],
  opciones: [
    { titulo: "Elegís un diseño", texto: "Tres formas, en un lugar ya pensado. Sin vueltas." },
    { titulo: "Como quieras", texto: "Subís tu imagen y elegís tamaño y lugar." },
  ],
};

// -----------------------------------------------------------------------------
// "¿Por qué nuestro arnés?" — video corto + razones.
// video: ruta en /public (ej. "/videos/arnes.mp4", vertical 4:5 o 9:16). Vacío → placeholder.
// -----------------------------------------------------------------------------
export const porQue = {
  eyebrow: "Pensado para salir",
  titulo: "¿Por qué nuestro arnés?",
  video: "",
  /** Foto que se muestra si no hay video (y portada del video si hay). */
  poster: "/productos/arnes-2.jpg",
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
export const cinta = ["Garantía por un año", "Envíos a todo el país", "Cambio de talle sin vueltas", "Todo combina con todo", "Hecho en Buenos Aires"];

// -----------------------------------------------------------------------------
// Galería "Salen con sanzo": fotos verticales 4:5 con el producto que se ve.
// -----------------------------------------------------------------------------
export const galeria = {
  eyebrow: "Salen con sanzo",
  titulo: "Cada paseo, con estilo",
  fotos: [
    { imagen: "/productos/galeria-1.jpg", producto: "bandana" },
    { imagen: "/productos/galeria-2.jpg", producto: "mono" },
    { imagen: "/productos/galeria-3.jpg", producto: "gorra" },
    { imagen: "/productos/galeria-4.jpg", producto: "piluso" },
    { imagen: "/productos/galeria-5.jpg", producto: "mono" },
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
  bajada: "Perros que ya salen con sanzo, en todo el país.",
  /** Fotitos redondas que acompañan el número. */
  fotos: ["/productos/galeria-1.jpg", "/productos/galeria-2.jpg", "/productos/galeria-3.jpg", "/productos/galeria-5.jpg"],
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
