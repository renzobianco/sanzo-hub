import { useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { Modal, Field, Segmented } from './Primitives.jsx'
import { IconRefresh, IconCoins, IconAlert, IconInfo } from './Icons.jsx'
import { DOLAR_SOURCES } from '../../data/defaults.js'
import { fmtDecimal, fmtDateTime, fmtPct, fmtDolarAge } from '../../utils/format.js'
import { describeDolarSource } from '../../services/dolar.js'

// ---------- Puntito de frescura + texto de fuente, para reusar en Productos/Pedidos/Gráficos ----------
export function DolarSourceNote({ prefix = 'a' }) {
  const { state, dolar } = useApp()
  const info = describeDolarSource(state.settings, dolar)
  return (
    <span className="row" style={{ gap: 5, display: 'inline-flex', alignItems: 'center' }}>
      <span className={`dolar-dot ${info.fresh ? 'fresh' : 'stale'}`} />
      <span className="muted small">
        {prefix} $ {fmtDecimal(state.settings.exchangeRate, 0)} · {info.label}
        {info.fecha ? ` · ${fmtDolarAge(info.fecha)}` : ''}
      </span>
    </span>
  )
}

// ---------- Chip del Dashboard: valor vigente + fuente/antigüedad; abre el selector ----------
export function ExchangeRate({ compact = false }) {
  const { state, dolar } = useApp()
  const [open, setOpen] = useState(false)
  const info = describeDolarSource(state.settings, dolar)

  return (
    <>
      <button className="chip beige chip-btn dolar-chip" onClick={() => setOpen(true)}>
        <span className={`dolar-dot ${info.fresh ? 'fresh' : 'stale'}`} />
        <span className="dolar-chip-main">
          <span className="dolar-chip-value">
            <IconRefresh style={{ width: 14, height: 14 }} /> USD 1 = $ {fmtDecimal(state.settings.exchangeRate, 0)}
          </span>
          {!compact && (
            <span className="dolar-chip-sub">
              {info.label}
              {info.fecha ? ` · ${fmtDolarAge(info.fecha)}` : ''}
            </span>
          )}
        </span>
      </button>
      <ExchangeRateModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}

// ---------- Selector de fuente + edición manual + historial — el contenido en sí, sin
// modal alrededor, para poder embeberlo tanto en el chip del Dashboard como en Ajustes ----------
export function ExchangeRateFields() {
  const { state, setExchangeRate, setDolarSource, dolar, refreshDolar } = useApp()
  const [val, setVal] = useState(state.settings.exchangeRate)
  const source = state.settings.dolarSource || 'oficial'
  const history = state.settings.exchangeRateHistory || []

  const chooseSource = (s) => {
    setDolarSource(s)
    if (s !== 'manual') setVal(state.settings.exchangeRate)
  }

  const saveManual = () => setExchangeRate(val)

  return (
    <>
      <Field label="Fuente">
        <Segmented value={source} onChange={chooseSource} options={DOLAR_SOURCES.map((s) => ({ value: s.value, label: s.label.replace(' (automático)', '') }))} />
        <span className="hint">{DOLAR_SOURCES.find((s) => s.value === source)?.hint}</span>
      </Field>

      {source === 'manual' ? (
        <div className="field">
          <label>1 USD equivale a (ARS)</label>
          <div className="row" style={{ flexWrap: 'nowrap' }}>
            <div className="input-prefix" style={{ flex: 1 }}>
              <span>$</span>
              <input className="input" type="number" min="1" step="1" value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveManual()} autoFocus />
            </div>
            <button className="btn btn-primary" onClick={saveManual} disabled={!Number(val) || Number(val) === state.settings.exchangeRate}>
              Guardar
            </button>
          </div>
          <span className="hint">Usá el dólar al que realmente compran (blue, MEP o el que corresponda).</span>
        </div>
      ) : (
        <div className="card beige" style={{ padding: 14, marginTop: 4 }}>
          {dolar.error && dolar.stale && (
            <div className="row" style={{ gap: 6, marginBottom: 10, color: 'var(--terra)' }}>
              <IconAlert style={{ width: 14, height: 14 }} />
              <span className="small">No pudimos actualizar recién; mostrando la última cotización guardada.</span>
            </div>
          )}
          <div className="row between">
            <div>
              <div className="small strong">{DOLAR_SOURCES.find((s) => s.value === source)?.label}</div>
              <div className="muted small">{dolar[source]?.fechaActualizacion ? `Actualizado ${fmtDolarAge(dolar[source].fechaActualizacion)}` : 'Sin datos todavía'}</div>
            </div>
            <button className="btn btn-soft btn-sm" onClick={() => refreshDolar({ force: true })} disabled={dolar.loading}>
              <IconRefresh className={dolar.loading ? 'spin' : ''} /> Actualizar ahora
            </button>
          </div>
          <div className="row" style={{ gap: 20, marginTop: 12 }}>
            <div>
              <div className="muted small">Compra</div>
              <div className="strong">$ {fmtDecimal(dolar[source]?.compra, 0)}</div>
            </div>
            <div>
              <div className="muted small">Venta (usamos este)</div>
              <div className="strong">$ {fmtDecimal(dolar[source]?.venta, 0)}</div>
            </div>
          </div>
        </div>
      )}

      <div className="divider" />
      <div className="strong small" style={{ marginBottom: 8 }}>
        Historial de cotizaciones
      </div>
      {history.length === 0 ? (
        <p className="muted small">Todavía no cambió la cotización. El valor inicial es $ {fmtDecimal(state.settings.exchangeRate, 0)}.</p>
      ) : (
        <div className="list">
          {history.slice(0, 12).map((h) => (
            <div className="list-item" key={h.id} style={{ padding: '8px 0' }}>
              <div className="body">
                <div className="title">
                  $ {fmtDecimal(h.rate, 0)} {h.source === 'auto' && <span className="chip outline" style={{ padding: '1px 7px', fontSize: 10, marginLeft: 6 }}>auto</span>}
                </div>
                <div className="sub">{fmtDateTime(h.at)}</div>
              </div>
              {h.prev ? (
                <span className={`small ${h.rate > h.prev ? 'neg' : 'pos'}`}>
                  {h.rate > h.prev ? '▲' : '▼'} {fmtPct(Math.abs(((h.rate - h.prev) / h.prev) * 100), 1)}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </>
  )
}

export function ExchangeRateModal({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="Tipo de cambio" subtitle="Se usa en toda la app para convertir USD a pesos." size="narrow">
      <ExchangeRateFields />
    </Modal>
  )
}

// ---------- Mini-tarjeta "Dólar hoy" para el Dashboard ----------
export function DolarTodayCard() {
  const { dolar, refreshDolar } = useApp()
  const { oficial, blue } = dolar
  if (!oficial || !blue) return null
  const brecha = oficial.venta > 0 ? ((blue.venta - oficial.venta) / oficial.venta) * 100 : 0

  return (
    <div className="card">
      <div className="card-head" style={{ marginBottom: 10 }}>
        <div>
          <div className="card-title">
            <IconCoins style={{ width: 17, height: 17, verticalAlign: '-3px', marginRight: 6, color: 'var(--caramel)' }} /> Dólar hoy
          </div>
          <div className="card-sub">{oficial.fechaActualizacion ? `Oficial actualizado ${fmtDolarAge(oficial.fechaActualizacion)}` : 'DolarApi.com'}</div>
        </div>
        <button className="btn btn-icon" onClick={() => refreshDolar({ force: true })} aria-label="Actualizar" title="Actualizar ahora">
          <IconRefresh className={dolar.loading ? 'spin' : ''} />
        </button>
      </div>
      <div className="grid grid-2" style={{ gap: 10 }}>
        <div className="stat-line" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4, border: 0 }}>
          <span className="muted small">Oficial</span>
          <span className="strong">
            $ {fmtDecimal(oficial.compra, 0)} <span className="muted small">compra</span>
          </span>
          <span className="strong">
            $ {fmtDecimal(oficial.venta, 0)} <span className="muted small">venta</span>
          </span>
        </div>
        <div className="stat-line" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4, border: 0 }}>
          <span className="muted small">Blue</span>
          <span className="strong">
            $ {fmtDecimal(blue.compra, 0)} <span className="muted small">compra</span>
          </span>
          <span className="strong">
            $ {fmtDecimal(blue.venta, 0)} <span className="muted small">venta</span>
          </span>
        </div>
      </div>
      <div className="help" style={{ marginTop: 12 }}>
        <IconInfo style={{ width: 13, height: 13, verticalAlign: '-2px' }} /> Brecha blue vs. oficial: {fmtPct(brecha, 1)}
      </div>
    </div>
  )
}
