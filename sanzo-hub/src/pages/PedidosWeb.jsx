import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { PageHeader, ConfirmDialog, EmptyState, Segmented, Modal, Field } from '../components/ui/Primitives.jsx'
import { IconCheck, IconX, IconPhone, IconRefresh, IconTrash, IconShip, IconDownload, IconAlert } from '../components/ui/Icons.jsx'
import { bajarPdf, llamarCorreo } from '../lib/correo.js'
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
  const { state, confirmWebOrder, setWebOrderStatus, removeItem, removeSale, notify } = useApp()
  const orders = state.webOrders
  const [seg, setSeg] = useState('open')
  const [confirming, setConfirming] = useState(null)
  const [canceling, setCanceling] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [enviando, setEnviando] = useState(null)

  // Ventas que salieron de este pedido (las crea la base con webOrderId al confirmarlo).
  const ventasDe = (o) => state.sales.filter((s) => s.webOrderId === o.id)

  // Para pedidos de prueba o cargados por error: borra el pedido y sus ventas, y devuelve el stock.
  const borrar = (o) => {
    const ventas = ventasDe(o)
    for (const s of ventas) removeSale(s.id, { restoreStock: true })
    removeItem('webOrders', o.id)
    notify(ventas.length ? `Pedido borrado, con sus ${ventas.length} ventas. Stock devuelto.` : 'Pedido borrado')
  }

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
              <OrderCard key={o.id} order={o} onConfirm={() => setConfirming(o)} onCancel={() => setCanceling(o)} onReopen={() => setWebOrderStatus(o.id, 'a_coordinar')} onDelete={() => setDeleting(o)} onGenerarEnvio={() => setEnviando(o)} />
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
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => borrar(deleting)}
        title={`¿Borrar el pedido ${deleting?.numero || ''}?`}
        message={
          deleting && ventasDe(deleting).length
            ? `Se borra el pedido y sus ${ventasDe(deleting).length} ventas, y vuelve el stock. Para pedidos de prueba o cargados por error. La plata de Mercado Pago no se devuelve sola: eso se hace en MP.`
            : 'Se borra el pedido. No tiene ventas cargadas.'
        }
      />
      {enviando && <GenerarEnvio key={enviando.id} order={enviando} onClose={() => setEnviando(null)} />}
    </div>
  )
}

/** Envío por Correo Argentino del pedido: número de seguimiento, etiqueta y anular; o el botón para generarlo. */
function EnvioCorreo({ order: o, onGenerar }) {
  const { notify } = useApp()
  const [ocupado, setOcupado] = useState('')
  const envio = o.envioCorreo && !o.envioCorreo.anulado ? o.envioCorreo : null

  const etiqueta = async () => {
    setOcupado('etiqueta')
    try {
      const r = await llamarCorreo('etiqueta', { pedidoId: o.id })
      bajarPdf(r.archivo, r.nombre)
    } catch (e) {
      notify(e.message, 'error')
    } finally {
      setOcupado('')
    }
  }

  const anular = async () => {
    if (!window.confirm(`¿Anular el envío ${envio.tracking}? Solo se puede si todavía no lo despachaste.`)) return
    setOcupado('anular')
    try {
      await llamarCorreo('anular', { pedidoId: o.id })
      notify('Envío anulado. Lo podés generar de nuevo.')
    } catch (e) {
      notify(e.message, 'error')
    } finally {
      setOcupado('')
    }
  }

  return (
    <div className="card beige" style={{ padding: 12 }}>
      {envio ? (
        <div className="row between" style={{ gap: 8 }}>
          <div className="small">
            <div className="strong">Correo Argentino{envio.test ? ' · prueba' : ''}</div>
            <div className="muted">
              Seguimiento <span className="tabular">{envio.tracking}</span>
            </div>
          </div>
          <div className="row" style={{ gap: 6 }}>
            <button className="btn btn-ghost btn-sm" onClick={anular} disabled={!!ocupado}>
              <IconX /> {ocupado === 'anular' ? 'Anulando…' : 'Anular'}
            </button>
            <button className="btn btn-primary btn-sm" onClick={etiqueta} disabled={!!ocupado}>
              <IconDownload /> {ocupado === 'etiqueta' ? 'Bajando…' : 'Etiqueta'}
            </button>
          </div>
        </div>
      ) : (
        <div className="row between" style={{ gap: 8 }}>
          <span className="small muted">{o.envioCorreo?.anulado ? `Envío ${o.envioCorreo.tracking} anulado.` : 'Todavía sin envío.'}</span>
          <button className="btn btn-ghost btn-sm" onClick={onGenerar}>
            <IconShip /> Generar envío
          </button>
        </div>
      )}
    </div>
  )
}

/** Ventana para dar de alta el envío en Correo Argentino: medidas del paquete y, si retira, la sucursal. */
function GenerarEnvio({ order: o, onClose }) {
  const { state, notify } = useApp()
  const c = o.cliente || {}
  const porSucursal = c.entrega === 'sucursal'
  const [paquete, setPaquete] = useState(() => ({ alto: '', ancho: '', largo: '', peso: '', ...(state.settings.correo?.paquete || {}) }))
  const [sucursales, setSucursales] = useState(null) // null = cargando
  const [agencyId, setAgencyId] = useState('')
  const [error, setError] = useState('')
  const [creando, setCreando] = useState(false)

  // Si retira en sucursal, traemos las de su provincia (primero las de su localidad).
  useEffect(() => {
    if (!porSucursal) return
    llamarCorreo('sucursales', { provincia: c.provincia })
      .then((r) => {
        const loc = String(c.localidad || '').toLowerCase()
        const lista = [...r.sucursales].sort((a, b) => Number(b.localidad.toLowerCase() === loc) - Number(a.localidad.toLowerCase() === loc) || a.localidad.localeCompare(b.localidad))
        setSucursales(lista)
      })
      .catch((e) => {
        setSucursales([])
        setError(e.message)
      })
  }, [porSucursal, c.provincia, c.localidad])

  const crear = async () => {
    setError('')
    setCreando(true)
    try {
      const r = await llamarCorreo('crear', { pedidoId: o.id, paquete, agencyId: porSucursal ? agencyId : undefined })
      notify(`Envío creado: ${r.envio.tracking}. Ya podés bajar la etiqueta.`)
      onClose()
    } catch (e) {
      setError(e.message)
    } finally {
      setCreando(false)
    }
  }

  const p = (k) => ({ value: paquete[k], onChange: (e) => setPaquete({ ...paquete, [k]: e.target.value }), type: 'number', inputMode: 'numeric', min: 0, className: 'input' })

  return (
    <Modal open onClose={onClose} title={`Envío del pedido ${o.numero}`} subtitle="Se da de alta en Correo Argentino con los datos del cliente. Después bajás la etiqueta y lo despachás.">
      <div className="stack" style={{ gap: 14 }}>
        <div className="small">
          <div className="strong">{c.nombre}</div>
          <div className="muted">
            {porSucursal ? 'Retira en sucursal' : [`${c.calle || ''} ${c.altura || ''}`.trim(), c.pisoDepto].filter(Boolean).join(', ')} ·{' '}
            {[c.localidad, c.provincia, c.codigoPostal].filter(Boolean).join(' · ')}
          </div>
        </div>

        {porSucursal && (
          <Field label="Sucursal donde retira" full>
            {sucursales === null ? (
              <p className="muted small">Cargando sucursales…</p>
            ) : (
              <select className="select" value={agencyId} onChange={(e) => setAgencyId(e.target.value)}>
                <option value="">Elegí la sucursal</option>
                {sucursales.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.localidad} · {s.nombre} · {s.direccion}
                  </option>
                ))}
              </select>
            )}
          </Field>
        )}

        <div className="form-grid">
          <Field label="Alto (cm)">
            <input {...p('alto')} />
          </Field>
          <Field label="Ancho (cm)">
            <input {...p('ancho')} />
          </Field>
          <Field label="Largo (cm)">
            <input {...p('largo')} />
          </Field>
          <Field label="Peso (gramos)">
            <input {...p('peso')} />
          </Field>
        </div>

        {error && (
          <div className="banner warn">
            <IconAlert />
            <span>{error}</span>
          </div>
        )}

        <div className="form-actions">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={crear} disabled={creando || (porSucursal && !agencyId)}>
            <IconShip /> {creando ? 'Creando…' : 'Crear envío'}
          </button>
        </div>
      </div>
    </Modal>
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

function OrderCard({ order: o, onConfirm, onCancel, onReopen, onDelete, onGenerarEnvio }) {
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
        <div className="row" style={{ gap: 2, alignItems: 'flex-start' }}>
          <div className="serif" style={{ fontSize: 22, textAlign: 'right' }}>
            {fmtARS(o.total)}
            {o.envioACotizar && <div className="muted small">+ envío</div>}
          </div>
          <button className="btn btn-icon" onClick={onDelete} aria-label="Borrar pedido" title="Borrar pedido">
            <IconTrash />
          </button>
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
              {/* Dónde va el parche en cada pieza (lo eligió arrastrándolo en la web). */}
              {it.ubicacion?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                  {it.ubicacion.map((u) => (
                    <div key={u.pieza} className="small muted" style={{ textAlign: 'center' }}>
                      <div style={{ position: 'relative', width: 72, height: 90, background: '#f4ede3', borderRadius: 6, overflow: 'hidden', border: '1px solid rgba(0,0,0,.08)' }}>
                        <img src={u.foto} alt={u.pieza} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <span style={{ position: 'absolute', left: `${u.x}%`, top: `${u.y}%`, width: 10, height: 10, marginLeft: -5, marginTop: -5, borderRadius: 99, background: '#c0392b', boxShadow: '0 0 0 2px #fff' }} />
                      </div>
                      {u.pieza}
                    </div>
                  ))}
                </div>
              )}
              {/* Imágenes que subió para grabar (una por pieza si eligió diseños distintos): tocándola se abre la original. */}
              {(it.imagenes || (it.imagen ? [{ pieza: '', url: it.imagen }] : [])).map((m, j) =>
                m.url ? (
                  <a key={j} href={m.url} target="_blank" rel="noreferrer" className="small" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                    <img src={m.url} alt="Imagen para grabar" style={{ width: 56, height: 56, objectFit: 'contain', borderRadius: 6, background: '#f4ede3', border: '1px solid rgba(0,0,0,.08)' }} />
                    <span style={{ textDecoration: 'underline' }}>Ver / descargar imagen para grabar{m.pieza ? ` (${m.pieza})` : ''}</span>
                  </a>
                ) : (
                  <div key={j} className="small" style={{ marginTop: 4, color: '#a0522d' }}>Falta la imagen{m.pieza ? ` (${m.pieza})` : ''}: la manda por WhatsApp</div>
                ),
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

      {o.estado !== 'cancelado' && o.estado !== 'rechazado' && <EnvioCorreo order={o} onGenerar={onGenerarEnvio} />}

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
