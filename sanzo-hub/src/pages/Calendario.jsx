import { useMemo, useRef, useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { PageHeader, Modal, ConfirmDialog, EmptyState, Field, Segmented, ContentStatus, ContentStatusLegend, ContentThumb, ContentCover } from '../components/ui/Primitives.jsx'
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconX,
  IconChevronLeft,
  IconChevronRight,
  IconClipboard,
  IconFlame,
  IconReel,
  IconStory,
  IconCarousel,
  IconCamera,
  IconAlert,
  IconRepeat,
  IconSearch,
  IconSend,
  IconCheck,
  IconUpload,
  IconRefresh,
  IconEye,
} from '../components/ui/Icons.jsx'
import { CONTENT_FORMATS, CONTENT_RESPONSIBLES, CONTENT_STATUSES, NETWORKS } from '../data/defaults.js'
import { fmtDate, todayISO, monthKey, monthGrid, addMonths, addDays, fmtMonthLong } from '../utils/format.js'
import { nextContentSeq, contentCode, sortContent, contentStreak, weekCoverage, contentMonthSummary } from '../utils/calc.js'
import { bufferReady, getStoredChannels, channelForNetwork, scheduleChannelPost, deleteBufferPost } from '../lib/buffer.js'
import { uploadContentMedia, deleteContentMedia } from '../lib/supabase.js'
import InstagramPreviewPanel from '../components/ui/InstagramPreview.jsx'

const FORMAT_ICONS = { Reel: IconReel, Historia: IconStory, Carrusel: IconCarousel, Foto: IconCamera }
const networkLabel = (key) => NETWORKS.find((n) => n.key === key)?.label || key
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
// Un carrusel guarda sus imágenes en assetUrls (array); el resto de los formatos usa assetUrl (uno solo).
const hasAsset = (post) => Boolean(post.assetUrl) || (post.assetUrls?.length || 0) > 0

// ---------- Orquesta la programación en Buffer (llamadas a la API + estado de UI) ----------
function useBufferScheduling({ updateItem, notify, navigate }) {
  const [channels] = useState(() => getStoredChannels())
  const [scheduling, setScheduling] = useState(null) // id del post que se está programando
  const [assetConfirm, setAssetConfirm] = useState(null) // post pendiente de confirmar "sin archivo"
  const [weekScheduling, setWeekScheduling] = useState(false)
  const [weekResults, setWeekResults] = useState(null)

  const doSchedule = async (post, { skipConfirm = false } = {}) => {
    if (!bufferReady()) {
      notify('Configurá la clave de Buffer en Ajustes primero', 'error')
      navigate?.('ajustes')
      return null
    }
    if (!post.date || !post.time || !post.title?.trim() || !(post.networks || []).length) {
      notify('Para programar en Buffer hace falta fecha, hora, título y al menos una red', 'error')
      return null
    }
    if (!hasAsset(post) && !skipConfirm) {
      setAssetConfirm(post)
      return null
    }
    // No reintentamos redes que ya tienen un post real en Buffer (evita duplicar,
    // por ejemplo, Instagram cuando solo falló Facebook).
    const alreadyDone = new Set((post.bufferPostIds || []).map((bp) => bp.network))
    const pending = post.networks.filter((n) => !alreadyDone.has(n))
    if (pending.length === 0) {
      notify('Ya está programada en todas las redes elegidas', 'error')
      return null
    }
    setScheduling(post.id)
    const text = [post.title, post.hashtags].filter(Boolean).join('\n\n')
    const dueAtISO = new Date(`${post.date}T${post.time}:00`).toISOString()
    const results = []
    for (const netKey of pending) {
      const channel = channelForNetwork(channels, netKey)
      if (!channel) {
        results.push({ network: netKey, ok: false, error: `${networkLabel(netKey)} no está conectado en Buffer` })
        continue
      }
      try {
        const bp = await scheduleChannelPost({ channelId: channel.id, service: channel.service, text, dueAtISO, post })
        results.push({ network: netKey, ok: true, bufferPostId: bp.id })
      } catch (e) {
        results.push({ network: netKey, ok: false, error: e.friendly || e.message })
      }
    }
    setScheduling(null)

    const ok = results.filter((r) => r.ok)
    const fail = results.filter((r) => !r.ok)
    if (ok.length > 0) {
      updateItem('contentPosts', post.id, {
        status: 'Cargado en Buffer',
        bufferPostIds: [...(post.bufferPostIds || []), ...ok.map((r) => ({ network: r.network, id: r.bufferPostId }))],
      })
    }
    if (fail.length === 0) {
      notify(`✅ Programada en Buffer para el ${fmtDate(post.date)} a las ${post.time} en ${ok.map((r) => networkLabel(r.network)).join(' y ')}`)
    } else if (ok.length > 0) {
      notify(`Programada en ${ok.map((r) => networkLabel(r.network)).join(', ')}, pero falló en ${fail.map((r) => `${networkLabel(r.network)}: ${r.error}`).join(' · ')}`, 'error')
    } else {
      notify(`No se pudo programar: ${fail.map((r) => `${networkLabel(r.network)}: ${r.error}`).join(' · ')}`, 'error')
    }
    return { results, ok, fail }
  }

  const unschedule = async (post) => {
    for (const bp of post.bufferPostIds || []) {
      try {
        await deleteBufferPost(bp.id)
      } catch (e) {
        notify(`No se pudo borrar ${networkLabel(bp.network)} de Buffer: ${e.friendly || e.message}`, 'error')
      }
    }
    updateItem('contentPosts', post.id, { bufferPostIds: [], status: 'Listo para publicar' })
    notify('Se borró de Buffer. Editá lo que necesites y volvé a programar cuando esté listo.')
  }

  const scheduleWeek = async (contentPosts, today) => {
    if (!bufferReady()) {
      notify('Configurá la clave de Buffer en Ajustes primero', 'error')
      navigate?.('ajustes')
      return
    }
    const days = Array.from({ length: 7 }, (_, i) => addDays(today, i))
    const candidates = contentPosts.filter((p) => days.includes(p.date) && p.status === 'Listo para publicar')
    const withAsset = candidates.filter(hasAsset)
    const withoutAsset = candidates.filter((p) => !hasAsset(p))
    if (withAsset.length === 0) {
      notify('No hay publicaciones "Listo para publicar" con archivo cargado en los próximos 7 días', 'error')
      return
    }
    setWeekScheduling(true)
    const summary = []
    for (const post of withAsset) {
      const r = await doSchedule(post, { skipConfirm: true })
      summary.push({ post, ok: r?.ok || [], fail: r?.fail || [] })
      await sleep(300)
    }
    setWeekScheduling(false)
    setWeekResults({ summary, omitted: withoutAsset })
  }

  return { channels, scheduling, doSchedule, unschedule, assetConfirm, setAssetConfirm, weekScheduling, weekResults, setWeekResults, scheduleWeek }
}

export default function Calendario({ navigate }) {
  const { state, addItem, updateItem, removeItem, notify } = useApp()
  const { contentPosts, settings } = state
  const pillars = settings.contentPillars || []
  const cadence = settings.contentCadence || {}
  const today = todayISO()
  const buf = useBufferScheduling({ updateItem, notify, navigate })

  const [view, setView] = useState('calendar')
  const [month, setMonth] = useState(monthKey(today))
  const [formModal, setFormModal] = useState(null) // null | { post } | { date }
  const [detail, setDetail] = useState(null)
  const [toDelete, setToDelete] = useState(null)
  const [alsoDeleteBuffer, setAlsoDeleteBuffer] = useState(true)
  const [bufferConfirm, setBufferConfirm] = useState(null)
  const [filters, setFilters] = useState({ q: '', status: '', format: '', responsible: '' })
  const [preview, setPreview] = useState(null)

  const grid = useMemo(() => monthGrid(month), [month])
  const streak = useMemo(() => contentStreak(contentPosts, today), [contentPosts, today])
  const coverage = useMemo(() => weekCoverage(contentPosts, today), [contentPosts, today])
  const monthSummary = useMemo(() => contentMonthSummary(contentPosts, month, cadence), [contentPosts, month, cadence])
  const sorted = useMemo(() => sortContent(contentPosts), [contentPosts])

  const filteredList = useMemo(() => {
    const q = filters.q.trim().toLowerCase()
    return sorted.filter((p) => {
      if (filters.status && p.status !== filters.status) return false
      if (filters.format && p.format !== filters.format) return false
      if (filters.responsible && p.responsible !== filters.responsible) return false
      if (q) {
        const hay = `${p.title} ${p.hashtags || ''} ${p.notes || ''} ${contentCode(p.seq)}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [sorted, filters])

  const hasFilters = Object.values(filters).some(Boolean)

  const openNewFor = (date) => setFormModal({ date })
  const openEdit = (post) => {
    setDetail(null)
    setFormModal({ post })
  }

  const onSave = (data, id) => {
    if (id) {
      updateItem('contentPosts', id, data)
      notify('Publicación actualizada')
    } else {
      const seq = nextContentSeq(contentPosts)
      addItem('contentPosts', { ...data, seq })
      notify(`Publicación ${contentCode(seq)} creada`)
    }
    setFormModal(null)
  }

  const duplicate = (post) => {
    const seq = nextContentSeq(contentPosts)
    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, bufferPostIds: _bpi, assetUrl: _au, assetUrls: _aus, thumbnailUrl: _tu, ...rest } = post
    // El archivo NO se copia: si se compartiera la misma URL y después se borra uno de
    // los dos posts, se borraría el archivo que el otro todavía necesita.
    const copy = addItem('contentPosts', { ...rest, seq, status: 'Idea', bufferPostIds: [], assetUrl: '', assetUrls: [], thumbnailUrl: '' })
    notify(`Duplicada como ${contentCode(seq)}`)
    setDetail(null)
    setFormModal({ post: copy })
  }

  const copyForBuffer = async (post) => {
    const text = [post.title, post.hashtags].filter(Boolean).join('\n\n')
    if (!text.trim()) {
      notify('Todavía no hay título ni hashtags cargados', 'error')
      return
    }
    try {
      await navigator.clipboard.writeText(text)
      notify('Copiado. Listo para pegar en Buffer.')
    } catch {
      notify('No se pudo copiar al portapapeles', 'error')
      return
    }
    if (post.status !== 'Cargado en Buffer' && post.status !== 'Publicado') {
      setBufferConfirm(post)
    }
  }

  const scheduleFromDetail = async () => {
    const r = await buf.doSchedule(detail)
    if (r?.ok?.length) {
      setDetail((d) =>
        d && d.id === detail.id
          ? { ...d, status: 'Cargado en Buffer', bufferPostIds: [...(d.bufferPostIds || []), ...r.ok.map((x) => ({ network: x.network, id: x.bufferPostId }))] }
          : d,
      )
    }
  }

  const confirmDeleteBufferOfPending = async () => {
    const post = buf.assetConfirm
    buf.setAssetConfirm(null)
    const r = await buf.doSchedule(post, { skipConfirm: true })
    if (r?.ok?.length && detail?.id === post.id) {
      setDetail((d) => ({ ...d, status: 'Cargado en Buffer', bufferPostIds: [...(d.bufferPostIds || []), ...r.ok.map((x) => ({ network: x.network, id: x.bufferPostId }))] }))
    }
  }

  return (
    <div>
      <PageHeader eyebrow="Calendario de contenido" title="Calendario" subtitle="Organizá Reels, Historias, carruseles y fotos. Programalas en Buffer con un click, o cargalas a mano si preferís.">
        <Segmented
          value={view}
          onChange={setView}
          options={[
            { value: 'calendar', label: 'Calendario' },
            { value: 'list', label: 'Lista' },
          ]}
        />
        <button className="btn btn-soft" onClick={() => buf.scheduleWeek(contentPosts, today)} disabled={buf.weekScheduling}>
          <IconSend className={buf.weekScheduling ? 'spin' : ''} /> {buf.weekScheduling ? 'Programando…' : 'Programar semana en Buffer'}
        </button>
        <button className="btn btn-primary" onClick={() => openNewFor(today)}>
          <IconPlus /> Nueva publicación
        </button>
      </PageHeader>

      <WeekAlert coverage={coverage} />

      {contentPosts.length > 0 && (
        <div className="grid grid-2 mb-16">
          <StreakCard streak={streak} />
          <MonthSummaryCard summary={monthSummary} month={month} />
        </div>
      )}

      {contentPosts.length === 0 ? (
        <div className="card">
          <EmptyState
            title="Todavía no hay contenido planificado"
            text="Arrancá creando la primera publicación. Cargá fecha, formato y archivo, y cuando esté lista la programás en Buffer en un toque."
            action={() => openNewFor(today)}
            actionLabel="Crear la primera publicación"
          />
        </div>
      ) : view === 'calendar' ? (
        <CalendarView grid={grid} month={month} setMonth={setMonth} today={today} posts={contentPosts} onOpenDay={openNewFor} onOpenPost={setDetail} />
      ) : (
        <ListView
          posts={filteredList}
          filters={filters}
          setFilters={setFilters}
          hasFilters={hasFilters}
          onOpen={setDetail}
          onCopy={copyForBuffer}
          onDuplicate={duplicate}
          onDelete={(p) => {
            setAlsoDeleteBuffer(true)
            setToDelete(p)
          }}
          onSchedule={buf.doSchedule}
          scheduling={buf.scheduling}
        />
      )}

      {formModal && (
        <PostForm
          key={formModal.post?.id || formModal.date || 'new'}
          post={formModal.post || null}
          initialDate={formModal.date || today}
          pillars={pillars}
          onClose={() => setFormModal(null)}
          onSave={onSave}
          onUnschedule={buf.unschedule}
        />
      )}

      {detail && (
        <DetailModal
          post={detail}
          onClose={() => setDetail(null)}
          onEdit={() => openEdit(detail)}
          onDuplicate={() => duplicate(detail)}
          onDelete={() => {
            setAlsoDeleteBuffer(true)
            setToDelete(detail)
            setDetail(null)
          }}
          onCopy={() => copyForBuffer(detail)}
          onSchedule={scheduleFromDetail}
          onPreview={() => setPreview(detail)}
          scheduling={buf.scheduling === detail.id}
          onStatus={(status) => {
            updateItem('contentPosts', detail.id, { status })
            setDetail((d) => ({ ...d, status }))
          }}
        />
      )}

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={async () => {
          if (alsoDeleteBuffer && toDelete.bufferPostIds?.length) {
            for (const bp of toDelete.bufferPostIds) {
              try {
                await deleteBufferPost(bp.id)
              } catch (e) {
                notify(`No se pudo borrar de Buffer (${networkLabel(bp.network)}): ${e.friendly || e.message}`, 'error')
              }
            }
          }
          if (toDelete.assetUrl) deleteContentMedia(toDelete.assetUrl)
          for (const u of toDelete.assetUrls || []) deleteContentMedia(u)
          if (toDelete.thumbnailUrl) deleteContentMedia(toDelete.thumbnailUrl)
          removeItem('contentPosts', toDelete.id)
          notify('Publicación borrada')
        }}
        title="¿Borrar esta publicación?"
        message={toDelete ? `${contentCode(toDelete.seq)} · ${toDelete.title}` : ''}
      >
        {toDelete?.bufferPostIds?.length > 0 && (
          <label className="checkbox" style={{ marginBottom: 6 }}>
            <input type="checkbox" checked={alsoDeleteBuffer} onChange={(e) => setAlsoDeleteBuffer(e.target.checked)} />
            También borrar de Buffer ({toDelete.bufferPostIds.map((bp) => networkLabel(bp.network)).join(', ')})
          </label>
        )}
      </ConfirmDialog>

      <ConfirmDialog
        open={!!bufferConfirm}
        onClose={() => setBufferConfirm(null)}
        danger={false}
        confirmLabel="Sí, marcar"
        onConfirm={() => {
          updateItem('contentPosts', bufferConfirm.id, { status: 'Cargado en Buffer' })
          notify('Marcada como cargada en Buffer')
          setDetail((d) => (d && d.id === bufferConfirm.id ? { ...d, status: 'Cargado en Buffer' } : d))
        }}
        title="¿Marcar como cargada en Buffer?"
        message={bufferConfirm ? `Ya copiaste el texto de ${contentCode(bufferConfirm.seq)}. ¿La marcamos como "Cargado en Buffer"?` : ''}
      />

      <ConfirmDialog
        open={!!buf.assetConfirm}
        onClose={() => buf.setAssetConfirm(null)}
        danger={false}
        confirmLabel="Sí, continuar"
        onConfirm={confirmDeleteBufferOfPending}
        title="¿Programar sin video/imagen?"
        message="Se va a programar solo el texto — el video o la imagen los vas a tener que agregar a mano en Buffer. ¿Continuar?"
      />

      {buf.weekResults && <WeekResultsModal results={buf.weekResults} onClose={() => buf.setWeekResults(null)} />}

      {preview && <InstagramPreviewPanel post={preview} onClose={() => setPreview(null)} />}
    </div>
  )
}

function WeekResultsModal({ results, onClose }) {
  const { summary, omitted } = results
  return (
    <Modal open onClose={onClose} title="Programación semanal en Buffer" subtitle="Resultado de programar los próximos 7 días" size="narrow">
      {summary.length === 0 ? (
        <p className="muted small">No había nada para programar.</p>
      ) : (
        <div className="list">
          {summary.map(({ post, ok, fail }) => (
            <div className="list-item" key={post.id} style={{ padding: '8px 0' }}>
              <div className="body">
                <div className="title">
                  {contentCode(post.seq)} · {post.title}
                </div>
                <div className="sub">
                  {ok.length > 0 && <span className="pos">✓ {ok.map((r) => networkLabel(r.network)).join(', ')}</span>}
                  {ok.length > 0 && fail.length > 0 && ' · '}
                  {fail.length > 0 && <span className="neg">✗ {fail.map((r) => `${networkLabel(r.network)}: ${r.error}`).join(', ')}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {omitted.length > 0 && (
        <>
          <div className="divider" />
          <div className="small muted">Omitidas por falta de URL de archivo: {omitted.map((p) => contentCode(p.seq)).join(', ')}</div>
        </>
      )}
      <div className="form-actions">
        <button className="btn btn-primary" onClick={onClose}>
          Listo
        </button>
      </div>
    </Modal>
  )
}

function WeekAlert({ coverage }) {
  const { notReady, emptyDays, inWeek, buffered, needsAction } = coverage
  const hasWarning = notReady.length > 0 || emptyDays.length > 0
  if (inWeek.length === 0 && !hasWarning) return null
  const parts = []
  if (notReady.length > 0) {
    parts.push(`${notReady.length} ${notReady.length === 1 ? 'publicación' : 'publicaciones'} de esta semana ${notReady.length === 1 ? 'sigue' : 'siguen'} sin llegar a "Listo para publicar"`)
  }
  if (emptyDays.length > 0) {
    parts.push(`${emptyDays.length} ${emptyDays.length === 1 ? 'día' : 'días'} de esta semana sin nada planificado`)
  }
  return (
    <div className="stack" style={{ gap: 10, marginBottom: 20 }}>
      {inWeek.length > 0 && (
        <div className="row" style={{ gap: 8 }}>
          {buffered.length > 0 && (
            <span className="chip green">
              <IconCheck style={{ width: 12, height: 12 }} /> {buffered.length} en Buffer esta semana
            </span>
          )}
          {needsAction.length > 0 && (
            <span className="chip terra">
              <IconAlert style={{ width: 12, height: 12 }} /> {needsAction.length} todavía {needsAction.length === 1 ? 'necesita' : 'necesitan'} acción
            </span>
          )}
        </div>
      )}
      {hasWarning && (
        <div className="banner warn" style={{ marginBottom: 0 }}>
          <IconAlert />
          <span>{parts.join(' · ')}.</span>
        </div>
      )}
    </div>
  )
}

function StreakCard({ streak }) {
  return (
    <div className="card">
      <div className="kpi-label">Racha de publicación</div>
      <div className="kpi-value streak-flame" style={{ marginTop: 10 }}>
        <IconFlame /> {streak} {streak === 1 ? 'día seguido' : 'días seguidos'}
      </div>
      <div className="kpi-foot">Contando publicaciones cargadas en Buffer o marcadas como "Publicado"</div>
    </div>
  )
}

function MonthSummaryCard({ summary, month }) {
  return (
    <div className="card">
      <div className="card-head" style={{ marginBottom: 8 }}>
        <div>
          <div className="card-title">Cadencia del mes</div>
          <div className="card-sub" style={{ textTransform: 'capitalize' }}>
            {fmtMonthLong(month)} · planificado vs. objetivo
          </div>
        </div>
      </div>
      <div className="stat-line">
        <span className="muted">Reels</span>
        <span className="v">
          {summary.reels} / {summary.targetReels}
        </span>
      </div>
      <div className="stat-line">
        <span className="muted">Historias</span>
        <span className="v">
          {summary.historias} / {summary.targetHistorias}
        </span>
      </div>
      <div className="stat-line">
        <span className="muted">Carruseles</span>
        <span className="v">
          {summary.carruseles} / {summary.targetCarruseles}
        </span>
      </div>
      <div className="stat-line" style={{ borderBottom: 0 }}>
        <span className="muted">Publicaciones en total</span>
        <span className="v">{summary.publicaciones}</span>
      </div>
    </div>
  )
}

function DayPill({ post, onOpen }) {
  const color = CONTENT_STATUSES.find((s) => s.value === post.status)?.color || 'var(--muted)'
  // Preferimos el título corto; si una publicación vieja no lo tiene, mostramos el caption.
  const label = post.title?.trim() || post.caption?.trim() || 'Sin título'
  return (
    <span
      className="cal-post"
      style={{ borderLeftColor: color }}
      title={`${label} · ${post.status}`}
      onClick={(e) => {
        e.stopPropagation()
        onOpen(post)
      }}
    >
      <ContentThumb post={post} size={22} />
      <span className="txt">{label}</span>
    </span>
  )
}

const WEEK_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

function CalendarView({ grid, month, setMonth, today, posts, onOpenDay, onOpenPost }) {
  const byDate = useMemo(() => {
    const map = new Map()
    for (const p of posts) {
      if (!map.has(p.date)) map.set(p.date, [])
      map.get(p.date).push(p)
    }
    for (const arr of map.values()) arr.sort((a, b) => (a.time || '').localeCompare(b.time || ''))
    return map
  }, [posts])

  return (
    <div className="card">
      <div className="card-head">
        <div className="cal-nav">
          <button className="btn btn-icon" onClick={() => setMonth(addMonths(month, -1))} aria-label="Mes anterior">
            <IconChevronLeft />
          </button>
          <div className="cal-month-label">{fmtMonthLong(month)}</div>
          <button className="btn btn-icon" onClick={() => setMonth(addMonths(month, 1))} aria-label="Mes siguiente">
            <IconChevronRight />
          </button>
        </div>
        <button className="btn btn-soft btn-sm" onClick={() => setMonth(monthKey(today))}>
          Hoy
        </button>
      </div>

      <ContentStatusLegend />

      <div className="cal-weekdays">
        {WEEK_LABELS.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>
      <div className="cal-grid">
        {grid.map(({ date, inMonth }) => {
          const dayPosts = byDate.get(date) || []
          const isToday = date === today
          const dayNum = Number(date.slice(8, 10))
          const shown = dayPosts.slice(0, 3)
          const rest = dayPosts.length - shown.length
          return (
            <button key={date} type="button" className={`cal-day ${inMonth ? '' : 'out'} ${isToday ? 'today' : ''}`} onClick={() => onOpenDay(date)}>
              <span className="num">{dayNum}</span>
              {shown.map((p) => (
                <DayPill key={p.id} post={p} onOpen={onOpenPost} />
              ))}
              {rest > 0 && <span className="cal-more">+{rest} más</span>}
            </button>
          )
        })}
      </div>

      <div className="cal-agenda">
        {grid
          .filter((d) => d.inMonth)
          .map(({ date }) => {
            const dayPosts = byDate.get(date) || []
            const isToday = date === today
            return (
              <div key={date} className={`agenda-day ${isToday ? 'today' : ''}`}>
                <div className="agenda-day-head" onClick={() => onOpenDay(date)}>
                  <span className="lbl">
                    {fmtDate(date)} {isToday ? '· Hoy' : ''}
                  </span>
                  <button
                    className="btn btn-icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      onOpenDay(date)
                    }}
                    aria-label="Agregar publicación"
                  >
                    <IconPlus />
                  </button>
                </div>
                {dayPosts.length > 0 && (
                  <div className="agenda-posts">
                    {dayPosts.map((p) => (
                      <DayPill key={p.id} post={p} onOpen={onOpenPost} />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
      </div>
    </div>
  )
}

function ListView({ posts, filters, setFilters, hasFilters, onOpen, onCopy, onDuplicate, onDelete, onSchedule, scheduling }) {
  return (
    <div className="card">
      <div className="toolbar">
        <div className="search">
          <IconSearch />
          <input className="input" placeholder="Buscar título, hashtags, notas…" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} />
        </div>
        <select className="select" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">Todos los estados</option>
          {CONTENT_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.value}
            </option>
          ))}
        </select>
        <select className="select" value={filters.format} onChange={(e) => setFilters({ ...filters, format: e.target.value })}>
          <option value="">Todos los formatos</option>
          {CONTENT_FORMATS.map((f) => (
            <option key={f}>{f}</option>
          ))}
        </select>
        <select className="select" value={filters.responsible} onChange={(e) => setFilters({ ...filters, responsible: e.target.value })}>
          <option value="">Todos los responsables</option>
          {CONTENT_RESPONSIBLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        {hasFilters && (
          <button className="btn btn-ghost btn-sm" onClick={() => setFilters({ q: '', status: '', format: '', responsible: '' })}>
            <IconX /> Limpiar
          </button>
        )}
      </div>

      {posts.length === 0 ? (
        <EmptyState compact title="Nada con esos filtros" text="Probá con otra búsqueda o limpiá los filtros." />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Título</th>
                <th>Fecha</th>
                <th>Formato</th>
                <th>Redes</th>
                <th>Responsable</th>
                <th>Estado</th>
                <th className="actions"></th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => {
                const Icon = FORMAT_ICONS[p.format] || IconCamera
                return (
                  <tr key={p.id}>
                    <td className="muted tabular">{contentCode(p.seq)}</td>
                    <td>
                      <div className="row" style={{ gap: 10, cursor: 'pointer', flexWrap: 'nowrap' }} onClick={() => onOpen(p)}>
                        <ContentThumb post={p} size={34} />
                        <div style={{ minWidth: 0 }}>
                          <div className="cell-title" title={p.title}>
                            {p.title}
                          </div>
                          {p.time && <div className="cell-sub">{p.time} hs</div>}
                        </div>
                      </div>
                    </td>
                    <td className="tabular">{fmtDate(p.date)}</td>
                    <td>
                      <span className="row" style={{ gap: 6, flexWrap: 'nowrap' }}>
                        <Icon style={{ width: 15, height: 15, color: 'var(--caramel)' }} /> {p.format}
                      </span>
                    </td>
                    <td className="small muted">{(p.networks || []).map((n) => NETWORKS.find((x) => x.key === n)?.label).filter(Boolean).join(', ') || '—'}</td>
                    <td>{CONTENT_RESPONSIBLES.find((r) => r.value === p.responsible)?.label || '—'}</td>
                    <td>
                      <ContentStatus status={p.status} />
                    </td>
                    <td className="actions">
                      {p.status === 'Listo para publicar' && (
                        <button className="btn btn-icon" onClick={() => onSchedule(p)} aria-label="Programar en Buffer" title="Programar en Buffer" disabled={scheduling === p.id}>
                          <IconSend className={scheduling === p.id ? 'spin' : ''} />
                        </button>
                      )}
                      <button className="btn btn-icon" onClick={() => onCopy(p)} aria-label="Copiar para Buffer" title="Copiar para Buffer">
                        <IconClipboard />
                      </button>
                      <button className="btn btn-icon" onClick={() => onDuplicate(p)} aria-label="Duplicar" title="Duplicar">
                        <IconRepeat />
                      </button>
                      <button className="btn btn-icon danger" onClick={() => onDelete(p)} aria-label="Borrar" title="Borrar">
                        <IconTrash />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function DetailBlock({ label, text, pre = false }) {
  if (!text) return null
  return (
    <div>
      <div className="small muted strong" style={{ marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 11 }}>
        {label}
      </div>
      <div style={{ whiteSpace: pre ? 'pre-wrap' : 'normal', fontSize: 14, lineHeight: 1.5, wordBreak: 'break-word' }}>{text}</div>
    </div>
  )
}

function DetailModal({ post, onClose, onEdit, onDuplicate, onDelete, onCopy, onSchedule, onPreview, scheduling, onStatus }) {
  const buffered = (post.bufferPostIds || []).length > 0
  return (
    <Modal open onClose={onClose} title={`${contentCode(post.seq)} · ${post.title}`} subtitle={`${fmtDate(post.date)}${post.time ? ` · ${post.time} hs` : ''} · ${post.format}`} size="wide">
      <div className="row between" style={{ marginBottom: 18 }}>
        <div className="row" style={{ gap: 8 }}>
          {(post.networks || []).map((n) => {
            const net = NETWORKS.find((x) => x.key === n)
            return net ? (
              <span key={n} className="chip" style={{ background: `${net.color}1c`, color: net.color }}>
                {net.label}
              </span>
            ) : null
          })}
        </div>
        <select className="select" value={post.status} onChange={(e) => onStatus(e.target.value)} style={{ width: 'auto', padding: '7px 30px 7px 10px', fontSize: 13, background: 'var(--white)' }}>
          {CONTENT_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.value}
            </option>
          ))}
        </select>
      </div>

      {buffered && (
        <div className="chip green" style={{ marginBottom: 14 }}>
          <IconCheck style={{ width: 12, height: 12 }} /> Programada en Buffer: {post.bufferPostIds.map((bp) => networkLabel(bp.network)).join(', ')}
        </div>
      )}

      <div style={{ marginBottom: 18 }}>
        <ContentCover post={post} height={140} />
      </div>

      <div className="stack" style={{ gap: 14 }}>
        <DetailBlock label="Responsable" text={CONTENT_RESPONSIBLES.find((r) => r.value === post.responsible)?.label} />
        <DetailBlock label="Ubicación" text={post.location} />
        <DetailBlock label="Hashtags" text={post.hashtags} />
        <DetailBlock label="Notas" text={post.notes} pre />
        {post.assetUrl && (
          <DetailBlock
            label="URL del video/imagen"
            text={
              <a href={post.assetUrl} target="_blank" rel="noreferrer">
                {post.assetUrl}
              </a>
            }
          />
        )}
        {post.format === 'Carrusel' && post.assetUrls?.length > 0 && (
          <div>
            <div className="small muted strong" style={{ marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 11 }}>
              Imágenes del carrusel ({post.assetUrls.length})
            </div>
            <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
              {post.assetUrls.map((u, i) => (
                <a key={u + i} href={u} target="_blank" rel="noreferrer" title={u}>
                  <img src={u} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8 }} />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="form-actions" style={{ justifyContent: 'space-between' }}>
        <div className="row" style={{ gap: 4 }}>
          <button type="button" className="btn btn-icon" onClick={onDuplicate} aria-label="Duplicar" title="Duplicar">
            <IconRepeat />
          </button>
          <button type="button" className="btn btn-icon danger" onClick={onDelete} aria-label="Borrar" title="Borrar">
            <IconTrash />
          </button>
        </div>
        <div className="row" style={{ gap: 8 }}>
          {hasAsset(post) && (
            <button type="button" className="btn btn-soft" onClick={onPreview}>
              <IconEye /> Vista previa
            </button>
          )}
          <button type="button" className="btn btn-soft" onClick={onCopy}>
            <IconClipboard /> Copiar para Buffer
          </button>
          {post.status === 'Listo para publicar' && (
            <button type="button" className="btn btn-soft" onClick={onSchedule} disabled={scheduling}>
              <IconSend className={scheduling ? 'spin' : ''} /> {scheduling ? 'Programando…' : 'Programar en Buffer'}
            </button>
          )}
          <button type="button" className="btn btn-primary" onClick={onEdit}>
            <IconEdit /> Editar
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ---------- Subida de video/imagen a Supabase Storage (o pegar un link a mano) ----------
function fileNameFromUrl(url) {
  try {
    const last = decodeURIComponent(new URL(url).pathname.split('/').filter(Boolean).pop() || '')
    // Si el último segmento no parece un nombre de archivo (p. ej. los links de "ver"
    // de Drive terminan en /view, no en un nombre), mostramos la URL completa.
    return last && /\.[a-z0-9]{2,5}$/i.test(last) ? last : url
  } catch {
    return url
  }
}

function AssetUpload({ value, onChange, accept, placeholder }) {
  const [uploading, setUploading] = useState(false)
  const [err, setErr] = useState('')
  const [showLink, setShowLink] = useState(false)
  const fileRef = useRef(null)

  const onFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setErr('')
    setUploading(true)
    try {
      const prev = value
      const url = await uploadContentMedia(file)
      onChange(url)
      if (prev) deleteContentMedia(prev) // reemplazo: no dejamos el archivo viejo huérfano en el storage
    } catch (e2) {
      setErr(e2.message || 'No se pudo subir el archivo')
    } finally {
      setUploading(false)
    }
  }

  const clear = () => {
    if (value) deleteContentMedia(value)
    onChange('')
  }

  if (value) {
    return (
      <div className="row" style={{ gap: 8, flexWrap: 'nowrap' }}>
        <span className="chip beige" style={{ flex: 1, minWidth: 0, justifyContent: 'flex-start' }} title={value}>
          <IconCheck style={{ width: 12, height: 12, flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fileNameFromUrl(value)}</span>
        </span>
        <button type="button" className="btn btn-icon" onClick={clear} aria-label="Quitar archivo" title="Quitar">
          <IconX />
        </button>
      </div>
    )
  }

  return (
    <div>
      {showLink ? (
        <div className="row" style={{ gap: 8, flexWrap: 'nowrap' }}>
          <input className="input" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{ flex: 1 }} />
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowLink(false)}>
            Subir archivo
          </button>
        </div>
      ) : (
        <div className="row" style={{ gap: 10 }}>
          <button type="button" className="btn btn-soft btn-sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? (
              <>
                <IconRefresh className="spin" /> Subiendo…
              </>
            ) : (
              <>
                <IconUpload /> Elegir archivo
              </>
            )}
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowLink(true)} disabled={uploading}>
            o pegá un link
          </button>
          <input ref={fileRef} type="file" accept={accept} className="hidden-input" onChange={onFile} />
        </div>
      )}
      {err && (
        <div className="form-error" style={{ marginTop: 8 }}>
          {err}
        </div>
      )}
    </div>
  )
}

// ---------- Subida de varias imágenes para un Carrusel (Instagram/Facebook: 2 a 10) ----------
function AssetUploadMultiple({ value, onChange, accept, placeholder }) {
  const [uploading, setUploading] = useState(false)
  const [err, setErr] = useState('')
  const [showLink, setShowLink] = useState(false)
  const [linkValue, setLinkValue] = useState('')
  const [dragIndex, setDragIndex] = useState(null)
  const [overIndex, setOverIndex] = useState(null)
  const fileRef = useRef(null)
  const urls = value || []

  const onFiles = async (e) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (!files.length) return
    setErr('')
    setUploading(true)
    try {
      const uploaded = []
      for (const file of files) {
        uploaded.push(await uploadContentMedia(file))
      }
      onChange([...urls, ...uploaded])
    } catch (e2) {
      setErr(e2.message || 'No se pudo subir el archivo')
    } finally {
      setUploading(false)
    }
  }

  const addLink = () => {
    const v = linkValue.trim()
    if (!v) return
    onChange([...urls, v])
    setLinkValue('')
    setShowLink(false)
  }

  const removeAt = (i) => {
    deleteContentMedia(urls[i])
    onChange(urls.filter((_, idx) => idx !== i))
  }

  const move = (i, dir) => {
    const j = i + dir
    if (j < 0 || j >= urls.length) return
    const next = [...urls]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }

  // Arrastrar una imagen y soltarla entre otras dos para reordenar el carrusel.
  const reorder = (from, to) => {
    if (from == null || to == null || from === to) return
    const next = [...urls]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    onChange(next)
  }

  const handleDragStart = (i) => (e) => {
    setDragIndex(i)
    e.dataTransfer.effectAllowed = 'move'
    try {
      e.dataTransfer.setData('text/plain', String(i))
    } catch {
      /* Firefox exige que se llame setData para permitir el drag */
    }
  }
  const handleDragOver = (i) => (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (overIndex !== i) setOverIndex(i)
  }
  const handleDrop = (i) => (e) => {
    e.preventDefault()
    reorder(dragIndex, i)
    setDragIndex(null)
    setOverIndex(null)
  }
  const handleDragEnd = () => {
    setDragIndex(null)
    setOverIndex(null)
  }

  return (
    <div className="stack" style={{ gap: 8 }}>
      {urls.length > 0 && (
        <>
          <div className="carousel-order-grid">
            {urls.map((u, i) => (
              <div
                key={u + i}
                className={`carousel-order-item${dragIndex === i ? ' dragging' : ''}${overIndex === i && dragIndex !== null && dragIndex !== i ? ' drag-over' : ''}`}
                draggable
                onDragStart={handleDragStart(i)}
                onDragOver={handleDragOver(i)}
                onDrop={handleDrop(i)}
                onDragEnd={handleDragEnd}
                title={u}
              >
                <span className="carousel-order-badge">{i + 1}</span>
                <img src={u} alt="" className="carousel-order-img" />
                <div className="carousel-order-actions">
                  <button type="button" className="btn btn-icon btn-sm" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Mover antes" title="Mover antes">
                    <IconChevronLeft />
                  </button>
                  <button type="button" className="btn btn-icon btn-sm" onClick={() => move(i, 1)} disabled={i === urls.length - 1} aria-label="Mover después" title="Mover después">
                    <IconChevronRight />
                  </button>
                  <button type="button" className="btn btn-icon btn-sm" onClick={() => removeAt(i)} aria-label="Quitar" title="Quitar">
                    <IconX />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="small muted">Arrastrá una imagen para cambiarla de lugar, o usá las flechas. La 1 es la primera que se ve.</div>
        </>
      )}
      {showLink ? (
        <div className="row" style={{ gap: 8, flexWrap: 'nowrap' }}>
          <input className="input" value={linkValue} onChange={(e) => setLinkValue(e.target.value)} placeholder={placeholder} style={{ flex: 1 }} />
          <button type="button" className="btn btn-soft btn-sm" onClick={addLink}>
            Agregar
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowLink(false)}>
            Cancelar
          </button>
        </div>
      ) : (
        <div className="row" style={{ gap: 10 }}>
          <button type="button" className="btn btn-soft btn-sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? (
              <>
                <IconRefresh className="spin" /> Subiendo…
              </>
            ) : (
              <>
                <IconUpload /> Agregar imágenes
              </>
            )}
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowLink(true)} disabled={uploading}>
            o pegá un link
          </button>
          <input ref={fileRef} type="file" accept={accept} multiple className="hidden-input" onChange={onFiles} />
        </div>
      )}
      {urls.length > 0 && urls.length < 2 && <div className="small muted">Instagram pide al menos 2 imágenes para un carrusel.</div>}
      {err && (
        <div className="form-error" style={{ marginTop: 4 }}>
          {err}
        </div>
      )}
    </div>
  )
}

function PostForm({ post, initialDate, pillars, onClose, onSave, onUnschedule }) {
  const [f, setF] = useState(() => ({
    title: '',
    date: initialDate,
    time: '19:30',
    format: 'Foto',
    networks: ['instagram'],
    responsible: 'santino',
    location: 'CABA',
    pillar: pillars[0] || '',
    hook: '',
    script: '',
    caption: '',
    hashtags: '#perro #sanzo #petshop #mascota',
    notes: '',
    status: 'Idea',
    assetUrl: '',
    assetUrls: [],
    thumbnailUrl: '',
    bufferPostIds: [],
    ...(post || {}),
  }))
  const [err, setErr] = useState('')
  const [unscheduling, setUnscheduling] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const initialAssets = useRef({
    assetUrl: post?.assetUrl || '',
    assetUrls: post?.assetUrls || [],
    thumbnailUrl: post?.thumbnailUrl || '',
  })
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }))
  const toggleNetwork = (key) => setF((x) => ({ ...x, networks: x.networks.includes(key) ? x.networks.filter((n) => n !== key) : [...x.networks, key] }))

  // Si subieron un archivo nuevo y cierran sin guardar, no lo dejamos huérfano en el storage.
  const handleClose = () => {
    if (f.assetUrl && f.assetUrl !== initialAssets.current.assetUrl) deleteContentMedia(f.assetUrl)
    for (const u of f.assetUrls || []) {
      if (!initialAssets.current.assetUrls.includes(u)) deleteContentMedia(u)
    }
    if (f.thumbnailUrl && f.thumbnailUrl !== initialAssets.current.thumbnailUrl) deleteContentMedia(f.thumbnailUrl)
    onClose()
  }

  const doUnschedule = async () => {
    setUnscheduling(true)
    await onUnschedule(f)
    setF((x) => ({ ...x, bufferPostIds: [], status: 'Listo para publicar' }))
    setUnscheduling(false)
  }

  const submit = (e) => {
    e.preventDefault()
    if (!f.title.trim()) return setErr('Ponele un título corto.')
    if (!f.date) return setErr('Elegí la fecha planificada.')
    onSave(
      {
        title: f.title.trim(),
        date: f.date,
        time: f.time,
        format: f.format,
        networks: f.networks,
        responsible: f.responsible,
        location: f.location.trim(),
        pillar: f.pillar,
        hook: f.hook.trim(),
        script: f.script.trim(),
        caption: f.caption.trim(),
        hashtags: f.hashtags.trim(),
        notes: f.notes.trim(),
        status: f.status,
        assetUrl: f.format === 'Carrusel' ? '' : f.assetUrl.trim(),
        assetUrls: f.format === 'Carrusel' ? f.assetUrls : [],
        thumbnailUrl: f.thumbnailUrl.trim(),
      },
      post?.id,
    )
  }

  return (
    <>
    <Modal open onClose={handleClose} title={post ? `Editar ${contentCode(post.seq)}` : 'Nueva publicación'} subtitle="Organizá todo acá; después la programás en Buffer o la copiás a mano." size="wide">
      {f.bufferPostIds?.length > 0 && (
        <div className="banner warn">
          <IconAlert />
          <span>
            Ya está programada en Buffer ({f.bufferPostIds.map((bp) => networkLabel(bp.network)).join(', ')}). Si la editás, el cambio NO se actualiza solo allá.
          </span>
          <span className="spacer" />
          <button type="button" className="btn btn-soft btn-sm" onClick={doUnschedule} disabled={unscheduling}>
            {unscheduling ? 'Borrando…' : 'Borrar de Buffer y reprogramar'}
          </button>
        </div>
      )}
      <form onSubmit={submit}>
        <div className="form-grid">
          <Field label="Título corto" full hint="Podés usar Enter para bajar de línea; no envía el formulario.">
            <textarea
              className="textarea"
              rows={1}
              style={{ minHeight: 40 }}
              value={f.title}
              onChange={(e) => set('title', e.target.value)}
              autoFocus
              placeholder="Ej: 5 señales de que tu perro está feliz"
            />
          </Field>
          <Field label="Fecha planificada">
            <input className="input" type="date" value={f.date} onChange={(e) => set('date', e.target.value)} required />
          </Field>
          <Field label="Hora tentativa">
            <input className="input" type="time" value={f.time} onChange={(e) => set('time', e.target.value)} />
          </Field>
          <Field label="Formato">
            <select className="select" value={f.format} onChange={(e) => set('format', e.target.value)}>
              {CONTENT_FORMATS.map((fo) => (
                <option key={fo}>{fo}</option>
              ))}
            </select>
          </Field>
          <Field label="Responsable">
            <select className="select" value={f.responsible} onChange={(e) => set('responsible', e.target.value)}>
              {CONTENT_RESPONSIBLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Ubicación">
            <input className="input" value={f.location} onChange={(e) => set('location', e.target.value)} placeholder="CABA" />
          </Field>
          <Field label="Redes" full>
            <div className="row">
              {NETWORKS.map((n) => (
                <label key={n.key} className="checkbox" style={{ background: 'var(--cream)', padding: '7px 12px', borderRadius: 999 }}>
                  <input type="checkbox" checked={f.networks.includes(n.key)} onChange={() => toggleNetwork(n.key)} style={{ accentColor: n.color }} />
                  {n.label}
                </label>
              ))}
            </div>
          </Field>
        </div>

        <div className="divider" />
        <div className="stack" style={{ gap: 14 }}>
          <Field label="Hashtags">
            <input className="input" value={f.hashtags} onChange={(e) => set('hashtags', e.target.value)} placeholder="#perros #sanzo #petshop…" />
          </Field>
          <Field label="Notas">
            <textarea className="textarea" style={{ minHeight: 60 }} value={f.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Locación, referencia, lo que sea útil para grabar o editar…" />
          </Field>
        </div>

        <div className="divider" />
        <div className="form-grid">
          {f.format === 'Carrusel' ? (
            <Field label="Imágenes del carrusel" full hint="Subí 2 o más imágenes, en el orden en que se van a ver.">
              <AssetUploadMultiple value={f.assetUrls} onChange={(v) => set('assetUrls', v)} accept="image/*" placeholder="https://drive.google.com/… (o cualquier link público a la imagen)" />
            </Field>
          ) : (
            <Field label="Video o imagen" full hint="Puede ser foto o video — Buffer lo detecta solo según el archivo.">
              <AssetUpload
                value={f.assetUrl}
                onChange={(v) => set('assetUrl', v)}
                accept="video/*,image/*"
                placeholder="https://drive.google.com/… (o cualquier link público al archivo)"
              />
            </Field>
          )}
          <Field
            label="Portada / miniatura (opcional)"
            full
            hint={
              f.format === 'Foto'
                ? 'Si no cargás una, usamos la foto de arriba como portada automáticamente.'
                : 'La imagen que se ve en el calendario, la lista y el dashboard para reconocer la publicación de un vistazo (recomendado para Reels e Historias en video).'
            }
          >
            <AssetUpload value={f.thumbnailUrl} onChange={(v) => set('thumbnailUrl', v)} accept="image/*" placeholder="https://… (Drive, Buffer, etc.)" />
          </Field>
        </div>

        {hasAsset(f) && (
          <button type="button" className="btn btn-soft btn-sm" style={{ marginTop: 4 }} onClick={() => setShowPreview(true)}>
            <IconEye /> Vista previa en Instagram
          </button>
        )}

        {err && (
          <div className="form-error" style={{ marginTop: 14 }}>
            {err}
          </div>
        )}
        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={handleClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary">
            {post ? 'Guardar cambios' : 'Crear publicación'}
          </button>
        </div>
      </form>
    </Modal>
    {showPreview && <InstagramPreviewPanel post={f} onClose={() => setShowPreview(false)} />}
    </>
  )
}
