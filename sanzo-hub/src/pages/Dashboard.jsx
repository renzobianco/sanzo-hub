import { useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useApp } from '../context/AppContext.jsx'
import { ImageUpload } from '../components/ui/ImageUpload.jsx'
import { ChartTooltip, EmptyState, ProgressBar, ContentStatus, ContentThumb } from '../components/ui/Primitives.jsx'
import { ExchangeRate, DolarTodayCard } from '../components/ui/ExchangeRate.jsx'
import { IconPaw, IconTag, IconReceipt, IconTrendUp, IconBox, IconCoins, IconWallet, IconCalendar, IconChevronRight, IconAlert, IconCheck } from '../components/ui/Icons.jsx'
import { fmtARS, fmtNum, fmtPct, fmtDate, todayISO, fmtMonthLong, fmtDecimal, daysBetween } from '../utils/format.js'
import { sumSales, sumExpenses, sumUnits, inRange, thisMonthRange, dailySeries, recovery, currentPhase, saleTotal, expenseARS, contentTodayAlert, contentCode, sortNotes, noteProgress } from '../utils/calc.js'
import { NOTE_COLORS, SANZO_FOUNDED_DATE } from '../data/defaults.js'

export default function Dashboard({ navigate }) {
  const { state, updateSettings } = useApp()
  const { sales, expenses, products, settings, partners, phases, contentPosts, notes } = state
  const today = todayISO()
  const partner = partners[settings.currentUser]

  const m = useMemo(() => {
    const { from, to } = thisMonthRange(today)
    const ms = sales.filter((s) => inRange(s.date, from, to))
    const me = expenses.filter((e) => inRange(e.date, from, to))
    const ventas = sumSales(ms)
    const gastos = sumExpenses(me, settings.exchangeRate)
    return { ventas, gastos, neto: ventas - gastos, unidades: sumUnits(ms), cant: ms.length }
  }, [sales, expenses, settings.exchangeRate, today])

  const kit = products.find((p) => p.isKit)
  const rec = useMemo(() => recovery(state), [state])
  const phase = useMemo(() => currentPhase(phases, today), [phases, today])
  const trend = useMemo(() => dailySeries(sales, 30, today), [sales, today])
  const trendTotal = trend.reduce((a, d) => a + d.ventas, 0)

  const movements = useMemo(() => {
    const productName = (id) => products.find((p) => p.id === id)?.name || 'Producto'
    const all = [
      ...sales.map((s) => ({ id: `s${s.id}`, kind: 'sale', date: s.date, createdAt: s.createdAt, title: `${fmtNum(s.qty)} × ${productName(s.productId)}`, sub: [s.channel, s.clientName || (s.clientHandle ? `@${s.clientHandle.replace(/^@/, '')}` : null)].filter(Boolean).join(' · '), amount: saleTotal(s) })),
      ...expenses.map((e) => ({ id: `e${e.id}`, kind: 'expense', date: e.date, createdAt: e.createdAt, title: e.description || e.category, sub: e.category + (e.currency === 'USD' ? ` · USD ${fmtDecimal(e.amount)}` : ''), amount: expenseARS(e, settings.exchangeRate) })),
    ]
    return all.sort((a, b) => (b.date + (b.createdAt || '')).localeCompare(a.date + (a.createdAt || ''))).slice(0, 5)
  }, [sales, expenses, products, settings.exchangeRate])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buen día' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div>
      <div className="cover">
        <ImageUpload value={settings.coverImage} onChange={(v) => updateSettings({ coverImage: v })} shape="rounded" size={{ width: '100%', height: '100%' }} text="Subí una foto de portada" maxSize={1400} />
        {settings.coverImage && (
          <div className="cover-overlay">
            <h2>
              {greeting}, {partner?.name}
            </h2>
          </div>
        )}
      </div>

      <div className="page-header">
        <div>
          <div className="eyebrow">
            <IconPaw style={{ width: 12, height: 12 }} /> {fmtDate(today)} · {fmtMonthLong(today.slice(0, 7))}
          </div>
          <h1>
            {greeting}, {partner?.name}
          </h1>
          <p className="subtitle">Así está Sanzo hoy, de un vistazo.</p>
        </div>
        <div className="page-header-actions">
          <SanzoAgeChip today={today} />
          <PhaseChip phase={phase} onClick={() => navigate('objetivos')} />
          <ExchangeRate />
        </div>
      </div>

      <div className="grid grid-kpi">
        <Kpi icon={IconTag} label="Ventas del mes" value={fmtARS(m.ventas)} foot={`${fmtNum(m.cant)} ${m.cant === 1 ? 'venta' : 'ventas'} este mes`} tone={m.ventas > 0 ? 'pos' : ''} />
        <Kpi icon={IconReceipt} label="Gastos del mes" value={fmtARS(m.gastos)} foot="Convertidos al tipo de cambio cargado" tone={m.gastos > 0 ? 'neg' : ''} />
        <Kpi icon={IconTrendUp} label="Ganancia neta del mes" value={fmtARS(m.neto)} foot="Ventas menos gastos" tone={m.neto > 0 ? 'pos' : m.neto < 0 ? 'neg' : ''} />
        <Kpi icon={IconBox} label="Unidades vendidas" value={fmtNum(m.unidades)} foot="Este mes, todos los productos" />
        <Kpi icon={IconCoins} label="Stock de kits" value={fmtNum(kit?.stock || 0)} foot={kit?.initialStock ? `de ${fmtNum(kit.initialStock)} del lote` : 'Cargá el lote en Productos'} tone={kit && kit.stock > 0 && kit.stock < settings.stockThreshold ? 'neg' : ''} />
        <Kpi icon={IconWallet} label="Inversión recuperada" value={fmtPct(rec.pct)} foot={`Ganancia bruta ${fmtARS(rec.profitARS, { compact: true })} de USD ${fmtNum(rec.investmentUSD)}`} tone={rec.pct >= 100 ? 'pos' : ''} progress={rec.pct} />
      </div>

      <div className="grid grid-3 mt-24">
        <div className="card span-2">
          <div className="card-head">
            <div>
              <div className="card-title">Últimos 30 días</div>
              <div className="card-sub">Tendencia de ventas diarias · total {fmtARS(trendTotal)}</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('graficos')}>
              Ver gráficos <IconChevronRight />
            </button>
          </div>
          {trendTotal > 0 ? (
            <div className="chart-box" style={{ height: 220 }}>
              <ResponsiveContainer>
                <AreaChart data={trend} margin={{ top: 10, right: 6, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gCaramel" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#956037" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#956037" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#8a7a6d' }} axisLine={false} tickLine={false} interval={4} />
                  <YAxis hide />
                  <Tooltip content={<ChartTooltip formatter={(v) => fmtARS(v)} />} cursor={{ stroke: '#D5B9A2' }} />
                  <Area type="monotone" dataKey="ventas" name="Ventas" stroke="#956037" strokeWidth={2.2} fill="url(#gCaramel)" dot={false} activeDot={{ r: 5, fill: '#956037', stroke: '#fff', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState compact title="Todavía no hay ventas" text="Cuando registres la primera, acá vas a ver cómo evoluciona día a día." action={() => navigate('ventas')} actionLabel="Cargar una venta" />
          )}
        </div>

        <div className="stack" style={{ gap: 24 }}>
          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title">Últimos movimientos</div>
                <div className="card-sub">Ventas y gastos, lo más reciente primero</div>
              </div>
            </div>
            {movements.length === 0 ? (
              <EmptyState compact title="Nada por acá aún" text="Las ventas y gastos que cargues aparecen en esta lista." />
            ) : (
              <div className="list">
                {movements.map((mv) => (
                  <div className="list-item" key={mv.id}>
                    <div className={`icon ${mv.kind}`}>{mv.kind === 'sale' ? <IconTag /> : <IconReceipt />}</div>
                    <div className="body">
                      <div className="title">{mv.title}</div>
                      <div className="sub">
                        {fmtDate(mv.date)}
                        {mv.sub ? ` · ${mv.sub}` : ''}
                      </div>
                    </div>
                    <div className={`amount ${mv.kind === 'sale' ? 'pos' : 'neg'}`}>
                      {mv.kind === 'sale' ? '+' : '−'} {fmtARS(mv.amount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DolarTodayCard />
        </div>
      </div>

      <ContentToday contentPosts={contentPosts} today={today} navigate={navigate} />
      <PinnedNotes notes={notes} navigate={navigate} />
    </div>
  )
}

function PinnedNotes({ notes, navigate }) {
  const pinned = useMemo(() => sortNotes(notes.filter((n) => n.pinned)).slice(0, 3), [notes])
  return (
    <div className="card mt-24">
      <div className="card-head">
        <div>
          <div className="card-title">Notas fijadas</div>
          <div className="card-sub">Lo que siempre tenés que tener a mano</div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('notas')}>
          Ver notas <IconChevronRight />
        </button>
      </div>
      {pinned.length === 0 ? (
        <EmptyState compact title="Nada fijado todavía" text="Fijá una nota importante para tenerla siempre a mano acá." />
      ) : (
        <div className="grid grid-3">
          {pinned.map((n) => {
            const progress = noteProgress(n)
            const preview = n.type === 'checklist' ? (n.items || []).slice(0, 3).map((i) => i.text).filter(Boolean).join(' · ') : n.content
            return (
              <div
                key={n.id}
                className="card"
                style={{ background: NOTE_COLORS.find((c) => c.key === n.color)?.bg || '#F7F1EA', padding: 14, cursor: 'pointer' }}
                onClick={() => navigate('notas')}
              >
                {n.title && (
                  <div className="strong small" style={{ marginBottom: 4 }}>
                    {n.title}
                  </div>
                )}
                <div className="small muted" style={{ overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {progress ? `${progress.done}/${progress.total} hechas · ` : ''}
                  {preview || 'Sin contenido'}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ContentToday({ contentPosts, today, navigate }) {
  const { list, pending } = useMemo(() => contentTodayAlert(contentPosts, today), [contentPosts, today])
  return (
    <div className="card mt-24">
      <div className="card-head">
        <div>
          <div className="card-title">Contenido de hoy</div>
          <div className="card-sub">Lo que tiene que salir hoy en redes</div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('calendario')}>
          Ver calendario <IconChevronRight />
        </button>
      </div>
      {list.length === 0 ? (
        <EmptyState compact title="Nada planificado para hoy" text="Si te toca publicar, cargalo en el calendario." />
      ) : (
        <>
          {pending.length > 0 && (
            <div className="banner warn" style={{ marginBottom: 14 }}>
              <IconAlert />
              <span>{pending.map((p) => `⚠ Hoy sale ${contentCode(p.seq)} y todavía no está cargada en Buffer`).join(' · ')}</span>
            </div>
          )}
          <div className="list">
            {list.map((p) => {
              const safe = p.status === 'Cargado en Buffer' || p.status === 'Publicado'
              return (
                <div className="list-item" key={p.id}>
                  <ContentThumb post={p} size={38} radius={12} />
                  <div className="body">
                    <div className="title">
                      {safe ? (
                        <IconCheck style={{ width: 12, height: 12, color: 'var(--green)', verticalAlign: '-1px' }} />
                      ) : (
                        <IconAlert style={{ width: 12, height: 12, color: 'var(--terra)', verticalAlign: '-1px' }} />
                      )}{' '}
                      {contentCode(p.seq)} · {p.title}
                    </div>
                    <div className="sub">
                      {p.format}
                      {p.time ? ` · ${p.time} hs` : ''}
                      {safe ? ' · tranquilo, sale solo' : ' · falta cargar en Buffer'}
                    </div>
                  </div>
                  <ContentStatus status={p.status} />
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

function Kpi({ icon: Icon, label, value, foot, tone = '', progress }) {
  return (
    <div className="card kpi hoverable">
      <div className="kpi-label">
        <Icon /> {label}
      </div>
      <div>
        <div className={`kpi-value ${tone}`}>{value}</div>
        {progress !== undefined && (
          <div style={{ marginTop: 10 }}>
            <ProgressBar value={progress} thin />
          </div>
        )}
        {foot && <div className="kpi-foot">{foot}</div>}
      </div>
      <IconPaw className="paw-deco" />
    </div>
  )
}

// Sanzo se fundó el 28 de julio. Contador de días + saludo especial el día del aniversario.
function SanzoAgeChip({ today }) {
  const days = daysBetween(SANZO_FOUNDED_DATE, today)
  if (days < 0) return null
  const isAnniversary = today.slice(5) === SANZO_FOUNDED_DATE.slice(5)
  const years = Math.floor(days / 365)
  const label = isAnniversary ? `¡Feliz cumpleaños, Sanzo! 🎉` : years >= 1 ? `${years} ${years === 1 ? 'año' : 'años'} de Sanzo` : `${days} ${days === 1 ? 'día' : 'días'} de Sanzo`
  return (
    <span className="chip ink" style={{ padding: '9px 14px', fontSize: 13 }} title={`Fundada el ${fmtDate(SANZO_FOUNDED_DATE)}`}>
      🐾 {label}
    </span>
  )
}

function PhaseChip({ phase, onClick }) {
  if (!phase) return null
  const label = phase.upcoming ? `Arranca Fase ${phase.code} en ${phase.daysToStart} días` : `Fase ${phase.code} · ${phase.name}`
  const dates = phase.end ? `${fmtDate(phase.start)} – ${fmtDate(phase.end)}` : `desde ${fmtDate(phase.start)}`
  return (
    <button className="chip ink chip-btn" onClick={onClick} style={{ padding: '9px 14px', fontSize: 13 }} title={dates}>
      <IconCalendar style={{ width: 14, height: 14 }} /> {label}
      {phase.active && phase.daysLeft !== null && <span style={{ opacity: 0.7 }}>· {phase.daysLeft} días</span>}
    </button>
  )
}

