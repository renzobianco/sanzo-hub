// Función serverless (Vercel) que lee estadísticas de Meta: anuncios
// (Marketing API) y publicaciones de Instagram (Graph API).
//
// Solo lectura. El token vive en la variable de entorno META_ACCESS_TOKEN
// (Vercel → Settings → Environment Variables, y en .env para desarrollo):
// nunca en el navegador, nunca en Supabase. Es un token de "usuario del
// sistema" del Business de Sanzo con permisos ads_read, read_insights,
// pages_show_list, pages_read_engagement, instagram_basic e
// instagram_manage_insights.
//
// Esta función no reenvía consultas arbitrarias: solo arma las dos lecturas
// de abajo (?tipo=ads y ?tipo=instagram), así que aunque alguien la llame
// no puede usar el token para otra cosa.
//
// En desarrollo la sirve el plugin de vite.config.js.

const VERSION = process.env.META_API_VERSION || 'v24.0'
const AD_ACCOUNT = process.env.META_AD_ACCOUNT_ID || 'act_1502019825120576'
const GRAPH = `https://graph.facebook.com/${VERSION}`

class MetaError extends Error {
  constructor(message, code) {
    super(message)
    this.code = code
  }
}

async function graph(path, params = {}) {
  const token = process.env.META_ACCESS_TOKEN
  if (!token) throw new MetaError('Falta META_ACCESS_TOKEN en el servidor', 'sin_token')
  const url = new URL(path.startsWith('http') ? path : `${GRAPH}/${path}`)
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, typeof v === 'string' ? v : JSON.stringify(v))
  }
  url.searchParams.set('access_token', token)
  const r = await fetch(url)
  const body = await r.json().catch(() => ({}))
  if (!r.ok || body.error) {
    const e = body.error || {}
    throw new MetaError(e.message || `Meta respondió ${r.status}`, e.code === 190 ? 'token_invalido' : 'meta')
  }
  return body
}

// Trae todas las páginas de un listado (con tope para no colgarse).
async function graphAll(path, params, max = 10) {
  let out = []
  let page = await graph(path, params)
  out = out.concat(page.data || [])
  let n = 1
  while (page.paging?.next && n < max) {
    page = await graph(page.paging.next)
    out = out.concat(page.data || [])
    n++
  }
  return out
}

const isoDate = (d) => d.toISOString().slice(0, 10)
function rangeFromQuery(q) {
  const ok = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || '')
  const until = ok(q.get('hasta')) ? q.get('hasta') : isoDate(new Date())
  const since = ok(q.get('desde')) ? q.get('desde') : isoDate(new Date(Date.now() - 29 * 864e5))
  return { since, until }
}

// ---------- Anuncios ----------
const AD_FIELDS = [
  'spend', 'reach', 'impressions', 'frequency', 'cpm', 'ctr', 'cpc',
  'clicks', 'inline_link_clicks', 'inline_link_click_ctr', 'cost_per_inline_link_click',
  'actions', 'action_values', 'cost_per_action_type', 'purchase_roas',
]
const VIDEO_FIELDS = [
  'video_play_actions', 'video_avg_time_watched_actions', 'video_thruplay_watched_actions',
  'video_p25_watched_actions', 'video_p50_watched_actions', 'video_p75_watched_actions',
  'video_p95_watched_actions', 'video_p100_watched_actions', 'video_play_curve_actions',
]

async function readAds(q) {
  const time_range = rangeFromQuery(q)
  const [account, campaigns, daily, byAd, ads] = await Promise.all([
    graph(AD_ACCOUNT, { fields: 'name,currency,account_status,amount_spent,timezone_name' }),
    graphAll(`${AD_ACCOUNT}/campaigns`, {
      fields: 'id,name,status,effective_status,objective,daily_budget,lifetime_budget,start_time,stop_time',
      limit: 100,
    }),
    graphAll(`${AD_ACCOUNT}/insights`, { fields: AD_FIELDS.join(','), time_range, time_increment: 1, limit: 500 }),
    graphAll(`${AD_ACCOUNT}/insights`, {
      level: 'ad',
      fields: ['ad_id', 'ad_name', 'adset_name', 'campaign_id', 'campaign_name', ...AD_FIELDS, ...VIDEO_FIELDS].join(','),
      time_range,
      limit: 200,
    }),
    graphAll(`${AD_ACCOUNT}/ads`, {
      fields: 'id,name,effective_status,creative{thumbnail_url,image_url,title,body,video_id}',
      limit: 200,
    }),
  ])
  const total = await graph(`${AD_ACCOUNT}/insights`, { fields: AD_FIELDS.join(','), time_range })
  return { account, campaigns, total: total.data?.[0] || null, daily, byAd, ads, range: time_range }
}

// ---------- Instagram ----------
const REEL_METRICS = 'reach,views,likes,comments,shares,saved,total_interactions,ig_reels_avg_watch_time,ig_reels_video_view_total_time'
const FEED_METRICS = 'reach,views,likes,comments,shares,saved,total_interactions'

async function findInstagramAccount() {
  if (process.env.META_IG_USER_ID) return process.env.META_IG_USER_ID
  const pages = await graphAll('me/accounts', { fields: 'name,instagram_business_account', limit: 50 }, 2)
  const withIg = pages.find((p) => p.instagram_business_account?.id)
  if (!withIg) throw new MetaError('El token no ve ninguna página con Instagram vinculado', 'sin_instagram')
  return withIg.instagram_business_account.id
}

async function mediaInsights(m) {
  const metrics = m.media_product_type === 'REELS' ? REEL_METRICS : FEED_METRICS
  try {
    const r = await graph(`${m.id}/insights`, { metric: metrics })
    const out = {}
    for (const row of r.data || []) out[row.name] = row.values?.[0]?.value ?? row.total_value?.value ?? null
    return out
  } catch (e) {
    return { _error: e.message }
  }
}

async function readInstagram(q) {
  const igId = await findInstagramAccount()
  const limit = Math.min(Number(q.get('cantidad')) || 24, 50)
  const [profile, mediaPage] = await Promise.all([
    graph(igId, { fields: 'username,name,followers_count,follows_count,media_count,profile_picture_url' }),
    graph(`${igId}/media`, {
      fields: 'id,caption,media_type,media_product_type,permalink,thumbnail_url,media_url,timestamp,like_count,comments_count',
      limit,
    }),
  ])
  const media = mediaPage.data || []
  // De a 6 para no pegarle a Meta con 50 pedidos juntos.
  const insights = []
  for (let i = 0; i < media.length; i += 6) {
    insights.push(...(await Promise.all(media.slice(i, i + 6).map(mediaInsights))))
  }
  return { profile, media: media.map((m, i) => ({ ...m, insights: insights[i] })) }
}

export default async function handler(req, res) {
  const send = (status, body) => {
    res.statusCode = status
    res.setHeader('content-type', 'application/json')
    res.setHeader('cache-control', 'no-store')
    res.end(JSON.stringify(body))
  }
  if (req.method !== 'GET') return send(405, { error: 'Método no permitido' })
  const q = new URL(req.url, 'http://x').searchParams
  try {
    const tipo = q.get('tipo')
    if (tipo === 'ads') return send(200, await readAds(q))
    if (tipo === 'instagram') return send(200, await readInstagram(q))
    return send(400, { error: 'tipo tiene que ser ads o instagram' })
  } catch (e) {
    const status = e.code === 'sin_token' || e.code === 'token_invalido' ? 401 : 502
    return send(status, { error: e.message, code: e.code || 'error' })
  }
}
