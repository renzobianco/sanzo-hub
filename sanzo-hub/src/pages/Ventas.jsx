import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { PageHeader, Modal, ConfirmDialog, EmptyState, Field, MoneyInput, SaleStatus } from '../components/ui/Primitives.jsx'
import { IconPlus, IconEdit, IconTrash, IconSearch, IconAlert, IconX } from '../components/ui/Icons.jsx'
import { CHANNELS, PAYMENT_METHODS, SALE_STATUSES } from '../data/defaults.js'
import { fmtARS, fmtDate, fmtNum, todayISO } from '../utils/format.js'
import { saleTotal, sumSales, sumUnits, inRange, normalizeHandle } from '../utils/calc.js'

const emptyForm = (products) => ({
  date: todayISO(),
  productId: products.find((p) => p.isKit)?.id || products[0]?.id || '',
  qty: 1,
  unitPrice: '',
  channel: 'Instagram',
  payment: 'Transferencia',
  clientName: '',
  clientHandle: '',
  shipping: '',
  status: 'Pagado',
  notes: '',
})

export default function Ventas() {
  const { state, addSale, updateSale, removeSale, notify } = useApp()
  const { sales, products } = state
  const [modal, setModal] = useState(null) // null | 'new' | sale
  const [toDelete, setToDelete] = useState(null)
  const [restoreStock, setRestoreStock] = useState(true)
  const [filters, setFilters] = useState({ q: '', productId: '', channel: '', status: '', from: '', to: '' })

  const productName = (id) => products.find((p) => p.id === id)?.name || '—'

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase()
    return sales
      .filter((s) => {
        if (filters.productId && s.productId !== filters.productId) return false
        if (filters.channel && s.channel !== filters.channel) return false
        if (filters.status && s.status !== filters.status) return false
        if (!inRange(s.date, filters.from || null, filters.to || null)) return false
        if (q) {
          const hay = `${s.clientName || ''} ${s.clientHandle || ''} ${s.notes || ''} ${productName(s.productId)} ${s.payment || ''}`.toLowerCase()
          if (!hay.includes(q)) return false
        }
        return true
      })
      .sort((a, b) => (b.date + (b.createdAt || '')).localeCompare(a.date + (a.createdAt || '')))
  }, [sales, filters, products])

  const total = sumSales(filtered)
  const units = sumUnits(filtered)
  const ticket = filtered.length ? total / filtered.length : 0
  const hasFilters = Object.values(filters).some(Boolean)

  const onSave = (data, id) => {
    if (id) {
      updateSale(id, data)
      notify('Venta actualizada')
    } else {
      addSale(data)
      notify('Venta registrada. Stock descontado.')
    }
    setModal(null)
  }

  return (
    <div>
      <PageHeader eyebrow="Ventas" title="Ventas" subtitle="Cada venta que registrás descuenta el stock automáticamente y alimenta clientes, gráficos y objetivos.">
        <button className="btn btn-primary" onClick={() => setModal('new')}>
          <IconPlus /> Nueva venta
        </button>
      </PageHeader>

      <div className="grid grid-4 mb-16">
        <Stat label={hasFilters ? 'Total del período filtrado' : 'Total vendido'} value={fmtARS(total)} tone="pos" />
        <Stat label="Ticket promedio" value={fmtARS(ticket)} />
        <Stat label="Ventas" value={fmtNum(filtered.length)} />
        <Stat label="Unidades" value={fmtNum(units)} />
      </div>

      <div className="card">
        <div className="toolbar">
          <div className="search">
            <IconSearch />
            <input className="input" placeholder="Buscar cliente, @usuario, nota…" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} />
          </div>
          <select className="select" value={filters.productId} onChange={(e) => setFilters({ ...filters, productId: e.target.value })}>
            <option value="">Todos los productos</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select className="select" value={filters.channel} onChange={(e) => setFilters({ ...filters, channel: e.target.value })}>
            <option value="">Todos los canales</option>
            {CHANNELS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select className="select" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="">Todos los estados</option>
            {SALE_STATUSES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <input className="input" type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} title="Desde" />
          <input className="input" type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} title="Hasta" />
          {hasFilters && (
            <button className="btn btn-ghost btn-sm" onClick={() => setFilters({ q: '', productId: '', channel: '', status: '', from: '', to: '' })}>
              <IconX /> Limpiar
            </button>
          )}
        </div>

        {sales.length === 0 ? (
          <EmptyState title="Todavía no hay ventas" text="Cuando llegue el lote y hagas la primera venta, cargala acá. El stock se descuenta solo." action={() => setModal('new')} actionLabel="Cargar la primera venta" />
        ) : filtered.length === 0 ? (
          <EmptyState compact title="Nada con esos filtros" text="Probá con otra búsqueda o limpiá los filtros." />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Producto</th>
                  <th>Cliente</th>
                  <th>Canal</th>
                  <th>Pago</th>
                  <th className="num">Total</th>
                  <th>Estado</th>
                  <th className="actions"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id}>
                    <td className="tabular">{fmtDate(s.date)}</td>
                    <td>
                      <div className="cell-title">
                        {fmtNum(s.qty)} × {productName(s.productId)}
                      </div>
                      <div className="cell-sub">
                        {fmtARS(s.unitPrice)} c/u{Number(s.shipping) > 0 ? ` + envío ${fmtARS(s.shipping)}` : ''}
                      </div>
                    </td>
                    <td>
                      {s.clientName || s.clientHandle ? (
                        <>
                          <div className="cell-title">{s.clientName || `@${normalizeHandle(s.clientHandle)}`}</div>
                          {s.clientName && s.clientHandle && <div className="cell-sub">@{normalizeHandle(s.clientHandle)}</div>}
                        </>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td>{s.channel}</td>
                    <td className="muted">{s.payment}</td>
                    <td className="num strong">{fmtARS(saleTotal(s))}</td>
                    <td>
                      <SaleStatus status={s.status} />
                    </td>
                    <td className="actions">
                      <button className="btn btn-icon" onClick={() => setModal(s)} aria-label="Editar">
                        <IconEdit />
                      </button>
                      <button className="btn btn-icon danger" onClick={() => { setRestoreStock(true); setToDelete(s) }} aria-label="Borrar">
                        <IconTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && <SaleForm key={modal === 'new' ? 'new' : modal.id} sale={modal === 'new' ? null : modal} products={products} onClose={() => setModal(null)} onSave={onSave} />}

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          removeSale(toDelete.id, { restoreStock })
          notify('Venta borrada')
        }}
        title="¿Borrar esta venta?"
        message={toDelete ? `${fmtNum(toDelete.qty)} × ${productName(toDelete.productId)} del ${fmtDate(toDelete.date)} por ${fmtARS(saleTotal(toDelete))}.` : ''}
      >
        <label className="checkbox" style={{ marginBottom: 6 }}>
          <input type="checkbox" checked={restoreStock} onChange={(e) => setRestoreStock(e.target.checked)} />
          Devolver las unidades al stock
        </label>
      </ConfirmDialog>
    </div>
  )
}

function Stat({ label, value, tone = '' }) {
  return (
    <div className="card" style={{ padding: '16px 18px' }}>
      <div className="kpi-label">{label}</div>
      <div className={`kpi-value sm ${tone}`} style={{ marginTop: 6 }}>
        {value}
      </div>
    </div>
  )
}

function SaleForm({ sale, products, onClose, onSave }) {
  const [f, setF] = useState(() => (sale ? { ...emptyForm(products), ...sale } : { ...emptyForm(products), unitPrice: products.find((p) => p.isKit)?.priceARS || '' }))
  const [err, setErr] = useState('')
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }))
  const product = products.find((p) => p.id === f.productId)

  const onProduct = (id) => {
    const p = products.find((x) => x.id === id)
    setF((x) => ({ ...x, productId: id, unitPrice: !sale && p?.priceARS ? p.priceARS : x.unitPrice }))
  }

  const availableStock = (Number(product?.stock) || 0) + (sale && sale.productId === f.productId ? Number(sale.qty) || 0 : 0)
  const overStock = Number(f.qty) > availableStock
  const total = (Number(f.qty) || 0) * (Number(f.unitPrice) || 0) + (Number(f.shipping) || 0)

  const submit = (e) => {
    e.preventDefault()
    if (!f.productId) return setErr('Elegí un producto.')
    if (!f.date) return setErr('Cargá la fecha.')
    if (!(Number(f.qty) > 0)) return setErr('La cantidad tiene que ser mayor a cero.')
    if (Number(f.unitPrice) < 0 || f.unitPrice === '') return setErr('Cargá el precio unitario.')
    const data = {
      date: f.date,
      productId: f.productId,
      qty: Math.round(Number(f.qty)),
      unitPrice: Number(f.unitPrice),
      channel: f.channel,
      payment: f.payment,
      clientName: f.clientName.trim(),
      clientHandle: f.clientHandle.trim().replace(/^@/, ''),
      shipping: Number(f.shipping) || 0,
      status: f.status,
      notes: f.notes.trim(),
    }
    onSave(data, sale?.id)
  }

  return (
    <Modal open onClose={onClose} title={sale ? 'Editar venta' : 'Nueva venta'} subtitle={sale ? 'Si cambiás cantidad o producto, el stock se reajusta solo.' : 'Se descuenta del stock al guardar.'}>
      <form onSubmit={submit}>
        <div className="form-grid">
          <Field label="Fecha">
            <input className="input" type="date" value={f.date} onChange={(e) => set('date', e.target.value)} required />
          </Field>
          <Field label="Producto">
            <select className="select" value={f.productId} onChange={(e) => onProduct(e.target.value)}>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · stock {fmtNum(p.stock)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Cantidad" hint={product ? `Disponible: ${fmtNum(availableStock)}` : ''}>
            <input className={`input ${overStock ? 'error' : ''}`} type="number" min="1" step="1" value={f.qty} onChange={(e) => set('qty', e.target.value)} />
          </Field>
          <Field label="Precio unitario (ARS)">
            <MoneyInput value={f.unitPrice} onChange={(e) => set('unitPrice', e.target.value)} placeholder="0,00" />
          </Field>
          <Field label="Canal de venta">
            <select className="select" value={f.channel} onChange={(e) => set('channel', e.target.value)}>
              {CHANNELS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Método de pago">
            <select className="select" value={f.payment} onChange={(e) => set('payment', e.target.value)}>
              {PAYMENT_METHODS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Cliente (opcional)">
            <input className="input" placeholder="Nombre" value={f.clientName} onChange={(e) => set('clientName', e.target.value)} />
          </Field>
          <Field label="@usuario de la red (opcional)">
            <input className="input" placeholder="@usuario" value={f.clientHandle} onChange={(e) => set('clientHandle', e.target.value)} />
          </Field>
          <Field label="Costo de envío (ARS)" hint="Lo que se le cobra al cliente por el envío">
            <MoneyInput value={f.shipping} onChange={(e) => set('shipping', e.target.value)} placeholder="0,00" />
          </Field>
          <Field label="Estado">
            <select className="select" value={f.status} onChange={(e) => set('status', e.target.value)}>
              {SALE_STATUSES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Notas" full>
            <textarea className="textarea" placeholder="Color, talle, dirección, lo que sea útil…" value={f.notes} onChange={(e) => set('notes', e.target.value)} />
          </Field>
        </div>

        {overStock && (
          <div className="banner warn" style={{ marginTop: 16, marginBottom: 0 }}>
            <IconAlert /> Estás vendiendo más unidades de las que hay en stock ({fmtNum(availableStock)}). Podés guardar igual (por ejemplo, para una preventa) y el stock queda en cero.
          </div>
        )}
        {err && <div className="form-error" style={{ marginTop: 14 }}>{err}</div>}

        <div className="form-actions" style={{ alignItems: 'center' }}>
          <span className="muted small" style={{ marginRight: 'auto' }}>
            Total: <strong className="strong" style={{ color: 'var(--ink)' }}>{fmtARS(total)}</strong>
          </span>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary">
            {sale ? 'Guardar cambios' : 'Registrar venta'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
