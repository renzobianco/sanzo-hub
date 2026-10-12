import { useEffect, useRef, useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { ImageUpload, Avatar } from '../ui/ImageUpload.jsx'
import { Modal, ConfirmDialog, PawRow } from '../ui/Primitives.jsx'
import { BrandMark, IconDownload, IconUpload, IconMore, IconX, IconLogout, IconAlert, IconSettings, IconPaw, IconTrash, IconRefresh } from '../ui/Icons.jsx'
import { fmtDateTime, fmtNum } from '../../utils/format.js'

// ---------- Sidebar (desktop) ----------
export function Sidebar({ items, current, onNavigate }) {
  const { state, updateSettings, exportBackup } = useApp()
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <ImageUpload value={state.settings.logoImage} onChange={(v) => updateSettings({ logoImage: v })} shape="round" size={46} showText={false} maxSize={400} />
        <div>
          <div className="brand-name">Sanzo</div>
          <div className="brand-sub">EL BÚNKER</div>
        </div>
      </div>
      {items.map((it) => {
        const Icon = it.icon
        return (
          <button key={it.key} className={`nav-item ${current === it.key ? 'active' : ''}`} onClick={() => onNavigate(it.key)}>
            <Icon />
            {it.label}
          </button>
        )
      })}
      <div className="sidebar-footer">
        <SyncStatus />
        <button className="btn btn-soft btn-sm btn-block" onClick={exportBackup}>
          <IconDownload /> Exportar backup
        </button>
        <BackupStatus />
      </div>
    </aside>
  )
}

// ---------- Estado de sincronización con la base compartida ----------
function SyncStatus() {
  const { online, activePartners, currentUser } = useApp()
  const others = activePartners.filter((p) => p !== currentUser)
  return (
    <div className="row" style={{ justifyContent: 'center', gap: 6, padding: '2px 0 8px' }}>
      <span
        className="small"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: online ? 'var(--green)' : 'var(--terra)', fontWeight: 600 }}
        title={online ? 'Conectado a la base compartida' : 'Sin conexión: los cambios no se están guardando'}
      >
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
        {online ? 'En vivo' : 'Sin conexión'}
      </span>
      {online && others.length > 0 && <span className="small muted">· {others.map((o) => (o === 'santino' ? 'Santino' : 'Renzo')).join(', ')} también está</span>}
    </div>
  )
}

function BackupStatus() {
  const { state } = useApp()
  const last = state.settings.lastBackupExport
  return (
    <div className="small muted" style={{ textAlign: 'center', padding: '4px 0' }}>
      {last ? `Último backup: ${fmtDateTime(last)}` : 'Todavía no exportaste un backup'}
    </div>
  )
}

// ---------- Bottom nav (mobile) ----------
export function BottomNav({ items, current, onNavigate }) {
  const [more, setMore] = useState(false)
  const primary = items.slice(0, 4)
  const secondary = items.slice(4)
  const secondaryActive = secondary.some((i) => i.key === current)
  return (
    <>
      {more && (
        <div className="more-sheet">
          {secondary.map((it) => {
            const Icon = it.icon
            return (
              <button
                key={it.key}
                className={`nav-item ${current === it.key ? 'active' : ''}`}
                onClick={() => {
                  onNavigate(it.key)
                  setMore(false)
                }}
              >
                <Icon /> {it.label}
              </button>
            )
          })}
        </div>
      )}
      <nav className="bottom-nav">
        {primary.map((it) => {
          const Icon = it.icon
          return (
            <button
              key={it.key}
              className={current === it.key && !more ? 'active' : ''}
              onClick={() => {
                onNavigate(it.key)
                setMore(false)
              }}
            >
              <Icon />
              {it.short || it.label}
            </button>
          )
        })}
        <button className={secondaryActive || more ? 'active' : ''} onClick={() => setMore((m) => !m)}>
          {more ? <IconX /> : <IconMore />}
          Más
        </button>
      </nav>
    </>
  )
}

// ---------- Topbar ----------
export function TopBar({ title }) {
  const { state, updateSettings, exportBackup, importBackup, resetAll, setPartnerPhoto, setCurrentUser, online } = useApp()
  const [menu, setMenu] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const fileRef = useRef(null)
  const user = state.settings.currentUser
  const partner = user ? state.partners[user] : null

  const onImport = async (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    try {
      await importBackup(f)
    } catch {
      /* el toast ya avisa */
    }
    setMenu(false)
  }

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="topbar-brand">
          <ImageUpload value={state.settings.logoImage} onChange={(v) => updateSettings({ logoImage: v })} shape="round" size={38} showText={false} maxSize={400} />
          <span className="brand-name">Sanzo</span>
        </div>
        <span className="muted small" style={{ display: 'none' }}>
          {title}
        </span>
      </div>
      <div className="topbar-right">
        <button className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()} title="Importar backup">
          <IconUpload /> <span className="hide-mobile">Importar</span>
        </button>
        <button className="btn btn-soft btn-sm" onClick={exportBackup} title="Exportar backup">
          <IconDownload /> <span className="hide-mobile">Backup</span>
        </button>
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden-input" onChange={onImport} />
        {!online && (
          <span className="chip terra" title="Sin conexión con la base compartida">
            <IconRefresh style={{ width: 12, height: 12 }} /> <span className="hide-mobile">Sin conexión</span>
          </span>
        )}
        <Avatar src={partner?.photo} name={partner?.name || '?'} onClick={() => setMenu(true)} />
      </div>

      <Modal open={menu} onClose={() => setMenu(false)} title={partner ? `Hola, ${partner.name}` : 'Sanzo Hub'} subtitle="Tu perfil, backups y ajustes generales" size="narrow">
        {partner && (
          <div className="row" style={{ gap: 16, marginBottom: 18 }}>
            <ImageUpload value={partner.photo} onChange={(v) => setPartnerPhoto(user, v)} shape="round" size={84} text="Tu foto" maxSize={400} />
            <div>
              <div className="strong" style={{ fontSize: 17 }}>
                {partner.name}
              </div>
              <div className="muted small">Socio de Sanzo</div>
              <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => setCurrentUser(null)}>
                <IconLogout /> Cambiar de socio
              </button>
            </div>
          </div>
        )}
        <div className="divider" />
        <div className="stack" style={{ gap: 10 }}>
          <button className="btn btn-primary btn-block" onClick={exportBackup}>
            <IconDownload /> Exportar backup (JSON)
          </button>
          <button className="btn btn-soft btn-block" onClick={() => fileRef.current?.click()}>
            <IconUpload /> Importar backup
          </button>
          <BackupStatus />
        </div>
        <div className="divider" />
        <SettingsBlock />
        <div className="divider" />
        <button className="btn btn-ghost btn-sm btn-block" onClick={() => setConfirmReset(true)}>
          <IconTrash /> Borrar todos los datos
        </button>
      </Modal>

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={() => {
          resetAll()
          setMenu(false)
        }}
        title="¿Borrar todo?"
        message="Se van a borrar ventas, gastos, stock, pedidos, clientes y fotos para los dos socios, en la base compartida. Exportá un backup antes si no querés perder nada."
        confirmLabel="Sí, borrar todo"
      />
    </header>
  )
}

function SettingsBlock() {
  const { state, updateSettings } = useApp()
  const s = state.settings
  return (
    <div className="stack" style={{ gap: 12 }}>
      <div className="row" style={{ gap: 8 }}>
        <IconSettings style={{ width: 16, height: 16, color: 'var(--caramel)' }} />
        <span className="strong small">Ajustes</span>
      </div>
      <div className="field">
        <label>Inversión inicial (USD)</label>
        <input className="input" type="number" min="0" value={s.initialInvestmentUSD} onChange={(e) => updateSettings({ initialInvestmentUSD: Number(e.target.value) || 0 })} />
      </div>
      <div className="field">
        <label>Alerta de stock bajo (unidades)</label>
        <input className="input" type="number" min="0" value={s.stockThreshold} onChange={(e) => updateSettings({ stockThreshold: Number(e.target.value) || 0 })} />
        <span className="hint">Se marca en rojo cuando un producto queda con menos de {fmtNum(s.stockThreshold)} unidades.</span>
      </div>
    </div>
  )
}

// ---------- Aviso de backup ----------
export function BackupBanner() {
  const { state, exportBackup, online } = useApp()
  const last = state.settings.lastBackupExport
  const hasData = state.sales.length + state.expenses.length + state.orders.length + state.clients.length > 0
  const days = last ? Math.floor((Date.now() - new Date(last).getTime()) / 86400000) : null
  const stale = hasData && (days === null || days >= 7)

  if (!online) {
    return (
      <div className="banner warn">
        <IconAlert />
        <span>Sin conexión con la base compartida. Lo que veas puede estar desactualizado y lo que cargues ahora no se va a guardar hasta que vuelva la conexión.</span>
      </div>
    )
  }
  if (!stale) return null
  return (
    <div className="banner">
      <IconPaw style={{ width: 16, height: 16 }} />
      <span>{days === null ? 'Todavía no exportaste ningún backup.' : `Hace ${days} días que no exportás un backup.`} Pasáselo a tu socio y guardalo por las dudas.</span>
      <span className="spacer" />
      <button className="btn btn-soft btn-sm" onClick={exportBackup}>
        <IconDownload /> Exportar
      </button>
    </div>
  )
}

// ---------- ¿Quién está usando? ----------
export function UserPicker() {
  const { state, setCurrentUser, setPartnerPhoto } = useApp()
  return (
    <div className="user-picker">
      <div className="user-picker-card">
        {state.settings.logoImage ? (
          <img src={state.settings.logoImage} alt="Sanzo" style={{ width: 84, height: 84, borderRadius: '50%', objectFit: 'cover', margin: '0 auto', display: 'block', boxShadow: 'var(--shadow-md)' }} />
        ) : (
          <BrandMark size={84} style={{ display: 'block', margin: '0 auto' }} />
        )}
        <h1>¿Quién está usando?</h1>
        <p className="muted" style={{ marginTop: 8 }}>
          Elegí tu perfil para entrar a Sanzo Hub. Podés subir tu foto tocando el círculo.
        </p>
        <div className="options">
          {Object.entries(state.partners).map(([key, p]) => (
            <div key={key} className="user-option" onClick={() => setCurrentUser(key)}>
              <ImageUpload value={p.photo} onChange={(v) => setPartnerPhoto(key, v)} shape="round" size={110} text="Subí tu foto" maxSize={400} />
              <div className="name">{p.name}</div>
              <button className="btn btn-primary btn-sm">Entrar</button>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 26 }}>
          <PawRow n={5} />
        </div>
      </div>
    </div>
  )
}

export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · Sanzo Hub` : 'Sanzo Hub'
  }, [title])
}
