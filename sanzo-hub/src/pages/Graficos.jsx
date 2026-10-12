import { useMemo, useState } from 'react'
import { BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, Legend } from 'recharts'
import { useApp } from '../context/AppContext.jsx'
import { PageHeader, Segmented, ChartTooltip, EmptyState } from '../components/ui/Primitives.jsx'
import { DolarSourceNote } from '../components/ui/ExchangeRate.jsx'
import { CHANNELS, CONTENT_STATUSES, CONTENT_RESPONSIBLES } from '../data/defaults.js'
import { fmtARS, fmtNum, fmtPct, fmtDate, fmtUSD, fmtAxis } from '../utils/format.js'
import {
  periodRange,
  inRange,
  monthlySeries,
  dailySeriesInRange,
  byProduct,
  byChannel,
  expensesByCategory,
  recoveryCurve,
  sumSales,
  sumExpenses,
  contentByStatus,
  contentByPillar,
  contentByResponsible,
  contentPublishedByMonth,
} from '../utils/calc.js'

// Paleta de marca para series
export const PALETTE = ['#956037', '#D5B9A2', '#C9A06A', '#6B8F5E', '#B5533C', '#7A4D2B', '#8A7A6D', '#EAD9C8', '#4F5D6B']
const axisTick = { fontSize: 11, fill: '#8a7a6d' }
const gridProps = { stroke: '#EFE6DB', vertical: false }

export default function Graficos() {
  const { state } = useApp()
  const { sales, expenses, products, settings, contentPosts } = state
  const rate = settings.exchangeRate
  const [period, setPeriod] = useState('all')

  const { from, to } = useMemo(() => periodRange(period), [period])
  const fs = useMemo(() => sales.filter((s) => inRange(s.date, from, to)), [sales, from, to])
  const fe = useMemo(() => expenses.filter((e) => inRange(e.date, from, to)), [expenses, from, to])
  const fc = useMemo(() => contentPosts.filter((p) => inRange(p.date, from, to)), [contentPosts, from, to])

  const monthly = useMemo(() => monthlySeries(fs, fe, rate), [fs, fe, rate])
  const daily = useMemo(() => dailySeriesInRange(fs, from, to), [fs, from, to])
  const prod = useMemo(() => byProduct(fs, products), [fs, products])
  const chan = useMemo(() => byChannel(fs, CHANNELS), [fs])
  const cats = useMemo(() => expensesByCategory(fe, rate), [fe, rate])
  const rec = useMemo(() => recoveryCurve(state), [state])
  const contentStatusData = useMemo(() => contentByStatus(fc, CONTENT_STATUSES).filter((s) => s.total > 0), [fc])
  const contentPillarData = useMemo(() => contentByPillar(fc, settings.contentPillars || []), [fc, settings.contentPillars])
  const contentRespData = useMemo(() => contentByResponsible(fc, CONTENT_RESPONSIBLES), [fc])
  const contentPubMonthly = useMemo(() => contentPublishedByMonth(fc), [fc])

  const totalSales = sumSales(fs)
  const totalExp = sumExpenses(fe, rate)
  const kitShare = prod.length ? (prod.filter((p) => p.isKit).reduce((a, p) => a + p.total, 0) / (prod.reduce((a, p) => a + p.total, 0) || 1)) * 100 : 0

  const noSales = fs.length === 0
  const noExp = fe.length === 0

  return (
    <div>
      <PageHeader eyebrow="Gráficos y estadísticas" title="Gráficos" subtitle="Qué se vende, por dónde entra la plata y cuándo recuperamos la inversión.">
        <Segmented
          value={period}
          onChange={setPeriod}
          options={[
            { value: 'month', label: 'Este mes' },
            { value: '3m', label: '3 meses' },
            { value: 'all', label: 'Todo' },
          ]}
        />
      </PageHeader>

      <div className="grid grid-4 mb-16">
        <Stat label="Ventas" value={fmtARS(totalSales)} tone={totalSales > 0 ? 'pos' : ''} />
        <Stat label="Gastos" value={fmtARS(totalExp)} tone={totalExp > 0 ? 'neg' : ''} sub="histórico" />
        <Stat label="Neto" value={fmtARS(totalSales - totalExp)} tone={totalSales - totalExp > 0 ? 'pos' : totalSales - totalExp < 0 ? 'neg' : ''} />
        <Stat label="El kit sobre el total" value={fmtPct(kitShare)} sub="de los ingresos por producto" />
      </div>
      <div className="mb-16">
        <DolarSourceNote prefix="Gastos en USD convertidos a" />
      </div>

      <div className="grid grid-2">
        <ChartCard title="Ventas por mes" sub="Ingresos totales mes a mes">
          {noSales ? (
            <Empty />
          ) : (
            <div className="chart-box">
              <ResponsiveContainer>
                <BarChart data={monthly} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
                  <YAxis tick={axisTick} axisLine={false} tickLine={false} tickFormatter={fmtAxis} width={72} />
                  <Tooltip content={<ChartTooltip formatter={(v) => fmtARS(v)} />} cursor={{ fill: 'rgba(213,185,162,0.25)' }} />
                  <Bar dataKey="ventas" name="Ventas" fill="#956037" radius={[10, 10, 4, 4]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Evolución diaria" sub="Cómo se mueven las ventas día a día">
          {noSales ? (
            <Empty />
          ) : (
            <div className="chart-box">
              <ResponsiveContainer>
                <LineChart data={daily} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={24} />
                  <YAxis tick={axisTick} axisLine={false} tickLine={false} tickFormatter={fmtAxis} width={72} />
                  <Tooltip content={<ChartTooltip formatter={(v) => fmtARS(v)} />} cursor={{ stroke: '#D5B9A2' }} />
                  <Line type="monotone" dataKey="ventas" name="Ventas" stroke="#956037" strokeWidth={2.2} dot={{ r: 2.5, fill: '#956037', strokeWidth: 0 }} activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Ventas por producto" sub="¿El kit o las piezas sueltas?">
          {noSales ? (
            <Empty />
          ) : (
            <div className="chart-box" style={{ height: Math.max(220, prod.length * 44) }}>
              <ResponsiveContainer>
                <BarChart data={prod} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                  <CartesianGrid stroke="#EFE6DB" horizontal={false} />
                  <XAxis type="number" tick={axisTick} axisLine={false} tickLine={false} tickFormatter={fmtAxis} />
                  <YAxis type="category" dataKey="name" tick={{ ...axisTick, fill: '#1a1a1a', fontSize: 12 }} axisLine={false} tickLine={false} width={92} />
                  <Tooltip content={<ChartTooltip formatter={(v, n, p) => (n === 'Ingresos' ? `${fmtARS(v)} · ${fmtNum(p.payload.unidades)} u.` : v)} />} cursor={{ fill: 'rgba(213,185,162,0.25)' }} />
                  <Bar dataKey="total" name="Ingresos" radius={[4, 10, 10, 4]} maxBarSize={26}>
                    {prod.map((p, i) => (
                      <Cell key={p.id} fill={p.isKit ? '#956037' : PALETTE[(i % 6) + 1]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Ventas por canal" sub="¿Instagram, X o Facebook trae más plata?">
          {noSales ? (
            <Empty />
          ) : (
            <PieWithLegend data={chan} valueKey="total" formatter={(v) => fmtARS(v)} extra={(d) => `${fmtNum(d.ventas)} ${d.ventas === 1 ? 'venta' : 'ventas'}`} />
          )}
        </ChartCard>

        <ChartCard title="Gastos por categoría" sub="En qué se va la plata">
          {noExp ? (
            <Empty text="Todavía no hay gastos en este período." />
          ) : (
            <PieWithLegend data={cats} valueKey="total" formatter={(v) => fmtARS(v)} extra={(d) => `${fmtNum(d.items)} ${d.items === 1 ? 'gasto' : 'gastos'}`} />
          )}
        </ChartCard>

        <ChartCard title="Ganancia neta mensual" sub="Ventas menos gastos, mes a mes">
          {noSales && noExp ? (
            <Empty text="Cargá ventas y gastos para ver la ganancia neta." />
          ) : (
            <div className="chart-box">
              <ResponsiveContainer>
                <AreaChart data={monthly} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gNeto" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6B8F5E" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#6B8F5E" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
                  <YAxis tick={axisTick} axisLine={false} tickLine={false} tickFormatter={fmtAxis} width={72} domain={[(min) => Math.min(0, min), (max) => Math.max(0, max)]} />
                  <ReferenceLine y={0} stroke="#B5533C" strokeDasharray="4 4" />
                  <Tooltip content={<ChartTooltip formatter={(v) => fmtARS(v)} />} cursor={{ stroke: '#D5B9A2' }} />
                  <Area type="monotone" dataKey="neto" name="Neto" stroke="#6B8F5E" strokeWidth={2.2} fill="url(#gNeto)" dot={{ r: 3, fill: '#6B8F5E', strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard
          title="Curva de recupero de inversión"
          sub={`Ganancia bruta acumulada (precio cobrado menos costo del producto) contra los ${fmtUSD(settings.initialInvestmentUSD)} invertidos, a $ ${fmtNum(rate)} por dólar.`}
          className="span-2"
        >
          {rec.points.length === 0 ? (
            <Empty text="Cuando haya ventas con costo cargado en Productos, vas a ver acá cuándo pasamos a verde." />
          ) : (
            <>
              <div className="row" style={{ marginBottom: 10 }}>
                {rec.crossDate ? (
                  <span className="chip green">Inversión recuperada el {fmtDate(rec.crossDate)}</span>
                ) : (
                  <span className="chip">
                    Faltan {fmtARS(Math.max(0, rec.investment - rec.points[rec.points.length - 1].ganancia))} para cubrir la inversión
                  </span>
                )}
              </div>
              <div className="chart-box tall">
                <ResponsiveContainer>
                  <AreaChart data={rec.points} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gRec" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#956037" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#956037" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid {...gridProps} />
                    <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} minTickGap={24} />
                    <YAxis tick={axisTick} axisLine={false} tickLine={false} tickFormatter={fmtAxis} width={72} domain={[0, (max) => Math.max(max, rec.investment * 1.1)]} />
                    <Tooltip content={<ChartTooltip formatter={(v) => fmtARS(v)} />} cursor={{ stroke: '#D5B9A2' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: '#8a7a6d' }} />
                    <ReferenceLine y={rec.investment} stroke="#B5533C" strokeDasharray="6 4" label={{ value: 'Inversión', position: 'insideTopRight', fill: '#B5533C', fontSize: 11 }} />
                    <Area type="monotone" dataKey="ganancia" name="Ganancia acumulada" stroke="#956037" strokeWidth={2.4} fill="url(#gRec)" dot={false} activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }} />
                    <Line type="monotone" dataKey="inversion" name="Inversión inicial" stroke="#B5533C" strokeWidth={1.5} dot={false} strokeDasharray="6 4" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </ChartCard>

        <ChartCard title="Contenido por estado" sub="Cuántas publicaciones hay en cada etapa del flujo">
          {contentStatusData.length === 0 ? (
            <Empty text="Todavía no hay contenido planificado." />
          ) : (
            <div className="chart-box" style={{ height: Math.max(220, contentStatusData.length * 40) }}>
              <ResponsiveContainer>
                <BarChart data={contentStatusData} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                  <CartesianGrid stroke="#EFE6DB" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ ...axisTick, fill: '#1a1a1a', fontSize: 11.5 }} axisLine={false} tickLine={false} width={150} />
                  <Tooltip content={<ChartTooltip formatter={(v) => `${fmtNum(v)} ${v === 1 ? 'publicación' : 'publicaciones'}`} />} cursor={{ fill: 'rgba(213,185,162,0.25)' }} />
                  <Bar dataKey="total" name="Publicaciones" radius={[4, 10, 10, 4]} maxBarSize={22}>
                    {contentStatusData.map((s) => (
                      <Cell key={s.name} fill={s.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Publicado por mes" sub="Publicaciones que llegaron a estado Publicado">
          {contentPubMonthly.length === 0 ? (
            <Empty text="Todavía no marcaste ninguna publicación como Publicado." />
          ) : (
            <div className="chart-box">
              <ResponsiveContainer>
                <BarChart data={contentPubMonthly} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} width={36} />
                  <Tooltip content={<ChartTooltip formatter={(v) => `${fmtNum(v)} ${v === 1 ? 'publicación' : 'publicaciones'}`} />} cursor={{ fill: 'rgba(213,185,162,0.25)' }} />
                  <Bar dataKey="total" name="Publicado" fill="#6B8F5E" radius={[10, 10, 4, 4]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Contenido por pilar" sub="Para ver si estamos respetando la mezcla de contenido">
          {contentPillarData.length === 0 ? <Empty text="Todavía no hay contenido planificado." /> : <PieWithLegend data={contentPillarData} valueKey="total" formatter={(v) => `${fmtNum(v)} ${v === 1 ? 'publicación' : 'publicaciones'}`} />}
        </ChartCard>

        <ChartCard title="Contenido por responsable" sub="¿Está repartido el laburo entre los dos?">
          {contentRespData.length === 0 ? <Empty text="Todavía no hay contenido planificado." /> : <PieWithLegend data={contentRespData} valueKey="total" formatter={(v) => `${fmtNum(v)} ${v === 1 ? 'publicación' : 'publicaciones'}`} />}
        </ChartCard>
      </div>
    </div>
  )
}

function ChartCard({ title, sub, children, className = '' }) {
  return (
    <div className={`card ${className}`}>
      <div className="card-head" style={{ marginBottom: 12 }}>
        <div>
          <div className="card-title">{title}</div>
          {sub && <div className="card-sub">{sub}</div>}
        </div>
      </div>
      {children}
    </div>
  )
}

function Stat({ label, value, sub, tone = '' }) {
  return (
    <div className="card" style={{ padding: '16px 18px' }}>
      <div className="kpi-label">{label}</div>
      <div className={`kpi-value sm ${tone}`} style={{ marginTop: 6 }}>
        {value}
      </div>
      {sub && <div className="kpi-foot">{sub}</div>}
    </div>
  )
}

function Empty({ text = 'Todavía no hay ventas en este período.' }) {
  return <EmptyState compact title="Sin datos por ahora" text={text} />
}

export function PieWithLegend({ data, valueKey, formatter, extra }) {
  const total = data.reduce((a, d) => a + d[valueKey], 0)
  return (
    <div className="row" style={{ alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
      <div style={{ width: 200, height: 200, flexShrink: 0, margin: '0 auto' }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey={valueKey} nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={3} stroke="#fff" strokeWidth={2}>
              {data.map((d, i) => (
                <Cell key={d.name} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip formatter={(v) => formatter(v)} />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="list" style={{ flex: 1, minWidth: 200 }}>
        {data.map((d, i) => (
          <div className="list-item" key={d.name} style={{ padding: '8px 0' }}>
            <span style={{ width: 12, height: 12, borderRadius: 4, background: PALETTE[i % PALETTE.length], flexShrink: 0 }} />
            <div className="body">
              <div className="title">{d.name}</div>
              <div className="sub">
                {fmtPct(total ? (d[valueKey] / total) * 100 : 0)}
                {extra ? ` · ${extra(d)}` : ''}
              </div>
            </div>
            <div className="amount">{formatter(d[valueKey])}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
