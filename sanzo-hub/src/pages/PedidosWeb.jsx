import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { PageHeader, ConfirmDialog, EmptyState, Segmented } from '../components/ui/Primitives.jsx'
import { IconCheck, IconX, IconPhone, IconRefresh } from '../components/ui/Icons.jsx'
import { fmtARS, fmtNum } from '../utils/format.js'

// Pedidos que entran por la tienda (sanzo-web). Los pagados con Mercado Pago se pasan solos a
// ventas; los "a coordinar" (envío a cotizar, transferencia…) se confirman acá a mano.
const ESTADOS = {
  pendiente_pago: { label: 'Esperando pago', bg: '#f3e6cf', color: '#9a7327' },
  a_coordinar: { label: 'A coordinar', bg: 'var(--beige-light)', color: 'var(--caramel-dark)' },
  pagado: { label: 'Pagado', bg: 'var(--green-soft)', color: 'var(--green)' },
  rechazado: { label: 'Pago rechazado', bg: '#f0c8bc', color: '#B5533C' },
  revisar: { label: 'Revisar monto', bg: '#f0c8bc', color: '#B5533C' },
  cancelado: { label: 'Cancelado', bg: 'var(--beige-soft)', color: 'var(--muted)' },
}

const cerrado = (o) => o.aplicado || o.estado === 'cancelado' || o.estado === 'rechazado'

const fmtCuando = (iso) =>
  iso ? new Date(iso).toLocaleString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'

function linkWhatsapp(celular) {
  let d = String(celular || '').replace(/\D/g, '')
  if (!d) return null
  if (!d.startsWith('54')) d = '549' + d.replace(/^0/, '')
  return `https://wa.me/${d}`
}

export default function PedidosWeb() {
  const { state, confirmWebOrder, setWebOrderStatus } = useApp()
  const orders = state.webOrders
  const [seg, setSeg] = useState('open')
  const [confirming, setConfirming] = useState(null)
  const [canceling, setCanceling] = useState(null)

  const sorted = useMemo(() => [...orders].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')), [orders])
  const filtered = sorted.filter((o) => (seg === 'open' ? !cerrado(o) : seg === 'done' ? o.aplicado : true))

  const mes = new Date().toISOString().slice(0, 7)
  const delMes = orders.filter((o) => (o.createdAt || '').startsWith(mes))
  const vendidoMes = delMes.filter((o) => o.aplicado).reduce((a, o) => a + (Number(o.total) || 0), 0)
  const abiertos = orders.filter((o) => !cerrado(o)).length

  return (
    <div>
      <PageHeader
        eyebrow="Tienda online"
        title="Pedidos web"
        subtitle="Lo que entra por sanzo-web. Si pagan con Mercado Pago se pasa solo a Ventas (descuenta stock y suma a la ganancia); los que se coordinan por mensaje los confirmás acá."
      />

      <div className="grid grid-3 mb-16">
        <Stat label="Para atender" value={fmtNum(abiertos)} sub="Esperando pago o a coordinar" />
        <Stat label="Pedidos este mes" value={fmtNum(delMes.length)} sub={`${fmtNum(delMes.filter((o) => o.aplicado).length)} ya pasados a ventas`} />
        <Stat label="Vendido por la web este mes" value={fmtARS(vendidoMes)} sub="Solo los confirmados" />
      </div>

      <div className="card">
        <div className="toolbar">
          <Segmented
            value={seg}
            onChange={setSeg}
            options={[
              { value: 'open', label: 'Para atender' },
              { value: 'done', label: 'En ventas' },
              { value: 'all', label: 'Todos' },
            ]}
          />
        </div>

        {orders.length === 0 ? (
          <EmptyState title="Todavía no entraron pedidos" text="Cuando alguien compre en la web, aparece acá al instante." />
        ) : filtered.length === 0 ? (
          <EmptyState compact title="Nada por acá" text={seg === 'open' ? 'No hay pedidos pendientes. Todo al día.' : 'Probá con otro filtro.'} />
        ) : (
          <div className="grid grid-2" style={{ marginTop: 14 }}>
            {filtered.map((o) => (
              <OrderCard key={o.id} order={o} onConfirm={() => setConfirming(o)} onCancel={() => setCanceling(o)} onReopen={() => setWebOrderStatus(o.id, 'a_coordinar')} />
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!confirming}
        onClose={() => setConfirming(null)}
        onConfirm={() => confirmWebOrder(confirming.id)}
        title={`¿Confirmar el pedido ${confirming?.numero || ''}?`}
        message="Se cargan las ventas (canal Tienda online), se descuenta el stock y suma a la ganancia. Hacelo cuando ya cobraste."
        confirmLabel="Sí, ya cobramos"
        danger={false}
      />
      <ConfirmDialog
        open={!!canceling}
        onClose={() => setCanceling(null)}
        onConfirm={() => setWebOrderStatus(canceling.id, 'cancelado')}
        title={`¿Cancelar el pedido ${canceling?.numero || ''}?`}
        message="No toca ventas ni stock. Lo podés reactivar después."
        confirmLabel="Sí, cancelar"
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

function OrderCard({ order: o, onConfirm, onCancel, onReopen }) {
  const c = o.cliente || {}
  const est = ESTADOS[o.estado] || ESTADOS.a_coordinar
  const wa = linkWhatsapp(c.celular)
  const direccion =
    c.entrega === 'sucursal'
      ? 'Retira en sucursal de Correo Argentino'
      : [`${c.calle || ''} ${c.altura || ''}`.trim(), c.pisoDepto].filter(Boolean).join(', ')
  const lugar = [c.localidad, c.provincia, c.codigoPostal && `CP ${String(c.codigoPostal).toUpperCase()}`].filter(Boolean).join(' · ')

  return (
    <div className="card hoverable" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="row between" style={{ alignItems: 'flex-start' }}>
        <div>
          <div className="row" style={{ gap: 8 }}>
            <h3 style={{ fontSize: 20 }}>{o.numero}</h3>
            <span className="status" style={{ background: est.bg, color: est.color }}>
              {est.label}
            </span>
          </div>
          <div className="muted small">{fmtCuando(o.createdAt)}</div>
        </div>
        <div className="serif" style={{ fontSize: 22, textAlign: 'right' }}>
          {fmtARS(o.total)}
          {o.envioACotizar && <div className="muted small">+ envío</div>}
        </div>
      </div>

      <div>
        <div className="strong">{c.nombre}</div>
        <div className="muted small">
          {[c.email, c.celular, c.dni && `DNI ${c.dni}`].filter(Boolean).join(' · ')}
        </div>
        <div className="small" style={{ marginTop: 4 }}>
          {direccion}
          {lugar && <div className="muted">{lugar}</div>}
          {c.referencia && <div className="muted">Ref.: {c.referencia}</div>}
        </div>
      </div>

      <div>
        {(o.items || []).map((it, i) => (
          <div className="stat-line" key={i}>
            <span>
              {it.cantidad} × {it.nombre}
              {(it.opcion || it.personalizacion) && (
                <div className="muted small">{[it.opcion, it.personalizacion && `Personalizado: ${it.personalizacion}`].filter(Boolean).join(' · ')}</div>
              )}
            </span>
            <span className="v">{fmtARS(it.subtotal)}</span>
          </div>
        ))}
        {Number(o.ahorro) > 0 && (
          <div className="stat-line">
            <span className="muted">Promo</span>
            <span className="v">− {fmtARS(o.ahorro)}</span>
          </div>
        )}
        <div className="stat-line">
          <span className="muted">Envío</span>
          <span className="v">{o.envio}</span>
        </div>
      </div>

      {c.notas && <p className="muted small">“{c.notas}”</p>}

      <div className="row between" style={{ marginTop: 'auto' }}>
        <div className="small muted">
          {o.aplicado ? (
            <span className="pos strong">
              <IconCheck style={{ width: 14, height: 14, verticalAlign: '-2px' }} /> En ventas{' '}
              {o.pago?.manual ? `(confirmado a mano${o.pago.por ? ` por ${o.pago.por}` : ''})` : `(Mercado Pago${o.pago?.medio ? ` · ${o.pago.medio}` : ''})`}
            </span>
          ) : o.estado === 'revisar' ? (
            <span className="neg">MP cobró {fmtARS(o.pago?.monto)}: no coincide con el total</span>
          ) : o.pagoOnline ? (
            'Pago online con Mercado Pago'
          ) : (
            'A coordinar por mensaje'
          )}
        </div>
        <div className="row" style={{ gap: 6 }}>
          {wa && (
            <a className="btn btn-ghost btn-sm" href={wa} target="_blank" rel="noreferrer">
              <IconPhone /> WhatsApp
            </a>
          )}
          {!o.aplicado && o.estado === 'cancelado' && (
            <button className="btn btn-ghost btn-sm" onClick={onReopen}>
              <IconRefresh /> Reactivar
            </button>
          )}
          {!o.aplicado && o.estado !== 'cancelado' && (
            <>
              <button className="btn btn-ghost btn-sm" onClick={onCancel}>
                <IconX /> Cancelar
              </button>
              <button className="btn btn-primary btn-sm" onClick={onConfirm}>
                <IconCheck /> Confirmar venta
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
