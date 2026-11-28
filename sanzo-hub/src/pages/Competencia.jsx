import { useCallback, useEffect, useMemo, useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { Segmented, EmptyState } from '../components/ui/Primitives.jsx'
import { IconRefresh, IconTrash, IconPlus, IconChevronRight, IconSparkle, IconFlame, IconHeart, IconCommentBubble } from '../components/ui/Icons.jsx'
import { fmtNum, fmtDate, uid } from '../utils/format.js'
import { fetchMeta, getInstagramCached, igPost } from '../lib/meta.js'
import { competitorList, analyzeCompetitor, findOpportunities, cleanHandle, daysSince } from '../lib/competencia.js'

export function libraryUrl(q) {
  const p = new URLSearchParams({ active_status: 'active', ad_type: 'all', country: 'AR', media_type: 'all', q, search_type: 'keyword_unordered' })
  return `https://www.facebook.com/ads/library/?${p}`
}

const GROUPS = [
  { value: 'todas', label: 'Todas' },
  { value: 'directa', label: 'Argentina' },
  { value: 'inspiracion', label: 'Inspiración' },
  { value: 'viral', label: 'Virales' },
]
const PERIODS = [
  { value: '7', label: 'Semana' },
  { value: '30', label: '30 días' },
  { value: '0', label: 'Todo' },
]
const SORTS = [
  { value: 'fecha', label: 'Recientes' },
  { value: 'likes', label: 'Más likes' },
  { value: 'lift', label: 'Más arriba de su promedio' },
]
const SIZES = { S: 110, M: 160, L: 240 }
const readPref = (k, d) => {
  try {
    return localStorage.getItem(k) || d
  } catch {
    return d
  }
}
const savePref = (k, v) => {
  try {
    localStorage.setItem(k, v)
  } catch {
    /* sin almacenamiento */
  }
}
// Desde dónde la rutina puede mandar datos al hub con postMessage.
const TRUSTED_ORIGINS = ['https://www.facebook.com', 'https://www.instagram.com', 'https://www.tiktok.com']
const KINDS = ['Todo', 'Reel', 'Carrusel', 'Foto', 'Anuncio']
const KIND_LABEL = { Todo: 'Todo', Reel: 'Reels', Carrusel: 'Carruseles', Foto: 'Fotos', Anuncio: 'Anuncios' }

// Lo mismo no se vuelve a pedir por 6 horas (cada lectura son ~20 consultas a Meta;
// además Vercel la guarda 6 horas del lado del servidor).
const compCache = new Map()
function fetchCompetencia(key, force) {
  const hit = compCache.get(key)
  if (!force && hit && Date.now() - hit.at < 6 * 3600 * 1000) return hit.promise
  const promise = fetchMeta('competencia', { usuarios: key })
  compCache.set(key, { at: Date.now(), promise })
  promise.catch(() => compCache.delete(key))
  return promise
}

export default function CompetitorsTab() {
  const { state, updateSettings } = useApp()
  const list = useMemo(() => competitorList(state.settings), [state.settings])
  const handles = list.map((c) => c.ig).filter(Boolean)
  const key = handles.join(',')
  const [st, setSt] = useState({ loading: true, data: null, error: null })
  const [own, setOwn] = useState([])
  const [group, setGroup] = useState('todas')
  const [kind, setKind] = useState('Todo')
  const [brand, setBrand] = useState('')
  const [shown, setShown] = useState(48)
  const [period, setPeriod] = useState(() => readPref('comp-period', '30'))
  const [sort, setSort] = useState(() => readPref('comp-sort', 'likes'))
  const [size, setSize] = useState(() => readPref('comp-size', 'M'))
  const pick = (setter, k) => (v) => {
    setter(v)
    savePref(k, v)
  }

  const load = useCallback((force) => {
    setSt((s) => ({ ...s, loading: true, error: null }))
    fetchCompetencia(key, force === true)
      .then((data) => setSt({ loading: false, data, error: null }))
      .catch((error) => setSt({ loading: false, data: null, error }))
  }, [key])
  useEffect(() => {
    load()
  }, [load])
  useEffect(() => {
    getInstagramCached()
      .then((d) => setOwn((d.media || []).map(igPost)))
      .catch(() => {})
  }, [])

  // ---- guardar ----
  const saved = state.settings.adCompetitors || []
  const upsert = useCallback(
    (ig, patch) => {
      const h = cleanHandle(ig)
      const cur = state.settings.adCompetitors || []
      const base = list.find((c) => c.ig === h) || { name: h, ig: h, group: 'directa' }
      const exists = cur.some((c) => cleanHandle(c.ig || c.name) === h)
      const next = exists
        ? cur.map((c) => (cleanHandle(c.ig || c.name) === h ? { ...c, ig: h, ...patch, updatedAt: new Date().toISOString() } : c))
        : [...cur, { id: uid(), name: base.name, ig: h, group: base.group, notes: '', ...patch, updatedAt: new Date().toISOString() }]
      return updateSettings({ adCompetitors: next })
    },
    [state.settings.adCompetitors, list, updateSettings],
  )
  const trends = state.settings.trendReels || []
  const saveTrends = useCallback(
    (items) => {
      const clean = (items || [])
        .filter((t) => t && t.link)
        .map((t) => ({ ...t, id: t.id || t.link, savedAt: new Date().toISOString() }))
      const byId = new Map([...(state.settings.trendReels || []), ...clean].map((t) => [t.id, t]))
      const next = [...byId.values()].sort((a, b) => String(b.date || b.savedAt).localeCompare(String(a.date || a.savedAt))).slice(0, 200)
      return updateSettings({ trendReels: next })
    },
    [state.settings.trendReels, updateSettings],
  )
  const remove = (c) => {
    if (c.suggested) updateSettings({ adCompetitorsHidden: [...(state.settings.adCompetitorsHidden || []), c.ig] })
    else updateSettings({ adCompetitors: saved.filter((x) => x.id !== c.id) })
  }

  // La rutina de la mañana (Claude en el Chrome Sanzo) usa esto para guardar
  // lo que ve en la Biblioteca de anuncios y en las webs de cada marca:
  //   window.sanzoCompetencia.lista()
  //   window.sanzoCompetencia.guardar('barkargentina', { ads: [...], products: [...], adsCheckedAt })
  useEffect(() => {
    window.sanzoCompetencia = {
      lista: () => list.map(({ ig, name, group, website, ads, products, adsCheckedAt }) => ({ ig, name, group, website, ads, products, adsCheckedAt })),
      guardar: (ig, patch) => upsert(ig, patch),
      oportunidades: () => window.__sanzoOportunidades || [],
      // Reels/TikToks virales de cualquier tema que encuentra la rutina de trends:
      // [{ id, link, thumb, title, views, likes, source, date, idea }]
      guardarTendencias: (items) => saveTrends(items),
    }
    // La rutina abre el hub con window.open desde la Biblioteca de anuncios o
    // Instagram y le manda lo que leyó (las miniaturas solo se ven desde ahí).
    const onMsg = (e) => {
      if (!TRUSTED_ORIGINS.includes(e.origin) || !e.data || typeof e.data !== 'object') return
      if (e.data.type === 'sanzo-guardar' && e.data.ig) upsert(e.data.ig, e.data.patch || {})
      if (e.data.type === 'sanzo-tendencias' && Array.isArray(e.data.items)) saveTrends(e.data.items)
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [list, upsert, saveTrends])

  // ---- análisis ----
  const brands = useMemo(() => {
    const byHandle = Object.fromEntries((st.data?.competitors || []).map((c) => [String(c.username || '').toLowerCase(), c]))
    return list.map((c) => {
      const ig = byHandle[c.ig] || {}
      const a = analyzeCompetitor({ ...ig, name: c.name || ig.name, username: ig.username || c.ig })
      return { ...c, ...a, name: c.name || ig.name || c.ig, group: c.group || (a.argentina ? 'directa' : 'inspiracion'), igError: ig._error, website: c.website || ig.website }
    })
  }, [list, st.data])
  const visibleBrands = brands.filter((b) => group === 'todas' || b.group === group)
  const opps = useMemo(() => findOpportunities({ brands: visibleBrands, own: group === 'todas' ? own : [] }), [visibleBrands, own, group])
  useEffect(() => {
    window.__sanzoOportunidades = opps.map(({ thumb, video, ...o }) => o)
  }, [opps])

  const gallery = useMemo(() => {
    const items = []
    for (const b of visibleBrands) {
      if (brand && b.ig !== brand) continue
      for (const m of b.media) items.push({ ...m, brand: b.name, handle: b.username })
      for (const ad of b.ads || [])
        items.push({ id: `ad-${b.ig}-${ad.id || ad.link}`, kind: 'Anuncio', thumb: ad.thumb, permalink: ad.link, caption: ad.text, timestamp: ad.startedAt, brand: b.name, handle: b.ig, adDays: daysSince(ad.startedAt) })
    }
    const maxAge = Number(period)
    return items
      .filter((m) => kind === 'Todo' || m.kind === kind)
      .filter((m) => !maxAge || (m.kind === 'Anuncio' ? true : daysSince(m.timestamp) <= maxAge))
      .sort((a, b) =>
        sort === 'likes' ? (b.likes || 0) - (a.likes || 0) : sort === 'lift' ? (b.giveaway ? 0 : b.lift || 0) - (a.giveaway ? 0 : a.lift || 0) : String(b.timestamp || '').localeCompare(String(a.timestamp || '')),
      )
  }, [visibleBrands, brand, kind, period, sort])
  const trendItems = useMemo(() => {
    const maxAge = Number(period)
    return trends
      .filter((t) => !maxAge || daysSince(t.date || t.savedAt) <= maxAge)
      .sort((a, b) => (sort === 'fecha' ? String(b.date || '').localeCompare(String(a.date || '')) : (b.views || b.likes || 0) - (a.views || a.likes || 0)))
  }, [trends, period, sort])

  return (
    <div>
      <div className="row between mt-8" style={{ flexWrap: 'wrap', gap: 8 }}>
        <Segmented options={GROUPS} value={group} onChange={setGroup} />
        <button className="btn btn-ghost btn-sm" onClick={() => load(true)} disabled={st.loading}>
          <IconRefresh /> {st.loading ? 'Cargando…' : 'Actualizar'}
        </button>
      </div>
      {st.error && (
        <div className="card mt-16">
          <div className="card-title">No se pudo leer Instagram de la competencia</div>
          <p className="muted small">{st.error.message}</p>
        </div>
      )}

      {/* ---------- Oportunidades ---------- */}
      <div className="row mt-24" style={{ gap: 8, alignItems: 'baseline' }}>
        <IconSparkle style={{ width: 18, height: 18, color: 'var(--terra)' }} />
        <h3 className="section-title" style={{ margin: 0 }}>Oportunidades</h3>
        <span className="muted small">Lo que les está funcionando y se puede hacer con Sanzo</span>
      </div>
      {st.loading && !st.data ? (
        <p className="muted small mt-8">Buscando qué les anda mejor…</p>
      ) : opps.length === 0 ? (
        <EmptyState compact title="Sin oportunidades claras todavía" text="Aparecen cuando una marca tiene un post que rindió el doble de lo normal o un anuncio activo hace más de 2 semanas." />
      ) : (
        <div className="comp-grid mt-12">
          {opps.slice(0, 8).map((o) => (
            <a className="opp-card" key={o.key} href={o.link} target="_blank" rel="noreferrer">
              <Thumb src={o.thumb} video={o.video} kind={o.kind} badge={o.badge} hot />
              <div className="opp-body">
                <div className="row between" style={{ gap: 6 }}>
                  <span className="small strong">{o.type === 'own' ? 'Tuyo' : o.brand}</span>
                  <span className={`chip ${o.type === 'ad' ? 'terra' : o.type === 'own' ? 'green' : 'beige'}`}>{o.kind}</span>
                </div>
                <div className="opp-title">{o.title}</div>
                <div className="muted small">{o.why}</div>
                <div className="opp-idea">
                  <strong>Para Sanzo:</strong> {o.idea}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* ---------- Filtros de las galerías ---------- */}
      <div className="comp-filters mt-24">
        <Segmented options={PERIODS} value={period} onChange={pick(setPeriod, 'comp-period')} />
        <Segmented options={SORTS} value={sort} onChange={pick(setSort, 'comp-sort')} />
        <div className="row" style={{ gap: 4 }} title="Tamaño de las miniaturas">
          {['S', 'M', 'L'].map((k) => (
            <button key={k} type="button" className={`chip chip-btn ${size === k ? 'ink' : 'outline'}`} onClick={() => pick(setSize, 'comp-size')(k)}>
              {k === 'S' ? 'Chico' : k === 'M' ? 'Mediano' : 'Grande'}
            </button>
          ))}
        </div>
      </div>

      {/* ---------- Lo más pegado de la plataforma ---------- */}
      <div className="row mt-24" style={{ gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
        <h3 className="section-title">Lo más pegado de la plataforma</h3>
        <span className="muted small">Reels y TikToks virales de cualquier tema, para adaptar a Sanzo. Los suma la rutina de trends cada mañana</span>
      </div>
      {trendItems.length === 0 ? (
        <p className="muted small mt-8">Todavía no hay virales cargados en este período. Mientras tanto, la vista "Virales" de arriba muestra las cuentas más grandes de Instagram.</p>
      ) : (
        <div className="gallery-grid mt-12" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${SIZES[size]}px, 1fr))` }}>
          {trendItems.slice(0, shown).map((t) => (
            <a key={t.id} className="gallery-item" href={t.link} target="_blank" rel="noreferrer" title={t.idea || t.title || ''}>
              <Thumb src={t.thumb} kind={t.source || 'Reel'} badge={t.views ? `${fmtNum(t.views)} vistas` : t.likes ? `${fmtNum(t.likes)} likes` : null} hot />
              <div className="gallery-meta">
                <span className="strong">{t.title || t.source}</span>
                <span>{t.date ? fmtDate(String(t.date).slice(0, 10)) : ''}</span>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* ---------- Galería ---------- */}
      <div className="row between mt-24" style={{ flexWrap: 'wrap', gap: 8 }}>
        <h3 className="section-title" style={{ margin: 0 }}>Lo que están publicando</h3>
        <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
          {KINDS.map((k) => (
            <button key={k} type="button" className={`chip chip-btn ${kind === k ? 'ink' : 'outline'}`} onClick={() => setKind(k)}>
              {KIND_LABEL[k]}
            </button>
          ))}
          <select className="input" style={{ width: 'auto', padding: '4px 8px', fontSize: 12 }} value={brand} onChange={(e) => setBrand(e.target.value)}>
            <option value="">Todas las marcas</option>
            {visibleBrands.map((b) => (
              <option key={b.ig || b.id} value={b.ig}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      {gallery.length === 0 ? (
        <p className="muted small mt-8">{kind === 'Anuncio' ? 'Todavía no hay anuncios cargados. Los carga la rutina de la mañana desde la Biblioteca de anuncios.' : 'Nada para mostrar con estos filtros. Probá con "Todo" en el período.'}</p>
      ) : (
        <div className="gallery-grid mt-12" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${SIZES[size]}px, 1fr))` }}>
          {gallery.slice(0, shown).map((m) => (
            <a key={m.id} className="gallery-item" href={m.permalink} target="_blank" rel="noreferrer" title={(m.caption || '').slice(0, 200)}>
              <Thumb src={m.thumb} video={m.video} kind={m.kind} badge={m.adDays != null ? `${m.adDays} días activo` : m.giveaway ? 'Sorteo' : m.lift >= 2 ? (m.lift >= 10 ? '10x+' : `${m.lift.toFixed(1)}x`) : null} hot={(!m.giveaway && m.lift >= 2) || m.adDays >= 14} />
              <div className="gallery-meta">
                <span className="strong">{m.brand}</span>
                {m.kind !== 'Anuncio' ? (
                  <span className="row" style={{ gap: 6 }}>
                    <span className="row" style={{ gap: 2 }}>
                      <IconHeart /> {fmtNum(m.likes)}
                    </span>
                    <span className="row" style={{ gap: 2 }}>
                      <IconCommentBubble /> {fmtNum(m.comments)}
                    </span>
                  </span>
                ) : (
                  <span>{m.timestamp ? `desde ${fmtDate(m.timestamp.slice(0, 10))}` : ''}</span>
                )}
              </div>
            </a>
          ))}
        </div>
      )}
      {gallery.length > shown && (
        <div className="mt-12" style={{ textAlign: 'center' }}>
          <button className="btn btn-soft btn-sm" onClick={() => setShown((n) => n + 48)}>
            Ver más ({gallery.length - shown})
          </button>
        </div>
      )}

      {/* ---------- Marcas ---------- */}
      <h3 className="section-title mt-24">Marcas que seguimos</h3>
      <AddBrand onAdd={(c) => upsert(c.ig, { name: c.name || c.ig, group: c.group, website: c.website || undefined })} />
      <div className="comp-grid mt-12">
        {visibleBrands.map((b) => (
          <BrandCard key={b.id || b.ig} b={b} onRemove={() => remove(b)} />
        ))}
      </div>
    </div>
  )
}

function Thumb({ src, video, kind, badge, hot }) {
  const [broken, setBroken] = useState(false)
  return (
    <div className="comp-thumb">
      {src && !broken ? (
        <img src={src} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setBroken(true)} />
      ) : video && !broken ? (
        <video src={`${video}#t=0.5`} muted preload="metadata" playsInline onError={() => setBroken(true)} />
      ) : (
        <div className="comp-thumb-empty">{kind}</div>
      )}
      {badge && (
        <span className={`comp-badge ${hot ? 'hot' : ''}`}>
          {hot && <IconFlame />} {badge}
        </span>
      )}
      {kind && kind !== 'Foto' && <span className="comp-kind">{kind}</span>}
    </div>
  )
}

function BrandCard({ b, onRemove }) {
  const [open, setOpen] = useState(false)
  const site = b.website ? b.website.replace(/^https?:\/\//, '').replace(/\/$/, '') : ''
  const products = b.products || []
  return (
    <div className="card">
      <div className="row" style={{ gap: 10, alignItems: 'center' }}>
        {b.profile_picture_url ? (
          <img src={b.profile_picture_url} alt="" referrerPolicy="no-referrer" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
        ) : (
          <div className="comp-avatar">{(b.name || '?').slice(0, 1).toUpperCase()}</div>
        )}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="card-title" style={{ lineHeight: 1.2 }}>{b.name}</div>
          <div className="muted small">@{b.ig || '—'}</div>
        </div>
        <span className={`chip ${b.group === 'directa' ? 'terra' : 'outline'}`} style={{ flexShrink: 0 }}>{b.group === 'directa' ? 'AR' : b.group === 'viral' ? 'Viral' : 'Inspira'}</span>
      </div>
      {b.igError ? (
        <p className="muted small mt-8">No se pudo leer su Instagram (puede ser una cuenta personal o el usuario cambió).</p>
      ) : (
        <div className="comp-stats mt-12">
          <div>
            <strong>{b.followers_count ? fmtNum(b.followers_count) : '—'}</strong>
            <span>seguidores</span>
          </div>
          <div>
            <strong>{b.media?.length ? b.postsPerWeek.toFixed(1) : '—'}</strong>
            <span>posts/semana</span>
          </div>
          <div>
            <strong>{b.media?.length ? fmtNum(Math.round(b.avgLikes)) : '—'}</strong>
            <span>likes promedio</span>
          </div>
          <div>
            <strong>{b.bestKind || '—'}</strong>
            <span>lo que mejor le anda</span>
          </div>
        </div>
      )}
      <div className="row mt-12" style={{ gap: 6, flexWrap: 'wrap' }}>
        {b.ig && (
          <a className="btn btn-soft btn-sm" href={`https://www.instagram.com/${b.ig}/`} target="_blank" rel="noreferrer">
            Instagram
          </a>
        )}
        {site && (
          <a className="btn btn-soft btn-sm" href={b.website.startsWith('http') ? b.website : `https://${b.website}`} target="_blank" rel="noreferrer">
            Web
          </a>
        )}
        <a className="btn btn-soft btn-sm" href={libraryUrl(b.name)} target="_blank" rel="noreferrer">
          Anuncios {b.ads?.length ? `(${b.ads.length})` : ''} <IconChevronRight />
        </a>
        <button className="btn-icon danger" title="Dejar de seguir" onClick={onRemove} type="button" style={{ marginLeft: 'auto' }}>
          <IconTrash />
        </button>
      </div>
      {(b.adsCheckedAt || products.length > 0) && (
        <div className="muted small mt-8">
          {b.adsCheckedAt && `Anuncios revisados el ${fmtDate(b.adsCheckedAt.slice(0, 10))}. `}
          {products.length > 0 && (
            <button type="button" className="link-btn" onClick={() => setOpen((v) => !v)}>
              {open ? 'Ocultar precios' : `Ver ${products.length} precios de su web`}
            </button>
          )}
        </div>
      )}
      {open && (
        <ul className="comp-prices mt-8">
          {products.map((p, i) => (
            <li key={i}>
              <span>{p.name}</span>
              <span>
                {p.prevPrice && p.prevPrice !== p.price && <s className="muted">${fmtNum(p.prevPrice)}</s>} <strong>${fmtNum(p.price)}</strong>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function AddBrand({ onAdd }) {
  const [ig, setIg] = useState('')
  const [website, setWebsite] = useState('')
  const [group, setGroup] = useState('directa')
  const submit = (e) => {
    e.preventDefault()
    const h = cleanHandle(ig)
    if (!/^[a-z0-9._]{1,30}$/.test(h)) return
    onAdd({ ig: h, name: h, website: website.trim(), group })
    setIg('')
    setWebsite('')
  }
  return (
    <form className="row mt-8" style={{ gap: 8, flexWrap: 'wrap' }} onSubmit={submit}>
      <input className="input" style={{ maxWidth: 220 }} placeholder="@usuario de Instagram" value={ig} onChange={(e) => setIg(e.target.value)} />
      <input className="input" style={{ maxWidth: 220 }} placeholder="Web (opcional)" value={website} onChange={(e) => setWebsite(e.target.value)} />
      <select className="input" style={{ width: 'auto' }} value={group} onChange={(e) => setGroup(e.target.value)}>
        <option value="directa">Argentina</option>
        <option value="inspiracion">Inspiración</option>
        <option value="viral">Viral (cualquier tema)</option>
      </select>
      <button className="btn btn-primary btn-sm" type="submit">
        <IconPlus /> Sumar marca
      </button>
    </form>
  )
}
