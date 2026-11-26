import { useCallback, useEffect, useMemo, useState } from 'react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { useApp } from '../context/AppContext.jsx'
import { PageHeader, Segmented, ChartTooltip, EmptyState } from '../components/ui/Primitives.jsx'
import { IconRefresh, IconAlert, IconSparkle, IconTrash, IconPlus, IconEye, IconChevronRight } from '../components/ui/Icons.jsx'
import { fmtARS, fmtNum, fmtPct, fmtDecimal, fmtDate, fmtAxis, uid } from '../utils/format.js'
import { fetchMeta, summarize, suggestionsFor, biggestDrop, pctChange, igPost, contentSuggestions } from '../lib/meta.js'
import { saleTotal } from '../utils/calc.js'

const axisTick = { fontSize: 11, fill: '#8a7a6d' }
const gridProps = { stroke: '#EFE6DB', vertical: false }
const PERIODS = [
  { value: '7', label: '7 días' },
  { value: '14', label: '14 días' },
  { value: '30', label: '30 días' },
]
const isoDaysAgo = (n) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10)

export default function Ads() {
  const [tab, setTab] = useState('ads')
  return (
    <div>
      <PageHeader eyebrow="Meta · solo lectura" title="Ads y estadísticas" subtitle="Lo que pasa con los anuncios, las publicaciones de Instagram y la competencia.">
        <Segmented
          options={[
            { value: 'ads', label: 'Anuncios' },
            { value: 'ig', label: 'Instagram' },
            { value: 'comp', label: 'Competencia' },
          ]}
          value={tab}
          onChange={setTab}
        />
      </PageHeader>
      {tab === 'ads' && <AdsTab />}
      {tab === 'ig' && <InstagramTab />}
      {tab === 'comp' && <CompetitorsTab />}
    </div>
  )
}

// ---------- carga de datos ----------
function useMeta(tipo, params) {
  const key = JSON.stringify(params)
  const [st, setSt] = useState({ loading: true, data: null, error: null })
  const load = useCallback(() => {
    setSt((s) => ({ ...s, loading: true, error: null }))
    fetchMeta(tipo, JSON.parse(key))
      .then((data) => setSt({ loading: false, data, error: null }))
      .catch((error) => setSt({ loading: false, data: null, error }))
  }, [tipo, key])
  useEffect(() => {
    load()
  }, [load])
  return { ...st, reload: load }
}

function MetaError({ error, onRetry }) {
  const noToken = ['sin_token', 'token_invalido', 'sin_api'].includes(error.code)
  return (
    <div className="card">
      <div className="card-head">
        <div>
          <div className="card-title">{noToken ? 'Falta conectar Meta' : 'No se pudieron traer los datos'}</div>
          <div className="card-sub">{error.message}</div>
        </div>
        <button className="btn btn-soft btn-sm" onClick={onRetry}>
          <IconRefresh /> Reintentar
        </button>
      </div>
      {noToken && (
        <p className="muted small">
          El hub lee Meta con un token de usuario del sistema (solo lectura). Va en la variable <code>META_ACCESS_TOKEN</code> de Vercel y en el
          archivo <code>.env</code> de la compu. Si ya está cargado y aparece este cartel, puede haber vencido o faltar algún permiso.
        </p>
      )}
    </div>
  )
}

function Kpi({ label, value, foot, tone = '', delta = null, upIsGood = true }) {
  const good = delta === null ? null : delta >= 0 === upIsGood
  return (
    <div className="card kpi">
      <div className="kpi-label">{label}</div>
      <div>
        <div className={`kpi-value sm ${tone}`}>
          {value}
          {delta !== null && Math.abs(delta) >= 1 && (
            <span className="small" style={{ marginLeft: 8, fontSize: 12, color: good ? '#6B8F5E' : '#B5533C' }} title="Contra el período anterior de la misma duración">
              {delta > 0 ? '▲' : '▼'} {fmtDecimal(Math.abs(delta), 0)}%
            </span>
          )}
        </div>
        {foot && <div className="kpi-foot">{foot}</div>}
      </div>
    </div>
  )
}

// ---------- Anuncios ----------
function AdsTab() {
  const [period, setPeriod] = useState('7')
  const params = useMemo(() => ({ desde: isoDaysAgo(Number(period) - 1), hasta: isoDaysAgo(0) }), [period])
  const { loading, data, error, reload } = useMeta('ads', params)
  const [selected, setSelected] = useState(null)

  const { state } = useApp()
  const total = useMemo(() => summarize(data?.total), [data])
  const prev = useMemo(() => summarize(data?.previous), [data])
  const d = (k) => (total && prev ? pctChange(total[k], prev[k]) : null)
  // Ventas reales cargadas en el hub en el mismo período (no dependen del píxel).
  const hubSales = useMemo(() => {
    if (!data) return null
    const inRange = (state.sales || []).filter((s) => s.date >= data.range.since && s.date <= data.range.until)
    const web = inRange.filter((s) => s.channel === 'Tienda online')
    // 1 venta por persona por día (un combo cuenta como 1)
    const key = (s) => `${s.date}|${(s.clientHandle || s.clientName || s.id || '').toLowerCase()}`
    return {
      all: new Set(inRange.map(key)).size,
      allARS: inRange.reduce((a, s) => a + saleTotal(s), 0),
      web: new Set(web.map(key)).size,
      webARS: web.reduce((a, s) => a + saleTotal(s), 0),
    }
  }, [data, state.sales])
  const placements = useMemo(
    () =>
      (data?.placements || [])
        .map((r) => ({ name: placementLabel(r.publisher_platform, r.platform_position), s: summarize(r) }))
        .filter((r) => r.s.impressions > 0)
        .sort((a, b) => b.s.spend - a.s.spend),
    [data],
  )
  const demo = useMemo(() => {
    const ages = {}
    for (const r of data?.demo || []) {
      const s = summarize(r)
      const row = (ages[r.age] ||= { age: r.age, Mujeres: 0, Hombres: 0, Otros: 0, clics: 0, compras: 0 })
      row[r.gender === 'female' ? 'Mujeres' : r.gender === 'male' ? 'Hombres' : 'Otros'] += s.reach
      row.clics += s.linkClicks
      row.compras += s.purchases
    }
    return Object.values(ages).sort((a, b) => a.age.localeCompare(b.age))
  }, [data])
  const daily = useMemo(
    () =>
      (data?.daily || []).map((d) => {
        const s = summarize(d)
        return { label: fmtDate(d.date_start).slice(0, 5), gasto: s.spend, clics: s.linkClicks, compras: s.purchases }
      }),
    [data],
  )
  const ads = useMemo(() => {
    const thumbs = Object.fromEntries((data?.ads || []).map((a) => [a.id, a]))
    return (data?.byAd || [])
      .map((r) => ({ id: r.ad_id, name: r.ad_name, campaign: r.campaign_name, adset: r.adset_name, status: thumbs[r.ad_id]?.effective_status, thumb: thumbs[r.ad_id]?.creative?.thumbnail_url, s: summarize(r) }))
      .sort((a, b) => b.s.spend - a.s.spend)
  }, [data])
  const tips = useMemo(() => suggestionsFor(total, ads), [total, ads])
  const current = ads.find((a) => a.id === selected) || ads.find((a) => a.s.curve.length) || null

  return (
    <div>
      <div className="row between mt-8">
        <Segmented options={PERIODS} value={period} onChange={setPeriod} />
        <button className="btn btn-ghost btn-sm" onClick={reload} disabled={loading}>
          <IconRefresh /> {loading ? 'Cargando…' : 'Actualizar'}
        </button>
      </div>

      {error && <div className="mt-16"><MetaError error={error} onRetry={reload} /></div>}

      {data && (
        <>
          <div className="grid grid-kpi mt-16">
            <Kpi label="Gastado" value={`$ ${fmtNum(total?.spend)}`} foot={`${fmtDate(data.range.since)} al ${fmtDate(data.range.until)}`} delta={d('spend')} upIsGood={false} />
            <Kpi label="Alcance" value={fmtNum(total?.reach)} foot={`${fmtNum(total?.impressions)} impresiones · frecuencia ${fmtDecimal(total?.frequency, 1)}`} delta={d('reach')} />
            <Kpi label="Clics al enlace" value={fmtNum(total?.linkClicks)} foot={`CTR ${fmtPct(total?.ctr, 2)} · ${fmtARS(total?.cpc)} por clic`} delta={d('linkClicks')} />
            <Kpi label="Visitas a la web" value={fmtNum(total?.landing)} foot={`${fmtNum(total?.addToCart)} agregaron al carrito`} delta={d('landing')} />
            <Kpi label="Compras (píxel)" value={fmtNum(total?.purchases)} foot={total?.purchases ? `${fmtARS(total.costPerPurchase)} cada una` : 'Las que Meta atribuye al anuncio'} tone={total?.purchases ? 'pos' : ''} delta={d('purchases')} />
            <Kpi label="ROAS" value={total?.purchases ? fmtDecimal(total.roas, 2) : '—'} foot={total?.revenue ? `Vendido ${fmtARS(total.revenue)}` : `CPM ${fmtARS(total?.cpm)}`} tone={total?.roas >= 1 ? 'pos' : ''} />
          </div>
          {prev && prev.spend > 0 && (
            <div className="muted small mt-8">Las flechitas comparan con {fmtDate(data.previousRange.since)} al {fmtDate(data.previousRange.until)}.</div>
          )}

          {hubSales && (
            <div className="card beige mt-24">
              <div className="card-head">
                <div>
                  <div className="card-title">Contra las ventas reales del hub</div>
                  <div className="card-sub">Lo cargado en Ventas en el mismo período, sin depender del píxel de Meta (1 venta por persona por día)</div>
                </div>
              </div>
              <div className="grid grid-3">
                <div>
                  <div className="kpi-label">Ventas por la web</div>
                  <div className="kpi-value sm">{fmtNum(hubSales.web)}</div>
                  <div className="kpi-foot">{fmtARS(hubSales.webARS)} vendidos</div>
                </div>
                <div>
                  <div className="kpi-label">Costo de ads por venta web</div>
                  <div className="kpi-value sm">{hubSales.web ? fmtARS(total.spend / hubSales.web) : '—'}</div>
                  <div className="kpi-foot">Gasto en ads dividido ventas web</div>
                </div>
                <div>
                  <div className="kpi-label">Todas las ventas del período</div>
                  <div className="kpi-value sm">{fmtNum(hubSales.all)}</div>
                  <div className="kpi-foot">
                    {fmtARS(hubSales.allARS)} · ads = {hubSales.allARS ? fmtPct((total.spend / hubSales.allARS) * 100, 0) : '—'} de lo vendido
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-3 mt-24">
            <div className="card span-2">
              <div className="card-head">
                <div>
                  <div className="card-title">Gasto por día</div>
                  <div className="card-sub">Cuánto se invirtió cada día del período</div>
                </div>
              </div>
              {daily.length ? (
                <div className="chart-box" style={{ height: 220 }}>
                  <ResponsiveContainer>
                    <AreaChart data={daily} margin={{ top: 10, right: 6, left: 0, bottom: 0 }}>
                      <CartesianGrid {...gridProps} />
                      <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
                      <YAxis tick={axisTick} axisLine={false} tickLine={false} tickFormatter={fmtAxis} width={56} />
                      <Tooltip content={<ChartTooltip formatter={(v, n) => (n === 'Gasto' ? fmtARS(v) : fmtNum(v))} />} />
                      <Area type="monotone" dataKey="gasto" name="Gasto" stroke="#956037" strokeWidth={2.2} fill="#956037" fillOpacity={0.12} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState compact title="Sin gasto en este período" text="Cuando la campaña empiece a gastar, acá aparece día por día." />
              )}
            </div>
            <div className="card">
              <div className="card-head">
                <div>
                  <div className="card-title">Campañas</div>
                  <div className="card-sub">Todas las de la cuenta {data.account?.name}</div>
                </div>
              </div>
              <div className="list">
                {data.campaigns.map((c) => (
                  <div className="list-item" key={c.id}>
                    <div className="body">
                      <div className="title">{c.name}</div>
                      <div className="sub">
                        {statusLabel(c.effective_status)}
                        {c.daily_budget ? ` · ${fmtARS(Number(c.daily_budget) / 100)} por día` : ''}
                        {c.lifetime_budget ? ` · ${fmtARS(Number(c.lifetime_budget) / 100)} en total` : ''}
                      </div>
                    </div>
                  </div>
                ))}
                {data.campaigns.length === 0 && <div className="muted small">No hay campañas.</div>}
              </div>
            </div>
          </div>

          <div className="card mt-24">
            <div className="card-head">
              <div>
                <div className="card-title">
                  <IconSparkle style={{ width: 16, height: 16 }} /> Sugerencias
                </div>
                <div className="card-sub">Salen solas de los números del período</div>
              </div>
            </div>
            {tips.length ? (
              <div className="list">
                {tips.map((t, i) => (
                  <div className="list-item" key={i}>
                    <div className={`icon ${t.level === 'warn' ? 'expense' : 'sale'}`}>{t.level === 'warn' ? <IconAlert /> : <IconSparkle />}</div>
                    <div className="body">
                      <div className="title" style={{ whiteSpace: 'normal', fontWeight: 500 }}>{t.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="muted small">Todavía no hay datos suficientes para sugerir algo.</div>
            )}
          </div>

          <div className="card mt-24">
            <div className="card-head">
              <div>
                <div className="card-title">Anuncios</div>
                <div className="card-sub">Tocá uno con video para ver en qué segundo se va la gente</div>
              </div>
            </div>
            {ads.length ? (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Anuncio</th>
                      <th className="num">Gastado</th>
                      <th className="num">Alcance</th>
                      <th className="num">CTR</th>
                      <th className="num">Costo/clic</th>
                      <th className="num">Compras</th>
                      <th className="num" title="Porcentaje de impresiones que miraron 3 segundos o más">Enganche 3s</th>
                      <th className="num">Visto prom.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ads.map((a) => (
                      <tr key={a.id} onClick={() => setSelected(a.id)} style={{ cursor: 'pointer', background: current?.id === a.id ? 'var(--beige-50, #F7F1EA)' : undefined }}>
                        <td>
                          <div className="row" style={{ gap: 10, flexWrap: 'nowrap' }}>
                            {a.thumb && <img src={a.thumb} alt="" width={36} height={36} style={{ borderRadius: 6, objectFit: 'cover' }} />}
                            <div>
                              <div>{a.name}</div>
                              <div className="muted small">{statusLabel(a.status)} · {a.adset}</div>
                            </div>
                          </div>
                        </td>
                        <td className="num">{fmtARS(a.s.spend)}</td>
                        <td className="num">{fmtNum(a.s.reach)}</td>
                        <td className="num">{fmtPct(a.s.ctr, 2)}</td>
                        <td className="num">{a.s.cpc ? fmtARS(a.s.cpc) : '—'}</td>
                        <td className="num">{fmtNum(a.s.purchases)}</td>
                        <td className="num">{a.s.plays3s ? fmtPct(a.s.hookRate, 0) : '—'}</td>
                        <td className="num">{a.s.avgWatch ? `${fmtDecimal(a.s.avgWatch, 1)} s` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState compact title="Sin datos por anuncio" text="Meta todavía no informó números para este período." />
            )}
          </div>

          {current && current.s.curve.length > 0 && <RetentionCard ad={current} />}

          {(placements.length > 0 || demo.length > 0) && (
            <div className="grid grid-2 mt-24">
              <div className="card" style={{ minWidth: 0 }}>
                <div className="card-head">
                  <div>
                    <div className="card-title">Dónde se vio</div>
                    <div className="card-sub">Por ubicación: qué rinde más, Reels, Feed o Historias</div>
                  </div>
                </div>
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Ubicación</th>
                        <th className="num">Gastado</th>
                        <th className="num">CTR</th>
                        <th className="num">Costo/clic</th>
                        <th className="num">Compras</th>
                      </tr>
                    </thead>
                    <tbody>
                      {placements.map((p) => (
                        <tr key={p.name}>
                          <td>{p.name}</td>
                          <td className="num">{fmtARS(p.s.spend)}</td>
                          <td className="num">{fmtPct(p.s.ctr, 2)}</td>
                          <td className="num">{p.s.linkClicks ? fmtARS(p.s.spend / p.s.linkClicks) : '—'}</td>
                          <td className="num">{fmtNum(p.s.purchases)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="card" style={{ minWidth: 0 }}>
                <div className="card-head">
                  <div>
                    <div className="card-title">A quién le llegó</div>
                    <div className="card-sub">Alcance por edad y sexo</div>
                  </div>
                </div>
                <div className="chart-box" style={{ height: 240 }}>
                  <ResponsiveContainer>
                    <BarChart data={demo} margin={{ top: 10, right: 6, left: 0, bottom: 0 }}>
                      <CartesianGrid {...gridProps} />
                      <XAxis dataKey="age" tick={axisTick} axisLine={false} tickLine={false} />
                      <YAxis tick={axisTick} axisLine={false} tickLine={false} width={40} />
                      <Tooltip content={<ChartTooltip formatter={(v) => fmtNum(v)} />} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="Mujeres" stackId="a" fill="#956037" isAnimationActive={false} />
                      <Bar dataKey="Hombres" stackId="a" fill="#D5B9A2" isAnimationActive={false} />
                      <Bar dataKey="Otros" stackId="a" fill="#8A7A6D" radius={[6, 6, 0, 0]} isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function RetentionCard({ ad }) {
  const drop = biggestDrop(ad.s.curve)
  const steps = [
    { label: '25%', v: ad.s.p25 },
    { label: '50%', v: ad.s.p50 },
    { label: '75%', v: ad.s.p75 },
    { label: '100%', v: ad.s.p100 },
  ]
  return (
    <div className="grid grid-3 mt-24">
      <div className="card span-2">
        <div className="card-head">
          <div>
            <div className="card-title">Retención del video · {ad.name}</div>
            <div className="card-sub">
              Qué porcentaje sigue mirando en cada segundo
              {drop ? ` · la mayor fuga es en el segundo ${drop.second} (−${fmtDecimal(drop.drop, 0)} puntos)` : ''}
            </div>
          </div>
        </div>
        <div className="chart-box" style={{ height: 240 }}>
          <ResponsiveContainer>
            <AreaChart data={ad.s.curve} margin={{ top: 10, right: 6, left: 0, bottom: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} interval={1} />
              <YAxis tick={axisTick} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} width={40} />
              <Tooltip content={<ChartTooltip formatter={(v) => fmtPct(v, 0)} />} />
              <Area type="monotone" dataKey="pct" name="Siguen mirando" stroke="#6B8F5E" strokeWidth={2.2} fill="#6B8F5E" fillOpacity={0.15} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="card">
        <div className="card-head">
          <div>
            <div className="card-title">Hasta dónde llegan</div>
            <div className="card-sub">Reproducciones que pasaron cada parte del video</div>
          </div>
        </div>
        <div className="list">
          <div className="list-item">
            <div className="body"><div className="title">Miraron 3 segundos</div></div>
            <div className="amount">{fmtNum(ad.s.plays3s)}</div>
          </div>
          {steps.map((s) => (
            <div className="list-item" key={s.label}>
              <div className="body"><div className="title">Llegaron al {s.label}</div></div>
              <div className="amount">{fmtNum(s.v)}</div>
            </div>
          ))}
          <div className="list-item">
            <div className="body"><div className="title">Tiempo promedio</div></div>
            <div className="amount">{fmtDecimal(ad.s.avgWatch, 1)} s</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function placementLabel(platform, position) {
  const plat = { instagram: 'Instagram', facebook: 'Facebook', messenger: 'Messenger', audience_network: 'Audience Network', threads: 'Threads' }[platform] || platform
  const pos =
    {
      instagram_reels: 'Reels',
      facebook_reels: 'Reels',
      feed: 'Feed',
      instagram_stories: 'Historias',
      facebook_stories: 'Historias',
      instagram_explore: 'Explorar',
      instagram_explore_grid_home: 'Explorar',
      instagram_profile_feed: 'Perfil',
      marketplace: 'Marketplace',
      video_feeds: 'Videos',
      search: 'Búsqueda',
      an_classic: 'Apps',
      rewarded_video: 'Videos con premio',
    }[position] || (position || '').replaceAll('_', ' ')
  return `${plat} · ${pos}`
}

function statusLabel(s) {
  return (
    {
      ACTIVE: 'Activa',
      PAUSED: 'Pausada',
      CAMPAIGN_PAUSED: 'Campaña pausada',
      ADSET_PAUSED: 'Conjunto pausado',
      IN_PROCESS: 'En revisión',
      PENDING_REVIEW: 'En revisión',
      DISAPPROVED: 'Rechazada',
      WITH_ISSUES: 'Con problemas',
      ARCHIVED: 'Archivada',
      DELETED: 'Borrada',
    }[s] || s || '—'
  )
}

// ---------- Instagram ----------

function InstagramTab() {
  const [period, setPeriod] = useState('30')
  const params = useMemo(() => ({ cantidad: '30', desde: isoDaysAgo(Number(period) - 1), hasta: isoDaysAgo(0) }), [period])
  const { loading, data, error, reload } = useMeta('instagram', params)
  const posts = useMemo(() => (data?.media || []).map(igPost), [data])
  const acc = data?.account
  const reachDaily = (acc?.daily?.reach || []).map((r) => ({ label: fmtDate(r.date).slice(0, 5), alcance: Number(r.value) || 0 }))
  const newFollowers = (acc?.daily?.followers || []).reduce((a, r) => a + (Number(r.value) || 0), 0)
  const tips = useMemo(() => contentSuggestions(posts, acc), [posts, acc])
  const t = acc?.totals || {}
  const reels = posts.filter((p) => p.kind === 'Reel')
  const avg = (arr, k) => (arr.length ? arr.reduce((a, p) => a + p[k], 0) / arr.length : 0)
  const chart = reels
    .slice()
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    .map((p) => ({ label: fmtDate(p.timestamp.slice(0, 10)).slice(0, 5), segundos: Number(p.avgWatch.toFixed(1)), vistas: p.views }))

  return (
    <div>
      <div className="row between mt-8">
        <div className="row" style={{ gap: 12 }}>
          <Segmented options={PERIODS} value={period} onChange={setPeriod} />
          <span className="muted small">{data?.profile ? `@${data.profile.username}` : ''}</span>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={reload} disabled={loading}>
          <IconRefresh /> {loading ? 'Cargando…' : 'Actualizar'}
        </button>
      </div>

      {error && <div className="mt-16"><MetaError error={error} onRetry={reload} /></div>}

      {data && (
        <>
          <div className="grid grid-kpi mt-16">
            <Kpi label="Seguidores" value={fmtNum(data.profile.followers_count)} foot={acc?.daily?.followers ? `${newFollowers >= 0 ? '+' : ''}${fmtNum(newFollowers)} en el período` : `${fmtNum(data.profile.media_count)} publicaciones en total`} />
            <Kpi label="Visitas al perfil" value={t.profile_views != null ? fmtNum(t.profile_views) : '—'} foot="En el período" />
            <Kpi label="Clics al link de la web" value={t.website_clicks != null ? fmtNum(t.website_clicks) : '—'} foot={t.profile_views ? `${fmtPct((t.website_clicks / t.profile_views) * 100, 1)} de las visitas al perfil` : 'Desde la bio'} />
            <Kpi label="Cuentas que interactuaron" value={t.accounts_engaged != null ? fmtNum(t.accounts_engaged) : '—'} foot={t.total_interactions != null ? `${fmtNum(t.total_interactions)} interacciones` : 'En el período'} />
            <Kpi label="Vistas promedio por reel" value={fmtNum(avg(reels, 'views'))} foot={`Tiempo visto: ${fmtDecimal(avg(reels, 'avgWatch'), 1)} s en promedio`} />
            <Kpi label="Compartidos y guardados" value={`${fmtDecimal(avg(posts, 'shares'), 1)} · ${fmtDecimal(avg(posts, 'saved'), 1)}`} foot="Promedio por publicación" />
          </div>

          <div className="grid grid-3 mt-24">
            <div className="card span-2">
              <div className="card-head">
                <div>
                  <div className="card-title">Alcance de la cuenta por día</div>
                  <div className="card-sub">Cuántas cuentas distintas vieron algo de Sanzo cada día</div>
                </div>
              </div>
              {reachDaily.length ? (
                <div className="chart-box" style={{ height: 220 }}>
                  <ResponsiveContainer>
                    <AreaChart data={reachDaily} margin={{ top: 10, right: 6, left: 0, bottom: 0 }}>
                      <CartesianGrid {...gridProps} />
                      <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
                      <YAxis tick={axisTick} axisLine={false} tickLine={false} width={44} />
                      <Tooltip content={<ChartTooltip formatter={(v) => fmtNum(v)} />} />
                      <Area type="monotone" dataKey="alcance" name="Alcance" stroke="#956037" strokeWidth={2.2} fill="#956037" fillOpacity={0.12} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="muted small">Meta no devolvió el alcance diario para este período.</div>
              )}
            </div>
            <div className="card">
              <div className="card-head">
                <div>
                  <div className="card-title">
                    <IconSparkle style={{ width: 16, height: 16 }} /> Sugerencias de contenido
                  </div>
                  <div className="card-sub">Salen de cómo rindieron las publicaciones</div>
                </div>
              </div>
              {tips.length ? (
                <div className="list">
                  {tips.map((tip, i) => (
                    <div className="list-item" key={i}>
                      <div className="body">
                        <div className="title" style={{ whiteSpace: 'normal', fontWeight: 500 }}>{tip.text}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="muted small">Hacen falta algunas publicaciones más para comparar.</div>
              )}
            </div>
          </div>

          {chart.length > 0 && (
            <div className="card mt-24">
              <div className="card-head">
                <div>
                  <div className="card-title">Segundos vistos por reel</div>
                  <div className="card-sub">Tiempo promedio que la gente se queda en cada reel, del más viejo al más nuevo</div>
                </div>
              </div>
              <div className="chart-box" style={{ height: 220 }}>
                <ResponsiveContainer>
                  <BarChart data={chart} margin={{ top: 10, right: 6, left: 0, bottom: 0 }}>
                    <CartesianGrid {...gridProps} />
                    <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
                    <YAxis tick={axisTick} axisLine={false} tickLine={false} width={32} tickFormatter={(v) => `${v}s`} />
                    <Tooltip content={<ChartTooltip formatter={(v, n) => (n === 'Segundos' ? `${fmtDecimal(v, 1)} s` : fmtNum(v))} />} />
                    <Bar dataKey="segundos" name="Segundos" fill="#956037" radius={[10, 10, 4, 4]} maxBarSize={48} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="card mt-24">
            <div className="card-head">
              <div>
                <div className="card-title">Publicaciones</div>
                <div className="card-sub">
                  La curva segundo a segundo de un reel orgánico solo la muestra la app de Instagram; Meta no la da por API. En los anuncios sí (pestaña Anuncios).
                </div>
              </div>
            </div>
            {posts.length ? (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Publicación</th>
                      <th className="num">Vistas</th>
                      <th className="num">Alcance</th>
                      <th className="num">Visto prom.</th>
                      <th className="num">Me gusta</th>
                      <th className="num">Coment.</th>
                      <th className="num">Compart.</th>
                      <th className="num">Guard.</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {posts.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <div className="row" style={{ gap: 10, flexWrap: 'nowrap' }}>
                            {(p.thumbnail_url || p.media_url) && <img src={p.thumbnail_url || p.media_url} alt="" width={36} height={36} style={{ borderRadius: 6, objectFit: 'cover' }} />}
                            <div style={{ maxWidth: 280 }}>
                              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(p.caption || 'Sin texto').split('\n')[0]}</div>
                              <div className="muted small">
                                {p.kind} · {fmtDate(p.timestamp.slice(0, 10))}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="num">{p.views ? fmtNum(p.views) : '—'}</td>
                        <td className="num">{fmtNum(p.reach)}</td>
                        <td className="num">{p.avgWatch ? `${fmtDecimal(p.avgWatch, 1)} s` : '—'}</td>
                        <td className="num">{fmtNum(p.likes)}</td>
                        <td className="num">{fmtNum(p.comments)}</td>
                        <td className="num">{fmtNum(p.shares)}</td>
                        <td className="num">{fmtNum(p.saved)}</td>
                        <td>
                          <a className="btn btn-ghost btn-sm" href={p.permalink} target="_blank" rel="noreferrer" title="Abrir en Instagram">
                            <IconEye />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState compact title="Sin publicaciones" text="No se encontraron publicaciones en la cuenta." />
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ---------- Competencia ----------
// La API de la Biblioteca de anuncios no trae anuncios comerciales de
// Argentina, así que acá queda la lista de marcas con el link directo a sus
// anuncios activos y las notas de lo que se vio (las puede completar Claude
// en la rutina de la mañana).
function libraryUrl(q) {
  const p = new URLSearchParams({ active_status: 'active', ad_type: 'all', country: 'AR', media_type: 'all', q, search_type: 'keyword_unordered' })
  return `https://www.facebook.com/ads/library/?${p}`
}

function CompetitorsTab() {
  const { state, updateSettings } = useApp()
  const list = state.settings.adCompetitors || []
  const [name, setName] = useState('')
  const save = (next) => updateSettings({ adCompetitors: next })
  const add = (e) => {
    e.preventDefault()
    const n = name.trim()
    if (!n) return
    save([...list, { id: uid(), name: n, notes: '', updatedAt: null }])
    setName('')
  }
  const edit = (id, patch) => save(list.map((c) => (c.id === id ? { ...c, ...patch, updatedAt: new Date().toISOString() } : c)))
  const remove = (id) => save(list.filter((c) => c.id !== id))

  return (
    <div>
      <form className="row mt-8" style={{ gap: 8 }} onSubmit={add}>
        <input className="input" style={{ maxWidth: 320 }} placeholder="Nombre de la marca o su @" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn btn-primary btn-sm" type="submit">
          <IconPlus /> Sumar marca
        </button>
      </form>
      <p className="muted small mt-8">
        Meta no publica cuánto gastan los demás ni deja leer por API los anuncios comerciales de Argentina. Desde acá se abre su Biblioteca de anuncios con lo
        que tienen activo, y se anota lo que se ve (creativos, ofertas, desde cuándo los corren).
      </p>
      {list.length === 0 ? (
        <EmptyState compact title="Todavía no hay marcas" text="Sumá las marcas de la competencia que quieran seguir." />
      ) : (
        <div className="grid grid-2 mt-16">
          {list.map((c) => (
            <div className="card" key={c.id}>
              <div className="card-head">
                <div>
                  <div className="card-title">{c.name}</div>
                  <div className="card-sub">{c.updatedAt ? `Notas del ${fmtDate(c.updatedAt.slice(0, 10))}` : 'Sin notas todavía'}</div>
                </div>
                <div className="row" style={{ gap: 4 }}>
                  <a className="btn btn-soft btn-sm" href={libraryUrl(c.name)} target="_blank" rel="noreferrer">
                    Ver sus anuncios <IconChevronRight />
                  </a>
                  <button className="btn-icon danger" title="Sacar de la lista" onClick={() => remove(c.id)} type="button">
                    <IconTrash />
                  </button>
                </div>
              </div>
              <textarea
                className="input"
                rows={4}
                placeholder="Qué anuncios tienen activos, qué ofrecen, qué formato usan…"
                defaultValue={c.notes}
                onBlur={(e) => e.target.value !== c.notes && edit(c.id, { notes: e.target.value })}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
