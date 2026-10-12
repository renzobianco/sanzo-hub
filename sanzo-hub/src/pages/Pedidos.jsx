import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { PageHeader, Modal, ConfirmDialog, EmptyState, Field, MoneyInput, OrderStatus } from '../components/ui/Primitives.jsx'
import { DolarSourceNote } from '../components/ui/ExchangeRate.jsx'
import { IconPlus, IconEdit, IconTrash, IconShip, IconCheck, IconX, IconInfo, IconBox } from '../components/ui/Icons.jsx'
import { ORDER_STATUSES } from '../data/defaults.js'
import { fmtARS, fmtUSD, fmtDate, fmtNum, todayISO, daysBetween, fmtDecimal } from '../utils/format.js'
import { orderTotals } from '../utils/calc.js'

export default function Pedidos() {
  const { state, addItem, updateItem, removeItem, receiveOrder, notify } = useApp()
  const { orders, products, settings } = state
  const rate = settings.exchangeRate
  const [modal, setModal] = useState(null)
  const [toDelete, setToDelete] = useState(null)
  const [receiving, setReceiving] = useState(null)
  const today = todayISO()

  const sorted = useMemo(() => [...orders].sort((a, b) => (b.date + (b.createdAt || '')).localeCompare(a.date + (a.createdAt || ''))), [orders])
  const inTransit = orders.filter((o) => o.status !== 'Recibido' && o.status !== 'Cotizado')
  const committedUSD = inTransit.reduce((a, o) => a + orderTotals(o).total, 0)
  const unitsComing = inTransit.reduce((a, o) => a + orderTotals(o).units, 0)
  const receivedUSD = orders.filter((o) => o.status === 'Recibido').reduce((a, o) => a + orderTotals(o).total, 0)

  const onSave = (data, id) => {
    if (id) {
      updateItem('orders', id, data)
      notify('Pedido actualizado')
    } else {
      addItem('orders', data)
      notify('Pedido registrado')
    }
    setModal(null)
  }

  const changeStatus = (o, status) => {
    if (status === 'Recibido' && (!o.stockApplied || !o.expenseApplied)) {
      setReceiving(o)
      return
    }
    updateItem('orders', o.id, { status })
  }

  return (
    <div>
      <PageHeader eyebrow="Pedidos a China" title="Pedidos a China" subtitle="Cada orden al proveedor, con su costo real por unidad. Cuando llega, se suma al stock y se registra como gasto de mercadería.">
        <button className="btn btn-primary" onClick={() => setModal('new')}>
          <IconPlus /> Nuevo pedido
        </button>
      </PageHeader>

      <div className="grid grid-3 mb-16">
        <Stat label="Pedidos en curso" value={fmtNum(inTransit.length)} sub={`${fmtNum(unitsComing)} unidades en camino`} />
        <Stat label="Comprometido en curso" value={fmtUSD(committedUSD)} sub={`≈ ${fmtARS(committedUSD * rate)} hoy`} />
        <Stat label="Total recibido" value={fmtUSD(receivedUSD)} sub={`${fmtNum(orders.filter((o) => o.status === 'Recibido').length)} pedidos recibidos`} />
      </div>
      <div className="mb-16">
        <DolarSourceNote prefix="Conversiones de hoy a" />
      </div>

      {orders.length === 0 ? (
        <div className="card">
          <EmptyState title="Todavía no hay pedidos" text="Cargá el primer lote de ~50 kits para trackearlo desde la cotización hasta que llega a tu casa." action={() => setModal('new')} actionLabel="Cargar el primer pedido" />
        </div>
      ) : (
        <div className="grid grid-2">
          {sorted.map((o) => (
            <OrderCard key={o.id} order={o} products={products} rate={rate} today={today} onEdit={() => setModal(o)} onDelete={() => setToDelete(o)} onStatus={(s) => changeStatus(o, s)} onReceive={() => setReceiving(o)} />
          ))}
        </div>
      )}

      {modal && <OrderForm key={modal === 'new' ? 'new' : modal.id} order={modal === 'new' ? null : modal} products={products} rate={rate} onClose={() => setModal(null)} onSave={onSave} />}

      {receiving && (
        <ReceiveDialog
          order={receiving}
          products={products}
          rate={rate}
          onClose={() => setReceiving(null)}
          onConfirm={(opts) => {
            receiveOrder(receiving.id, opts)
            notify(`Pedido recibido${opts.addStock ? ' · stock actualizado' : ''}${opts.addExpense ? ' · gasto registrado' : ''}`)
            setReceiving(null)
          }}
        />
      )}

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          removeItem('orders', toDelete.id)
          notify('Pedido borrado')
        }}
        title="¿Borrar este pedido?"
        message="No se toca el stock ni los gastos que ya se hayan registrado."
      />
    </div>
  )
}

function Stat({ label, value, sub }) {
  return (
    <div className="card" style={{ padding: '16px 18px' }}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value sm" style={{ marginTop: 6 }}>
        {value}
      </div>
      {sub && <div className="kpi-foot">{sub}</div>}
    </div>
  )
}

function OrderCard({ order: o, products, rate, today, onEdit, onDelete, onStatus, onReceive }) {
  const t = orderTotals(o)
  const [showUnits, setShowUnits] = useState(false)
  const pname = (id) => products.find((p) => p.id === id)?.name || 'Producto'
  const eta = o.eta ? daysBetween(today, o.eta) : null
  const received = o.status === 'Recibido'
  const histRate = o.rate || rate
  const rateDiffers = Math.round(histRate) !== Math.round(rate)

  return (
    <div className="card hoverable" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="row between" style={{ alignItems: 'flex-start' }}>
        <div>
          <div className="row" style={{ gap: 8 }}>
            <h3 style={{ fontSize: 20 }}>{o.supplier || 'Proveedor'}</h3>
            <OrderStatus status={o.status} />
          </div>
          <div className="muted small">
            Pedido el {fmtDate(o.date)}
            {o.tracking ? ` · Tracking ${o.tracking}` : ''}
          </div>
        </div>
        <div className="row" style={{ gap: 2 }}>
          <button className="btn btn-icon" onClick={onEdit} aria-label="Editar">
            <IconEdit />
          </button>
          <button className="btn btn-icon danger" onClick={onDelete} aria-label="Borrar">
            <IconTrash />
          </button>
        </div>
      </div>

      <div className="order-items">
        {(o.items || []).map((it, i) => (
          <span className="chip" key={i}>
            {fmtNum(it.qty)} × {pname(it.productId)}
          </span>
        ))}
        {(o.items || []).length === 0 && <span className="muted small">Sin detalle de productos</span>}
      </div>

      <div>
        <div className="stat-line">
          <span className="muted">FOB</span>
          <span className="v">{fmtUSD(t.fob)}</span>
        </div>
        <div className="stat-line">
          <span className="muted">Flete</span>
          <span className="v">{fmtUSD(t.freight)}</span>
        </div>
        <div className="stat-line">
          <span className="muted">Aduana, despachante y otros</span>
          <span className="v">{fmtUSD(t.other)}</span>
        </div>
        <div className="stat-line" style={{ borderBottom: 0, flexWrap: 'wrap' }}>
          <span className="strong">Total del pedido</span>
          <span className="v" style={{ fontSize: 16, textAlign: 'right' }}>
            {fmtUSD(t.total)} <span className="muted small">≈ {fmtARS(t.total * rate)} hoy</span>
            {rateDiffers && (
              <div className="muted small" style={{ fontWeight: 400 }}>
                Pedido a $ {fmtDecimal(histRate, 0)} el {fmtDate(o.date)} ≈ {fmtARS(t.total * histRate)}
              </div>
            )}
          </span>
        </div>
      </div>

      <div className="card beige" style={{ padding: 14 }}>
        <div className="row between">
          <div>
            <div className="small" style={{ color: 'var(--caramel-dark)', fontWeight: 600 }}>
              Costo unitario final (todo prorrateado)
            </div>
            <div className="serif" style={{ fontSize: 24 }}>
              {fmtUSD(t.unitAvg)} <span className="muted small">≈ {fmtARS(t.unitAvg * rate)} hoy</span>
            </div>
          </div>
          {t.perItem.length > 1 && (
            <button className="btn btn-ghost btn-sm" onClick={() => setShowUnits((v) => !v)}>
              {showUnits ? 'Ocultar' : 'Por producto'}
            </button>
          )}
        </div>
        {showUnits && (
          <div style={{ marginTop: 10 }}>
            {t.perItem.map((it, i) => (
              <div className="stat-line" key={i} style={{ borderColor: 'rgba(149,96,55,0.2)' }}>
                <span>
                  {pname(it.productId)} <span className="muted small">× {fmtNum(it.qty)}</span>
                </span>
                <span className="v">
                  {fmtUSD(it.unitCost)} <span className="muted small">≈ {fmtARS(it.unitCost * rate)}</span>
                </span>
              </div>
            ))}
            <div className="help" style={{ marginTop: 8 }}>
              <IconInfo style={{ width: 13, height: 13, verticalAlign: '-2px' }} /> {t.hasUnitFob ? 'Flete y otros costos repartidos según el valor FOB de cada producto.' : 'Sin precio FOB por producto: el total se divide en partes iguales por unidad.'}
            </div>
          </div>
        )}
      </div>

      {o.notes && <p className="muted small">{o.notes}</p>}

      <div className="row between" style={{ marginTop: 'auto' }}>
        <div className="small muted">
          {received ? (
            <span className="pos strong">
              <IconCheck style={{ width: 14, height: 14, verticalAlign: '-2px' }} /> Recibido {o.receivedAt ? `el ${fmtDate(o.receivedAt)}` : ''}
            </span>
          ) : o.eta ? (
            eta >= 0 ? (
              <>
                Llega aprox. el <strong>{fmtDate(o.eta)}</strong> · en {eta} días
              </>
            ) : (
              <span className="neg">Demorado {Math.abs(eta)} días (ETA {fmtDate(o.eta)})</span>
            )
          ) : (
            'Sin fecha estimada'
          )}
        </div>
        {!received ? (
          <div className="row" style={{ gap: 6 }}>
            <select className="select" value={o.status} onChange={(e) => onStatus(e.target.value)} style={{ padding: '7px 30px 7px 10px', fontSize: 13, width: 'auto', background: 'var(--white)' }}>
              {ORDER_STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <button className="btn btn-primary btn-sm" onClick={onReceive}>
              <IconBox /> Llegó
            </button>
          </div>
        ) : (
          (!o.stockApplied || !o.expenseApplied) && (
            <button className="btn btn-soft btn-sm" onClick={onReceive}>
              Aplicar stock / gasto
            </button>
          )
        )}
      </div>
    </div>
  )
}

function ReceiveDialog({ order, products, rate, onClose, onConfirm }) {
  const t = orderTotals(order)
  const [addStock, setAddStock] = useState(!order.stockApplied)
  const [addExpense, setAddExpense] = useState(!order.expenseApplied)
  const pname = (id) => products.find((p) => p.id === id)?.name || 'Producto'
  return (
    <Modal open onClose={onClose} title="¡Llegó el pedido!" subtitle="Elegí qué querés que hagamos automáticamente." size="narrow">
      <div className="stack" style={{ gap: 12 }}>
        <label className="checkbox card" style={{ padding: 14, alignItems: 'flex-start', opacity: order.stockApplied ? 0.6 : 1 }}>
          <input type="checkbox" checked={addStock} onChange={(e) => setAddStock(e.target.checked)} disabled={order.stockApplied} style={{ marginTop: 3 }} />
          <div>
            <div className="strong">Sumar las unidades al stock {order.stockApplied && <span className="chip green">ya aplicado</span>}</div>
            <div className="muted small">{t.perItem.map((it) => `+${fmtNum(it.qty)} ${pname(it.productId)}`).join(' · ') || 'Sin productos detallados'}</div>
          </div>
        </label>
        <label className="checkbox card" style={{ padding: 14, alignItems: 'flex-start', opacity: order.expenseApplied ? 0.6 : 1 }}>
          <input type="checkbox" checked={addExpense} onChange={(e) => setAddExpense(e.target.checked)} disabled={order.expenseApplied} style={{ marginTop: 3 }} />
          <div>
            <div className="strong">Registrar el costo como gasto de Mercadería {order.expenseApplied && <span className="chip green">ya aplicado</span>}</div>
            <div className="muted small">
              {fmtUSD(t.total)} a $ {fmtDecimal(rate, 0)} ≈ {fmtARS(t.total * rate)}, con fecha de hoy.
            </div>
          </div>
        </label>
        <div className="help">
          Tip: el costo unitario final de este pedido es {fmtUSD(t.unitAvg)}. Cargalo como costo en Productos para que el margen sea real.
        </div>
      </div>
      <div className="form-actions">
        <button className="btn btn-ghost" onClick={onClose}>
          Cancelar
        </button>
        <button className="btn btn-primary" onClick={() => onConfirm({ addStock: addStock && !order.stockApplied, addExpense: addExpense && !order.expenseApplied })}>
          <IconCheck /> Confirmar recepción
        </button>
      </div>
    </Modal>
  )
}

function OrderForm({ order, products, rate, onClose, onSave }) {
  const [f, setF] = useState(() => ({
    date: todayISO(),
    supplier: '',
    status: 'Cotizado',
    eta: '',
    tracking: '',
    fobUSD: '',
    freightUSD: '',
    otherUSD: '',
    notes: '',
    ...(order || {}),
    items: order?.items?.length ? order.items.map((i) => ({ ...i })) : [{ productId: products.find((p) => p.isKit)?.id || products[0]?.id, qty: '', unitFobUSD: '' }],
  }))
  const [err, setErr] = useState('')
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }))
  const setItem = (i, k, v) => setF((x) => ({ ...x, items: x.items.map((it, idx) => (idx === i ? { ...it, [k]: v } : it)) }))
  const addItem = () => setF((x) => ({ ...x, items: [...x.items, { productId: products[0]?.id, qty: '', unitFobUSD: '' }] }))
  const removeItem = (i) => setF((x) => ({ ...x, items: x.items.filter((_, idx) => idx !== i) }))

  const itemsFob = f.items.reduce((a, it) => a + (Number(it.qty) || 0) * (Number(it.unitFobUSD) || 0), 0)
  const allHaveFob = f.items.length > 0 && f.items.every((it) => Number(it.unitFobUSD) > 0)
  const preview = orderTotals({ ...f, fobUSD: f.fobUSD === '' && allHaveFob ? itemsFob : f.fobUSD })

  const submit = (e) => {
    e.preventDefault()
    if (!f.date) return setErr('Cargá la fecha del pedido.')
    const items = f.items.filter((it) => Number(it.qty) > 0).map((it) => ({ productId: it.productId, qty: Math.round(Number(it.qty)), unitFobUSD: Number(it.unitFobUSD) || 0 }))
    if (items.length === 0) return setErr('Agregá al menos un producto con cantidad.')
    const fob = f.fobUSD === '' && allHaveFob ? itemsFob : Number(f.fobUSD) || 0
    onSave(
      {
        date: f.date,
        supplier: f.supplier.trim(),
        status: f.status,
        eta: f.eta || '',
        tracking: f.tracking.trim(),
        fobUSD: fob,
        freightUSD: Number(f.freightUSD) || 0,
        otherUSD: Number(f.otherUSD) || 0,
        notes: f.notes.trim(),
        items,
        // Cotización del día del pedido, para poder mostrar después "lo que costó
        // entonces" vs. "lo que vale hoy" sin que el total histórico se mueva solo.
        rate: order?.rate || rate,
      },
      order?.id,
    )
  }

  return (
    <Modal open onClose={onClose} title={order ? 'Editar pedido' : 'Nuevo pedido a China'} subtitle="Todo en dólares. El costo por unidad se calcula solo." size="wide">
      <form onSubmit={submit}>
        <div className="form-grid">
          <Field label="Fecha de la orden">
            <input className="input" type="date" value={f.date} onChange={(e) => set('date', e.target.value)} required />
          </Field>
          <Field label="Proveedor">
            <input className="input" placeholder="Nombre del proveedor o tienda" value={f.supplier} onChange={(e) => set('supplier', e.target.value)} autoFocus={!order} />
          </Field>
          <Field label="Estado">
            <select className="select" value={f.status} onChange={(e) => set('status', e.target.value)}>
              {ORDER_STATUSES.filter((s) => s !== 'Recibido' || order?.status === 'Recibido').map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="Fecha estimada de llegada">
            <input className="input" type="date" value={f.eta} onChange={(e) => set('eta', e.target.value)} />
          </Field>
          <Field label="Número de tracking" full>
            <input className="input" placeholder="Ej: LP123456789CN" value={f.tracking} onChange={(e) => set('tracking', e.target.value)} />
          </Field>
        </div>

        <div className="divider" />
        <div className="row between" style={{ marginBottom: 10 }}>
          <div>
            <div className="strong">Productos y cantidades</div>
            <div className="muted small">El precio FOB unitario es opcional, pero mejora el prorrateo.</div>
          </div>
          <button type="button" className="btn btn-soft btn-sm" onClick={addItem}>
            <IconPlus /> Agregar
          </button>
        </div>
        <div className="stack" style={{ gap: 8 }}>
          {f.items.map((it, i) => (
            <div className="row" key={i} style={{ flexWrap: 'nowrap', gap: 8 }}>
              <select className="select" value={it.productId} onChange={(e) => setItem(i, 'productId', e.target.value)} style={{ flex: 2, minWidth: 0 }}>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <input className="input" type="number" min="1" step="1" placeholder="Cant." value={it.qty} onChange={(e) => setItem(i, 'qty', e.target.value)} style={{ flex: 1, minWidth: 70 }} />
              <div className="input-prefix usd" style={{ flex: 1.3, minWidth: 110 }}>
                <span>USD</span>
                <input className="input" type="number" min="0" step="0.01" placeholder="FOB c/u" value={it.unitFobUSD} onChange={(e) => setItem(i, 'unitFobUSD', e.target.value)} />
              </div>
              <button type="button" className="btn btn-icon danger" onClick={() => removeItem(i)} aria-label="Quitar" disabled={f.items.length === 1}>
                <IconX />
              </button>
            </div>
          ))}
        </div>

        <div className="divider" />
        <div className="form-grid">
          <Field label="Costo FOB total (USD)" hint={allHaveFob ? `Suma de los productos: ${fmtUSD(itemsFob)} (dejalo vacío para usar ese valor)` : 'Lo que cobra el proveedor por la mercadería'}>
            <MoneyInput currency="USD" value={f.fobUSD} onChange={(e) => set('fobUSD', e.target.value)} placeholder={allHaveFob ? fmtDecimal(itemsFob) : '0,00'} />
          </Field>
          <Field label="Flete (USD)">
            <MoneyInput currency="USD" value={f.freightUSD} onChange={(e) => set('freightUSD', e.target.value)} placeholder="0,00" />
          </Field>
          <Field label="Aduana, despachante y otros (USD)">
            <MoneyInput currency="USD" value={f.otherUSD} onChange={(e) => set('otherUSD', e.target.value)} placeholder="0,00" />
          </Field>
          <Field label="Notas" full>
            <textarea className="textarea" placeholder="Colores, talles, acuerdos con el proveedor…" value={f.notes} onChange={(e) => set('notes', e.target.value)} />
          </Field>
        </div>

        <div className="card beige" style={{ marginTop: 16, padding: 14 }}>
          <div className="row between">
            <span className="small" style={{ color: 'var(--caramel-dark)' }}>
              <IconShip style={{ width: 15, height: 15, verticalAlign: '-3px' }} /> Total {fmtUSD(preview.total)} ≈ {fmtARS(preview.total * rate)} hoy · {fmtNum(preview.units)} unidades
            </span>
            <span className="strong">Costo unitario: {fmtUSD(preview.unitAvg)}</span>
          </div>
        </div>
        {err && <div className="form-error" style={{ marginTop: 14 }}>{err}</div>}
        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary">
            {order ? 'Guardar cambios' : 'Registrar pedido'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
