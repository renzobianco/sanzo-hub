import { useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { Modal } from '../ui/Primitives.jsx'
import { IconChevronDown, IconCheck, IconRefresh, IconX } from '../ui/Icons.jsx'
import { MENU_COLORS, applyMenuLayout } from '../../lib/menu.js'

// Ventana para acomodar el menú: arrastrar (o flechitas) para cambiar el orden y
// tocar el circulito para ponerle color a cada sección. Cada socio tiene el suyo.
export function MenuEditor({ open, onClose, baseItems }) {
  if (!open) return null
  return <MenuEditorBody onClose={onClose} baseItems={baseItems} />
}

function MenuEditorBody({ onClose, baseItems }) {
  const { state, updateSettings, currentUser, notify } = useApp()
  const saved = state.settings.navLayout?.[currentUser]
  const [items, setItems] = useState(() => applyMenuLayout(baseItems, saved).map(({ key, label, icon, color }) => ({ key, label, icon, color: color || null })))
  const [picking, setPicking] = useState(null)
  const [dragKey, setDragKey] = useState(null)
  const [overKey, setOverKey] = useState(null)

  const move = (from, to) => {
    if (to < 0 || to >= items.length || from === to) return
    setItems((list) => {
      const next = [...list]
      const [it] = next.splice(from, 1)
      next.splice(to, 0, it)
      return next
    })
  }

  const setColor = (key, color) => {
    setItems((list) => list.map((it) => (it.key === key ? { ...it, color } : it)))
    setPicking(null)
  }

  const save = () => {
    const colors = {}
    for (const it of items) if (it.color) colors[it.key] = it.color
    const layout = { order: items.map((it) => it.key), colors }
    updateSettings({ navLayout: { ...(state.settings.navLayout || {}), [currentUser]: layout } })
    notify?.('Menú guardado')
    onClose()
  }

  const reset = () => {
    setItems(baseItems.map(({ key, label, icon }) => ({ key, label, icon, color: null })))
    setPicking(null)
  }

  return (
    <Modal open onClose={onClose} title="Acomodar menú" subtitle="Arrastrá o usá las flechitas para cambiar el orden. Tocá el circulito para ponerle color." size="narrow">
      <div className="menu-editor">
        {items.map((it, i) => {
          const Icon = it.icon
          return (
            <div key={it.key}>
              {i === 4 && <div className="menu-editor-sep">En el celu, desde acá van dentro de “Más”</div>}
              <div
                className={`menu-editor-row ${dragKey === it.key ? 'dragging' : ''} ${overKey === it.key && dragKey !== it.key ? 'over' : ''}`}
                draggable
                onDragStart={(e) => {
                  setDragKey(it.key)
                  e.dataTransfer.effectAllowed = 'move'
                }}
                onDragOver={(e) => {
                  e.preventDefault()
                  if (overKey !== it.key) setOverKey(it.key)
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  const from = items.findIndex((x) => x.key === dragKey)
                  if (from >= 0) move(from, i)
                  setDragKey(null)
                  setOverKey(null)
                }}
                onDragEnd={() => {
                  setDragKey(null)
                  setOverKey(null)
                }}
              >
                <span className="menu-editor-grip" aria-hidden>⠿</span>
                <span className="menu-editor-icon" style={it.color ? { color: it.color, background: `${it.color}1f` } : undefined}>
                  <Icon />
                </span>
                <span className="menu-editor-label">{it.label}</span>
                <button
                  type="button"
                  className="menu-editor-swatch"
                  style={it.color ? { background: it.color, borderColor: it.color } : undefined}
                  onClick={() => setPicking(picking === it.key ? null : it.key)}
                  aria-label={`Color de ${it.label}`}
                  title="Elegir color"
                />
                <button type="button" className="btn btn-icon btn-sm" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Subir">
                  <IconChevronDown style={{ transform: 'rotate(180deg)' }} />
                </button>
                <button type="button" className="btn btn-icon btn-sm" onClick={() => move(i, i + 1)} disabled={i === items.length - 1} aria-label="Bajar">
                  <IconChevronDown />
                </button>
              </div>
              {picking === it.key && (
                <div className="menu-editor-palette">
                  <button type="button" className={`menu-editor-color none ${!it.color ? 'selected' : ''}`} onClick={() => setColor(it.key, null)} title="Sin color" aria-label="Sin color">
                    <IconX />
                  </button>
                  {MENU_COLORS.map((c) => (
                    <button
                      type="button"
                      key={c.value}
                      className={`menu-editor-color ${it.color === c.value ? 'selected' : ''}`}
                      style={{ background: c.value }}
                      onClick={() => setColor(it.key, c.value)}
                      title={c.name}
                      aria-label={c.name}
                    >
                      {it.color === c.value && <IconCheck />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
      <div className="row" style={{ gap: 10, marginTop: 18, justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <button className="btn btn-ghost btn-sm" onClick={reset}>
          <IconRefresh /> Volver al original
        </button>
        <div className="row" style={{ gap: 10 }}>
          <button className="btn btn-soft" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={save}>
            <IconCheck /> Guardar
          </button>
        </div>
      </div>
    </Modal>
  )
}
