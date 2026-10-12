import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { ImageUpload } from '../components/ui/ImageUpload.jsx'
import { PageHeader, Modal, Field, MoneyInput, ProgressBar, EmptyState } from '../components/ui/Primitives.jsx'
import { DolarSourceNote } from '../components/ui/ExchangeRate.jsx'
import { IconEdit, IconAlert, IconPlus, IconMinus, IconBox, IconCoins, IconTrendUp, IconRefresh, IconInfo } from '../components/ui/Icons.jsx'
import { fmtARS, fmtUSD, fmtNum, fmtPct, fmtDateTime } from '../utils/format.js'
import { productMargin, inventoryValue } from '../utils/calc.js'

const REASONS = ['Ajuste de inventario', 'Rotura o falla', 'Regalo a influencer', 'Muestra o uso propio', 'Ingreso de mercadería', 'Otro']

export default function Productos() {
  const { state, updateProduct, updateSettings, addItem, notify } = useApp()
  const { products, settings } = state
  const rate = settings.exchangeRate
  const [editing, setEditing] = useState(null)
  const [adjusting, setAdjusting] = useState(null)
  const [showLog, setShowLog] = useState(false)
  const inv = useMemo(() => inventoryValue(products, rate), [products, rate])
  const lowStock = products.filter((p) => Number(p.initialStock) > 0 && Number(p.stock) < settings.stockThreshold)
  const stockLog = state.stockLog || []

  const applyAdjust = (p, newStock, reason, note) => {
    const delta = newStock - (Number(p.stock) || 0)
    if (delta === 0) return setAdjusting(null)
    updateProduct(p.id, { stock: newStock })
    addItem('stockLog', { productId: p.id, delta, reason, note, by: state.settings.currentUser })
    notify(`Stock de ${p.name}: ${delta > 0 ? '+' : ''}${fmtNum(delta)} (${reason})`)
    setAdjusting(null)
  }

  return (
    <div>
      <PageHeader eyebrow="Productos y stock" title="Productos y stock" subtitle="Costo en dólares, precio en pesos y margen calculado al tipo de cambio actual. El stock se descuenta solo con cada venta.">
        <div className="chip outline" style={{ padding: '8px 12px', gap: 8 }}>
          Alerta de stock bajo:
          <input className="input" type="number" min="0" value={settings.stockThreshold} onChange={(e) => updateSettings({ stockThreshold: Number(e.target.value) || 0 })} style={{ width: 64, padding: '4px 8px', fontSize: 13 }} />
          u.
        </div>
        <button className="btn btn-ghost" onClick={() => setShowLog(true)}>
          <IconRefresh /> Historial de ajustes
        </button>
      </PageHeader>

      {lowStock.length > 0 && (
        <div className="banner warn">
          <IconAlert />
          <span>
            Stock bajo en <strong>{lowStock.map((p) => `${p.name} (${fmtNum(p.stock)})`).join(', ')}</strong>. Ojo con la reposición.
          </span>
        </div>
      )}

      <div className="card beige mb-16">
        <div className="card-head" style={{ marginBottom: 12 }}>
          <div>
            <div className="card-title">Valor del inventario</div>
            <div className="card-sub" style={{ color: 'var(--caramel-dark)' }}>
              Cuánta plata hay parada en stock hoy. <DolarSourceNote prefix="A" />
            </div>
          </div>
        </div>
        <div className="grid grid-4">
          <MiniStat icon={IconBox} label="Unidades en stock" value={fmtNum(inv.units)} />
          <MiniStat icon={IconCoins} label="Al costo" value={fmtARS(inv.atCost)} sub={fmtUSD(rate ? inv.atCost / rate : 0)} />
          <MiniStat icon={IconTrendUp} label="A precio de venta" value={fmtARS(inv.atPrice)} />
          <MiniStat icon={IconTrendUp} label="Ganancia potencial" value={fmtARS(inv.potential)} tone={inv.potential > 0 ? 'pos' : ''} />
        </div>
      </div>

      <div className="grid grid-3">
        {products.map((p) => {
          const m = productMargin(p, rate)
          const low = Number(p.stock) < settings.stockThreshold
          const soldPct = Number(p.initialStock) > 0 ? ((Number(p.initialStock) - Number(p.stock)) / Number(p.initialStock)) * 100 : 0
          return (
            <div className="card hoverable" key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <ImageUpload value={p.image} onChange={(v) => updateProduct(p.id, { image: v })} shape="rounded" size={{ width: '100%', height: 170 }} text="Subí tu foto" />
              <div>
                <div className="row between">
                  <h3 style={{ fontSize: 21 }}>{p.name}</h3>
                  <span className={`chip ${p.isKit ? 'ink' : 'outline'}`}>{p.isKit ? 'Producto estrella' : 'Suelto'}</span>
                </div>
                <div className="muted small">{p.description}</div>
              </div>

              <div className="row between" style={{ alignItems: 'flex-end' }}>
                <div>
                  <div className="kpi-label">Stock actual</div>
                  <div className={`stock-pill ${low && Number(p.initialStock) > 0 ? 'low' : ''}`}>
                    {fmtNum(p.stock)}
                    {low && Number(p.initialStock) > 0 && <IconAlert style={{ width: 18, height: 18 }} />}
                  </div>
                  <div className="muted small">inicial: {fmtNum(p.initialStock)}</div>
                </div>
                <div className="qty-control">
                  <button onClick={() => updateProduct(p.id, (x) => ({ stock: Math.max(0, Number(x.stock) - 1) }))} aria-label="Restar 1">
                    <IconMinus style={{ width: 14, height: 14 }} />
                  </button>
                  <span>{fmtNum(p.stock)}</span>
                  <button onClick={() => updateProduct(p.id, (x) => ({ stock: Number(x.stock) + 1 }))} aria-label="Sumar 1">
                    <IconPlus style={{ width: 14, height: 14 }} />
                  </button>
                </div>
              </div>
              {Number(p.initialStock) > 0 && (
                <div>
                  <ProgressBar value={soldPct} thin />
                  <div className="muted small" style={{ marginTop: 4 }}>
                    {fmtPct(soldPct)} del lote vendido
                  </div>
                </div>
              )}

              <div>
                <div className="stat-line">
                  <span className="muted">Costo unitario</span>
                  <span className="v">
                    {fmtUSD(p.costUSD)} <span className="muted small">≈ {fmtARS(m.cost)}</span>
                  </span>
                </div>
                <div className="stat-line">
                  <span className="muted">Precio de venta</span>
                  <span className="v">{fmtARS(p.priceARS)}</span>
                </div>
                <div className="stat-line">
                  <span className="muted">Margen</span>
                  <span className={`v ${m.margin > 0 ? 'pos' : m.margin < 0 ? 'neg' : ''}`}>
                    {fmtARS(m.margin)} · {fmtPct(m.pct, 1)}
                  </span>
                </div>
              </div>

              <div className="row" style={{ marginTop: 'auto' }}>
                <button className="btn btn-soft btn-sm" style={{ flex: 1 }} onClick={() => setEditing(p)}>
                  <IconEdit /> Editar
                </button>
                <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => setAdjusting(p)}>
                  <IconRefresh /> Ajustar stock
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {editing && <ProductForm key={editing.id} product={editing} rate={rate} onClose={() => setEditing(null)} onSave={(patch) => { updateProduct(editing.id, patch); notify(`${editing.name} actualizado`); setEditing(null) }} />}
      {adjusting && <AdjustForm key={adjusting.id} product={adjusting} onClose={() => setAdjusting(null)} onSave={applyAdjust} />}

      <Modal open={showLog} onClose={() => setShowLog(false)} title="Historial de ajustes de stock" subtitle="Roturas, regalos a influencers, correcciones. Las ventas no aparecen acá: viven en Ventas.">
        {stockLog.length === 0 ? (
          <EmptyState compact title="Sin ajustes todavía" text="Cuando ajustes stock a mano con un motivo, queda registrado acá." />
        ) : (
          <div className="list">
            {stockLog.map((l) => {
              const p = products.find((x) => x.id === l.productId)
              return (
                <div className="list-item" key={l.id}>
                  <div className="body">
                    <div className="title">
                      {p?.name || 'Producto'} · <span className={l.delta > 0 ? 'pos' : 'neg'}>{l.delta > 0 ? '+' : ''}{fmtNum(l.delta)}</span>
                    </div>
                    <div className="sub">
                      {l.reason}
                      {l.note ? ` · ${l.note}` : ''} · {fmtDateTime(l.at)}
                      {l.by ? ` · ${state.partners[l.by]?.name || l.by}` : ''}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Modal>
    </div>
  )
}

function MiniStat({ icon: Icon, label, value, sub, tone = '' }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.55)', borderRadius: 14, padding: '12px 14px' }}>
      <div className="kpi-label" style={{ color: 'var(--caramel-dark)' }}>
        <Icon /> {label}
      </div>
      <div className={`kpi-value sm ${tone}`} style={{ marginTop: 6, fontSize: 22 }}>
        {value}
      </div>
      {sub && <div className="muted small">{sub}</div>}
    </div>
  )
}

function ProductForm({ product, rate, onClose, onSave }) {
  const [f, setF] = useState({ costUSD: product.costUSD, priceARS: product.priceARS, stock: product.stock, initialStock: product.initialStock })
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }))
  const m = productMargin({ costUSD: f.costUSD, priceARS: f.priceARS }, rate)
  const submit = (e) => {
    e.preventDefault()
    onSave({ costUSD: Number(f.costUSD) || 0, priceARS: Number(f.priceARS) || 0, stock: Math.max(0, Math.round(Number(f.stock) || 0)), initialStock: Math.max(0, Math.round(Number(f.initialStock) || 0)) })
  }
  return (
    <Modal open onClose={onClose} title={product.name} subtitle="Costo con flete prorrateado, precio de venta y stock.">
      <form onSubmit={submit}>
        <div className="form-grid">
          <Field label="Costo unitario (USD)" hint="Lo que sale de China con flete prorrateado. Lo podés sacar de Pedidos a China.">
            <MoneyInput currency="USD" value={f.costUSD} onChange={(e) => set('costUSD', e.target.value)} autoFocus />
          </Field>
          <Field label="Precio de venta (ARS)">
            <MoneyInput value={f.priceARS} onChange={(e) => set('priceARS', e.target.value)} />
          </Field>
          <Field label="Stock actual">
            <input className="input" type="number" min="0" step="1" value={f.stock} onChange={(e) => set('stock', e.target.value)} />
          </Field>
          <Field label="Stock inicial (tamaño del lote)">
            <input className="input" type="number" min="0" step="1" value={f.initialStock} onChange={(e) => set('initialStock', e.target.value)} />
          </Field>
        </div>
        <div className="card beige" style={{ marginTop: 16, padding: 14 }}>
          <div className="row between">
            <span className="small" style={{ color: 'var(--caramel-dark)' }}>
              <IconInfo style={{ width: 14, height: 14, verticalAlign: '-2px' }} /> Margen <DolarSourceNote prefix="a" />
            </span>
            <span className={`strong ${m.margin > 0 ? 'pos' : m.margin < 0 ? 'neg' : ''}`}>
              {fmtARS(m.margin)} · {fmtPct(m.pct, 1)}
            </span>
          </div>
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary">
            Guardar
          </button>
        </div>
      </form>
    </Modal>
  )
}

function AdjustForm({ product, onClose, onSave }) {
  const [stock, setStock] = useState(product.stock)
  const [reason, setReason] = useState(REASONS[0])
  const [note, setNote] = useState('')
  const delta = (Number(stock) || 0) - (Number(product.stock) || 0)
  return (
    <Modal open onClose={onClose} title={`Ajustar stock de ${product.name}`} subtitle="Para roturas, regalos a influencers o correcciones de inventario." size="narrow">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onSave(product, Math.max(0, Math.round(Number(stock) || 0)), reason, note.trim())
        }}
      >
        <div className="stack" style={{ gap: 14 }}>
          <Field label="Nuevo stock" hint={delta !== 0 ? `${delta > 0 ? 'Suma' : 'Resta'} ${fmtNum(Math.abs(delta))} unidades` : 'Sin cambios'}>
            <input className="input" type="number" min="0" step="1" value={stock} onChange={(e) => setStock(e.target.value)} autoFocus />
          </Field>
          <Field label="Motivo">
            <select className="select" value={reason} onChange={(e) => setReason(e.target.value)}>
              {REASONS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </Field>
          <Field label="Nota (opcional)">
            <input className="input" placeholder="Ej: kit para @influencer" value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={delta === 0}>
            Aplicar ajuste
          </button>
        </div>
      </form>
    </Modal>
  )
}
