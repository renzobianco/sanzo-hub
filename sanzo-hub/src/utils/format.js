// Formato argentino: $ 1.250.500,00 — fechas DD/MM/AAAA

const arsFmt = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const intFmt = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 })

export function fmtARS(n, { compact = false } = {}) {
  const v = Number(n) || 0
  if (compact && Math.abs(v) >= 1_000_000) {
    return `$ ${(v / 1_000_000).toLocaleString('es-AR', { maximumFractionDigits: 2 })} M`
  }
  return `$ ${arsFmt.format(v)}`
}

export function fmtUSD(n) {
  const v = Number(n) || 0
  return `USD ${arsFmt.format(v)}`
}

// Etiquetas cortas para ejes de gráficos: $2,4 M · $280 mil · $950
export function fmtAxis(n) {
  const v = Number(n) || 0
  const abs = Math.abs(v)
  const sign = v < 0 ? '-' : ''
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toLocaleString('es-AR', { maximumFractionDigits: 1 })} M`
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toLocaleString('es-AR', { maximumFractionDigits: 0 })} mil`
  return `${sign}$${intFmt.format(abs)}`
}

export function fmtNum(n) {
  return intFmt.format(Number(n) || 0)
}

export function fmtPct(n, digits = 0) {
  const v = Number(n) || 0
  return `${v.toLocaleString('es-AR', { minimumFractionDigits: digits, maximumFractionDigits: digits })} %`
}

export function fmtDecimal(n, digits = 2) {
  return (Number(n) || 0).toLocaleString('es-AR', { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

// Fechas: se guardan como 'YYYY-MM-DD' y se muestran 'DD/MM/AAAA'
export function todayISO() {
  const d = new Date()
  return toISO(d)
}

export function toISO(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseISO(iso) {
  if (!iso) return null
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function fmtDate(iso) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export function fmtDateShort(iso) {
  if (!iso) return ''
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}

export function fmtDateTime(isoDateTime) {
  if (!isoDateTime) return '—'
  const d = new Date(isoDateTime)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${d.getFullYear()} ${hh}:${mi}`
}

export function monthKey(iso) {
  return iso ? iso.slice(0, 7) : ''
}

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const MONTHS_LONG = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

export function fmtMonth(key) {
  if (!key) return ''
  const [y, m] = key.split('-').map(Number)
  return `${MONTHS[m - 1]} '${String(y).slice(2)}`
}

export function fmtMonthLong(key) {
  if (!key) return ''
  const [y, m] = key.split('-').map(Number)
  return `${MONTHS_LONG[m - 1]} ${y}`
}

export function addDays(iso, n) {
  const d = parseISO(iso)
  d.setDate(d.getDate() + n)
  return toISO(d)
}

export function addMonths(monthKeyStr, n) {
  const [y, m] = monthKeyStr.split('-').map(Number)
  const d = new Date(y, m - 1 + n, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function daysInMonth(monthKeyStr) {
  const [y, m] = monthKeyStr.split('-').map(Number)
  return new Date(y, m, 0).getDate()
}

// Grilla de 6 semanas (42 días) arrancando en lunes, para el calendario mensual.
export function monthGrid(monthKeyStr) {
  const [y, m] = monthKeyStr.split('-').map(Number)
  const first = new Date(y, m - 1, 1)
  const firstWeekday = (first.getDay() + 6) % 7 // 0 = lunes
  const start = addDays(toISO(first), -firstWeekday)
  return Array.from({ length: 42 }, (_, i) => {
    const date = addDays(start, i)
    return { date, inMonth: date.slice(0, 7) === monthKeyStr }
  })
}

export function daysBetween(isoA, isoB) {
  const a = parseISO(isoA)
  const b = parseISO(isoB)
  if (!a || !b) return 0
  return Math.round((b - a) / 86400000)
}

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0].toUpperCase())
    .join('')
}

// Tiempo relativo tipo "hace 2 hs" para notas y cosas editadas en vivo.
export function fmtRelative(isoDateTime) {
  if (!isoDateTime) return ''
  const then = new Date(isoDateTime).getTime()
  if (Number.isNaN(then)) return ''
  const diffSec = Math.max(0, Math.floor((Date.now() - then) / 1000))
  if (diffSec < 45) return 'recién'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `hace ${diffMin} min`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `hace ${diffHr} hs`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) return `hace ${diffDay} ${diffDay === 1 ? 'día' : 'días'}`
  return fmtDateTime(isoDateTime)
}

// Antigüedad de una cotización: "hoy 11:30", "ayer", "hace 2 días" (fmtRelative para el resto).
export function fmtDolarAge(isoDateTime) {
  if (!isoDateTime) return ''
  const d = new Date(isoDateTime)
  if (Number.isNaN(d.getTime())) return ''
  const now = new Date()
  if (d.toDateString() === now.toDateString()) {
    const hh = String(d.getHours()).padStart(2, '0')
    const mi = String(d.getMinutes()).padStart(2, '0')
    return `hoy ${hh}:${mi}`
  }
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return 'ayer'
  return fmtRelative(isoDateTime)
}

export function uid() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}
