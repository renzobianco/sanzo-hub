// Competencia y oportunidades: arma, a partir del Instagram de otras marcas
// (business_discovery en /api/meta?tipo=competencia) y de lo que la rutina de
// la mañana anota de la Biblioteca de anuncios y de sus webs, una lista de
// "oportunidades": cosas que les están funcionando y que Sanzo puede copiar.

// Marcas que Claude encontró en Instagram (26 nov 2026, todas leen bien por
// business_discovery). Las de Argentina son competencia directa; las de afuera
// (Colombia, España), inspiración.
export const DEFAULT_COMPETITORS = [
  { ig: 'barkargentina', name: 'Bark', group: 'directa' },
  { ig: 'somos_orejas', name: 'Somos Orejas', group: 'directa' },
  { ig: 'perrijos.ar', name: 'Perrijos', group: 'directa' },
  { ig: 'chaveandco_', name: 'Chave & Co.', group: 'directa' },
  { ig: 'somos.mochi', name: 'Mochi', group: 'directa' },
  { ig: 'orejas_voladoras', name: 'Orejas Voladoras', group: 'directa' },
  { ig: 'handy_do', name: 'Handy Do', group: 'directa' },
  { ig: 'manadabarky', name: 'Manada Barky', group: 'inspiracion' },
  { ig: 'doggy.craft', name: 'Doggy Craft', group: 'inspiracion' },
  // Virales de cualquier tema (probadas el 26 nov: todas leen bien). Sirven para
  // ver qué formato está pegando en toda la plataforma y adaptarlo.
  { ig: 'weratedogs', name: 'WeRateDogs', group: 'viral' },
  { ig: 'barked', name: 'Barked', group: 'viral' },
  { ig: 'thedodo', name: 'The Dodo', group: 'viral' },
  { ig: 'daquan', name: 'Daquan', group: 'viral' },
  { ig: 'pubity', name: 'Pubity', group: 'viral' },
  { ig: 'memezar', name: 'Memezar', group: 'viral' },
  { ig: '9gag', name: '9GAG', group: 'viral' },
  { ig: 'ladbible', name: 'LADbible', group: 'viral' },
  { ig: 'khaby00', name: 'Khaby Lame', group: 'viral' },
  { ig: 'wearedukier', name: 'Dukier', group: 'inspiracion' },
  { ig: 'mypugandco', name: 'My Pug & Co.', group: 'inspiracion' },
]

export const cleanHandle = (s) =>
  String(s || '')
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .replace(/[/?#].*$/, '')
    .replace(/^@/, '')
    .toLowerCase()

// Lista final: lo guardado en settings.adCompetitors + las sugeridas que no
// se sacaron a mano (settings.adCompetitorsHidden).
export function competitorList(settings) {
  const saved = (settings.adCompetitors || []).map((c) => ({
    ...c,
    ig: cleanHandle(c.ig || (/^@?[a-z0-9._]+$/i.test(c.name || '') ? c.name : '')),
  }))
  const hidden = new Set(settings.adCompetitorsHidden || [])
  const have = new Set(saved.map((c) => c.ig).filter(Boolean))
  const extra = DEFAULT_COMPETITORS.filter((d) => !have.has(d.ig) && !hidden.has(d.ig)).map((d) => ({ id: `sug-${d.ig}`, suggested: true, ...d }))
  return [...saved, ...extra]
}

const DAY = 864e5
export const daysSince = (iso) => (iso ? Math.max(0, Math.floor((Date.now() - Date.parse(iso)) / DAY)) : null)
const median = (arr) => {
  if (!arr.length) return 0
  const s = [...arr].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

export function compKind(m) {
  if (m.media_type === 'CAROUSEL_ALBUM') return 'Carrusel'
  if (m.media_product_type === 'REELS' || m.media_type === 'VIDEO') return 'Reel'
  return 'Foto'
}

// Normaliza los posts de una marca y calcula cuánto rindió cada uno contra la
// mediana de esa misma marca (así se compara una cuenta chica con una grande).
export function analyzeCompetitor(c) {
  const media = (c.media || []).map((m) => ({
    ...m,
    kind: compKind(m),
    likes: Number(m.like_count) || 0,
    comments: Number(m.comments_count) || 0,
    thumb: m.thumbnail_url || (m.media_type !== 'VIDEO' ? m.media_url : null) || m.children?.data?.map((c) => c.thumbnail_url || (c.media_type !== 'VIDEO' ? c.media_url : null)).find(Boolean) || null,
    video: m.media_type === 'VIDEO' && !m.thumbnail_url ? m.media_url : null,
  }))
  // Sorteos y convocatorias inflan los comentarios ("comentá y participá"):
  // no sirven para medir si el contenido gustó, así que quedan afuera.
  for (const m of media) {
    m.eng = m.likes + m.comments
    m.giveaway = m.comments > m.likes * 0.5 || /sorteo|giveaway|ganador|particip|concurso|buscamos creador/i.test(m.caption || '')
  }
  const med = median(media.filter((m) => !m.giveaway).map((m) => m.eng)) || 1
  for (const m of media) m.lift = m.eng / med
  const last30 = media.filter((m) => daysSince(m.timestamp) <= 30)
  const mix = { Reel: 0, Carrusel: 0, Foto: 0 }
  for (const m of last30) mix[m.kind]++
  const byKind = Object.fromEntries(
    Object.keys(mix).map((k) => {
      const arr = media.filter((m) => m.kind === k)
      return [k, arr.length ? arr.reduce((a, m) => a + m.eng, 0) / arr.length : 0]
    }),
  )
  const bestKind = Object.entries(byKind).sort((a, b) => b[1] - a[1])[0]?.[0]
  const site = (c.website || '').toLowerCase()
  return {
    ...c,
    media,
    medianEng: med,
    postsPerWeek: last30.length / (30 / 7),
    mix,
    bestKind,
    avgLikes: media.length ? media.reduce((a, m) => a + m.likes, 0) / media.length : 0,
    argentina: /\.ar(\/|$)/.test(site) || /argentin|🇦🇷/i.test(`${c.biography || ''} ${c.name || ''}`),
    lastPost: media[0]?.timestamp || null,
  }
}

const firstLine = (s, n = 90) => (s || '').split('\n').find((l) => l.trim())?.trim().slice(0, n) || ''

// Oportunidades ordenadas por fuerza de la señal.
// - Posts recientes (≤45 días) que rindieron 2x o más su mediana.
// - Anuncios que la marca tiene activos hace 14 días o más (si no les
//   vendiera, los habrían apagado).
// - Lo tuyo que mejor anduvo, para repetirlo.
export function findOpportunities({ brands, own }) {
  const out = []
  for (const b of brands) {
    for (const m of b.media) {
      const age = daysSince(m.timestamp)
      if (age > 45 || m.lift < 2 || m.eng < 20 || m.giveaway) continue
      out.push({
        key: `post-${m.id}`,
        type: 'post',
        kind: m.kind,
        brand: b.name || b.username,
        handle: b.username,
        group: b.group,
        thumb: m.thumb,
        video: m.video,
        link: m.permalink,
        badge: liftLabel(m.lift),
        title: firstLine(m.caption) || `${m.kind} de ${b.name || b.username}`,
        why: `${m.likes.toLocaleString('es-AR')} likes y ${m.comments.toLocaleString('es-AR')} comentarios, hace ${age} días.`,
        idea: ideaFor(m.kind),
        score: m.lift * (age <= 14 ? 1.3 : 1),
        date: m.timestamp,
      })
    }
    for (const ad of b.ads || []) {
      const d = daysSince(ad.startedAt)
      if (d === null || d < 14) continue
      out.push({
        key: `ad-${b.ig}-${ad.id || ad.link}`,
        type: 'ad',
        kind: 'Anuncio',
        brand: b.name || b.username || b.ig,
        handle: b.ig,
        group: b.group,
        thumb: ad.thumb,
        link: ad.link,
        badge: `Activo hace ${d} días`,
        title: firstLine(ad.text) || 'Anuncio activo',
        why: `Lo vienen pagando hace ${d} días: si no les vendiera, ya lo habrían apagado.${ad.format ? ` Formato: ${ad.format}.` : ''}`,
        idea: ad.idea || 'Mirá el gancho de los primeros segundos y la oferta: armá la versión Sanzo con los mismos pasos.',
        score: 1.5 + d / 14,
        date: ad.startedAt,
      })
    }
  }
  if (own?.length) {
    const reels = own.filter((p) => p.kind === 'Reel' && p.views > 0 && daysSince(p.timestamp) <= 60)
    const best = [...reels].sort((a, b) => b.views - a.views)[0]
    if (best && reels.length >= 3) {
      const avg = reels.reduce((a, p) => a + p.views, 0) / reels.length
      if (best.views > avg * 1.5)
        out.push({
          key: `own-${best.id}`,
          type: 'own',
          kind: 'Reel',
          brand: 'Sanzo',
          handle: 'sanzo_pets',
          group: 'propio',
          thumb: best.thumbnail_url || best.media_url,
          link: best.permalink,
          badge: `${(best.views / avg).toFixed(1)}x tu promedio`,
          title: firstLine(best.caption) || 'Tu mejor reel',
          why: `${best.views.toLocaleString('es-AR')} reproducciones y ${best.avgWatch.toFixed(1)} s de visualización promedio.`,
          idea: 'Es tu mejor reel de los últimos 60 días: hacé otro con el mismo arranque y el mismo tipo de humor.',
          score: 2.2,
          date: best.timestamp,
        })
    }
  }
  return out.sort((a, b) => b.score - a.score)
}

export const liftLabel = (x) => (x >= 10 ? '10x+ su promedio' : `${x.toFixed(1)}x su promedio`)

function ideaFor(kind) {
  if (kind === 'Reel') return 'Copiá la estructura (gancho, ritmo, remate) con un perro Sanzo y nuestros productos.'
  if (kind === 'Carrusel') return 'Armá un carrusel con el mismo tema y orden de placas, con fotos y estilo Sanzo.'
  return 'Mirá qué muestra y cómo lo cuenta: probá la misma idea con un producto Sanzo.'
}
