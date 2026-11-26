// Función serverless (Vercel) que lee estadísticas de Meta: anuncios
// (Marketing API) y publicaciones de Instagram (Graph API).
//
// Solo lectura. El token vive en la variable de entorno META_ACCESS_TOKEN
// (Vercel → Settings → Environment Variables, y en .env para desarrollo):
// nunca en el navegador, nunca en Supabase. Es un token de "usuario del
// sistema" del Business de Sanzo con permisos ads_read,
// pages_show_list, pages_read_engagement, instagram_basic e
// instagram_manage_insights.
//
// Esta función no reenvía consultas arbitrarias: solo arma las dos lecturas
// de abajo (?tipo=ads, ?tipo=instagram y ?tipo=competencia), así que aunque alguien la llame
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
  // En Vercel Renzo la cargó como TOKENMETA; se aceptan los dos nombres.
  const token = process.env.META_ACCESS_TOKEN || process.env.TOKENMETA
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
  const days = Math.round((Date.parse(time_range.until) - Date.parse(time_range.since)) / 864e5) + 1
  const prevUntil = isoDate(new Date(Date.parse(time_range.since) - 864e5))
  const prevSince = isoDate(new Date(Date.parse(time_range.since) - days * 864e5))
  const BREAK_FIELDS = 'spend,reach,impressions,inline_link_clicks,inline_link_click_ctr,actions,action_values'
  // Hora y provincia pueden fallar por separado sin tirar todo lo demás.
  const optional = (p) => p.catch(() => [])
  const [total, previous, placements, demo, hours, regions] = await Promise.all([
    graph(`${AD_ACCOUNT}/insights`, { fields: AD_FIELDS.join(','), time_range }),
    graph(`${AD_ACCOUNT}/insights`, { fields: AD_FIELDS.join(','), time_range: { since: prevSince, until: prevUntil } }),
    graphAll(`${AD_ACCOUNT}/insights`, { fields: BREAK_FIELDS, time_range, breakdowns: 'publisher_platform,platform_position', limit: 100 }, 2),
    graphAll(`${AD_ACCOUNT}/insights`, { fields: BREAK_FIELDS, time_range, breakdowns: 'age,gender', limit: 100 }, 2),
    optional(graphAll(`${AD_ACCOUNT}/insights`, { fields: BREAK_FIELDS, time_range, breakdowns: 'hourly_stats_aggregated_by_advertiser_time_zone', limit: 100 }, 2)),
    optional(graphAll(`${AD_ACCOUNT}/insights`, { fields: BREAK_FIELDS, time_range, breakdowns: 'region', limit: 100 }, 2)),
  ])
  return {
    account,
    campaigns,
    total: total.data?.[0] || null,
    previous: previous.data?.[0] || null,
    previousRange: { since: prevSince, until: prevUntil },
    daily,
    byAd,
    ads,
    placements,
    demo,
    hours,
    regions,
    range: time_range,
  }
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

// Métricas de la cuenta en el período: alcance por día, seguidores nuevos por
// día y totales de visitas al perfil, clics al link de la bio y cuentas que
// interactuaron. Cada bloque por separado: si Meta rechaza uno, el resto sale.
async function accountInsights(igId, { since, until }) {
  const ts = (d, end) => Math.floor(Date.parse(d + (end ? 'T23:59:59Z' : 'T00:00:00Z')) / 1000)
  const range = { since: ts(since), until: ts(until, true) }
  const out = { range: { since, until }, daily: {}, totals: {} }
  const safe = async (fn) => {
    try {
      await fn()
    } catch (e) {
      out.errors = [...(out.errors || []), e.message]
    }
  }
  await Promise.all([
    safe(async () => {
      const r = await graph(`${igId}/insights`, { metric: 'reach', period: 'day', ...range })
      out.daily.reach = (r.data?.[0]?.values || []).map((v) => ({ date: v.end_time?.slice(0, 10), value: v.value }))
    }),
    safe(async () => {
      // follower_count solo acepta los últimos 30 días
      const r = await graph(`${igId}/insights`, { metric: 'follower_count', period: 'day', since: Math.max(range.since, Math.floor(Date.now() / 1000) - 29 * 86400), until: range.until })
      out.daily.followers = (r.data?.[0]?.values || []).map((v) => ({ date: v.end_time?.slice(0, 10), value: v.value }))
    }),
    ...['profile_views', 'website_clicks', 'accounts_engaged', 'total_interactions', 'views'].map((metric) =>
      safe(async () => {
        const r = await graph(`${igId}/insights`, { metric, period: 'day', metric_type: 'total_value', ...range })
        out.totals[metric] = r.data?.[0]?.total_value?.value ?? null
      }),
    ),
  ])
  return out
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
  const account = await accountInsights(igId, rangeFromQuery(q))
  return { profile, account, media: media.map((m, i) => ({ ...m, insights: insights[i] })) }
}

// ---------- Competencia (Instagram de otras marcas) ----------
// business_discovery deja ver el perfil público y los últimos posts de otras
// cuentas de empresa o creador: seguidores, likes, comentarios, tipo de post.
// No da reproducciones ni alcance de cuentas ajenas.
const COMP_MEDIA_FIELDS = 'id,caption,media_type,media_product_type,permalink,timestamp,like_count,comments_count,thumbnail_url,media_url,children{media_type,media_url,thumbnail_url}'
async function readCompetitor(igId, username) {
  const fields = `business_discovery.username(${username}){username,name,biography,website,followers_count,follows_count,media_count,profile_picture_url,media.limit(30){${COMP_MEDIA_FIELDS}}}`
  try {
    const r = await graph(igId, { fields })
    const b = r.business_discovery || {}
    const media = b.media?.data || []
    delete b.media
    return { ...b, media }
  } catch (e) {
    return { username, _error: e.message }
  }
}

async function readCompetencia(q) {
  const users = (q.get('usuarios') || '')
    .split(',')
    .map((u) => u.trim().replace(/^@/, '').toLowerCase())
    .filter((u) => /^[a-z0-9._]{1,30}$/.test(u))
    .slice(0, 15)
  if (users.length === 0) return { competitors: [] }
  const igId = await findInstagramAccount()
  const competitors = []
  for (let i = 0; i < users.length; i += 4) {
    competitors.push(...(await Promise.all(users.slice(i, i + 4).map((u) => readCompetitor(igId, u)))))
  }
  return { competitors, at: new Date().toISOString() }
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
    if (tipo === 'competencia') return send(200, await readCompetencia(q))
    return send(400, { error: 'tipo tiene que ser ads, instagram o competencia' })
  } catch (e) {
    const status = e.code === 'sin_token' || e.code === 'token_invalido' ? 401 : 502
    return send(status, { error: e.message, code: e.code || 'error' })
  }
}
