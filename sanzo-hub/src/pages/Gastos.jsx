import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { PageHeader, Modal, ConfirmDialog, EmptyState, Field, MoneyInput } from '../components/ui/Primitives.jsx'
import { DolarSourceNote } from '../components/ui/ExchangeRate.jsx'
import { IconPlus, IconEdit, IconTrash, IconSearch, IconRepeat, IconCheck, IconX } from '../components/ui/Icons.jsx'
import { EXPENSE_CATEGORIES } from '../data/defaults.js'
import { fmtARS, fmtUSD, fmtDate, fmtNum, todayISO, monthKey, fmtMonthLong, fmtDecimal } from '../utils/format.js'
import { expenseARS, expenseARSToday, expenseHasHistoricalRate, sumExpenses, sumExpensesUSD, inRange } from '../utils/calc.js'

export default function Gastos() {
  const { state, addItem, updateItem, removeItem, notify } = useApp()
  const { expenses, settings } = state
  const rate = settings.exchangeRate
  const [modal, setModal] = useState(null)
  const [toDelete, setToDelete] = useState(null)
  const [filters, setFilters] = useState({ q: '', category: '', from: '', to: '' })
  const today = todayISO()
  const thisMonth = monthKey(today)

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase()
    return expenses
      .filter((e) => {
        if (filters.category && e.category !== filters.category) return false
        if (!inRange(e.date, filters.from || null, filters.to || null)) return false
        if (q && !`${e.description || ''} ${e.category}`.toLowerCase().includes(q)) return false
        return true
      })
      .sort((a, b) => (b.date + (b.createdAt || '')).localeCompare(a.date + (a.createdAt || '')))
  }, [expenses, filters])

  // Gastos fijos: la última versión de cada gasto recurrente (por descripción + categoría)
  const fixed = useMemo(() => {
    const map = new Map()
    const sorted = [...expenses].filter((e) => e.recurring).sort((a, b) => (a.date < b.date ? 1 : -1))
    for (const e of sorted) {
      const k = `${e.category}|${(e.description || '').trim().toLowerCase()}`
      if (!map.has(k)) map.set(k, e)
    }
    return [...map.values()].map((tpl) => {
      const k = `${tpl.category}|${(tpl.description || '').trim().toLowerCase()}`
      const loadedThisMonth = expenses.some((e) => monthKey(e.date) === thisMonth && `${e.category}|${(e.description || '').trim().toLowerCase()}` === k)
      return { tpl, loadedThisMonth }
    })
  }, [expenses, thisMonth])

  const fixedMonthly = fixed.reduce((a, { tpl }) => a + expenseARSToday(tpl, rate), 0)
  const pendingFixed = fixed.filter((f) => !f.loadedThisMonth)
  const total = sumExpenses(filtered, rate)
  const totalUSD = sumExpensesUSD(filtered)
  const hasFilters = Object.values(filters).some(Boolean)

  const loadFixed = (tpl) => {
    addItem('expenses', { date: today, category: tpl.category, description: tpl.description, amount: tpl.amount, currency: tpl.currency, rate: tpl.currency === 'USD' ? rate : undefined, recurring: true })
    notify(`Cargado: ${tpl.description || tpl.category} para ${fmtMonthLong(thisMonth)}`)
  }

  const onSave = (data, id) => {
    if (id) {
      updateItem('expenses', id, data)
      notify('Gasto actualizado')
    } else {
      addItem('expenses', data)
      notify('Gasto registrado')
    }
    setModal(null)
  }

  return (
    <div>
      <PageHeader eyebrow="Gastos" title="Gastos" subtitle="Todo lo que sale: mercadería, flete, apps, envíos, packaging. Los USD guardan la cotización del día en que se cargan, y además mostramos cuánto valdrían hoy.">
        <button className="btn btn-primary" onClick={() => setModal('new')}>
          <IconPlus /> Nuevo gasto
        </button>
      </PageHeader>

      <div className="grid grid-4 mb-16">
        <div className="card" style={{ padding: '16px 18px' }}>
          <div className="kpi-label">{hasFilters ? 'Total del período filtrado' : 'Total gastado'}</div>
          <div className="kpi-value sm neg" style={{ marginTop: 6 }}>
            {fmtARS(total)}
          </div>
          <div className="kpi-foot">
            Histórico · lo que realmente se pagó · {fmtNum(filtered.length)} {filtered.length === 1 ? 'gasto' : 'gastos'}
          </div>
        </div>
        <div className="card" style={{ padding: '16px 18px' }}>
          <div className="kpi-label">Total en USD</div>
          <div className="kpi-value sm neg" style={{ marginTop: 6 }}>
            {fmtUSD(totalUSD)}
          </div>
          <div className="kpi-foot">≈ {fmtARS(totalUSD * rate)} hoy</div>
        </div>
        <div className="card" style={{ padding: '16px 18px' }}>
          <div className="kpi-label">Gastos fijos por mes</div>
          <div className="kpi-value sm" style={{ marginTop: 6 }}>
            {fmtARS(fixedMonthly)}
          </div>
          <div className="kpi-foot">{fixed.length} {fixed.length === 1 ? 'suscripción o gasto recurrente' : 'suscripciones y gastos recurrentes'}</div>
        </div>
        <div className="card" style={{ padding: '16px 18px' }}>
          <div className="kpi-label">Pendientes de cargar este mes</div>
          <div className={`kpi-value sm ${pendingFixed.length ? 'neg' : 'pos'}`} style={{ marginTop: 6 }}>
            {fmtNum(pendingFixed.length)}
          </div>
          <div className="kpi-foot">{pendingFixed.length ? 'Cargalos abajo con un toque' : 'Todo al día'}</div>
        </div>
      </div>

      <div className="mb-16">
        <DolarSourceNote prefix="Conversión de hoy a" />
      </div>

      {fixed.length > 0 && (
        <div className="card beige mb-16">
          <div className="card-head" style={{ marginBottom: 10 }}>
            <div>
              <div className="card-title">
                <IconRepeat style={{ width: 18, height: 18, verticalAlign: '-3px', marginRight: 6 }} />
                Gastos fijos mensuales
              </div>
              <div className="card-sub" style={{ color: 'var(--caramel-dark)' }}>
                Se repiten cada mes. Cargá los de {fmtMonthLong(thisMonth)} con un toque.
              </div>
            </div>
          </div>
          <div className="list">
            {fixed.map(({ tpl, loadedThisMonth }) => (
              <div className="list-item" key={tpl.id} style={{ borderColor: 'rgba(149,96,55,0.15)' }}>
                <div className="body">
                  <div className="title">{tpl.description || tpl.category}</div>
                  <div className="sub" style={{ color: 'var(--caramel-dark)', opacity: 0.8 }}>
                    {tpl.category} · {tpl.currency === 'USD' ? `${fmtUSD(tpl.amount)} ≈ ${fmtARS(expenseARSToday(tpl, rate))} hoy` : fmtARS(tpl.amount)}
                  </div>
                </div>
                {loadedThisMonth ? (
                  <span className="chip green">
                    <IconCheck style={{ width: 13, height: 13 }} /> Cargado este mes
                  </span>
                ) : (
                  <button className="btn btn-primary btn-sm" onClick={() => loadFixed(tpl)}>
                    <IconPlus /> Cargar este mes
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <div className="toolbar">
          <div className="search">
            <IconSearch />
            <input className="input" placeholder="Buscar por descripción…" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} />
          </div>
          <select className="select" value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
            <option value="">Todas las categorías</option>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <input className="input" type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} title="Desde" />
          <input className="input" type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} title="Hasta" />
          {hasFilters && (
            <button className="btn btn-ghost btn-sm" onClick={() => setFilters({ q: '', category: '', from: '', to: '' })}>
              <IconX /> Limpiar
            </button>
          )}
        </div>

        {expenses.length === 0 ? (
          <EmptyState title="Todavía no hay gastos" text="Cargá la compra a China, el flete, las apps que pagan por mes. Así la ganancia neta es real." action={() => setModal('new')} actionLabel="Cargar el primer gasto" />
        ) : filtered.length === 0 ? (
          <EmptyState compact title="Nada con esos filtros" text="Probá con otra búsqueda o limpiá los filtros." />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Descripción</th>
                  <th>Categoría</th>
                  <th className="num">Monto</th>
                  <th className="num">En pesos, hoy</th>
                  <th className="actions"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => {
                  const today = expenseARSToday(e, rate)
                  const hist = expenseARS(e, rate)
                  const hasHist = expenseHasHistoricalRate(e)
                  const differs = e.currency === 'USD' && Math.round(today) !== Math.round(hist)
                  return (
                    <tr key={e.id}>
                      <td className="tabular">{fmtDate(e.date)}</td>
                      <td>
                        <div className="cell-title">
                          {e.description || <span className="muted">Sin descripción</span>}
                          {e.recurring && (
                            <span className="chip outline" style={{ marginLeft: 8, padding: '2px 8px', fontSize: 11 }}>
                              <IconRepeat style={{ width: 11, height: 11 }} /> mensual
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="muted">{e.category}</td>
                      <td className="num">{e.currency === 'USD' ? fmtUSD(e.amount) : fmtARS(e.amount)}</td>
                      <td className="num strong neg">
                        {fmtARS(today)}
                        {e.currency === 'USD' && (
                          <>
                            <div className="cell-sub">a $ {fmtDecimal(rate, 0)} hoy</div>
                            {differs && (
                              <div className="cell-sub">
                                Pagó {fmtARS(hist)} el {fmtDate(e.date)} a $ {fmtDecimal(e.rate || rate, 0)}
                                {!hasHist && ' (estimado)'}
                              </div>
                            )}
                          </>
                        )}
                      </td>
                      <td className="actions">
                        <button className="btn btn-icon" onClick={() => setModal(e)} aria-label="Editar">
                          <IconEdit />
                        </button>
                        <button className="btn btn-icon danger" onClick={() => setToDelete(e)} aria-label="Borrar">
                          <IconTrash />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && <ExpenseForm key={modal === 'new' ? 'new' : modal.id} expense={modal === 'new' ? null : modal} rate={rate} onClose={() => setModal(null)} onSave={onSave} />}

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          removeItem('expenses', toDelete.id)
          notify('Gasto borrado')
        }}
        title="¿Borrar este gasto?"
        message={toDelete ? `${toDelete.description || toDelete.category} del ${fmtDate(toDelete.date)} por ${toDelete.currency === 'USD' ? fmtUSD(toDelete.amount) : fmtARS(toDelete.amount)}.` : ''}
      />
    </div>
  )
}

function ExpenseForm({ expense, rate, onClose, onSave }) {
  const [f, setF] = useState(() => ({
    date: todayISO(),
    category: 'Apps y suscripciones',
    description: '',
    amount: '',
    currency: 'ARS',
    rate: rate,
    recurring: false,
    ...(expense || {}),
    rate: expense?.rate || rate,
  }))
  const [err, setErr] = useState('')
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }))
  const inARS = f.currency === 'USD' ? (Number(f.amount) || 0) * (Number(f.rate) || 0) : Number(f.amount) || 0

  const submit = (e) => {
    e.preventDefault()
    if (!f.date) return setErr('Cargá la fecha.')
    if (!(Number(f.amount) > 0)) return setErr('El monto tiene que ser mayor a cero.')
    if (f.currency === 'USD' && !(Number(f.rate) > 0)) return setErr('Cargá el tipo de cambio para convertir a pesos.')
    onSave(
      {
        date: f.date,
        category: f.category,
        description: f.description.trim(),
        amount: Number(f.amount),
        currency: f.currency,
        rate: f.currency === 'USD' ? Number(f.rate) : undefined,
        recurring: !!f.recurring,
      },
      expense?.id,
    )
  }

  return (
    <Modal open onClose={onClose} title={expense ? 'Editar gasto' : 'Nuevo gasto'} subtitle="Si es en dólares, se guarda con el tipo de cambio de ese día.">
      <form onSubmit={submit}>
        <div className="form-grid">
          <Field label="Fecha">
            <input className="input" type="date" value={f.date} onChange={(e) => set('date', e.target.value)} required />
          </Field>
          <Field label="Categoría">
            <select className="select" value={f.category} onChange={(e) => set('category', e.target.value)}>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Descripción" full>
            <input className="input" placeholder="Ej: Suscripción Dreamina, Cajas kraft x50, Flete DHL…" value={f.description} onChange={(e) => set('description', e.target.value)} />
          </Field>
          <Field label="Moneda">
            <div className="segmented" style={{ width: '100%' }}>
              {['ARS', 'USD'].map((c) => (
                <button type="button" key={c} className={f.currency === c ? 'active' : ''} style={{ flex: 1 }} onClick={() => set('currency', c)}>
                  {c === 'ARS' ? 'Pesos (ARS)' : 'Dólares (USD)'}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Monto">
            <MoneyInput currency={f.currency} value={f.amount} onChange={(e) => set('amount', e.target.value)} placeholder="0,00" autoFocus={!expense} />
          </Field>
          {f.currency === 'USD' && (
            <Field label="Tipo de cambio del día" hint={`Equivale a ${fmtARS(inARS)}`}>
              <div className="input-prefix">
                <span>$</span>
                <input className="input" type="number" min="1" value={f.rate} onChange={(e) => set('rate', e.target.value)} />
              </div>
            </Field>
          )}
          <Field label="" full>
            <label className="checkbox">
              <input type="checkbox" checked={!!f.recurring} onChange={(e) => set('recurring', e.target.checked)} />
              Es un gasto fijo mensual (suscripción, alquiler, etc.)
            </label>
            <span className="hint">Aparece en la lista de gastos fijos y te sugerimos cargarlo cada mes.</span>
          </Field>
        </div>
        {err && <div className="form-error" style={{ marginTop: 14 }}>{err}</div>}
        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary">
            {expense ? 'Guardar cambios' : 'Registrar gasto'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
