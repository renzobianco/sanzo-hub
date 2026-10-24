import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { buildInitialState, DATA_VERSION, PRODUCT_DEFS } from '../data/defaults.js'
import { todayISO, uid } from '../utils/format.js'
import { supabase, supabaseReady, TABLES, COLLECTION_TABLES, PRODUCTS_TABLE, STATE_TABLE } from '../lib/supabase.js'
import { BrandMark } from '../components/ui/Icons.jsx'
import { fetchDolarQuotes, loadLastKnownDolar, DOLAR_CACHE_MS } from '../services/dolar.js'

const AppContext = createContext(null)

// Caché local: arranque instantáneo + resguardo si Supabase no responde. NO es la fuente de verdad.
const CACHE_KEY = 'sanzo_hub_cache_v2'
const USER_KEY = 'sanzo_hub_user'

function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveCache(state) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(state))
  } catch {
    /* si no entra (fotos muy pesadas), no rompemos la app por esto */
  }
}

function loadLocalUser() {
  try {
    return localStorage.getItem(USER_KEY) || null
  } catch {
    return null
  }
}

// Fusiona un backup completo (JSON exportado) con el esquema base. Se usa al importar.
function hydrate(raw) {
  const base = buildInitialState()
  if (!raw || typeof raw !== 'object') return base
  const merged = {
    ...base,
    ...raw,
    settings: { ...base.settings, ...(raw.settings || {}) },
    partners: {
      santino: { ...base.partners.santino, ...(raw.partners?.santino || {}) },
      renzo: { ...base.partners.renzo, ...(raw.partners?.renzo || {}) },
    },
  }
  const byId = new Map((raw.products || []).map((p) => [p.id, p]))
  merged.products = PRODUCT_DEFS.map((def) => {
    const saved = byId.get(def.id) || {}
    return { ...base.products.find((p) => p.id === def.id), ...saved, id: def.id, name: def.name, isKit: def.isKit }
  })
  for (const key of ['sales', 'expenses', 'orders', 'goals', 'followers', 'clients', 'phases', 'stockLog', 'contentPosts', 'notes', 'webOrders']) {
    if (!Array.isArray(merged[key])) merged[key] = base[key]
  }
  if (merged.phases.length === 0) merged.phases = base.phases
  if (merged.goals.length === 0) merged.goals = base.goals
  if (!Array.isArray(merged.settings.exchangeRateHistory)) merged.settings.exchangeRateHistory = []
  if (!Array.isArray(merged.settings.contentPillars) || merged.settings.contentPillars.length === 0) merged.settings.contentPillars = base.settings.contentPillars
  if (!merged.settings.contentCadence) merged.settings.contentCadence = base.settings.contentCadence
  delete merged.settings.currentUser
  delete merged.exportedAt
  delete merged.app
  merged.version = DATA_VERSION
  return merged
}

// Arma el estado completo a partir de lo que hay guardado en Supabase (una fila por documento).
function buildStateFromRows({ stateRows, productRows, collectionRows }) {
  const base = buildInitialState()
  const byStateId = Object.fromEntries(stateRows.map((r) => [r.id, r.payload]))
  const settings = { ...base.settings, ...(byStateId.settings || {}) }
  delete settings.currentUser
  const partners = {
    santino: { ...base.partners.santino, ...(byStateId.partner_santino || {}) },
    renzo: { ...base.partners.renzo, ...(byStateId.partner_renzo || {}) },
  }
  const byProductId = new Map(productRows.map((r) => [r.id, r.payload]))
  const products = PRODUCT_DEFS.map((def) => ({
    ...base.products.find((p) => p.id === def.id),
    ...(byProductId.get(def.id) || {}),
    id: def.id,
    name: def.name,
    isKit: def.isKit,
  }))
  const collections = {}
  for (const key of Object.keys(TABLES)) {
    const rows = collectionRows[key] || []
    collections[key] = rows.map((r) => ({ ...r.payload, id: r.id }))
  }
  return {
    version: DATA_VERSION,
    settings,
    partners,
    products,
    sales: collections.sales,
    expenses: collections.expenses,
    orders: collections.orders,
    goals: collections.goals.length ? collections.goals : base.goals,
    followers: collections.followers,
    clients: collections.clients,
    phases: collections.phases.length ? collections.phases : base.phases,
    stockLog: collections.stockLog,
    contentPosts: collections.contentPosts,
    notes: collections.notes,
    webOrders: collections.webOrders,
  }
}

// Reemplaza TODO el contenido de la base por lo que traiga `next` (se usa al sembrar por
// primera vez, al importar un backup y al borrar todo). Usa upsert para que sea repetible.
async function pushFullStateToSupabase(next) {
  const rows = { [STATE_TABLE]: [], [PRODUCTS_TABLE]: [] }
  rows[STATE_TABLE].push({ id: 'settings', payload: { ...next.settings, currentUser: undefined } })
  rows[STATE_TABLE].push({ id: 'partner_santino', payload: next.partners.santino })
  rows[STATE_TABLE].push({ id: 'partner_renzo', payload: next.partners.renzo })
  for (const p of next.products) rows[PRODUCTS_TABLE] = [...(rows[PRODUCTS_TABLE] || []), { id: p.id, payload: p }]
  for (const key of Object.keys(TABLES)) {
    rows[TABLES[key]] = (next[key] || []).map((item) => ({ id: item.id, payload: item }))
  }
  await Promise.all(
    Object.entries(rows).map(([table, records]) => (records.length ? supabase.from(table).upsert(records, { onConflict: 'id' }) : Promise.resolve())),
  )
}

async function clearAllTables() {
  const tables = [...COLLECTION_TABLES, PRODUCTS_TABLE, STATE_TABLE]
  for (const t of tables) {
    const { error } = await supabase.from(t).delete().neq('id', '__none__')
    if (error) throw error
  }
}

async function fetchFullState() {
  const [stateRes, productsRes, ...collectionRes] = await Promise.all([
    supabase.from(STATE_TABLE).select('*'),
    supabase.from(PRODUCTS_TABLE).select('*'),
    ...Object.values(TABLES).map((t) => supabase.from(t).select('*')),
  ])
  // Pedidos web: si todavía no se corrió 005_web_orders.sql, el Hub sigue andando sin esa sección.
  const webIdx = Object.keys(TABLES).indexOf('webOrders')
  if (collectionRes[webIdx]?.error) {
    console.warn('Falta la tabla sanzo_web_orders (correr supabase/migrations/005_web_orders.sql)', collectionRes[webIdx].error)
    collectionRes[webIdx] = { data: [], error: null }
  }
  for (const r of [stateRes, productsRes, ...collectionRes]) if (r.error) throw r.error

  const stateRows = stateRes.data || []
  const isFirstRun = !stateRows.some((r) => r.id === 'settings')
  if (isFirstRun) {
    const fresh = buildInitialState()
    await pushFullStateToSupabase(fresh)
    return fresh
  }
  const collectionRows = {}
  Object.keys(TABLES).forEach((key, i) => {
    collectionRows[key] = collectionRes[i].data || []
  })
  return buildStateFromRows({ stateRows, productRows: productsRes.data || [], collectionRows })
}

export function AppProvider({ children }) {
  const cached = useMemo(loadCache, [])
  // hydrate() (no solo `cached` tal cual) para que una caché vieja, guardada antes de
  // que existiera algún campo nuevo (ej. contentPosts), no rompa el primer render con
  // un array undefined mientras se espera la respuesta real de Supabase.
  const [state, setState] = useState(() => (cached ? hydrate(cached) : buildInitialState()))
  const [currentUser, setCurrentUserRaw] = useState(loadLocalUser)
  const [dbStatus, setDbStatus] = useState(cached ? 'ready' : 'loading') // loading | ready | error
  const [online, setOnline] = useState(true)
  const [activePartners, setActivePartners] = useState([])
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)
  const stateRef = useRef(state)
  stateRef.current = state

  // ---- Cotización del dólar (DolarApi.com) ----
  const [dolar, setDolar] = useState(() => {
    const last = loadLastKnownDolar()
    return { oficial: null, blue: null, fetchedAt: null, stale: false, loading: false, error: null, ...(last || {}) }
  })

  const refreshDolar = useCallback(async (opts) => {
    setDolar((d) => ({ ...d, loading: true }))
    try {
      const data = await fetchDolarQuotes(opts)
      setDolar({ ...data, loading: false })
    } catch (e) {
      setDolar((d) => ({ ...d, loading: false, error: e.message }))
    }
  }, [])

  useEffect(() => {
    refreshDolar()
    const id = setInterval(refreshDolar, DOLAR_CACHE_MS)
    return () => clearInterval(id)
  }, [refreshDolar])

  const notify = useCallback((message, kind = 'ok') => {
    clearTimeout(toastTimer.current)
    setToast({ message, kind, id: Date.now() })
    toastTimer.current = setTimeout(() => setToast(null), 3200)
  }, [])

  // Caché local en cada cambio: arranque rápido y resguardo si se corta la conexión.
  useEffect(() => {
    saveCache(state)
  }, [state])

  const setCurrentUser = useCallback((who) => {
    setCurrentUserRaw(who)
    try {
      who ? localStorage.setItem(USER_KEY, who) : localStorage.removeItem(USER_KEY)
    } catch {
      /* no pasa nada si no se puede guardar */
    }
  }, [])

  // Carga inicial + suscripción en vivo a los cambios que haga el otro socio.
  useEffect(() => {
    if (!supabaseReady) {
      setDbStatus('error')
      return
    }
    let cancelled = false

    fetchFullState()
      .then((fresh) => {
        if (cancelled) return
        setState(fresh)
        setDbStatus('ready')
        setOnline(true)
      })
      .catch((e) => {
        console.error('No se pudo cargar Sanzo Hub desde Supabase', e)
        if (cancelled) return
        setOnline(false)
        setDbStatus((s) => (s === 'ready' ? s : cached ? 'ready' : 'error'))
      })

    const applyCollectionChange = (key, payload) => {
      setState((s) => {
        const arr = s[key]
        if (payload.eventType === 'DELETE') return { ...s, [key]: arr.filter((x) => x.id !== payload.old.id) }
        const item = { ...payload.new.payload, id: payload.new.id }
        const exists = arr.some((x) => x.id === item.id)
        return { ...s, [key]: exists ? arr.map((x) => (x.id === item.id ? item : x)) : [item, ...arr] }
      })
    }

    const applyProductChange = (payload) => {
      if (payload.eventType === 'DELETE') return
      const item = { ...payload.new.payload, id: payload.new.id }
      setState((s) => ({ ...s, products: s.products.map((p) => (p.id === item.id ? { ...p, ...item } : p)) }))
    }

    const applyStateChange = (payload) => {
      if (payload.eventType === 'DELETE') return
      const { id, payload: value } = payload.new
      setState((s) => {
        if (id === 'settings') {
          const clean = { ...value }
          delete clean.currentUser
          return { ...s, settings: { ...s.settings, ...clean } }
        }
        if (id === 'partner_santino') return { ...s, partners: { ...s.partners, santino: value } }
        if (id === 'partner_renzo') return { ...s, partners: { ...s.partners, renzo: value } }
        return s
      })
    }

    const channel = supabase.channel('sanzo-sync')
    for (const [key, table] of Object.entries(TABLES)) {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => applyCollectionChange(key, payload))
    }
    channel.on('postgres_changes', { event: '*', schema: 'public', table: PRODUCTS_TABLE }, applyProductChange)
    channel.on('postgres_changes', { event: '*', schema: 'public', table: STATE_TABLE }, applyStateChange)
    channel.subscribe((status) => {
      if (cancelled) return
      if (status === 'SUBSCRIBED') setOnline(true)
      else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') setOnline(false)
    })

    const onOffline = () => setOnline(false)
    const onOnline = () => setOnline(true)
    window.addEventListener('offline', onOffline)
    window.addEventListener('online', onOnline)

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
      window.removeEventListener('offline', onOffline)
      window.removeEventListener('online', onOnline)
    }
  }, [cached])

  // Presencia: quién más está con la app abierta ahora mismo.
  useEffect(() => {
    if (!supabaseReady || !currentUser) {
      setActivePartners([])
      return
    }
    const presence = supabase.channel('sanzo-presence', { config: { presence: { key: currentUser } } })
    presence
      .on('presence', { event: 'sync' }, () => {
        setActivePartners(Object.keys(presence.presenceState()))
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          try {
            await presence.track({ at: Date.now() })
          } catch {
            /* no es crítico */
          }
        }
      })
    return () => supabase.removeChannel(presence)
  }, [currentUser])

  const reportError = useCallback(
    (label) => (error) => {
      if (error) notify(`${label}: ${error.message}`, 'error')
    },
    [notify],
  )

  // ---- helpers genéricos por colección (gastos, pedidos, metas, seguidores, clientes, stockLog) ----
  const addItem = useCallback(
    (key, item) => {
      const id = uid()
      const full = { id, createdAt: new Date().toISOString(), ...item }
      setState((s) => ({ ...s, [key]: [full, ...s[key]] }))
      supabase.from(TABLES[key]).insert({ id, payload: full }).then(({ error }) => reportError('No se pudo guardar')(error))
      return full
    },
    [reportError],
  )

  const updateItem = useCallback(
    (key, id, patch) => {
      const prev = stateRef.current[key].find((x) => x.id === id)
      if (!prev) return
      const next = { ...prev, ...(typeof patch === 'function' ? patch(prev) : patch), updatedAt: new Date().toISOString() }
      setState((s) => ({ ...s, [key]: s[key].map((x) => (x.id === id ? next : x)) }))
      supabase
        .from(TABLES[key])
        .update({ payload: next, updated_at: next.updatedAt })
        .eq('id', id)
        .then(({ error }) => reportError('No se pudo actualizar')(error))
    },
    [reportError],
  )

  const removeItem = useCallback(
    (key, id) => {
      setState((s) => ({ ...s, [key]: s[key].filter((it) => it.id !== id) }))
      supabase
        .from(TABLES[key])
        .delete()
        .eq('id', id)
        .then(({ error }) => reportError('No se pudo borrar')(error))
    },
    [reportError],
  )

  // ---- settings compartidos ----
  const updateSettings = useCallback(
    (patch) => {
      const { currentUser: _ignored, ...clean } = patch || {}
      const next = { ...stateRef.current.settings, ...clean }
      setState((s) => ({ ...s, settings: next }))
      supabase
        .from(STATE_TABLE)
        .upsert({ id: 'settings', payload: next, updated_at: new Date().toISOString() })
        .then(({ error }) => reportError('No se pudo guardar la configuración')(error))
    },
    [reportError],
  )

  const setExchangeRate = useCallback(
    (rate, { source = 'manual' } = {}) => {
      const r = Number(rate)
      if (!r || r <= 0) return
      const cur = stateRef.current.settings
      if (cur.exchangeRate === r) return
      const entry = { id: uid(), date: todayISO(), at: new Date().toISOString(), rate: r, prev: cur.exchangeRate, source }
      const history = [entry, ...cur.exchangeRateHistory].slice(0, 200)
      const next = { ...cur, exchangeRate: r, exchangeRateHistory: history }
      setState((s) => ({ ...s, settings: next }))
      supabase
        .from(STATE_TABLE)
        .upsert({ id: 'settings', payload: next, updated_at: new Date().toISOString() })
        .then(({ error }) => reportError('No se pudo guardar el tipo de cambio')(error))
    },
    [reportError],
  )

  // Mientras el modo elegido sea automático (oficial/blue), mantenemos settings.exchangeRate
  // — que ya usa toda la app para convertir USD→ARS — sincronizado con la cotización vigente.
  // En modo manual no tocamos nada: se respeta lo que cargó el usuario.
  useEffect(() => {
    if (dbStatus !== 'ready') return
    const src = stateRef.current.settings.dolarSource
    if (src === 'manual') return
    const venta = dolar[src]?.venta
    if (venta > 0) setExchangeRate(venta, { source: 'auto' })
  }, [dolar, dbStatus, setExchangeRate])

  const setDolarSource = useCallback(
    (source) => {
      updateSettings({ dolarSource: source })
    },
    [updateSettings],
  )

  const setPartnerPhoto = useCallback(
    (who, photo) => {
      const next = { ...stateRef.current.partners[who], photo }
      setState((s) => ({ ...s, partners: { ...s.partners, [who]: next } }))
      supabase
        .from(STATE_TABLE)
        .upsert({ id: `partner_${who}`, payload: next, updated_at: new Date().toISOString() })
        .then(({ error }) => reportError('No se pudo guardar la foto')(error))
    },
    [reportError],
  )

  // ---- productos ----
  const updateProduct = useCallback(
    (id, patch) => {
      const prev = stateRef.current.products.find((p) => p.id === id)
      if (!prev) return
      const next = { ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) }
      setState((s) => ({ ...s, products: s.products.map((p) => (p.id === id ? next : p)) }))
      supabase
        .from(PRODUCTS_TABLE)
        .upsert({ id, payload: next, updated_at: new Date().toISOString() })
        .then(({ error }) => reportError('No se pudo guardar el producto')(error))
    },
    [reportError],
  )

  // ---- fases (metas del negocio) ----
  const savePhases = useCallback(
    (list) => {
      setState((s) => ({ ...s, phases: list }))
      Promise.all(list.map((ph) => supabase.from(TABLES.phases).upsert({ id: ph.id, payload: ph, updated_at: new Date().toISOString() }))).then((results) =>
        results.forEach((r) => reportError('No se pudieron guardar las fases')(r.error)),
      )
    },
    [reportError],
  )

  // ---- ventas: descuentan/reponen stock de forma atómica en la base (evita pisadas entre los dos socios) ----
  const addSale = useCallback(
    (sale) => {
      const id = uid()
      const full = { id, createdAt: new Date().toISOString(), ...sale }
      const qty = Number(sale.qty) || 0
      setState((s) => ({
        ...s,
        sales: [full, ...s.sales],
        products: s.products.map((p) => (p.id === sale.productId ? { ...p, stock: Math.max(0, (Number(p.stock) || 0) - qty) } : p)),
      }))
      ;(async () => {
        const { error: e1 } = await supabase.from(TABLES.sales).insert({ id, payload: full })
        if (e1) return notify('No se pudo guardar la venta: ' + e1.message, 'error')
        const { error: e2 } = await supabase.rpc('adjust_product_stock', { p_id: sale.productId, stock_delta: -qty, initial_delta: 0 })
        if (e2) notify('La venta se guardó pero no se pudo descontar el stock: ' + e2.message, 'error')
      })()
      return full
    },
    [notify],
  )

  const updateSale = useCallback(
    (id, patch) => {
      const prev = stateRef.current.sales.find((x) => x.id === id)
      if (!prev) return
      const next = { ...prev, ...patch, updatedAt: new Date().toISOString() }
      const stockOps = []
      if (prev.productId !== next.productId || Number(prev.qty) !== Number(next.qty)) {
        if (prev.productId === next.productId) {
          stockOps.push({ productId: prev.productId, delta: (Number(prev.qty) || 0) - (Number(next.qty) || 0) })
        } else {
          stockOps.push({ productId: prev.productId, delta: Number(prev.qty) || 0 })
          stockOps.push({ productId: next.productId, delta: -(Number(next.qty) || 0) })
        }
      }
      setState((s) => {
        let products = s.products
        if (stockOps.length) {
          products = products.map((p) => {
            const op = stockOps.find((o) => o.productId === p.id)
            return op ? { ...p, stock: Math.max(0, (Number(p.stock) || 0) + op.delta) } : p
          })
        }
        return { ...s, products, sales: s.sales.map((x) => (x.id === id ? next : x)) }
      })
      ;(async () => {
        const { error } = await supabase.from(TABLES.sales).update({ payload: next, updated_at: next.updatedAt }).eq('id', id)
        if (error) notify('No se pudo actualizar la venta: ' + error.message, 'error')
        for (const op of stockOps) {
          const { error: e2 } = await supabase.rpc('adjust_product_stock', { p_id: op.productId, stock_delta: op.delta, initial_delta: 0 })
          if (e2) notify('No se pudo reajustar el stock: ' + e2.message, 'error')
        }
      })()
    },
    [notify],
  )

  const removeSale = useCallback(
    (id, { restoreStock = true } = {}) => {
      const prev = stateRef.current.sales.find((x) => x.id === id)
      if (!prev) return
      const qty = Number(prev.qty) || 0
      setState((s) => ({
        ...s,
        products: restoreStock ? s.products.map((p) => (p.id === prev.productId ? { ...p, stock: (Number(p.stock) || 0) + qty } : p)) : s.products,
        sales: s.sales.filter((x) => x.id !== id),
      }))
      ;(async () => {
        const { error } = await supabase.from(TABLES.sales).delete().eq('id', id)
        if (error) notify('No se pudo borrar la venta: ' + error.message, 'error')
        if (restoreStock) {
          const { error: e2 } = await supabase.rpc('adjust_product_stock', { p_id: prev.productId, stock_delta: qty, initial_delta: 0 })
          if (e2) notify('No se pudo devolver el stock: ' + e2.message, 'error')
        }
      })()
    },
    [notify],
  )

  // ---- pedidos de la web (sanzo-web) ----
  // Pasar a ventas lo hace la base (aplicar_pedido_web, ver 005_web_orders.sql): crea las ventas,
  // descuenta el stock y marca el pedido, una sola vez. Los cambios llegan por realtime.
  const confirmWebOrder = useCallback(
    async (id) => {
      const { data, error } = await supabase.rpc('aplicar_pedido_web', {
        p_id: id,
        p_pago: { manual: true, por: currentUser, fecha: new Date().toISOString() },
      })
      if (error) return notify('No se pudo confirmar el pedido: ' + error.message, 'error')
      if (data === 'ya_aplicado') return notify('Ese pedido ya estaba pasado a ventas.')
      notify('Pedido confirmado. Ventas cargadas y stock descontado.')
    },
    [currentUser, notify],
  )

  const setWebOrderStatus = useCallback(
    async (id, estado) => {
      const { data, error } = await supabase.rpc('estado_pedido_web', { p_id: id, p_estado: estado, p_pago: null })
      if (error) return notify('No se pudo cambiar el estado: ' + error.message, 'error')
      if (data === 'ya_aplicado') return notify('Ya está pasado a ventas: para anularlo, borrá esas ventas en Ventas.', 'error')
    },
    [notify],
  )

  // ---- pedidos a China: recepción ----
  const receiveOrder = useCallback(
    (orderId, { addStock, addExpense }) => {
      const order = stateRef.current.orders.find((o) => o.id === orderId)
      if (!order) return
      const willAddStock = addStock && !order.stockApplied
      const willAddExpense = addExpense && !order.expenseApplied
      const qtyBy = {}
      if (willAddStock) for (const it of order.items || []) qtyBy[it.productId] = (qtyBy[it.productId] || 0) + (Number(it.qty) || 0)
      let expenseFull = null
      if (willAddExpense) {
        const total = (Number(order.fobUSD) || 0) + (Number(order.freightUSD) || 0) + (Number(order.otherUSD) || 0)
        const units = (order.items || []).reduce((a, i) => a + (Number(i.qty) || 0), 0)
        expenseFull = {
          id: uid(),
          createdAt: new Date().toISOString(),
          date: todayISO(),
          category: 'Mercadería',
          description: `Pedido a ${order.supplier || 'proveedor'} (${units} unidades)`,
          amount: total,
          currency: 'USD',
          rate: stateRef.current.settings.exchangeRate,
          recurring: false,
          orderId,
        }
      }
      const nextOrder = {
        ...order,
        status: 'Recibido',
        receivedAt: order.receivedAt || todayISO(),
        stockApplied: order.stockApplied || !!addStock,
        expenseApplied: order.expenseApplied || !!addExpense,
      }
      setState((s) => ({
        ...s,
        products: willAddStock
          ? s.products.map((p) =>
              qtyBy[p.id] ? { ...p, stock: (Number(p.stock) || 0) + qtyBy[p.id], initialStock: (Number(p.initialStock) || 0) + qtyBy[p.id] } : p,
            )
          : s.products,
        expenses: expenseFull ? [expenseFull, ...s.expenses] : s.expenses,
        orders: s.orders.map((o) => (o.id === orderId ? nextOrder : o)),
      }))
      ;(async () => {
        const { error } = await supabase.from(TABLES.orders).update({ payload: nextOrder, updated_at: new Date().toISOString() }).eq('id', orderId)
        if (error) notify('No se pudo actualizar el pedido: ' + error.message, 'error')
        if (expenseFull) {
          const { error: e2 } = await supabase.from(TABLES.expenses).insert({ id: expenseFull.id, payload: expenseFull })
          if (e2) notify('No se pudo registrar el gasto del pedido: ' + e2.message, 'error')
        }
        for (const [productId, qty] of Object.entries(qtyBy)) {
          const { error: e3 } = await supabase.rpc('adjust_product_stock', { p_id: productId, stock_delta: qty, initial_delta: qty })
          if (e3) notify('No se pudo sumar el stock del pedido: ' + e3.message, 'error')
        }
      })()
    },
    [notify],
  )

  // ---- backup ----
  const exportBackup = useCallback(() => {
    const now = new Date().toISOString()
    const snapshot = { ...state, settings: { ...state.settings, lastBackupExport: now }, exportedAt: now, app: 'Sanzo Hub' }
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const d = new Date()
    const pad = (n) => String(n).padStart(2, '0')
    const stamp = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`
    a.href = url
    a.download = `sanzo-hub-backup_${stamp}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    updateSettings({ lastBackupExport: now })
    notify('Backup exportado. Guardalo en un lugar seguro.')
  }, [state, updateSettings, notify])

  const importBackup = useCallback(
    (file) =>
      new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = async () => {
          try {
            const parsed = JSON.parse(reader.result)
            if (!parsed || typeof parsed !== 'object' || !('products' in parsed || 'sales' in parsed)) {
              throw new Error('El archivo no parece un backup de Sanzo Hub')
            }
            const next = hydrate(parsed)
            next.settings.lastBackupExport = parsed.settings?.lastBackupExport || parsed.exportedAt || null
            setState(next)
            await clearAllTables()
            await pushFullStateToSupabase(next)
            notify('Backup importado. Los dos van a ver estos datos.')
            resolve(next)
          } catch (e) {
            notify(e.message || 'No se pudo leer el backup', 'error')
            reject(e)
          }
        }
        reader.onerror = () => {
          notify('No se pudo leer el archivo', 'error')
          reject(reader.error)
        }
        reader.readAsText(file)
      }),
    [notify],
  )

  const resetAll = useCallback(() => {
    const fresh = buildInitialState()
    setState(fresh)
    setCurrentUser(null)
    ;(async () => {
      try {
        await clearAllTables()
        await pushFullStateToSupabase(fresh)
      } catch (e) {
        notify('Se limpió acá, pero hubo un error borrando en la base: ' + e.message, 'error')
      }
    })()
    notify('Arrancamos de cero. Todo limpio.')
  }, [notify, setCurrentUser])

  const retryConnection = useCallback(() => {
    setDbStatus('loading')
    fetchFullState()
      .then((fresh) => {
        setState(fresh)
        setDbStatus('ready')
        setOnline(true)
      })
      .catch((e) => {
        notify('Seguimos sin poder conectar: ' + e.message, 'error')
        setDbStatus(cached ? 'ready' : 'error')
      })
  }, [cached, notify])

  const value = useMemo(
    () => ({
      state: { ...state, settings: { ...state.settings, currentUser } },
      currentUser,
      setCurrentUser,
      online,
      activePartners,
      toast,
      notify,
      addItem,
      updateItem,
      removeItem,
      updateSettings,
      setExchangeRate,
      dolar,
      refreshDolar,
      setDolarSource,
      setPartnerPhoto,
      updateProduct,
      savePhases,
      addSale,
      updateSale,
      removeSale,
      receiveOrder,
      confirmWebOrder,
      setWebOrderStatus,
      exportBackup,
      importBackup,
      resetAll,
    }),
    [
      state,
      currentUser,
      setCurrentUser,
      online,
      activePartners,
      toast,
      notify,
      addItem,
      updateItem,
      removeItem,
      updateSettings,
      setExchangeRate,
      dolar,
      refreshDolar,
      setDolarSource,
      setPartnerPhoto,
      updateProduct,
      savePhases,
      addSale,
      updateSale,
      removeSale,
      receiveOrder,
      confirmWebOrder,
      setWebOrderStatus,
      exportBackup,
      importBackup,
      resetAll,
    ],
  )

  if (dbStatus === 'loading') {
    return <BootScreen />
  }
  if (dbStatus === 'error') {
    return <ErrorScreen onRetry={retryConnection} />
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

function BootScreen() {
  return (
    <div className="user-picker">
      <div className="user-picker-card">
        <BrandMark size={84} style={{ display: 'block', margin: '0 auto' }} />
        <h1 style={{ marginTop: 18 }}>Sanzo Hub</h1>
        <p className="muted" style={{ marginTop: 8 }}>
          Conectando con la base compartida…
        </p>
      </div>
    </div>
  )
}

function ErrorScreen({ onRetry }) {
  return (
    <div className="user-picker">
      <div className="user-picker-card">
        <BrandMark size={84} style={{ display: 'block', margin: '0 auto' }} />
        <h1 style={{ marginTop: 18 }}>No pudimos conectar</h1>
        <p className="muted" style={{ marginTop: 8 }}>
          Revisá tu conexión a internet. Sanzo Hub necesita llegar a la base compartida para mostrar los datos de los dos socios.
        </p>
        <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={onRetry}>
          Reintentar
        </button>
      </div>
    </div>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp debe usarse dentro de AppProvider')
  return ctx
}
