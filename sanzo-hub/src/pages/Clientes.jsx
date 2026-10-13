import { lazy, Suspense, useMemo, useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { PageHeader, Modal, ConfirmDialog, EmptyState, Field, Segmented } from '../components/ui/Primitives.jsx'
import { IconPlus, IconEdit, IconTrash, IconSearch, IconHeart, IconPhone, IconUsers, IconX } from '../components/ui/Icons.jsx'
import { fmtARS, fmtDate, fmtNum } from '../utils/format.js'
import { aggregateClients, normalizeHandle } from '../utils/calc.js'

const MapaLugares = lazy(() => import('../components/MapaLugares.jsx'))

export default function Clientes() {
  const { state, addItem, updateItem, removeItem, notify } = useApp()
  const { sales, clients, products } = state
  const [modal, setModal] = useState(null)
  const [toDelete, setToDelete] = useState(null)
  const [q, setQ] = useState('')
  const [seg, setSeg] = useState('all')

  const all = useMemo(() => aggregateClients(sales, clients), [sales, clients])
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    return all.filter((c) => {
      if (seg === 'repeat' && c.purchases < 2) return false
      if (seg === 'interested' && c.purchases > 0) return false
      if (seg === 'buyers' && c.purchases === 0) return false
      if (s && !`${c.name || ''} ${c.handle || ''} ${c.phone || ''} ${c.notes || ''}`.toLowerCase().includes(s)) return false
      return true
    })
  }, [all, q, seg])

  const buyers = all.filter((c) => c.purchases > 0)
  const repeat = all.filter((c) => c.purchases >= 2)
  const interested = all.filter((c) => c.purchases === 0)
  const productName = (id) => products.find((p) => p.id === id)?.name || 'Producto'

  const onSave = (data, id) => {
    if (id) {
      updateItem('clients', id, data)
      notify('Cliente actualizado')
    } else {
      addItem('clients', data)
      notify('Cliente guardado')
    }
    setModal(null)
  }

  // Un cliente derivado de ventas (sin registro manual) se puede "completar": creamos su ficha manual.
  const editClient = (c) => {
    if (c.manual) setModal(clients.find((x) => x.id === c.id) || c)
    else setModal({ name: c.name, handle: c.handle, phone: '', notes: '', status: 'cliente', derived: true })
  }

  return (
    <div>
      <PageHeader eyebrow="Clientes" title="Clientes" subtitle="Se arma sola con las ventas. Sumá a mano los interesados que escriben por DM: son tu base para la preventa.">
        <button className="btn btn-primary" onClick={() => setModal('new')}>
          <IconPlus /> Agregar cliente
        </button>
      </PageHeader>

      <div className="grid grid-3 mb-16">
        <Stat icon={IconUsers} label="Compraron" value={fmtNum(buyers.length)} sub={`${fmtNum(all.length)} contactos en total`} />
        <Stat icon={IconHeart} label="Compraron 2+ veces" value={fmtNum(repeat.length)} sub="Los que más quieren a Sanzo" tone="pos" />
        <Stat icon={IconPhone} label="Interesados sin compra" value={fmtNum(interested.length)} sub="Para avisar cuando abra la preventa" />
      </div>

      <div className="card">
        <div className="toolbar">
          <div className="search">
            <IconSearch />
            <input className="input" placeholder="Buscar por nombre, @usuario o teléfono…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Segmented
            value={seg}
            onChange={setSeg}
            options={[
              { value: 'all', label: 'Todos' },
              { value: 'buyers', label: 'Compraron' },
              { value: 'repeat', label: '2+ compras' },
              { value: 'interested', label: 'Interesados' },
            ]}
          />
          {(q || seg !== 'all') && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setQ(''); setSeg('all') }}>
              <IconX /> Limpiar
            </button>
          )}
        </div>

        {all.length === 0 ? (
          <EmptyState title="Todavía no hay clientes" text="Cuando cargues ventas con nombre o @usuario, aparecen acá solos. También podés sumar interesados a mano." action={() => setModal('new')} actionLabel="Agregar un interesado" />
        ) : filtered.length === 0 ? (
          <EmptyState compact title="Nadie con ese filtro" text="Probá con otra búsqueda." />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Contacto</th>
                  <th className="num">Compras</th>
                  <th className="num">Gastó</th>
                  <th>Última compra</th>
                  <th>Estado</th>
                  <th className="actions"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.key}>
                    <td>
                      <div className="cell-title">{c.name || `@${normalizeHandle(c.handle)}`}</div>
                      {c.notes && <div className="cell-sub">{c.notes}</div>}
                    </td>
                    <td>
                      {c.handle && <div>@{normalizeHandle(c.handle)}</div>}
                      {c.phone && <div className="cell-sub">{c.phone}</div>}
                      {!c.handle && !c.phone && <span className="muted">—</span>}
                    </td>
                    <td className="num">
                      {fmtNum(c.purchases)}
                      {c.purchases > 0 && <div className="cell-sub">{[...new Set(c.sales.map((s) => productName(s.productId)))].slice(0, 2).join(', ')}</div>}
                    </td>
                    <td className={`num strong ${c.spent > 0 ? 'pos' : ''}`}>{fmtARS(c.spent)}</td>
                    <td className="tabular">{c.lastPurchase ? fmtDate(c.lastPurchase) : <span className="muted">—</span>}</td>
                    <td>
                      {c.purchases >= 2 ? (
                        <span className="chip green">
                          <IconHeart style={{ width: 12, height: 12 }} /> Recurrente
                        </span>
                      ) : c.purchases === 1 ? (
                        <span className="chip">Cliente</span>
                      ) : (
                        <span className="chip outline">Interesado</span>
                      )}
                    </td>
                    <td className="actions">
                      <button className="btn btn-icon" onClick={() => editClient(c)} aria-label="Editar">
                        <IconEdit />
                      </button>
                      {c.manual && (
                        <button className="btn btn-icon danger" onClick={() => setToDelete(c)} aria-label="Borrar">
                          <IconTrash />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ marginTop: 16 }}>
        <Suspense fallback={<div className="card places-map places-map-loading">Cargando mapa…</div>}>
          <MapaLugares />
        </Suspense>
      </div>

      {modal && <ClientForm key={modal === 'new' ? 'new' : modal.id || 'derived'} client={modal === 'new' ? null : modal} onClose={() => setModal(null)} onSave={onSave} />}

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          removeItem('clients', toDelete.id)
          notify('Cliente borrado')
        }}
        title="¿Borrar este cliente?"
        message="Se borra la ficha manual. Si tiene ventas cargadas, va a seguir apareciendo con los datos de esas ventas."
      />
    </div>
  )
}

function Stat({ icon: Icon, label, value, sub, tone = '' }) {
  return (
    <div className="card" style={{ padding: '16px 18px' }}>
      <div className="kpi-label">
        <Icon /> {label}
      </div>
      <div className={`kpi-value sm ${tone}`} style={{ marginTop: 6 }}>
        {value}
      </div>
      {sub && <div className="kpi-foot">{sub}</div>}
    </div>
  )
}

function ClientForm({ client, onClose, onSave }) {
  const [f, setF] = useState(() => ({ name: '', handle: '', phone: '', notes: '', status: 'interesado', ...(client || {}) }))
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }))
  const [err, setErr] = useState('')
  const isNew = !client?.id
  const submit = (e) => {
    e.preventDefault()
    if (!f.name.trim() && !f.handle.trim()) return setErr('Cargá al menos el nombre o el @usuario.')
    onSave({ name: f.name.trim(), handle: f.handle.trim().replace(/^@/, ''), phone: f.phone.trim(), notes: f.notes.trim(), status: f.status }, client?.id)
  }
  return (
    <Modal open onClose={onClose} title={isNew ? (client?.derived ? 'Completar ficha' : 'Nuevo cliente') : 'Editar cliente'} subtitle={client?.derived ? 'Este contacto viene de las ventas. Sumale teléfono y notas.' : 'Interesados de DMs, clientes de la preventa, quien sea.'} size="narrow">
      <form onSubmit={submit}>
        <div className="stack" style={{ gap: 14 }}>
          <Field label="Nombre">
            <input className="input" value={f.name} onChange={(e) => set('name', e.target.value)} autoFocus placeholder="Nombre y apellido" />
          </Field>
          <Field label="@ de Instagram / X" hint="Con este @ se cruzan las ventas para contar compras.">
            <input className="input" value={f.handle} onChange={(e) => set('handle', e.target.value)} placeholder="@usuario" />
          </Field>
          <Field label="Teléfono / WhatsApp">
            <input className="input" type="tel" value={f.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+54 9 11 …" />
          </Field>
          <Field label="Notas">
            <textarea className="textarea" value={f.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Qué preguntó, qué perro tiene, si quiere que le avisemos…" />
          </Field>
        </div>
        {err && <div className="form-error" style={{ marginTop: 14 }}>{err}</div>}
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
