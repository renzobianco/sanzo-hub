// Cliente de /api/meta (ver api/meta.js). El token nunca pasa por acá:
// vive en el servidor.

export async function fetchMeta(tipo, params = {}) {
  const qs = new URLSearchParams({ tipo, ...params })
  const r = await fetch(`/api/meta?${qs}`)
  const body = await r.json().catch(() => ({ error: `Respuesta rara del servidor (${r.status})` }))
  if (!r.ok) {
    const e = new Error(body.error || `Error ${r.status}`)
    e.code = body.code || (r.status === 404 ? 'sin_api' : 'error')
    throw e
  }
  return body
}

// ---- helpers para leer las métricas de Meta ----
const num = (v) => (v === undefined || v === null || v === '' ? 0 : Number(v) || 0)

// Meta devuelve listas tipo [{action_type, value}]
export function actionValue(list, types) {
  if (!Array.isArray(list)) return 0
  const wanted = Array.isArray(types) ? types : [types]
  for (const t of wanted) {
    const row = list.find((a) => a.action_type === t)
    if (row) return num(row.value)
  }
  return 0
}

const PURCHASE = ['omni_purchase', 'purchase', 'offsite_conversion.fb_pixel_purchase']
const LANDING = ['landing_page_view', 'omni_landing_page_view']
const ADD_TO_CART = ['omni_add_to_cart', 'add_to_cart', 'offsite_conversion.fb_pixel_add_to_cart']
const VIDEO_3S = ['video_view']

export function summarize(row) {
  if (!row) return null
  const impressions = num(row.impressions)
  const spend = num(row.spend)
  const purchases = actionValue(row.actions, PURCHASE)
  const revenue = actionValue(row.action_values, PURCHASE)
  const linkClicks = num(row.inline_link_clicks)
  const plays3s = actionValue(row.actions, VIDEO_3S)
  const thruplays = actionValue(row.video_thruplay_watched_actions, 'video_view')
  return {
    spend,
    reach: num(row.reach),
    impressions,
    frequency: num(row.frequency),
    cpm: num(row.cpm),
    linkClicks,
    ctr: num(row.inline_link_click_ctr),
    cpc: num(row.cost_per_inline_link_click),
    landing: actionValue(row.actions, LANDING),
    addToCart: actionValue(row.actions, ADD_TO_CART),
    purchases,
    revenue,
    costPerPurchase: purchases ? spend / purchases : 0,
    roas: spend ? revenue / spend : 0,
    plays3s,
    hookRate: impressions ? (plays3s / impressions) * 100 : 0,
    holdRate: plays3s ? (thruplays / plays3s) * 100 : 0,
    avgWatch: actionValue(row.video_avg_time_watched_actions, 'video_view'),
    p25: actionValue(row.video_p25_watched_actions, 'video_view'),
    p50: actionValue(row.video_p50_watched_actions, 'video_view'),
    p75: actionValue(row.video_p75_watched_actions, 'video_view'),
    p100: actionValue(row.video_p100_watched_actions, 'video_view'),
    curve: retentionCurve(row.video_play_curve_actions),
  }
}

// video_play_curve_actions: posiciones 0-14 = segundos 0 a 14; 15-17 = 15-20,
// 20-25, 25-30 s; 18-20 = 30-40, 40-50, 50-60 s; 21 = más de 60 s.
const CURVE_LABELS = [...Array.from({ length: 15 }, (_, i) => `${i}s`), '15-20s', '20-25s', '25-30s', '30-40s', '40-50s', '50-60s', '60s+']
export function retentionCurve(list) {
  const row = Array.isArray(list) ? list.find((a) => Array.isArray(a.value)) : null
  if (!row) return []
  return row.value.map((v, i) => ({ label: CURVE_LABELS[i] || `${i}`, pct: num(v) }))
}

// Segundo donde se va más gente (la caída más grande entre dos puntos seguidos
// dentro de los primeros 15 segundos, que son los que tienen resolución de 1 s).
export function biggestDrop(curve) {
  let best = null
  for (let i = 1; i < Math.min(curve.length, 15); i++) {
    const drop = curve[i - 1].pct - curve[i].pct
    if (!best || drop > best.drop) best = { second: i, drop, from: curve[i - 1].pct, to: curve[i].pct }
  }
  return best
}

// ---- sugerencias automáticas a partir de los números ----
export function suggestionsFor(total, ads) {
  const out = []
  if (!total || total.impressions === 0) return out
  const add = (level, text) => out.push({ level, text })

  if (total.impressions < 1000) add('info', 'Todavía hay pocas impresiones (menos de 1.000). Esperá unos días antes de sacar conclusiones o cambiar cosas.')
  if (total.frequency > 3) add('warn', `La frecuencia está en ${total.frequency.toFixed(1)}: la misma gente ve el anuncio más de 3 veces. Conviene sumar creativos nuevos o ampliar el público.`)
  if (total.impressions >= 1000 && total.ctr < 0.8) add('warn', `El CTR del enlace es ${total.ctr.toFixed(2)}%, bajo para e-commerce (lo normal es arriba de 1%). Probá otro gancho en el primer segundo o un texto con el precio/promo.`)
  if (total.ctr >= 1.5) add('ok', `Buen CTR (${total.ctr.toFixed(2)}%): el anuncio llama la atención. Si no se convierte en compras, el problema está en la web o el precio, no en el anuncio.`)
  if (total.linkClicks > 30 && total.landing / total.linkClicks < 0.6) add('warn', `De ${total.linkClicks} clics solo ${total.landing} llegaron a ver la web. Puede que la web cargue lento en el celu.`)
  if (total.landing > 50 && total.purchases === 0) add('warn', `${total.landing} visitas a la web y ninguna compra registrada. Revisá que el píxel marque las compras y que el checkout ande bien.`)
  if (total.purchases > 0 && total.roas >= 2) add('ok', `ROAS de ${total.roas.toFixed(1)}: por cada $1 invertido vuelven $${total.roas.toFixed(1)}. Se puede subir el presupuesto de a 20% cada 2-3 días.`)
  if (total.purchases > 0 && total.roas < 1) add('warn', `ROAS de ${total.roas.toFixed(2)}: hoy se gasta más de lo que se vende por anuncios. Pausá los anuncios con peor costo por compra.`)

  const withVideo = ads.filter((a) => a.s.plays3s > 0 && a.s.impressions >= 500)
  for (const a of withVideo) {
    if (a.s.hookRate < 20) add('warn', `"${a.name}": solo ${a.s.hookRate.toFixed(0)}% mira más de 3 segundos. El arranque del video no engancha; probá empezar con el perro o con movimiento.`)
    const drop = biggestDrop(a.s.curve)
    if (drop && drop.drop >= 15) add('info', `"${a.name}": la mayor fuga es en el segundo ${drop.second} (pasa de ${drop.from.toFixed(0)}% a ${drop.to.toFixed(0)}%). Mirá qué pasa en ese momento del video.`)
  }
  const ranked = ads.filter((a) => a.s.impressions >= 500).sort((x, y) => y.s.ctr - x.s.ctr)
  if (ranked.length >= 2) {
    const best = ranked[0]
    const worst = ranked[ranked.length - 1]
    if (best.s.ctr > worst.s.ctr * 2) add('info', `"${best.name}" tiene el doble de CTR que "${worst.name}". Pasale más presupuesto al primero o pausá el segundo.`)
  }
  return out
}

// Variación porcentual entre el período actual y el anterior.
export function pctChange(now, before) {
  if (!before) return null
  return ((now - before) / before) * 100
}

// ---- Instagram compartido entre pestañas (Calendario la usa para "Cómo le fue") ----
let igCache = null
export function getInstagramCached() {
  if (igCache && Date.now() - igCache.at < 10 * 60 * 1000) return igCache.promise
  const promise = fetchMeta('instagram', { cantidad: '50' })
  igCache = { at: Date.now(), promise }
  promise.catch(() => {
    igCache = null
  })
  return promise
}

// Fecha local de Argentina (UTC-3) de un timestamp de Instagram.
export function arDate(ts) {
  return new Date(Date.parse(ts) - 3 * 3600 * 1000).toISOString().slice(0, 10)
}
const arTime = (ts) => new Date(Date.parse(ts) - 3 * 3600 * 1000).toISOString().slice(11, 16)

// Normaliza una publicación de Instagram con sus métricas.
export function igPost(m) {
  const i = m.insights || {}
  return {
    ...m,
    kind: m.media_type === 'CAROUSEL_ALBUM' ? 'Carrusel' : m.media_product_type === 'REELS' ? 'Reel' : m.media_product_type === 'STORY' ? 'Historia' : 'Foto',
    views: Number(i.views) || 0,
    reach: Number(i.reach) || 0,
    likes: Number(i.likes ?? m.like_count) || 0,
    comments: Number(i.comments ?? m.comments_count) || 0,
    shares: Number(i.shares) || 0,
    saved: Number(i.saved) || 0,
    avgWatch: (Number(i.ig_reels_avg_watch_time) || 0) / 1000,
  }
}

// Busca en Instagram la publicación que corresponde a una del Calendario:
// mismo día (hora argentina) y mismo formato; si hay varias, la más cercana a la hora planeada.
export function matchCalendarPost(post, media) {
  const cands = media.map(igPost).filter((m) => arDate(m.timestamp) === post.date && m.kind === post.format)
  if (cands.length <= 1) return cands[0] || null
  const mins = (hhmm) => {
    const [h, m] = (hhmm || '12:00').split(':').map(Number)
    return h * 60 + m
  }
  return cands.sort((a, b) => Math.abs(mins(arTime(a.timestamp)) - mins(post.time)) - Math.abs(mins(arTime(b.timestamp)) - mins(post.time)))[0]
}

// ---- sugerencias de contenido orgánico ----
export function contentSuggestions(posts, account) {
  const out = []
  const add = (level, text) => out.push({ level, text })
  const reels = posts.filter((p) => p.kind === 'Reel' && p.views > 0)
  const avg = (arr, k) => (arr.length ? arr.reduce((a, p) => a + p[k], 0) / arr.length : 0)
  if (reels.length >= 3) {
    const bestWatch = [...reels].sort((a, b) => b.avgWatch - a.avgWatch)[0]
    add('ok', `El reel que más retiene es "${(bestWatch.caption || 'sin texto').split('\n')[0].slice(0, 60)}" (${bestWatch.avgWatch.toFixed(1)} s en promedio). Repetí ese tipo de arranque.`)
    const bestShare = [...reels].sort((a, b) => b.shares / (b.reach || 1) - a.shares / (a.reach || 1))[0]
    if (bestShare.shares > 0) add('ok', `El que más se compartió en proporción es "${(bestShare.caption || 'sin texto').split('\n')[0].slice(0, 60)}" (${bestShare.shares} veces). Compartir es lo que más alcance trae: hacé más de ese estilo.`)
    const lowWatch = reels.filter((r) => r.avgWatch > 0 && r.avgWatch < 3).length
    if (lowWatch >= Math.ceil(reels.length / 2)) add('warn', `${lowWatch} de ${reels.length} reels se miran menos de 3 segundos en promedio. El primer segundo tiene que tener al perro o algo que pase, no una placa.`)
  }
  const carr = posts.filter((p) => p.kind === 'Carrusel' && p.reach > 0)
  if (reels.length >= 2 && carr.length >= 2) {
    const r = avg(reels, 'reach')
    const c = avg(carr, 'reach')
    if (r > c * 1.5) add('info', `Los reels llegan a ${Math.round(r / c)} veces más gente que los carruseles. Para crecer, priorizá reels.`)
    else if (c > r * 1.2) add('info', `Los carruseles están llegando a más gente que los reels (${Math.round(c)} vs ${Math.round(r)} de alcance promedio).`)
    if (avg(carr, 'saved') > avg(reels, 'saved') * 1.5) add('info', 'Los carruseles se guardan bastante más que los reels: sirven para contenido útil (cuidados, tips).')
  }
  const t = account?.totals || {}
  if (t.profile_views > 0 && t.website_clicks !== undefined && t.website_clicks !== null) {
    const rate = (t.website_clicks / t.profile_views) * 100
    if (t.profile_views >= 50 && rate < 3) add('warn', `De ${t.profile_views} visitas al perfil solo ${t.website_clicks} tocaron el link de la web (${rate.toFixed(1)}%). Revisá la bio y que el link se vea claro.`)
  }
  return out
}
