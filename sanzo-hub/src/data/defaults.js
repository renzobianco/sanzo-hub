// Catálogo base y constantes del negocio. Todo arranca en cero: sin ventas, sin gastos, sin clientes.

export const STORAGE_KEY = 'sanzo_hub_v1'
export const DATA_VERSION = 1

// Fecha de fundación de Sanzo, para el contador de días en el Dashboard.
export const SANZO_FOUNDED_DATE = '2026-07-28'

export const PRODUCT_DEFS = [
  { id: 'kit', name: 'Kit completo', description: 'Arnés + correa + collar + moño + bandana + portabolsa', isKit: true },
  { id: 'arnes', name: 'Arnés', description: 'Pieza suelta del kit', isKit: false },
  { id: 'correa', name: 'Correa', description: 'Pieza suelta del kit', isKit: false },
  { id: 'collar', name: 'Collar', description: 'Pieza suelta del kit', isKit: false },
  { id: 'mono', name: 'Moño', description: 'Pieza suelta del kit', isKit: false },
  { id: 'bandana', name: 'Bandana', description: 'Pieza suelta del kit', isKit: false },
  { id: 'portabolsa', name: 'Portabolsa', description: 'Pieza suelta del kit', isKit: false },
  { id: 'gorra', name: 'Gorra', description: 'Gorra para perro', isKit: false },
  { id: 'piluso', name: 'Piluso', description: 'Piluso para perro', isKit: false },
]

export const CHANNELS = ['Instagram', 'X', 'Facebook', 'WhatsApp', 'Tienda online', 'En persona']
export const PAYMENT_METHODS = ['Efectivo', 'Transferencia', 'Mercado Pago', 'Otro']
export const SALE_STATUSES = ['Señado', 'Pagado', 'Enviado', 'Entregado']

export const EXPENSE_CATEGORIES = [
  'Mercadería',
  'Flete y aduana',
  'Apps y suscripciones',
  'Envíos locales',
  'Packaging',
  'Marketing',
  'Comisiones',
  'Otros',
]

export const ORDER_STATUSES = ['Cotizado', 'Pagado', 'En producción', 'En camino', 'En aduana', 'Recibido']

export const NETWORKS = [
  { key: 'instagram', label: 'Instagram', color: '#956037' },
  { key: 'twitter', label: 'X', color: '#1A1A1A' },
  { key: 'facebook', label: 'Facebook', color: '#C9A06A' },
  { key: 'tiktok', label: 'TikTok', color: '#B5533C' },
]

// ---------- Calendario de contenido ----------
export const CONTENT_FORMATS = ['Reel', 'Historia', 'Carrusel', 'Foto']

export const CONTENT_RESPONSIBLES = [
  { value: 'santino', label: 'Santino' },
  { value: 'renzo', label: 'Renzo' },
]

// El flujo exacto que ya usan en la planilla, agrupado en 3 familias tipo semáforo
// (apagadas, dentro de la paleta de marca) para poder escanear el mes de un vistazo:
// 🔴 terracota = todavía falta trabajo · 🟡 mostaza = falta el último paso · 🟢 verde = resuelto.
export const CONTENT_STATUS_FAMILIES = {
  red: { color: '#B5533C', label: 'En proceso' },
  yellow: { color: '#C99A3B', label: 'Listo para cargar' },
  green: { color: '#6B8F5E', label: 'Programado/Publicado' },
}

export const CONTENT_STATUSES = [
  { value: 'Idea', family: 'red', color: CONTENT_STATUS_FAMILIES.red.color },
  { value: 'Guion listo', family: 'red', color: CONTENT_STATUS_FAMILIES.red.color },
  { value: 'Grabando / seleccionando clips', family: 'red', color: CONTENT_STATUS_FAMILIES.red.color },
  { value: 'En edición', family: 'red', color: CONTENT_STATUS_FAMILIES.red.color },
  { value: 'En revisión', family: 'red', color: CONTENT_STATUS_FAMILIES.red.color },
  { value: 'Listo para publicar', family: 'yellow', color: CONTENT_STATUS_FAMILIES.yellow.color },
  { value: 'Cargado en Buffer', family: 'green', color: CONTENT_STATUS_FAMILIES.green.color },
  { value: 'Publicado', family: 'green', color: CONTENT_STATUS_FAMILIES.green.color },
]

export const DEFAULT_CONTENT_PILLARS = ['Perros — alto volumen', 'Producto', 'Detrás de escena', 'Humor / IA declarada', 'Educativo']

export const DEFAULT_CONTENT_CADENCE = { reelsPerDay: 1, storiesPerDay: 1, carouselsPerWeek: 2 }

// ---------- Notas compartidas ----------
export const NOTE_COLORS = [
  { key: 'cream', label: 'Crema', bg: '#F7F1EA' },
  { key: 'beige', label: 'Beige', bg: '#EAD9C8' },
  { key: 'tan', label: 'Marrón clarito', bg: '#D9BFA0' },
  { key: 'white', label: 'Blanco', bg: '#FFFFFF' },
  { key: 'red', label: 'Rojo · urgente', bg: '#F0C8BC' },
  { key: 'orange', label: 'Naranja · importante', bg: '#F5D9AC' },
  { key: 'green', label: 'Verde · tranquilo', bg: '#D6E3CB' },
]

export const NOTE_CATEGORIES = [
  { key: 'general', label: 'General' },
  { key: 'webs', label: 'Webs' },
  { key: 'contenido', label: 'Contenido' },
  { key: 'productos', label: 'Productos' },
  { key: 'ventas', label: 'Ventas' },
  { key: 'clientes', label: 'Clientes' },
]

export const DEFAULT_PHASES = [
  { id: 'f1', code: '01', name: 'Crecimiento', start: '2026-09-01', end: '2026-10-11', description: 'Sin producto, solo redes. Construir comunidad.' },
  { id: 'f2', code: '02', name: 'Preventa', start: '2026-10-12', end: '2026-10-25', description: 'Abrir reservas con seña antes de que llegue el lote.' },
  { id: 'f3', code: '03', name: 'Lanzamiento', start: '2026-10-26', end: null, description: 'Producto en mano. Ventas y envíos a todo ritmo.' },
]

// ---------- Tipo de cambio ----------
// 'oficial' y 'blue' se auto-actualizan desde DolarApi.com; 'manual' respeta lo que
// carga el usuario a mano (comportamiento histórico de la app).
export const DOLAR_SOURCES = [
  { value: 'oficial', label: 'Oficial (automático)', hint: 'Se actualiza solo desde DolarApi.com.' },
  { value: 'blue', label: 'Blue (automático)', hint: 'Se actualiza solo desde DolarApi.com.' },
  { value: 'manual', label: 'Manual', hint: 'Lo cargás vos a mano.' },
]

export const DEFAULT_GOALS = [
  { id: 'g_kits', type: 'kits', title: 'Vender los 50 kits', target: 50, auto: true },
  { id: 'g_inv', type: 'investment', title: 'Recuperar la inversión inicial', target: 100, auto: true },
  { id: 'g_ig', type: 'followers', network: 'instagram', title: 'Llegar a 1.000 seguidores en Instagram', target: 1000, auto: true },
]

export function buildInitialState() {
  return {
    version: DATA_VERSION,
    settings: {
      exchangeRate: 1000,
      exchangeRateHistory: [],
      dolarSource: 'oficial',
      stockThreshold: 5,
      initialInvestmentUSD: 2000,
      lastBackupExport: null,
      logoImage: null,
      coverImage: null,
      contentPillars: [...DEFAULT_CONTENT_PILLARS],
      contentCadence: { ...DEFAULT_CONTENT_CADENCE },
    },
    partners: {
      santino: { name: 'Santino', photo: null },
      renzo: { name: 'Renzo', photo: null },
    },
    products: PRODUCT_DEFS.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      isKit: p.isKit,
      costUSD: 0,
      priceARS: 0,
      stock: 0,
      initialStock: 0,
      image: null,
    })),
    sales: [],
    expenses: [],
    orders: [],
    goals: DEFAULT_GOALS.map((g) => ({ ...g })),
    followers: [],
    clients: [],
    stockLog: [],
    phases: DEFAULT_PHASES.map((p) => ({ ...p })),
    contentPosts: [],
    notes: [],
  }
}
