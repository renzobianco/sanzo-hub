import { useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { useApp } from '../context/AppContext.jsx'
import { PageHeader, Modal, ConfirmDialog, EmptyState, Field, ProgressBar, ChartTooltip } from '../components/ui/Primitives.jsx'
import { IconPlus, IconEdit, IconTrash, IconTarget, IconTrendUp, IconCalendar, IconCheck, IconInfo } from '../components/ui/Icons.jsx'
import { NETWORKS } from '../data/defaults.js'
import { fmtARS, fmtNum, fmtPct, fmtDate, fmtDateShort, todayISO, fmtUSD } from '../utils/format.js'
import { phaseStatus, recovery, breakEven, sumUnits, CONTENT_BUFFERED_STATUSES } from '../utils/calc.js'

const NETWORK_ABBR = { instagram: 'IG', twitter: 'X', facebook: 'FB', tiktok: 'TT' }

export default function Objetivos() {
  const { state, addItem, updateItem, removeItem, savePhases, notify } = useApp()
  const { phases, goals, followers, sales, products, contentPosts } = state
  const today = todayISO()
  const [goalModal, setGoalModal] = useState(null)
  const [goalDelete, setGoalDelete] = useState(null)
  const [phaseModal, setPhaseModal] = useState(false)
  const [followerModal, setFollowerModal] = useState(null)

  const phaseList = useMemo(() => phaseStatus(phases, today), [phases, today])
  const rec = useMemo(() => recovery(state), [state])
  const be = useMemo(() => breakEven(state), [state])
  const kit = products.find((p) => p.isKit)
  const kitsSold = useMemo(() => sumUnits(sales.filter((s) => s.productId === kit?.id)), [sales, kit])
  const followersSorted = useMemo(() => [...followers].sort((a, b) => (a.date < b.date ? -1 : 1)), [followers])
  const latestFollowers = followersSorted[followersSorted.length - 1]
  const prevFollowers = followersSorted[followersSorted.length - 2]

  // Progreso real de cada meta
  const progressOf = (g) => {
    if (g.type === 'kits') return { current: kitsSold, label: `${fmtNum(kitsSold)} de ${fmtNum(g.target)} kits vendidos` }
    if (g.type === 'investment') return { current: rec.pct, label: `${fmtPct(rec.pct)} recuperado · ${fmtARS(rec.profitARS)} de ganancia bruta`, isPct: true }
    if (g.type === 'followers') {
      const cur = Number(latestFollowers?.[g.network]) || 0
      const net = NETWORKS.find((n) => n.key === g.network)?.label || g.network
      return { current: cur, label: `${fmtNum(cur)} de ${fmtNum(g.target)} seguidores en ${net}` }
    }
    if (g.type === 'scheduledPosts') {
      const cur = contentPosts.filter((p) => CONTENT_BUFFERED_STATUSES.includes(p.status)).length
      return { current: cur, label: `${fmtNum(cur)} de ${fmtNum(g.target)} publicaciones programadas` }
    }
    return { current: Number(g.current) || 0, label: `${fmtNum(g.current || 0)} de ${fmtNum(g.target)}` }
  }

  return (
    <div>
      <PageHeader eyebrow="Objetivos y fases" title="Objetivos y fases" subtitle="Dónde estamos en el plan, qué metas se van cumpliendo y cuánto falta para cubrir la inversión.">
        <button className="btn btn-ghost" onClick={() => setPhaseModal(true)}>
          <IconCalendar /> Editar fechas de fases
        </button>
        <button className="btn btn-primary" onClick={() => setGoalModal('new')}>
          <IconPlus /> Nueva meta
        </button>
      </PageHeader>

      <div className="phases mb-16">
        {phaseList.map((p) => (
          <div key={p.id} className={`phase ${p.active ? 'active' : p.ended ? 'done' : ''}`}>
            <div className="row between">
              <div className="code">{p.code}</div>
              {p.active && <span className="chip" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>En curso</span>}
              {p.ended && (
                <span className="chip green">
                  <IconCheck style={{ width: 12, height: 12 }} /> Completada
                </span>
              )}
              {!p.started && <span className="chip outline">En {p.daysToStart} días</span>}
            </div>
            <div className="pname">{p.name}</div>
            <div className="pdates">
              {fmtDate(p.start)} {p.end ? `– ${fmtDate(p.end)}` : 'en adelante'}
            </div>
            <div className="pdesc">{p.description}</div>
            <ProgressBar value={p.pct} thin />
            <div className="pdates" style={{ marginTop: 6 }}>
              {p.active && p.end ? `${fmtPct(p.pct)} · quedan ${p.daysLeft} días` : p.active ? 'Sin fecha de fin' : p.ended ? 'Terminada' : 'Todavía no empezó'}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-3">
        <div className="card span-2">
          <div className="card-head">
            <div>
              <div className="card-title">Metas</div>
              <div className="card-sub">Las automáticas se alimentan solas de ventas, inversión y seguidores.</div>
            </div>
          </div>
          {goals.length === 0 ? (
            <EmptyState compact title="Sin metas todavía" text="Creá una meta para ver el progreso." action={() => setGoalModal('new')} actionLabel="Nueva meta" />
          ) : (
            <div className="list">
              {goals.map((g) => {
                const p = progressOf(g)
                const pct = p.isPct ? p.current : g.target > 0 ? (p.current / g.target) * 100 : 0
                const done = pct >= 100
                return (
                  <div className="list-item" key={g.id} style={{ alignItems: 'flex-start', padding: '14px 0' }}>
                    <div className="icon" style={{ background: done ? 'var(--green-soft)' : 'var(--beige-soft)', color: done ? 'var(--green)' : 'var(--caramel)' }}>
                      {done ? <IconCheck /> : <IconTarget />}
                    </div>
                    <div className="body">
                      <div className="row between" style={{ marginBottom: 6 }}>
                        <div className="title" style={{ whiteSpace: 'normal' }}>
                          {g.title}
                          {g.auto && (
                            <span className="chip outline" style={{ marginLeft: 8, padding: '2px 8px', fontSize: 11 }}>
                              automática
                            </span>
                          )}
                        </div>
                        <span className={`strong ${done ? 'pos' : ''}`}>{fmtPct(Math.min(100, pct))}</span>
                      </div>
                      <ProgressBar value={pct} />
                      <div className="sub" style={{ marginTop: 6 }}>
                        {p.label}
                      </div>
                    </div>
                    <div className="row" style={{ gap: 2 }}>
                      <button className="btn btn-icon" onClick={() => setGoalModal(g)} aria-label="Editar">
                        <IconEdit />
                      </button>
                      <button className="btn btn-icon danger" onClick={() => setGoalDelete(g)} aria-label="Borrar">
                        <IconTrash />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="card dark">
          <div className="card-title" style={{ color: 'var(--beige)' }}>
            Punto de equilibrio
          </div>
          <div className="card-sub" style={{ color: 'rgba(247,241,234,0.6)' }}>
            Con el margen real promedio de cada kit
          </div>
          <div className="divider" style={{ background: 'rgba(255,255,255,0.12)' }} />
          {be.reached ? (
            <div>
              <div className="serif" style={{ fontSize: 30, lineHeight: 1.1, color: '#9fc08f' }}>
                ¡Inversión cubierta!
              </div>
              <p className="small" style={{ opacity: 0.75, marginTop: 8 }}>
                La ganancia bruta acumulada ya supera los {fmtUSD(rec.investmentUSD)} invertidos. Todo lo que venga es ganancia.
              </p>
            </div>
          ) : be.kitsNeeded !== null ? (
            <div>
              <div className="small" style={{ opacity: 0.7 }}>
                Te faltan vender
              </div>
              <div className="serif" style={{ fontSize: 46, lineHeight: 1 }}>
                ~{fmtNum(be.kitsNeeded)} <span style={{ fontSize: 20 }}>kits</span>
              </div>
              <p className="small" style={{ opacity: 0.75, marginTop: 10 }}>
                para cubrir los {fmtUSD(rec.investmentUSD)} de inversión inicial.
              </p>
              <div className="divider" style={{ background: 'rgba(255,255,255,0.12)' }} />
              <div className="stat-line" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
                <span style={{ opacity: 0.7 }}>Margen por kit</span>
                <span className="v">{fmtARS(be.avgMarginKit)}</span>
              </div>
              <div className="stat-line" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
                <span style={{ opacity: 0.7 }}>Precio promedio real</span>
                <span className="v">{fmtARS(be.avgPriceKit)}</span>
              </div>
              <div className="stat-line" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
                <span style={{ opacity: 0.7 }}>Falta cubrir</span>
                <span className="v">{fmtARS(be.remaining)}</span>
              </div>
              <p className="small" style={{ opacity: 0.55, marginTop: 10 }}>
                <IconInfo style={{ width: 13, height: 13, verticalAlign: '-2px' }} /> {be.usingRealData ? `Calculado con las ${fmtNum(be.kitUnits)} ventas reales de kits.` : 'Todavía sin ventas de kits: usamos el precio de lista de Productos.'}
              </p>
            </div>
          ) : (
            <p className="small" style={{ opacity: 0.75 }}>
              Cargá el costo en USD y el precio de venta del kit en Productos para calcular cuántos kits faltan.
            </p>
          )}
        </div>
      </div>

      <div className="card mt-24">
        <div className="card-head">
          <div>
            <div className="card-title">
              <IconTrendUp style={{ width: 18, height: 18, verticalAlign: '-3px', marginRight: 6 }} />
              Crecimiento en redes
            </div>
            <div className="card-sub">Cargá los seguidores una vez por semana para ver la curva. Sin ads, esto es el termómetro de la Fase 01.</div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setFollowerModal('new')}>
            <IconPlus /> Cargar seguidores
          </button>
        </div>

        {followers.length === 0 ? (
          <EmptyState compact title="Todavía no cargaste seguidores" text="Anotá cuántos seguidores tienen Instagram, X, Facebook y TikTok hoy, y repetilo cada semana." action={() => setFollowerModal('new')} actionLabel="Cargar la primera medición" />
        ) : (
          <div className="grid grid-3">
            <div className="span-2">
              <div className="chart-box">
                <ResponsiveContainer>
                  <LineChart data={followersSorted.map((f) => ({ ...f, label: fmtDateShort(f.date) }))} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="#EFE6DB" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#8a7a6d' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#8a7a6d' }} axisLine={false} tickLine={false} width={50} tickFormatter={(v) => fmtNum(v)} />
                    <Tooltip content={<ChartTooltip formatter={(v) => fmtNum(v)} />} cursor={{ stroke: '#D5B9A2' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: '#8a7a6d' }} />
                    <Line type="monotone" dataKey="instagram" name="Instagram" stroke="#956037" strokeWidth={2.2} dot={{ r: 3, fill: '#956037', strokeWidth: 0 }} />
                    <Line type="monotone" dataKey="twitter" name="X" stroke="#1A1A1A" strokeWidth={2.2} dot={{ r: 3, fill: '#1A1A1A', strokeWidth: 0 }} />
                    <Line type="monotone" dataKey="facebook" name="Facebook" stroke="#C9A06A" strokeWidth={2.2} dot={{ r: 3, fill: '#C9A06A', strokeWidth: 0 }} />
                    <Line type="monotone" dataKey="tiktok" name="TikTok" stroke="#B5533C" strokeWidth={2.2} dot={{ r: 3, fill: '#B5533C', strokeWidth: 0 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div>
              {NETWORKS.map((n) => {
                const cur = Number(latestFollowers?.[n.key]) || 0
                const prev = Number(prevFollowers?.[n.key]) || 0
                const diff = prevFollowers ? cur - prev : null
                return (
                  <div className="stat-line" key={n.key}>
                    <span className="muted">{n.label}</span>
                    <span className="v">
                      {fmtNum(cur)}
                      {diff !== null && (
                        <span className={`small ${diff > 0 ? 'pos' : diff < 0 ? 'neg' : 'muted'}`} style={{ marginLeft: 6 }}>
                          {diff > 0 ? '+' : ''}
                          {fmtNum(diff)}
                        </span>
                      )}
                    </span>
                  </div>
                )
              })}
              <div className="muted small" style={{ marginTop: 10 }}>
                Última medición: {fmtDate(latestFollowers.date)}
              </div>
              <div className="list mt-16" style={{ maxHeight: 180, overflowY: 'auto' }}>
                {[...followersSorted].reverse().map((f) => (
                  <div className="list-item" key={f.id} style={{ padding: '6px 0' }}>
                    <div className="body">
                      <div className="sub">
                        {fmtDate(f.date)} · {NETWORKS.map((n) => `${NETWORK_ABBR[n.key] || n.label} ${fmtNum(f[n.key])}`).join(' · ')}
                      </div>
                    </div>
                    <button className="btn btn-icon" onClick={() => setFollowerModal(f)} aria-label="Editar" style={{ width: 28, height: 28 }}>
                      <IconEdit style={{ width: 14, height: 14 }} />
                    </button>
                    <button className="btn btn-icon danger" onClick={() => removeItem('followers', f.id)} aria-label="Borrar" style={{ width: 28, height: 28 }}>
                      <IconTrash style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {goalModal && (
        <GoalForm
          key={goalModal === 'new' ? 'new' : goalModal.id}
          goal={goalModal === 'new' ? null : goalModal}
          onClose={() => setGoalModal(null)}
          onSave={(data, id) => {
            if (id) updateItem('goals', id, data)
            else addItem('goals', data)
            notify(id ? 'Meta actualizada' : 'Meta creada')
            setGoalModal(null)
          }}
        />
      )}
      <ConfirmDialog open={!!goalDelete} onClose={() => setGoalDelete(null)} onConfirm={() => removeItem('goals', goalDelete.id)} title="¿Borrar esta meta?" message={goalDelete?.title} />

      {phaseModal && (
        <PhaseForm
          phases={phases}
          onClose={() => setPhaseModal(false)}
          onSave={(list) => {
            savePhases(list)
            notify('Fases actualizadas')
            setPhaseModal(false)
          }}
        />
      )}

      {followerModal && (
        <FollowerForm
          key={followerModal === 'new' ? 'new' : followerModal.id}
          entry={followerModal === 'new' ? null : followerModal}
          last={latestFollowers}
          onClose={() => setFollowerModal(null)}
          onSave={(data, id) => {
            if (id) updateItem('followers', id, data)
            else addItem('followers', data)
            notify('Seguidores guardados')
            setFollowerModal(null)
          }}
        />
      )}
    </div>
  )
}

function GoalForm({ goal, onClose, onSave }) {
  const [f, setF] = useState(() => ({ type: 'manual', title: '', target: '', current: 0, network: 'instagram', ...(goal || {}) }))
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }))
  const [err, setErr] = useState('')
  const isPctType = f.type === 'investment'
  const submit = (e) => {
    e.preventDefault()
    if (!f.title.trim()) return setErr('Poné un título a la meta.')
    if (!isPctType && !(Number(f.target) > 0)) return setErr('El objetivo tiene que ser mayor a cero.')
    onSave(
      {
        type: f.type,
        title: f.title.trim(),
        target: isPctType ? 100 : Number(f.target),
        current: f.type === 'manual' ? Number(f.current) || 0 : undefined,
        network: f.type === 'followers' ? f.network : undefined,
        auto: f.type !== 'manual',
      },
      goal?.id,
    )
  }
  return (
    <Modal open onClose={onClose} title={goal ? 'Editar meta' : 'Nueva meta'} subtitle="Las metas automáticas se actualizan solas. Las manuales las vas cargando vos." size="narrow">
      <form onSubmit={submit}>
        <div className="stack" style={{ gap: 14 }}>
          <Field label="Tipo de meta">
            <select className="select" value={f.type} onChange={(e) => set('type', e.target.value)}>
              <option value="kits">Kits vendidos (automática)</option>
              <option value="investment">Recuperar la inversión (automática)</option>
              <option value="followers">Seguidores en una red (automática)</option>
              <option value="scheduledPosts">Publicaciones programadas (automática)</option>
              <option value="manual">Manual (la cargo yo)</option>
            </select>
          </Field>
          <Field label="Título">
            <input className="input" placeholder="Ej: Vender los 50 kits" value={f.title} onChange={(e) => set('title', e.target.value)} autoFocus />
          </Field>
          {f.type === 'followers' && (
            <Field label="Red social">
              <select className="select" value={f.network} onChange={(e) => set('network', e.target.value)}>
                {NETWORKS.map((n) => (
                  <option key={n.key} value={n.key}>
                    {n.label}
                  </option>
                ))}
              </select>
            </Field>
          )}
          {!isPctType && (
            <Field label="Objetivo (número)">
              <input className="input" type="number" min="1" value={f.target} onChange={(e) => set('target', e.target.value)} />
            </Field>
          )}
          {f.type === 'manual' && (
            <Field label="Progreso actual">
              <input className="input" type="number" min="0" value={f.current} onChange={(e) => set('current', e.target.value)} />
            </Field>
          )}
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

function PhaseForm({ phases, onClose, onSave }) {
  const [list, setList] = useState(() => phases.map((p) => ({ ...p, end: p.end || '' })))
  const setP = (i, k, v) => setList((l) => l.map((p, idx) => (idx === i ? { ...p, [k]: v } : p)))
  return (
    <Modal open onClose={onClose} title="Fases del negocio" subtitle="Ajustá las fechas si el plan cambia.">
      <div className="stack">
        {list.map((p, i) => (
          <div className="card" key={p.id} style={{ padding: 16 }}>
            <div className="strong" style={{ marginBottom: 10 }}>
              Fase {p.code} · {p.name}
            </div>
            <div className="form-grid">
              <Field label="Nombre">
                <input className="input" value={p.name} onChange={(e) => setP(i, 'name', e.target.value)} />
              </Field>
              <Field label="Descripción">
                <input className="input" value={p.description || ''} onChange={(e) => setP(i, 'description', e.target.value)} />
              </Field>
              <Field label="Inicio">
                <input className="input" type="date" value={p.start} onChange={(e) => setP(i, 'start', e.target.value)} />
              </Field>
              <Field label="Fin (vacío = abierta)">
                <input className="input" type="date" value={p.end} onChange={(e) => setP(i, 'end', e.target.value)} />
              </Field>
            </div>
          </div>
        ))}
      </div>
      <div className="form-actions">
        <button className="btn btn-ghost" onClick={onClose}>
          Cancelar
        </button>
        <button className="btn btn-primary" onClick={() => onSave(list.map((p) => ({ ...p, end: p.end || null })))}>
          Guardar fases
        </button>
      </div>
    </Modal>
  )
}

function FollowerForm({ entry, last, onClose, onSave }) {
  const [f, setF] = useState(() => ({
    date: todayISO(),
    ...Object.fromEntries(NETWORKS.map((n) => [n.key, last?.[n.key] ?? ''])),
    ...(entry || {}),
  }))
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }))
  return (
    <Modal open onClose={onClose} title={entry ? 'Editar medición' : 'Seguidores de esta semana'} subtitle="Copiá el número que muestra cada red hoy." size="narrow">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onSave({ date: f.date, ...Object.fromEntries(NETWORKS.map((n) => [n.key, Number(f[n.key]) || 0])) }, entry?.id)
        }}
      >
        <div className="stack" style={{ gap: 14 }}>
          <Field label="Fecha">
            <input className="input" type="date" value={f.date} onChange={(e) => set('date', e.target.value)} required />
          </Field>
          {NETWORKS.map((n) => (
            <Field label={n.label} key={n.key}>
              <input className="input" type="number" min="0" value={f[n.key]} onChange={(e) => set(n.key, e.target.value)} placeholder="0" />
            </Field>
          ))}
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
