import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabaseReady = Boolean(url && anonKey)

if (!supabaseReady) {
  console.warn('Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Sanzo Hub no puede sincronizar con la base compartida.')
}

export const supabase = supabaseReady
  ? createClient(url, anonKey, { realtime: { params: { eventsPerSecond: 10 } } })
  : null

// Nombres de tabla por colección — un solo lugar para no desalinearlos.
export const TABLES = {
  sales: 'sanzo_sales',
  expenses: 'sanzo_expenses',
  orders: 'sanzo_orders',
  goals: 'sanzo_goals',
  followers: 'sanzo_followers',
  clients: 'sanzo_clients',
  phases: 'sanzo_phases',
  stockLog: 'sanzo_stock_log',
  contentPosts: 'sanzo_content_posts',
  notes: 'sanzo_notes',
}

export const COLLECTION_TABLES = Object.values(TABLES)
export const PRODUCTS_TABLE = 'sanzo_products'
export const STATE_TABLE = 'sanzo_state'

// ---------- Storage: videos/imágenes del calendario de contenido ----------
// Bucket público (ver supabase/migrations/003_content_media_storage.sql): Buffer
// necesita una URL pública para descargar el archivo, así que subimos acá en vez
// de guardar el archivo como base64 en la fila (además de que un video pesa
// demasiado para eso).
export const MEDIA_BUCKET = 'sanzo-content-media'
const MAX_MEDIA_BYTES = 200 * 1024 * 1024 // 200 MB

export async function uploadContentMedia(file) {
  if (file.size > MAX_MEDIA_BYTES) {
    throw new Error('El archivo pesa más de 200 MB. Subilo a otro lado (Drive, etc.) y pegá el link.')
  }
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin'
  const path = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type || undefined })
  if (error) throw error
  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

// Best-effort: borra un archivo del bucket a partir de su URL pública. Si la URL
// no es de nuestro bucket (por ejemplo, un link de Drive pegado a mano), no hace nada.
export async function deleteContentMedia(url) {
  if (!url) return
  try {
    const marker = `/storage/v1/object/public/${MEDIA_BUCKET}/`
    const idx = url.indexOf(marker)
    if (idx === -1) return
    const path = decodeURIComponent(url.slice(idx + marker.length))
    if (path) await supabase.storage.from(MEDIA_BUCKET).remove([path])
  } catch {
    /* no rompemos el flujo por esto */
  }
}
