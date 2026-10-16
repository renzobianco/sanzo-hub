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

// -----------------------------------------------------------------------------
// Textos generales
// -----------------------------------------------------------------------------
export const sitio = {
  barraSuperior: "ENVÍO GRATIS EN EL KIT COMPLETO · PRIMERA TANDA LIMITADA",
  hero: {
    titulo: "SACALO COMO SE MERECE",
    subtitulo: "Accesorios para perros, pensados para salir juntos.",
    boton: "Ver el kit",
    /** Foto grande del hero, ej. "/productos/hero.jpg". Vacío → fondo placeholder. */
    imagen: "",
  },
  kit: {
    bajada: "Todo lo que necesita para salir. Combinado.",
    boton: "Comprar el kit",
  },
  /** Redes que se muestran en el footer. Vacío → no se muestra. */
  redes: {
    instagram: "sanzo_pets", // usuario, sin @
    facebook: "", // link completo de la página, ej. "https://www.facebook.com/sanzo.pets"
    tiktok: "", // ej. "https://www.tiktok.com/@sanzo"
    /** Número de WhatsApp con código de área, sin 0 ni 15 (ej. "11 5969 4816"). */
    whatsapp: "11 5969 4816",
  },
  email: "", // mail de contacto que se muestra en el footer
};

// -----------------------------------------------------------------------------
// Contador de escasez del kit: "Quedan X de 50 kits".
// Poné `restantes: null` para ocultarlo.
// -----------------------------------------------------------------------------
export const contadorKits: { restantes: number | null; total: number } = {
  restantes: 50,
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
  imagenes: [],
  envioGratis: true,
  linkPago: "",
  disponible: true,
  opcion: { nombre: "Talle", valores: TALLES },
  personalizable: true,
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
    imagenes: [],
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
    imagenes: [],
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
    imagenes: [],
    envioGratis: false,
    linkPago: "",
    disponible: true,
    opcion: { nombre: "Talle", valores: TALLES },
    personalizable: true,
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
    imagenes: [],
    envioGratis: false,
    linkPago: "",
    disponible: true,
    opcion: { nombre: "Talle", valores: TALLES },
    personalizable: true,
  },
  {
    id: "correa",
    nombre: "Correa",
    tipo: "individual",
    descripcion: "La que combina con todo lo demás.",
    incluye: [],
    precio: null,
    imagenes: [],
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
    imagenes: [],
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
    imagenes: [],
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
    imagenes: [],
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
    imagenes: [],
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
    imagenes: [],
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
    imagenes: [],
    envioGratis: false,
    linkPago: "",
    disponible: true,
    opcion: { nombre: "Color", valores: ["Granate", "Jade"] },
  },
];

// -----------------------------------------------------------------------------
// Preguntas frecuentes (placeholders: revisalas antes de publicar)
// -----------------------------------------------------------------------------
export const preguntas: { pregunta: string; respuesta: string }[] = [
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
