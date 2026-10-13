// Lógica de negocio: totales, márgenes, recupero de inversión, series para gráficos.
import { addDays, daysBetween, daysInMonth, fmtDateShort, fmtMonth, monthKey, todayISO, toISO } from './format.js'

export const num = (v) => Number(v) || 0

// ---------- Ventas ----------
export const saleRevenue = (s) => num(s.qty) * num(s.unitPrice)
export const saleTotal = (s) => saleRevenue(s) + num(s.shipping)

export function sumSales(sales) {
  return sales.reduce((a, s) => a + saleTotal(s), 0)
}

export function sumUnits(sales) {
  return sales.reduce((a, s) => a + num(s.qty), 0)
}

// ---------- Gastos ----------
// Valor histórico: lo que REALMENTE se pagó, al tipo de cambio del día del gasto
// (e.rate). Si un gasto viejo no lo tiene guardado, usamos el vigente como estimación.
export function expenseARS(e, rate) {
  const amt = num(e.amount)
  if (e.currency === 'USD') return amt * (num(e.rate) || num(rate))
  return amt
}

// Valor a cotización de HOY: cuánto costaría ese mismo gasto si lo pagáramos ahora.
// Para gastos en ARS no hay conversión posible, así que coincide con expenseARS.
export function expenseARSToday(e, rate) {
  const amt = num(e.amount)
  return e.currency === 'USD' ? amt * num(rate) : amt
}

// true si guardamos la cotización del día del gasto (vs. una estimación con la vigente)
export function expenseHasHistoricalRate(e) {
  return e.currency === 'USD' && num(e.rate) > 0
}

export function sumExpenses(expenses, rate) {
  return expenses.reduce((a, e) => a + expenseARS(e, rate), 0)
}

export function sumExpensesUSD(expenses) {
  return expenses.filter((e) => e.currency === 'USD').reduce((a, e) => a + num(e.amount), 0)
}

// ---------- Filtros por fecha ----------
export function inRange(iso, from, to) {
  if (!iso) return false
  if (from && iso < from) return false
  if (to && iso > to) return false
  return true
}

export function thisMonthRange(today = todayISO()) {
  const from = `${today.slice(0, 7)}-01`
  return { from, to: today.slice(0, 7) + '-31' }
}

export function periodRange(period, today = todayISO()) {
  if (period === 'month') return thisMonthRange(today)
  if (period === '3m') {
    const d = new Date()
    d.setMonth(d.getMonth() - 2)
    return { from: `${toISO(d).slice(0, 7)}-01`, to: null }
  }
  return { from: null, to: null }
}

// ---------- Productos ----------
export function productMargin(p, rate) {
  const cost = num(p.costUSD) * num(rate)
  const price = num(p.priceARS)
  const margin = price - cost
  const pct = price > 0 ? (margin / price) * 100 : 0
  return { cost, price, margin, pct }
}

// El kit es un rejunte de las piezas sueltas: sus unidades, su costo y su precio ya
// están contados en cada pieza individual, así que lo dejamos afuera para no duplicar.
export function inventoryValue(products, rate) {
  let atCost = 0
  let atPrice = 0
  let units = 0
  for (const p of products) {
    if (p.isKit) continue
    const stock = num(p.stock)
    units += stock
    atCost += stock * num(p.costUSD) * num(rate)
    atPrice += stock * num(p.priceARS)
  }
  return { atCost, atPrice, units, potential: atPrice - atCost }
}

// Ganancia bruta real de las ventas: precio cobrado - costo del producto (al tipo de cambio actual)
export function grossProfit(sales, products, rate) {
  const cost = new Map(products.map((p) => [p.id, num(p.costUSD) * num(rate)]))
  return sales.reduce((a, s) => a + num(s.qty) * (num(s.unitPrice) - (cost.get(s.productId) || 0)), 0)
}

// ---------- Recupero de inversión ----------
export function recovery(state) {
  const { sales, products, settings } = state
  const rate = num(settings.exchangeRate)
  const investmentUSD = num(settings.initialInvestmentUSD)
  const investmentARS = investmentUSD * rate
  const profitARS = grossProfit(sales, products, rate)
  const pct = investmentARS > 0 ? (profitARS / investmentARS) * 100 : 0
  return { investmentUSD, investmentARS, profitARS, pct, recoveredUSD: rate > 0 ? profitARS / rate : 0 }
}

export function breakEven(state) {
  const { sales, products, settings } = state
  const rate = num(settings.exchangeRate)
  const kit = products.find((p) => p.isKit)
  const kitSales = sales.filter((s) => s.productId === kit?.id)
  const kitUnits = sumUnits(kitSales)
  const kitRevenue = kitSales.reduce((a, s) => a + saleRevenue(s), 0)
  const kitCost = num(kit?.costUSD) * rate
  const avgPriceKit = kitUnits > 0 ? kitRevenue / kitUnits : num(kit?.priceARS)
  const avgMarginKit = avgPriceKit - kitCost
  const rec = recovery(state)
  const remaining = Math.max(0, rec.investmentARS - rec.profitARS)
  const kitsNeeded = avgMarginKit > 0 ? Math.ceil(remaining / avgMarginKit) : null
  return { kitUnits, avgPriceKit, avgMarginKit, kitCost, remaining, kitsNeeded, usingRealData: kitUnits > 0, reached: remaining <= 0 && rec.investmentARS > 0 }
}

// ---------- Series para gráficos ----------
function sortedByDate(items) {
  return [...items].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
}

export function monthlySeries(sales, expenses, rate) {
  const map = new Map()
  const ensure = (k) => {
    if (!map.has(k)) map.set(k, { key: k, label: fmtMonth(k), ventas: 0, gastos: 0, unidades: 0 })
    return map.get(k)
  }
  for (const s of sales) {
    const m = ensure(monthKey(s.date))
    m.ventas += saleTotal(s)
    m.unidades += num(s.qty)
  }
  for (const e of expenses) ensure(monthKey(e.date)).gastos += expenseARS(e, rate)
  return [...map.values()]
    .filter((m) => m.key)
    .sort((a, b) => (a.key < b.key ? -1 : 1))
    .map((m) => ({ ...m, neto: m.ventas - m.gastos }))
}

export function dailySeries(sales, days = 30, endISO = todayISO()) {
  const start = addDays(endISO, -(days - 1))
  const map = new Map()
  for (let i = 0; i < days; i++) {
    const d = addDays(start, i)
    map.set(d, { date: d, label: fmtDateShort(d), ventas: 0, unidades: 0 })
  }
  for (const s of sales) {
    if (map.has(s.date)) {
      const row = map.get(s.date)
      row.ventas += saleTotal(s)
      row.unidades += num(s.qty)
    }
  }
  return [...map.values()]
}

export function dailySeriesInRange(sales, from, to) {
  if (!sales.length) return []
  const sorted = sortedByDate(sales)
  const start = from || sorted[0].date
  const end = to && to <= todayISO() ? to : todayISO()
  const days = Math.max(1, daysBetween(start, end) + 1)
  if (days > 400) {
    // Demasiados días: agrupamos por semana
    const map = new Map()
    for (const s of sales) {
      const wk = addDays(s.date, -(new Date(s.date).getUTCDay() || 7) + 1)
      if (!map.has(wk)) map.set(wk, { date: wk, label: fmtDateShort(wk), ventas: 0, unidades: 0 })
      map.get(wk).ventas += saleTotal(s)
      map.get(wk).unidades += num(s.qty)
    }
    return [...map.values()].sort((a, b) => (a.date < b.date ? -1 : 1))
  }
  return dailySeries(sales, days, end)
}

export function byProduct(sales, products) {
  const map = new Map(products.map((p) => [p.id, { id: p.id, name: p.name, total: 0, unidades: 0, isKit: p.isKit }]))
  for (const s of sales) {
    const row = map.get(s.productId)
    if (!row) continue
    row.total += saleRevenue(s)
    row.unidades += num(s.qty)
  }
  return [...map.values()].filter((r) => r.unidades > 0).sort((a, b) => b.total - a.total)
}

export function byChannel(sales, channels) {
  const map = new Map(channels.map((c) => [c, { name: c, total: 0, ventas: 0 }]))
  for (const s of sales) {
    if (!map.has(s.channel)) map.set(s.channel, { name: s.channel, total: 0, ventas: 0 })
    const row = map.get(s.channel)
    row.total += saleTotal(s)
    row.ventas += 1
  }
  return [...map.values()].filter((r) => r.ventas > 0).sort((a, b) => b.total - a.total)
}

export function expensesByCategory(expenses, rate) {
  const map = new Map()
  for (const e of expenses) {
    if (!map.has(e.category)) map.set(e.category, { name: e.category, total: 0, items: 0 })
    map.get(e.category).total += expenseARS(e, rate)
    map.get(e.category).items += 1
  }
  return [...map.values()].sort((a, b) => b.total - a.total)
}

// Curva de recupero: ganancia bruta acumulada por día contra la inversión.
export function recoveryCurve(state) {
  const { sales, products, settings } = state
  const rate = num(settings.exchangeRate)
  const investment = num(settings.initialInvestmentUSD) * rate
  const cost = new Map(products.map((p) => [p.id, num(p.costUSD) * rate]))
  const byDay = new Map()
  for (const s of sortedByDate(sales)) {
    const profit = num(s.qty) * (num(s.unitPrice) - (cost.get(s.productId) || 0))
    byDay.set(s.date, (byDay.get(s.date) || 0) + profit)
  }
  let acc = 0
  const points = [...byDay.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([date, profit]) => {
      acc += profit
      return { date, label: fmtDateShort(date), ganancia: acc, inversion: investment }
    })
  if (points.length) {
    const first = addDays(points[0].date, -1)
    points.unshift({ date: first, label: fmtDateShort(first), ganancia: 0, inversion: investment })
  }
  const crossIndex = points.findIndex((p) => p.ganancia >= investment && investment > 0)
  return { points, investment, crossDate: crossIndex >= 0 ? points[crossIndex].date : null }
}

// ---------- Clientes ----------
export const normalizeHandle = (h) =>
  String(h || '')
    .trim()
    .replace(/^@/, '')
    .toLowerCase()

export function aggregateClients(sales, manualClients) {
  const map = new Map()
  const keyFor = (name, handle) => {
    const h = normalizeHandle(handle)
    if (h) return `h:${h}`
    const n = String(name || '').trim().toLowerCase()
    return n ? `n:${n}` : null
  }
  for (const c of manualClients) {
    const k = keyFor(c.name, c.handle) || `id:${c.id}`
    map.set(k, {
      id: c.id,
      key: k,
      name: c.name,
      handle: c.handle,
      phone: c.phone,
      notes: c.notes,
      status: c.status || 'interesado',
      manual: true,
      purchases: 0,
      spent: 0,
      lastPurchase: null,
      sales: [],
    })
  }
  for (const s of sales) {
    const k = keyFor(s.clientName, s.clientHandle)
    if (!k) continue
    if (!map.has(k)) {
      map.set(k, {
        id: k,
        key: k,
        name: s.clientName || `@${normalizeHandle(s.clientHandle)}`,
        handle: s.clientHandle,
        phone: '',
        notes: '',
        status: 'cliente',
        manual: false,
        purchases: 0,
        spent: 0,
        lastPurchase: null,
        sales: [],
      })
    }
    const c = map.get(k)
    if (!c.handle && s.clientHandle) c.handle = s.clientHandle
    if ((!c.name || c.name.startsWith('@')) && s.clientName) c.name = s.clientName
    c.purchases += 1
    c.spent += saleTotal(s)
    c.sales.push(s)
    if (!c.lastPurchase || s.date > c.lastPurchase) c.lastPurchase = s.date
  }
  return [...map.values()]
    .map((c) => ({ ...c, status: c.purchases > 0 ? 'cliente' : c.status }))
    .sort((a, b) => b.spent - a.spent || (b.lastPurchase || '') > (a.lastPurchase || '') ? 1 : -1)
}

// ---------- Fases ----------
export function phaseStatus(phases, today = todayISO()) {
  const sorted = [...phases].sort((a, b) => (a.start < b.start ? -1 : 1))
  return sorted.map((p) => {
    const started = today >= p.start
    const ended = p.end ? today > p.end : false
    const active = started && !ended
    let pct = 0
    if (ended) pct = 100
    else if (active && p.end) {
      const total = daysBetween(p.start, p.end) + 1
      const elapsed = daysBetween(p.start, today) + 1
      pct = Math.min(100, Math.max(0, (elapsed / total) * 100))
    } else if (active && !p.end) pct = 100
    const daysLeft = p.end ? daysBetween(today, p.end) : null
    const daysToStart = started ? 0 : daysBetween(today, p.start)
    return { ...p, started, ended, active, pct, daysLeft, daysToStart }
  })
}

export function currentPhase(phases, today = todayISO()) {
  const list = phaseStatus(phases, today)
  return list.find((p) => p.active) || (today < list[0]?.start ? { ...list[0], upcoming: true } : list[list.length - 1])
}

// ---------- Pedidos a China ----------
export function orderTotals(order) {
  const fob = num(order.fobUSD)
  const freight = num(order.freightUSD)
  const other = num(order.otherUSD)
  const total = fob + freight + other
  const items = order.items || []
  const units = items.reduce((a, i) => a + num(i.qty), 0)
  const hasUnitFob = items.length > 0 && items.every((i) => num(i.unitFobUSD) > 0)
  const itemsFobTotal = items.reduce((a, i) => a + num(i.qty) * num(i.unitFobUSD), 0)
  const extras = freight + other
  const perItem = items.map((i) => {
    const qty = num(i.qty)
    let unitCost = 0
    if (hasUnitFob && itemsFobTotal > 0) {
      const share = (qty * num(i.unitFobUSD)) / itemsFobTotal
      unitCost = num(i.unitFobUSD) + (extras * share) / (qty || 1)
    } else {
      unitCost = units > 0 ? total / units : 0
    }
    return { ...i, qty, unitCost, subtotal: unitCost * qty }
  })
  return { fob, freight, other, total, units, unitAvg: units > 0 ? total / units : 0, perItem, hasUnitFob }
}

// ---------- Calendario de contenido ----------
export const CONTENT_READY_STATUSES = ['Listo para publicar', 'Cargado en Buffer', 'Publicado']
export const CONTENT_BUFFERED_STATUSES = ['Cargado en Buffer', 'Publicado']

export function nextContentSeq(posts) {
  return posts.reduce((max, p) => Math.max(max, Number(p.seq) || 0), 0) + 1
}

export function contentCode(seq) {
  return `G${String(seq).padStart(3, '0')}`
}

export function postsOnDate(posts, iso) {
  return posts.filter((p) => p.date === iso)
}

export function sortContent(posts) {
  return [...posts].sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')) || (Number(a.seq) || 0) - (Number(b.seq) || 0))
}

// Racha de días seguidos publicando (estado "Publicado"). Si hoy todavía no tiene nada,
// arranca a contar desde ayer para no cortar la racha antes de que termine el día.
// Cuenta "Cargado en Buffer" como publicado además de "Publicado": una vez programada,
// Buffer la publica sola a la hora indicada y casi nadie vuelve a marcarla "Publicado" a mano
// (por eso la racha quedaba rota — nunca sumaba nada aunque se publicara todos los días).
export function contentStreak(posts, today = todayISO()) {
  const published = new Set(posts.filter((p) => CONTENT_BUFFERED_STATUSES.includes(p.status)).map((p) => p.date))
  let streak = 0
  let d = published.has(today) ? today : addDays(today, -1)
  while (published.has(d)) {
    streak++
    d = addDays(d, -1)
  }
  return streak
}

export function weekCoverage(posts, today = todayISO()) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i))
  const inWeek = posts.filter((p) => days.includes(p.date))
  const notReady = inWeek.filter((p) => !CONTENT_READY_STATUSES.includes(p.status))
  const emptyDays = days.filter((d) => !inWeek.some((p) => p.date === d))
  const buffered = inWeek.filter((p) => CONTENT_BUFFERED_STATUSES.includes(p.status))
  const needsAction = inWeek.filter((p) => !CONTENT_BUFFERED_STATUSES.includes(p.status))
  return { days, inWeek, notReady, emptyDays, buffered, needsAction }
}

export function contentTodayAlert(posts, today = todayISO()) {
  const list = sortContent(postsOnDate(posts, today))
  const pending = list.filter((p) => p.status !== 'Cargado en Buffer' && p.status !== 'Publicado')
  return { list, pending }
}

export function contentMonthSummary(posts, monthKeyStr, cadence = {}) {
  const inMonth = posts.filter((p) => monthKey(p.date) === monthKeyStr)
  const count = (fmt) => inMonth.filter((p) => p.format === fmt).length
  const days = daysInMonth(monthKeyStr)
  const weeks = days / 7
  return {
    reels: count('Reel'),
    historias: count('Historia'),
    carruseles: count('Carrusel'),
    publicaciones: posts.length,
    targetReels: Math.round((Number(cadence.reelsPerDay) || 0) * days),
    targetHistorias: Math.round((Number(cadence.storiesPerDay) || 0) * days),
    targetCarruseles: Math.round((Number(cadence.carouselsPerWeek) || 0) * weeks),
  }
}

export function contentByStatus(posts, statuses) {
  return statuses.map((s) => ({ name: s.value, total: posts.filter((p) => p.status === s.value).length, color: s.color }))
}

export function contentByPillar(posts, pillars) {
  return pillars.map((name) => ({ name, total: posts.filter((p) => p.pillar === name).length })).filter((p) => p.total > 0)
}

export function contentByResponsible(posts, responsibles) {
  return responsibles.map((r) => ({ name: r.label, total: posts.filter((p) => p.responsible === r.value).length })).filter((r) => r.total > 0)
}

export function contentPublishedByMonth(posts) {
  const map = new Map()
  for (const p of posts.filter((x) => x.status === 'Publicado')) {
    const k = monthKey(p.date)
    if (!k) continue
    if (!map.has(k)) map.set(k, { key: k, label: fmtMonth(k), total: 0 })
    map.get(k).total += 1
  }
  return [...map.values()].sort((a, b) => (a.key < b.key ? -1 : 1))
}

// ---------- Notas compartidas ----------
// Fijadas primero, después por última edición descendente.
export function sortNotes(notes) {
  return [...notes].sort((a, b) => {
    const pinDiff = (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)
    if (pinDiff !== 0) return pinDiff
    return (b.updatedAt || b.createdAt || '').localeCompare(a.updatedAt || a.createdAt || '')
  })
}

// Los ítems tildados van al final (mismo orden relativo entre sí), sin tocar el
// array guardado — es solo para mostrar.
export function orderChecklistItems(items) {
  return [...(items || [])].sort((a, b) => (a.done ? 1 : 0) - (b.done ? 1 : 0))
}

export function noteProgress(note) {
  if (note.type !== 'checklist') return null
  const items = note.items || []
  return { done: items.filter((i) => i.done).length, total: items.length }
}

export function filterNotes(notes, query) {
  const q = (query || '').trim().toLowerCase()
  if (!q) return notes
  return notes.filter((n) => {
    const itemsText = (n.items || []).map((i) => i.text).join(' ')
    return `${n.title || ''} ${n.content || ''} ${itemsText}`.toLowerCase().includes(q)
  })
}
