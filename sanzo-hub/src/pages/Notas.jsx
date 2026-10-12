import { useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { PageHeader, Modal, ConfirmDialog, EmptyState, Segmented } from '../components/ui/Primitives.jsx'
import { Avatar } from '../components/ui/ImageUpload.jsx'
import { IconPlus, IconPin, IconTrash, IconSearch, IconX, IconCheck, IconAlert } from '../components/ui/Icons.jsx'
import { NOTE_COLORS, NOTE_CATEGORIES } from '../data/defaults.js'
import { fmtRelative, uid } from '../utils/format.js'
import { sortNotes, orderChecklistItems, noteProgress, filterNotes } from '../utils/calc.js'

const colorBg = (key) => NOTE_COLORS.find((c) => c.key === key)?.bg || NOTE_COLORS[0].bg
const categoryLabel = (key) => NOTE_CATEGORIES.find((c) => c.key === key)?.label || NOTE_CATEGORIES[0].label

export default function Notas() {
  const { state, addItem, updateItem, removeItem, notify } = useApp()
  const { notes, partners, settings } = state
  const currentUser = settings.currentUser

  const [q, setQ] = useState('')
  const [category, setCategory] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [toDelete, setToDelete] = useState(null)

  const sorted = useMemo(() => sortNotes(notes), [notes])
  const searched = useMemo(() => filterNotes(sorted, q), [sorted, q])
  const filtered = useMemo(() => (category ? searched.filter((n) => (n.category || 'general') === category) : searched), [searched, category])

  const counts = useMemo(() => {
    const map = new Map()
    for (const n of notes) map.set(n.category || 'general', (map.get(n.category || 'general') || 0) + 1)
    return map
  }, [notes])

  const createNote = () => {
    const full = addItem('notes', {
      title: '',
      type: 'text',
      content: '',
      items: [],
      color: 'cream',
      category: category || 'general',
      pinned: false,
      authorId: currentUser,
      editedBy: currentUser,
    })
    setEditingId(full.id)
  }

  const togglePin = (note) => {
    updateItem('notes', note.id, { pinned: !note.pinned, editedBy: currentUser })
  }

  return (
    <div>
      <PageHeader eyebrow="Notas" title="Notas" subtitle="Un solo tablón para los dos. Lo que escriba uno, lo ve el otro al toque.">
        <button className="btn btn-primary" onClick={createNote}>
          <IconPlus /> Nueva nota
        </button>
      </PageHeader>

      {notes.length > 0 && (
        <>
          <div className="toolbar">
            <div className="search">
              <IconSearch />
              <input className="input" placeholder="Buscar en las notas…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>
          <div className="row" style={{ gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            <button type="button" className={`chip chip-btn ${category === '' ? 'active' : ''}`} onClick={() => setCategory('')}>
              Todas · {notes.length}
            </button>
            {NOTE_CATEGORIES.map((c) => (
              <button key={c.key} type="button" className={`chip chip-btn ${category === c.key ? 'active' : ''}`} onClick={() => setCategory(c.key)}>
                {c.label} · {counts.get(c.key) || 0}
              </button>
            ))}
          </div>
        </>
      )}

      {notes.length === 0 ? (
        <div className="card">
          <EmptyState title="Todavía no hay notas" text="Dejale un mensaje a tu socio." action={createNote} actionLabel="Crear la primera nota" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState compact title="Nada con esos filtros" text="Probá con otra búsqueda o categoría." />
        </div>
      ) : (
        <div className="grid grid-2">
          {filtered.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              editor={partners[note.editedBy] || partners[note.authorId]}
              onOpen={() => setEditingId(note.id)}
              onTogglePin={() => togglePin(note)}
              onDelete={() => setToDelete(note)}
            />
          ))}
        </div>
      )}

      {editingId && <NoteEditor noteId={editingId} onClose={() => setEditingId(null)} onDelete={() => setToDelete(notes.find((n) => n.id === editingId))} />}

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          removeItem('notes', toDelete.id)
          if (editingId === toDelete.id) setEditingId(null)
          notify('Nota borrada')
        }}
        title="¿Borrar esta nota?"
        message={toDelete?.title ? `"${toDelete.title}"` : 'Esta nota no tiene título.'}
      />
    </div>
  )
}

function NoteCard({ note, editor, onOpen, onTogglePin, onDelete }) {
  const progress = noteProgress(note)
  const displayItems = note.type === 'checklist' ? orderChecklistItems(note.items) : []
  return (
    <div className="note-card" style={{ background: colorBg(note.color) }} onClick={onOpen}>
      {note.pinned && <IconPin className="note-pin-badge" />}
      <button
        type="button"
        className="btn btn-icon note-pin-toggle"
        onClick={(e) => {
          e.stopPropagation()
          onTogglePin()
        }}
        aria-label={note.pinned ? 'Desfijar' : 'Fijar'}
        title={note.pinned ? 'Desfijar' : 'Fijar arriba'}
      >
        <IconPin style={{ color: note.pinned ? 'var(--caramel)' : 'var(--muted)', opacity: note.pinned ? 1 : 0.55 }} />
      </button>

      <span className="chip outline note-category-tag">{categoryLabel(note.category || 'general')}</span>

      {note.title && <div className="note-title">{note.title}</div>}

      {note.type === 'checklist' ? (
        <div className="note-checklist">
          {displayItems.length === 0 && <span className="muted small">Sin ítems todavía</span>}
          {displayItems.slice(0, 12).map((item) => (
            <div className="note-check-row" key={item.id}>
              <span className={`note-check-dot ${item.done ? 'done' : ''}`} />
              <span className={item.done ? 'done-text' : ''}>{item.text || '—'}</span>
            </div>
          ))}
          {displayItems.length > 12 && <span className="small muted">+{displayItems.length - 12} más</span>}
        </div>
      ) : (
        <div className="note-content">{note.content || <span className="muted">Sin contenido</span>}</div>
      )}

      <div className="note-footer">
        <div className="row" style={{ gap: 6, minWidth: 0 }}>
          <Avatar src={editor?.photo} name={editor?.name} size={20} />
          <span className="small muted" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {progress ? `${progress.done}/${progress.total} hechas · ` : ''}
            editada por {editor?.name || '—'} · {fmtRelative(note.updatedAt || note.createdAt)}
          </span>
        </div>
        <button
          type="button"
          className="btn btn-icon danger note-delete-btn"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          aria-label="Borrar"
        >
          <IconTrash />
        </button>
      </div>
    </div>
  )
}

function NoteEditor({ noteId, onClose, onDelete }) {
  const { state, updateItem, removeItem } = useApp()
  const note = state.notes.find((n) => n.id === noteId)
  const currentUser = state.settings.currentUser
  const partners = state.partners

  const [draft, setDraft] = useState(() => ({
    title: note?.title || '',
    type: note?.type || 'text',
    content: note?.content || '',
    items: note?.items?.length ? note.items : [],
    color: note?.color || 'cream',
    category: note?.category || 'general',
  }))
  const [saveState, setSaveState] = useState('idle') // idle | saving | saved
  const [conflict, setConflict] = useState(null)
  const openedRef = useRef({ updatedAt: note?.updatedAt, editedBy: note?.editedBy })
  const saveTimer = useRef(null)
  const saveIdleTimer = useRef(null)

  useEffect(() => {
    if (!note) return
    if (note.editedBy && note.editedBy !== currentUser && note.updatedAt !== openedRef.current.updatedAt) {
      setConflict(partners[note.editedBy]?.name || 'Tu socio')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note?.updatedAt, note?.editedBy])

  useEffect(
    () => () => {
      clearTimeout(saveTimer.current)
      clearTimeout(saveIdleTimer.current)
    },
    [],
  )

  const set = (patch) => {
    const next = { ...draft, ...patch }
    setDraft(next)
    setSaveState('saving')
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      updateItem('notes', noteId, { ...next, editedBy: currentUser })
      setSaveState('saved')
      clearTimeout(saveIdleTimer.current)
      saveIdleTimer.current = setTimeout(() => setSaveState((s) => (s === 'saved' ? 'idle' : s)), 1800)
    }, 600)
  }

  const useIncomingVersion = () => {
    setDraft({ title: note.title || '', type: note.type || 'text', content: note.content || '', items: note.items || [], color: note.color || 'cream', category: note.category || 'general' })
    openedRef.current = { updatedAt: note.updatedAt, editedBy: note.editedBy }
    setConflict(null)
  }

  const setType = (t) => {
    if (t === draft.type) return
    if (t === 'checklist' && draft.type === 'text') {
      const items = draft.content
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((text) => ({ id: uid(), text, done: false }))
      set({ type: t, items: items.length ? items : draft.items })
    } else if (t === 'text' && draft.type === 'checklist') {
      const content = draft.items
        .map((i) => i.text)
        .filter(Boolean)
        .join('\n')
      set({ type: t, content: content || draft.content })
    } else {
      set({ type: t })
    }
  }

  const setItemText = (id, text) => set({ items: draft.items.map((i) => (i.id === id ? { ...i, text } : i)) })
  const toggleItemDone = (id) => set({ items: draft.items.map((i) => (i.id === id ? { ...i, done: !i.done } : i)) })
  const removeItemRow = (id) => set({ items: draft.items.filter((i) => i.id !== id) })
  const addItemRow = () => set({ items: [...draft.items, { id: uid(), text: '', done: false }] })

  const handleDone = () => {
    clearTimeout(saveTimer.current)
    const isEmpty = !draft.title.trim() && !draft.content.trim() && draft.items.every((i) => !i.text.trim())
    if (isEmpty) {
      removeItem('notes', noteId)
    } else {
      updateItem('notes', noteId, { ...draft, editedBy: currentUser })
    }
    onClose()
  }

  if (!note) return null // se borró desde otro lado mientras la teníamos abierta

  const author = partners[note.authorId]
  const editor = partners[note.editedBy]

  return (
    <Modal open onClose={handleDone} size="wide">
      <div className="row between" style={{ marginBottom: 4 }}>
        <input
          className="note-editor-title"
          placeholder="Título (opcional)"
          value={draft.title}
          onChange={(e) => set({ title: e.target.value })}
          autoFocus
        />
        <button type="button" className="btn btn-icon" onClick={handleDone} aria-label="Cerrar">
          <IconX />
        </button>
      </div>

      {conflict && (
        <div className="banner warn">
          <IconAlert />
          <span>{conflict} editó esta nota recién — cargá su versión antes de seguir para no pisarla.</span>
          <span className="spacer" />
          <button className="btn btn-soft btn-sm" onClick={useIncomingVersion}>
            Cargar esa versión
          </button>
        </div>
      )}

      <div className="row between" style={{ marginBottom: 14, marginTop: 14, flexWrap: 'wrap', gap: 10 }}>
        <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
          <Segmented
            value={draft.type}
            onChange={setType}
            options={[
              { value: 'text', label: 'Texto' },
              { value: 'checklist', label: 'Lista' },
            ]}
          />
          <select className="select" style={{ width: 'auto', padding: '7px 30px 7px 12px', fontSize: 13 }} value={draft.category} onChange={(e) => set({ category: e.target.value })}>
            {NOTE_CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="row" style={{ gap: 10 }}>
          <div className="row" style={{ gap: 6 }}>
            {NOTE_COLORS.map((c) => (
              <button
                key={c.key}
                type="button"
                className="note-color-dot"
                onClick={() => set({ color: c.key })}
                title={c.label}
                aria-label={c.label}
                style={{ background: c.bg, border: draft.color === c.key ? '2px solid var(--caramel)' : '1px solid var(--line)' }}
              />
            ))}
          </div>
          <button type="button" className="btn btn-icon" onClick={() => updateItem('notes', noteId, { pinned: !note.pinned, editedBy: currentUser })} aria-label={note.pinned ? 'Desfijar' : 'Fijar'} title={note.pinned ? 'Desfijar' : 'Fijar arriba'}>
            <IconPin style={{ color: note.pinned ? 'var(--caramel)' : undefined }} />
          </button>
          <button type="button" className="btn btn-icon danger" onClick={onDelete} aria-label="Borrar">
            <IconTrash />
          </button>
        </div>
      </div>

      {draft.type === 'text' ? (
        <textarea className="textarea note-editor-content" placeholder="Escribí acá…" value={draft.content} onChange={(e) => set({ content: e.target.value })} />
      ) : (
        <div className="stack" style={{ gap: 8 }}>
          {draft.items.map((item) => (
            <div className="row" key={item.id} style={{ gap: 8, flexWrap: 'nowrap' }}>
              <input type="checkbox" checked={item.done} onChange={() => toggleItemDone(item.id)} style={{ accentColor: 'var(--caramel)', width: 18, height: 18, flexShrink: 0 }} />
              <input
                className="input"
                style={{ flex: 1, textDecoration: item.done ? 'line-through' : 'none', opacity: item.done ? 0.55 : 1 }}
                value={item.text}
                placeholder="Ítem…"
                onChange={(e) => setItemText(item.id, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addItemRow()
                  }
                }}
              />
              <button type="button" className="btn btn-icon" onClick={() => removeItemRow(item.id)} aria-label="Quitar ítem">
                <IconX />
              </button>
            </div>
          ))}
          <button type="button" className="btn btn-ghost btn-sm" onClick={addItemRow} style={{ alignSelf: 'flex-start' }}>
            <IconPlus /> Agregar ítem
          </button>
        </div>
      )}

      <div className="row between" style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
        <div className="small muted">
          Creada por {author?.name || '—'}
          {editor && note.editedBy !== note.authorId ? ` · editada por ${editor.name}` : ''} · {fmtRelative(note.updatedAt || note.createdAt)}
        </div>
        <div className="row" style={{ gap: 10 }}>
          {saveState === 'saving' && <span className="small muted">Guardando…</span>}
          {saveState === 'saved' && (
            <span className="small pos">
              <IconCheck style={{ width: 12, height: 12, verticalAlign: '-1px' }} /> Guardado
            </span>
          )}
          <button type="button" className="btn btn-primary btn-sm" onClick={handleDone}>
            Listo
          </button>
        </div>
      </div>
    </Modal>
  )
}
