// Cliente de la API GraphQL de Buffer (https://developers.buffer.com).
//
// La clave y la lista de canales viven SOLO en localStorage de este navegador:
// nunca pasan por el estado compartido de Supabase, así que jamás entran al
// backup exportado. Cada socio la carga por su cuenta en Ajustes.
//
// Buffer pide explícitamente no llamar a su API desde el navegador ("API calls
// should be made from your server, not from a browser or mobile app"), y
// además el endpoint bloquea CORS. Por eso todo pasa por /api/buffer: en
// producción es la función serverless de Vercel (api/buffer.js) que reenvía
// la request tal cual; en desarrollo cumple el mismo rol el proxy de Vite
// (ver vite.config.js). El navegador nunca habla directo con api.buffer.com.

const KEY_STORAGE = 'sanzo_buffer_key'
const CHANNELS_STORAGE = 'sanzo_buffer_channels'
const PROXY_URL = '/api/buffer'

export function getBufferKey() {
  try {
    return localStorage.getItem(KEY_STORAGE) || ''
  } catch {
    return ''
  }
}

export function setBufferKey(key) {
  try {
    if (key) localStorage.setItem(KEY_STORAGE, key)
    else localStorage.removeItem(KEY_STORAGE)
  } catch {
    /* si no se puede guardar, seguimos igual */
  }
}

export function bufferReady() {
  return Boolean(getBufferKey())
}

export function getStoredChannels() {
  try {
    const raw = localStorage.getItem(CHANNELS_STORAGE)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function setStoredChannels(list) {
  try {
    localStorage.setItem(CHANNELS_STORAGE, JSON.stringify(list || []))
  } catch {
    /* no rompemos la app por esto */
  }
}

export function channelForNetwork(channels, networkKey) {
  return channels.find((c) => String(c.service || '').toLowerCase() === networkKey)
}

function friendlyError(message, extra) {
  const e = new Error(message)
  e.friendly = message
  if (extra) Object.assign(e, extra)
  return e
}

// Traduce los errores documentados por Buffer (extensions.code, o el texto
// cuando no viene código) a algo entendible en español.
function classify(errors) {
  const first = errors?.[0]
  const code = first?.extensions?.code
  const msg = first?.message || 'Buffer devolvió un error sin detalle.'
  if (code === 'UNAUTHORIZED' || code === 'UNAUTHENTICATED') return 'La clave de API no es válida. Revisala en Ajustes.'
  if (code === 'FORBIDDEN') return 'La clave no tiene permisos para esto. Revisá los permisos en Buffer → Settings → API.'
  if (code === 'NOT_FOUND') return `Buffer no encontró lo que le pedimos: ${msg}`
  if (code === 'RATE_LIMIT_EXCEEDED') return 'Buffer está limitando las llamadas por ahora. Esperá un momento y volvé a intentar.'
  const low = msg.toLowerCase()
  if (low.includes('channel')) return `Buffer no reconoce ese canal: ${msg}`
  if (low.includes('asset') || low.includes('media') || low.includes('url') || low.includes('video') || low.includes('image')) {
    return `Buffer no pudo leer el archivo. Verificá que el link sea público (por ejemplo, "cualquiera con el link" en Drive), o cargá el video a mano en Buffer. (${msg})`
  }
  return msg
}

async function bufferRequest(query) {
  const key = getBufferKey()
  if (!key) throw friendlyError('Todavía no configuraste la clave de API de Buffer.', { code: 'no_key' })

  let res
  try {
    res = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
      body: JSON.stringify({ query }),
    })
  } catch {
    throw friendlyError('No se pudo conectar con Buffer. Revisá tu conexión a internet.', { code: 'network' })
  }

  if (res.status === 429) {
    const retryAfter = res.headers.get('retry-after')
    throw friendlyError(`Buffer está limitando las llamadas por ahora.${retryAfter ? ` Esperá ${retryAfter} segundos.` : ' Esperá un momento.'}`, { code: 'rate_limit' })
  }

  let json
  try {
    json = await res.json()
  } catch {
    throw friendlyError(`Buffer respondió algo inesperado (HTTP ${res.status}).`, { code: 'bad_response' })
  }

  if (res.status === 401 || res.status === 403) {
    throw friendlyError('La clave de API no es válida o no tiene permisos.', { code: 'auth' })
  }

  if (json.errors?.length) {
    throw friendlyError(classify(json.errors), { code: 'graphql', raw: json.errors })
  }

  return json.data
}

// "Probar conexión": trae la organización y sus canales conectados.
export async function testBufferConnection() {
  const orgData = await bufferRequest(`query { account { organizations { id name ownerEmail } } }`)
  const orgs = orgData?.account?.organizations || []
  if (orgs.length === 0) {
    throw friendlyError('No se encontró ninguna organización en tu cuenta de Buffer.', { code: 'no_org' })
  }
  const org = orgs[0]
  const chData = await bufferRequest(`query { channels(input: { organizationId: ${JSON.stringify(org.id)} }) { id displayName service avatar isDisconnected } }`)
  const channels = (chData?.channels || []).filter((c) => !c.isDisconnected)
  setStoredChannels(channels)
  return { organization: org, channels }
}

const VIDEO_EXTENSIONS = ['mp4', 'mov', 'webm', 'm4v', 'avi', 'mkv']
const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif']

// Un Reel/Historia puede en realidad ser una foto (Instagram lo permite), así que no
// alcanza con mirar el formato: primero miramos la extensión real del archivo (los
// nuestros, subidos a Supabase Storage, siempre la tienen). Solo si no hay extensión
// reconocible (por ejemplo, un link de Drive sin extensión) usamos el formato como pista.
function isVideoUrl(url, fallbackIsVideo) {
  const match = (url || '').match(/\.([a-z0-9]+)(?:\?.*)?$/i)
  const ext = match ? match[1].toLowerCase() : ''
  if (VIDEO_EXTENSIONS.includes(ext)) return true
  if (IMAGE_EXTENSIONS.includes(ext)) return false
  return fallbackIsVideo
}

function isVideoAsset(post) {
  return isVideoUrl(post.assetUrl, post.format === 'Reel' || post.format === 'Historia')
}

// Un carrusel manda VARIAS imágenes/videos en un solo post (Instagram y Facebook lo
// soportan así). Para el resto de los formatos seguimos mandando un único asset.
function assetsField(post) {
  if (post.format === 'Carrusel' && post.assetUrls?.length) {
    // Buffer publica los carruseles en el orden INVERSO al que llegan en `assets`
    // (la última imagen del array termina siendo la primera del posteo). Mandamos
    // el array dado vuelta para que en Instagram/Facebook quede en el orden que
    // el usuario armó acá (1, 2, 3…).
    const items = [...post.assetUrls]
      .reverse()
      .filter(Boolean)
      .map((url) => (isVideoUrl(url, false) ? `{ video: { url: ${JSON.stringify(url)} } }` : `{ image: { url: ${JSON.stringify(url)} } }`))
      .join(', ')
    return items ? `assets: [${items}]` : ''
  }
  if (!post.assetUrl) return ''
  const thumb = post.thumbnailUrl ? `, thumbnailUrl: ${JSON.stringify(post.thumbnailUrl)}` : ''
  return isVideoAsset(post) ? `assets: [{ video: { url: ${JSON.stringify(post.assetUrl)}${thumb} } }]` : `assets: [{ image: { url: ${JSON.stringify(post.assetUrl)}${thumb} } }]`
}

// Instagram y Facebook exigen que se les diga si el post es post/story/reel
// ("... posts require a type"). Lo mapeamos desde el formato. X (Twitter) no
// tiene campos obligatorios en su metadata, así que no necesita nada acá.
// Nota: Buffer sigue identificando este canal internamente como "twitter" en
// el campo `service`, aunque la red se llame X ahora.
const POST_TYPE_BY_FORMAT = { Reel: 'reel', Historia: 'story', Carrusel: 'post', Foto: 'post' }

function metadataField(post, service) {
  const svc = String(service || '').toLowerCase()
  const type = POST_TYPE_BY_FORMAT[post.format] || 'post'
  if (svc === 'instagram') {
    // shouldShareToFeed es obligatorio para Instagram. true = también aparece en la
    // grilla principal (no solo en Reels/Stories), que es lo que se quiere la mayoría
    // de las veces.
    return `metadata: { instagram: { type: ${type}, shouldShareToFeed: true } }`
  }
  if (svc === 'facebook') {
    return `metadata: { facebook: { type: ${type} } }`
  }
  return ''
}

// Programa UNA publicación en UN canal (createPost solo acepta un channelId
// a la vez, así que para varias redes se llama una vez por canal).
export async function scheduleChannelPost({ channelId, service, text, dueAtISO, post }) {
  const query = `
    mutation {
      createPost(input: {
        channelId: ${JSON.stringify(channelId)}
        text: ${JSON.stringify(text)}
        schedulingType: automatic
        mode: customScheduled
        dueAt: ${JSON.stringify(dueAtISO)}
        ${assetsField(post)}
        ${metadataField(post, service)}
      }) {
        ... on PostActionSuccess { post { id dueAt } }
        ... on MutationError { message }
      }
    }
  `
  const data = await bufferRequest(query)
  const result = data?.createPost
  if (result?.message) throw friendlyError(classify([{ message: result.message }]), { code: 'mutation' })
  if (!result?.post?.id) throw friendlyError('Buffer no devolvió el post creado.', { code: 'unknown' })
  return result.post
}

export async function deleteBufferPost(postId) {
  const query = `
    mutation {
      deletePost(input: { id: ${JSON.stringify(postId)} }) {
        ... on DeletePostSuccess { id }
        ... on MutationError { message }
      }
    }
  `
  const data = await bufferRequest(query)
  const result = data?.deletePost
  if (result?.message) throw friendlyError(classify([{ message: result.message }]), { code: 'mutation' })
  return true
}
