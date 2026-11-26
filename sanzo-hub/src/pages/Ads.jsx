import { useCallback, useEffect, useMemo, useState } from 'react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { useApp } from '../context/AppContext.jsx'
import { PageHeader, Segmented, ChartTooltip, EmptyState } from '../components/ui/Primitives.jsx'
import { IconRefresh, IconAlert, IconSparkle } from '../components/ui/Icons.jsx'
import { fmtARS, fmtNum, fmtPct, fmtDecimal, fmtDate, fmtAxis } from '../utils/format.js'
import { fetchMeta, summarize, suggestionsFor, biggestDrop, pctChange, igPost, contentSuggestions } from '../lib/meta.js'
import { saleTotal } from '../utils/calc.js'
import CompetitorsTab from './Competencia.jsx'

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
            { value: 'comp', label: 'Competencia y oportunidades' },
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
  // Ventas reales cargadas en el hub en el mismo período, por canal (no dependen del píxel).
  const hubSales = useMemo(() => {
    if (!data) return null
    const inRange = (state.sales || []).filter((s) => s.date >= data.range.since && s.date <= data.range.until)
    // 1 venta por persona por día (un combo cuenta como 1)
    const key = (s) => `${s.date}|${(s.clientHandle || s.clientName || s.id || '').toLowerCase()}`
    const byChannel = {}
    for (const s of inRange) {
      const c = (byChannel[s.channel || 'Sin canal'] ||= { keys: new Set(), ars: 0 })
      c.keys.add(key(s))
      c.ars += saleTotal(s)
    }
    return {
      all: new Set(inRange.map(key)).size,
      allARS: inRange.reduce((a, s) => a + saleTotal(s), 0),
      channels: Object.entries(byChannel)
        .map(([name, c]) => ({ name, n: c.keys.size, ars: c.ars }))
        .sort((x, y) => y.n - x.n),
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
  const hours = useMemo(() => {
    const out = Array.from({ length: 24 }, (_, h) => ({ hora: `${h}h`, clics: 0, compras: 0, gasto: 0 }))
    for (const r of data?.hours || []) {
      const h = parseInt(String(r.hourly_stats_aggregated_by_advertiser_time_zone || '').slice(0, 2), 10)
      if (Number.isNaN(h)) continue
      const s = summarize(r)
      out[h].clics += s.linkClicks
      out[h].compras += s.purchases
      out[h].gasto += s.spend
    }
    return out.some((r) => r.clics || r.compras) ? out : []
  }, [data])
  const regions = useMemo(
    () =>
      (data?.regions || [])
        .map((r) => ({ name: r.region, s: summarize(r) }))
        .filter((r) => r.s.reach > 0)
        .sort((a, b) => b.s.reach - a.s.reach)
        .slice(0, 8),
    [data],
  )
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
                  <div className="card-title">Ventas reales y anuncios</div>
                  <div className="card-sub">
                    Lo cargado en Ventas en el mismo período (1 venta por persona por día). Una venta por la web puede venir de Instagram, de un anuncio o de otro lado: como
                    venta de anuncio solo cuenta la que Meta registra con el píxel.
                  </div>
                </div>
              </div>
              <div className="grid grid-3">
                <div>
                  <div className="kpi-label">Ventas del período</div>
                  <div className="kpi-value sm">{fmtNum(hubSales.all)}</div>
                  <div className="kpi-foot">{fmtARS(hubSales.allARS)} vendidos</div>
                  <div className="row mt-8" style={{ gap: 6, flexWrap: 'wrap' }}>
                    {hubSales.channels.map((c) => (
                      <span className="chip outline" key={c.name}>
                        {c.name}: {c.n}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="kpi-label">Ventas que vinieron de anuncios</div>
                  <div className="kpi-value sm">{fmtNum(total.purchases)}</div>
                  <div className="kpi-foot">{total.purchases ? `${fmtARS(total.costPerPurchase)} de anuncios por cada una` : 'Todavía ninguna compra registrada desde un anuncio'}</div>
                </div>
                <div>
                  <div className="kpi-label">Lo invertido en anuncios</div>
                  <div className="kpi-value sm">{fmtARS(total.spend)}</div>
                  <div className="kpi-foot">{hubSales.allARS ? `Equivale al ${fmtPct((total.spend / hubSales.allARS) * 100, 0)} de todo lo vendido` : 'Sin ventas cargadas en el período'}</div>
                </div>
              </div>
            </div>
          )}

          <FunnelCard t={total} />

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

          <AdsGallery ads={ads} current={current} onSelect={setSelected} />

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

          {(hours.length > 0 || regions.length > 0) && (
            <div className="grid grid-2 mt-24">
              <HoursCard hours={hours} />
              <RegionsCard regions={regions} />
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

          <div className="grid grid-2 mt-24">
            <WhenToPost posts={posts} />
            <FormatCompare posts={posts} />
          </div>

          {acc?.demographics && <Demographics d={acc.demographics} />}

          <PostsGallery posts={posts} />
        </>
      )}
    </div>
  )
}

// ---------- piezas visuales de Anuncios ----------
function FunnelCard({ t }) {
  if (!t || !t.impressions) return null
  const steps = [
    { label: 'Lo vieron', value: t.reach, hint: 'personas alcanzadas' },
    { label: 'Tocaron el enlace', value: t.linkClicks },
    { label: 'Llegaron a la web', value: t.landing },
    { label: 'Agregaron al carrito', value: t.addToCart },
    { label: 'Compraron', value: t.purchases, hint: 'según el píxel' },
  ]
  const max = steps[0].value || 1
  // El paso con peor conversión es donde más gente se pierde.
  let worst = null
  for (let i = 1; i < steps.length; i++) {
    const rate = steps[i - 1].value ? steps[i].value / steps[i - 1].value : 0
    if (i >= 2 && steps[i - 1].value >= 20 && (!worst || rate < worst.rate)) worst = { i, rate }
  }
  return (
    <div className="card mt-24">
      <div className="card-head">
        <div>
          <div className="card-title">El camino hasta la compra</div>
          <div className="card-sub">Cuánta gente pasa de un paso al siguiente{worst ? `. Donde más se pierde: "${steps[worst.i].label}"` : ''}</div>
        </div>
      </div>
      <div className="funnel">
        {steps.map((st, i) => {
          const rate = i > 0 && steps[i - 1].value ? (st.value / steps[i - 1].value) * 100 : null
          return (
            <div className={`funnel-row ${worst?.i === i ? 'leak' : ''}`} key={st.label}>
              <div className="funnel-label">
                <span>{st.label}</span>
                {st.hint && <span className="muted small"> · {st.hint}</span>}
              </div>
              <div className="funnel-bar">
                <div style={{ width: `${Math.max(2, (st.value / max) * 100)}%` }} />
              </div>
              <div className="funnel-num">
                <strong>{fmtNum(st.value)}</strong>
                {rate !== null && <span className="muted small">{fmtPct(rate, rate < 10 ? 1 : 0)}</span>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function AdsGallery({ ads, current, onSelect }) {
  if (!ads.length)
    return (
      <div className="card mt-24">
        <EmptyState compact title="Sin datos por anuncio" text="Meta todavía no informó números para este período." />
      </div>
    )
  const withImp = ads.filter((a) => a.s.impressions >= 300)
  const best = (k) => (withImp.length >= 2 ? [...withImp].sort((x, y) => y.s[k] - x.s[k])[0]?.id : null)
  const bestCtr = best('ctr')
  const bestHook = best('hookRate')
  const mostSales = ads.some((a) => a.s.purchases > 0) ? [...ads].sort((x, y) => y.s.purchases - x.s.purchases)[0].id : null
  return (
    <>
      <div className="row mt-24" style={{ gap: 8, alignItems: 'baseline' }}>
        <h3 className="section-title">Tus anuncios</h3>
        <span className="muted small">Tocá uno con video para ver en qué segundo se va la gente</span>
      </div>
      <div className="comp-grid mt-12">
        {ads.map((a) => {
          const tags = []
          if (a.id === mostSales) tags.push('Más compras')
          if (a.id === bestCtr) tags.push('Mejor CTR')
          if (a.id === bestHook && a.s.plays3s) tags.push('Mejor enganche')
          return (
            <button type="button" key={a.id} className={`opp-card anuncio-card ${current?.id === a.id ? 'selected' : ''}`} onClick={() => onSelect(a.id)}>
              <div className="comp-thumb" style={{ aspectRatio: '16 / 10' }}>
                {a.thumb ? <img src={a.thumb} alt="" loading="lazy" /> : <div className="comp-thumb-empty">Anuncio</div>}
                {tags[0] && <span className="comp-badge hot">{tags.join(' · ')}</span>}
                <span className="comp-kind">{statusLabel(a.status)}</span>
              </div>
              <div className="opp-body">
                <div className="opp-title">{a.name}</div>
                <div className="anuncio-stats">
                  <div><strong>{fmtARS(a.s.spend)}</strong><span>gastado</span></div>
                  <div><strong>{fmtPct(a.s.ctr, 2)}</strong><span>CTR</span></div>
                  <div><strong>{fmtNum(a.s.purchases)}</strong><span>compras</span></div>
                  <div><strong>{a.s.plays3s ? fmtPct(a.s.hookRate, 0) : '—'}</strong><span>enganche 3 s</span></div>
                </div>
                <div className="muted small">
                  {fmtNum(a.s.reach)} personas · {a.s.cpc ? `${fmtARS(a.s.cpc)} por clic` : 'sin clics'}
                  {a.s.avgWatch ? ` · visto ${fmtDecimal(a.s.avgWatch, 1)} s` : ''}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </>
  )
}

function HoursCard({ hours }) {
  if (!hours.length) return <div />
  const top = [...hours].sort((a, b) => b.clics + b.compras * 10 - (a.clics + a.compras * 10))[0]
  return (
    <div className="card" style={{ minWidth: 0 }}>
      <div className="card-head">
        <div>
          <div className="card-title">A qué hora responden</div>
          <div className="card-sub">Clics al enlace por hora del día{top?.clics ? `. Pico: ${top.hora}` : ''}</div>
        </div>
      </div>
      <div className="chart-box" style={{ height: 220 }}>
        <ResponsiveContainer>
          <BarChart data={hours} margin={{ top: 10, right: 6, left: 0, bottom: 0 }}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="hora" tick={axisTick} axisLine={false} tickLine={false} interval={2} />
            <YAxis tick={axisTick} axisLine={false} tickLine={false} width={32} allowDecimals={false} />
            <Tooltip content={<ChartTooltip formatter={(v, n) => (n === 'Gasto' ? fmtARS(v) : fmtNum(v))} />} />
            <Bar dataKey="clics" name="Clics" fill="#956037" radius={[4, 4, 0, 0]} isAnimationActive={false} maxBarSize={18} />
            <Bar dataKey="compras" name="Compras" fill="#6b8f5e" radius={[4, 4, 0, 0]} isAnimationActive={false} maxBarSize={18} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function RegionsCard({ regions }) {
  if (!regions.length) return <div />
  const max = regions[0].s.reach || 1
  return (
    <div className="card" style={{ minWidth: 0 }}>
      <div className="card-head">
        <div>
          <div className="card-title">De dónde son</div>
          <div className="card-sub">Alcance por provincia, con clics y compras</div>
        </div>
      </div>
      <div className="funnel">
        {regions.map((r) => (
          <div className="funnel-row" key={r.name}>
            <div className="funnel-label">{r.name.replace(/ Province$/, '')}</div>
            <div className="funnel-bar">
              <div style={{ width: `${Math.max(2, (r.s.reach / max) * 100)}%` }} />
            </div>
            <div className="funnel-num">
              <strong>{fmtNum(r.s.reach)}</strong>
              <span className="muted small">
                {fmtNum(r.s.linkClicks)} clics{r.s.purchases ? ` · ${fmtNum(r.s.purchases)} compras` : ''}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------- piezas visuales de Instagram ----------
const WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const arParts = (ts) => {
  const d = new Date(Date.parse(ts) - 3 * 3600 * 1000)
  return { wd: d.getUTCDay(), h: d.getUTCHours() }
}
const BANDS = [
  { label: 'Mañana (6 a 12)', from: 6, to: 12 },
  { label: 'Tarde (12 a 18)', from: 12, to: 18 },
  { label: 'Noche (18 a 24)', from: 18, to: 24 },
  { label: 'Madrugada (0 a 6)', from: 0, to: 6 },
]

function WhenToPost({ posts }) {
  // Se mide con el alcance de cada publicación, según el día y la hora (Argentina) en que salió.
  const withReach = posts.filter((p) => p.reach > 0 && p.kind !== 'Historia')
  if (withReach.length < 5) return <div />
  const byDay = WEEKDAYS.map((name, i) => {
    const arr = withReach.filter((p) => arParts(p.timestamp).wd === i)
    return { name, n: arr.length, avg: arr.length ? arr.reduce((a, p) => a + p.reach, 0) / arr.length : 0 }
  })
  const byBand = BANDS.map((b) => {
    const arr = withReach.filter((p) => {
      const { h } = arParts(p.timestamp)
      return h >= b.from && h < b.to
    })
    return { name: b.label, n: arr.length, avg: arr.length ? arr.reduce((a, p) => a + p.reach, 0) / arr.length : 0 }
  })
  const max = Math.max(...byDay.map((d) => d.avg), ...byBand.map((d) => d.avg), 1)
  const bestDay = [...byDay].filter((d) => d.n >= 2).sort((a, b) => b.avg - a.avg)[0]
  const bestBand = [...byBand].filter((d) => d.n >= 2).sort((a, b) => b.avg - a.avg)[0]
  const Row = ({ r, best }) => (
    <div className={`funnel-row ${best ? 'best' : ''}`}>
      <div className="funnel-label">{r.name}</div>
      <div className="funnel-bar">
        <div style={{ width: `${Math.max(2, (r.avg / max) * 100)}%` }} />
      </div>
      <div className="funnel-num">
        <strong>{r.n ? fmtNum(Math.round(r.avg)) : '—'}</strong>
        <span className="muted small">{r.n} posts</span>
      </div>
    </div>
  )
  return (
    <div className="card" style={{ minWidth: 0 }}>
      <div className="card-head">
        <div>
          <div className="card-title">Cuándo publicar</div>
          <div className="card-sub">
            Alcance promedio según cuándo salió cada post
            {bestDay && bestBand ? `. Lo que mejor anda: ${bestDay.name.toLowerCase()} a la ${bestBand.name.split(' ')[0].toLowerCase()}` : ''}
          </div>
        </div>
      </div>
      <div className="funnel">
        {byDay.map((r) => (
          <Row key={r.name} r={r} best={r === bestDay} />
        ))}
      </div>
      <div className="funnel mt-16">
        {byBand.map((r) => (
          <Row key={r.name} r={r} best={r === bestBand} />
        ))}
      </div>
    </div>
  )
}

function FormatCompare({ posts }) {
  const kinds = ['Reel', 'Carrusel', 'Foto']
    .map((k) => {
      const arr = posts.filter((p) => p.kind === k && p.reach > 0)
      const avg = (key) => (arr.length ? arr.reduce((a, p) => a + p[key], 0) / arr.length : 0)
      return { k, n: arr.length, reach: avg('reach'), shares: avg('shares'), saved: avg('saved'), likes: avg('likes') }
    })
    .filter((r) => r.n > 0)
  if (!kinds.length) return <div />
  const best = (key) => [...kinds].sort((a, b) => b[key] - a[key])[0].k
  const winners = { reach: best('reach'), shares: best('shares'), saved: best('saved'), likes: best('likes') }
  return (
    <div className="card" style={{ minWidth: 0 }}>
      <div className="card-head">
        <div>
          <div className="card-title">Reels, carruseles o fotos</div>
          <div className="card-sub">Promedio por publicación de cada formato. En marrón, el que gana en cada cosa</div>
        </div>
      </div>
      <div className="format-compare">
        {kinds.map((r) => (
          <div key={r.k} className="format-col">
            <div className="format-head">
              <strong>{r.k === 'Foto' ? 'Fotos' : `${r.k}s`}</strong>
              <span className="muted small">{r.n} posts</span>
            </div>
            {[
              ['reach', 'alcance'],
              ['likes', 'me gusta'],
              ['shares', 'compartidos'],
              ['saved', 'guardados'],
            ].map(([key, label]) => (
              <div key={key} className={`format-cell ${winners[key] === r.k && kinds.length > 1 ? 'win' : ''}`}>
                <strong>{key === 'reach' || key === 'likes' ? fmtNum(Math.round(r[key])) : fmtDecimal(r[key], 1)}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

const GENDER = { F: 'Mujeres', M: 'Hombres', U: 'Sin dato' }
function Demographics({ d }) {
  const cities = (d.city || []).slice(0, 8)
  const ages = (d.age || []).slice().sort((a, b) => String(a.key).localeCompare(String(b.key)))
  const genders = d.gender || []
  if (!cities.length && !ages.length && !genders.length) return null
  const totalG = genders.reduce((a, g) => a + g.value, 0) || 1
  const maxC = cities[0]?.value || 1
  const maxA = Math.max(...ages.map((a) => a.value), 1)
  return (
    <div className="card mt-24">
      <div className="card-head">
        <div>
          <div className="card-title">Quiénes te siguen</div>
          <div className="card-sub">Ciudad, edad y género de los seguidores de @sanzo_pets</div>
        </div>
      </div>
      {genders.length > 0 && (
        <div className="gender-bar">
          {genders.map((g) => (
            <div key={g.key} className={`g-${g.key}`} style={{ width: `${(g.value / totalG) * 100}%` }}>
              {GENDER[g.key] || g.key} {fmtPct((g.value / totalG) * 100, 0)}
            </div>
          ))}
        </div>
      )}
      <div className="grid grid-2 mt-16">
        <div className="funnel">
          {cities.map((c) => (
            <div className="funnel-row" key={c.key}>
              <div className="funnel-label">{String(c.key).split(',')[0]}</div>
              <div className="funnel-bar">
                <div style={{ width: `${Math.max(2, (c.value / maxC) * 100)}%` }} />
              </div>
              <div className="funnel-num">
                <strong>{fmtNum(c.value)}</strong>
              </div>
            </div>
          ))}
        </div>
        <div className="funnel">
          {ages.map((a) => (
            <div className="funnel-row" key={a.key}>
              <div className="funnel-label">{a.key} años</div>
              <div className="funnel-bar">
                <div style={{ width: `${Math.max(2, (a.value / maxA) * 100)}%` }} />
              </div>
              <div className="funnel-num">
                <strong>{fmtNum(a.value)}</strong>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function PostsGallery({ posts }) {
  const [sort, setSort] = useState('fecha')
  if (!posts.length)
    return (
      <div className="card mt-24">
        <EmptyState compact title="Sin publicaciones" text="No se encontraron publicaciones en la cuenta." />
      </div>
    )
  const top = (k) => [...posts].sort((a, b) => b[k] - a[k])[0]
  const tags = {}
  const tag = (p, t) => p && p[t[1]] > 0 && (tags[p.id] = [...(tags[p.id] || []), t[0]])
  tag(top('views'), ['Más visto', 'views'])
  tag(top('shares'), ['Más compartido', 'shares'])
  tag(top('saved'), ['Más guardado', 'saved'])
  tag(top('avgWatch'), ['Más retiene', 'avgWatch'])
  const sorted = [...posts].sort((a, b) => (sort === 'fecha' ? b.timestamp.localeCompare(a.timestamp) : b[sort] - a[sort]))
  return (
    <>
      <div className="row between mt-24" style={{ flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h3 className="section-title">Tus publicaciones</h3>
          <div className="muted small">La curva segundo a segundo de un reel orgánico solo la da la app de Instagram; en los anuncios sí está (solapa Anuncios).</div>
        </div>
        <Segmented
          options={[
            { value: 'fecha', label: 'Recientes' },
            { value: 'views', label: 'Más vistas' },
            { value: 'shares', label: 'Compartidas' },
            { value: 'saved', label: 'Guardadas' },
          ]}
          value={sort}
          onChange={setSort}
        />
      </div>
      <div className="gallery-grid mt-12">
        {sorted.map((p) => (
          <a key={p.id} className="gallery-item" href={p.permalink} target="_blank" rel="noreferrer" title={(p.caption || '').slice(0, 200)}>
            <div className="comp-thumb">
              {p.thumbnail_url || p.media_url ? <img src={p.thumbnail_url || p.media_url} alt="" loading="lazy" /> : <div className="comp-thumb-empty">{p.kind}</div>}
              {tags[p.id] && <span className="comp-badge hot">{tags[p.id].join(' · ')}</span>}
              {p.kind !== 'Foto' && <span className="comp-kind">{p.kind}</span>}
            </div>
            <div className="post-stats">
              <div><strong>{p.views ? fmtNum(p.views) : fmtNum(p.reach)}</strong><span>{p.views ? 'vistas' : 'alcance'}</span></div>
              <div><strong>{p.avgWatch ? `${fmtDecimal(p.avgWatch, 1)} s` : fmtNum(p.likes)}</strong><span>{p.avgWatch ? 'visto prom.' : 'me gusta'}</span></div>
              <div><strong>{fmtNum(p.shares)}</strong><span>compart.</span></div>
              <div><strong>{fmtNum(p.saved)}</strong><span>guard.</span></div>
            </div>
            <div className="muted small" style={{ padding: '0 8px 8px' }}>{fmtDate(p.timestamp.slice(0, 10))}</div>
          </a>
        ))}
      </div>
    </>
  )
}
