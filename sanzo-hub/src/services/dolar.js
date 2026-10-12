// Cotización del dólar en tiempo real vía DolarApi.com (pública, sin API key).
// Docs: https://dolarapi.com/docs — probamos la llamada directa desde el navegador
// (curl con Origin seteado) y responde con `Access-Control-Allow-Origin: *`, así que,
// a diferencia de Buffer, NO hace falta proxy ni función serverless acá.
const ENDPOINT = 'https://dolarapi.com/v1/dolares'

const CACHE_KEY = 'sanzo_dolar_cache_v1'
export const DOLAR_CACHE_MS = 45 * 60 * 1000 // 45 min: suficiente para no pegarle de más, y el valor no se mueve tan seguido

function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data))
  } catch {
    /* si no entra, no rompemos la app por esto */
  }
}

// Última cotización conocida, sincrónico — para poder pintar algo en el primer render
// sin esperar la respuesta de red (y para tener algo si no hay internet).
export function loadLastKnownDolar() {
  return loadCache()
}

function pick(list, casa) {
  const q = list.find((x) => x.casa === casa)
  if (!q) return null
  return { compra: Number(q.compra) || 0, venta: Number(q.venta) || 0, fechaActualizacion: q.fechaActualizacion }
}

// Trae oficial + blue en una sola llamada. Si falla y hay algo en caché (aunque esté
// vencido), devuelve eso con stale:true en vez de romper — nunca deja a la app sin
// ningún valor de cotización.
export async function fetchDolarQuotes({ force = false } = {}) {
  const cache = loadCache()
  const fresh = cache && Date.now() - cache.fetchedAt < DOLAR_CACHE_MS
  if (fresh && !force) return { ...cache, stale: false, fromCache: true, error: null }

  try {
    const res = await fetch(ENDPOINT)
    if (!res.ok) throw new Error(`DolarApi respondió ${res.status}`)
    const list = await res.json()
    const oficial = pick(list, 'oficial')
    const blue = pick(list, 'blue')
    if (!oficial || !blue) throw new Error('DolarApi no trajo oficial/blue')
    const data = { oficial, blue, fetchedAt: Date.now() }
    saveCache(data)
    return { ...data, stale: false, fromCache: false, error: null }
  } catch (e) {
    if (cache) return { ...cache, stale: true, fromCache: true, error: e.message }
    throw e
  }
}

// Texto + frescura de la fuente elegida, para mostrar junto a cualquier conversión
// USD→ARS de la app ("Oficial · hoy 11:30", "Blue · hace 2 días", "Manual").
export function describeDolarSource(settings, dolar) {
  const src = settings?.dolarSource || 'oficial'
  if (src === 'manual') return { source: 'manual', label: 'Manual', fresh: false, fecha: null }
  const q = dolar?.[src]
  const label = src === 'oficial' ? 'Oficial' : 'Blue'
  if (!q) return { source: src, label, fresh: false, fecha: null }
  const isToday = q.fechaActualizacion && new Date(q.fechaActualizacion).toDateString() === new Date().toDateString()
  return { source: src, label, fresh: isToday && !dolar?.stale, fecha: q.fechaActualizacion, compra: q.compra, venta: q.venta }
}
