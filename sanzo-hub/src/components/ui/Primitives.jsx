import { useEffect, useState } from 'react'
import { IconX, IconPaw, DogArt, IconAlert, IconReel, IconStory, IconCarousel, IconCamera } from './Icons.jsx'
import { CONTENT_STATUSES, CONTENT_STATUS_FAMILIES } from '../../data/defaults.js'

// ---------- Modal ----------
export function Modal({ open, onClose, title, subtitle, children, size = '' }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={`modal ${size}`} role="dialog" aria-modal="true">
        <div className="modal-head">
          <div>
            {title && <h2>{title}</h2>}
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button className="btn btn-icon" onClick={onClose} aria-label="Cerrar">
            <IconX />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ---------- Confirmación ----------
export function ConfirmDialog({ open, onClose, onConfirm, title = '¿Estás seguro?', message, confirmLabel = 'Sí, borrar', danger = true, children }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="narrow">
      {message && <p className="muted" style={{ marginBottom: 8 }}>{message}</p>}
      {children}
      <div className="form-actions">
        <button className="btn btn-ghost" onClick={onClose}>
          Cancelar
        </button>
        <button
          className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
          onClick={() => {
            onConfirm?.()
            onClose?.()
          }}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}

// ---------- Estado vacío ----------
export function EmptyState({ title, text, action, actionLabel, compact = false }) {
  return (
    <div className={`empty ${compact ? 'compact' : ''}`}>
      <DogArt className="dog" />
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {action && (
        <button className="btn btn-primary" onClick={action}>
          {actionLabel}
        </button>
      )}
    </div>
  )
}

// ---------- Header de sección ----------
export function PageHeader({ eyebrow, title, subtitle, children }) {
  return (
    <div className="page-header">
      <div>
        {eyebrow && (
          <div className="eyebrow">
            <IconPaw style={{ width: 12, height: 12 }} /> {eyebrow}
          </div>
        )}
        <h1>{title}</h1>
        {subtitle && <p className="subtitle">{subtitle}</p>}
      </div>
      {children && <div className="page-header-actions">{children}</div>}
    </div>
  )
}

// ---------- Campos ----------
export function Field({ label, hint, children, full = false, className = '' }) {
  return (
    <div className={`field ${full ? 'full' : ''} ${className}`}>
      {label && <label>{label}</label>}
      {children}
      {hint && <span className="hint">{hint}</span>}
    </div>
  )
}

export function MoneyInput({ currency = 'ARS', value, onChange, ...rest }) {
  return (
    <div className={`input-prefix ${currency === 'USD' ? 'usd' : ''}`}>
      <span>{currency === 'USD' ? 'USD' : '$'}</span>
      <input className="input" type="number" inputMode="decimal" step="0.01" min="0" value={value} onChange={onChange} {...rest} />
    </div>
  )
}

// ---------- Segmented control ----------
export function Segmented({ options, value, onChange }) {
  return (
    <div className="segmented">
      {options.map((o) => (
        <button key={o.value} className={value === o.value ? 'active' : ''} onClick={() => onChange(o.value)} type="button">
          {o.label}
        </button>
      ))}
    </div>
  )
}

// ---------- Barra de progreso ----------
export function ProgressBar({ value = 0, green = false, thin = false }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0))
  return (
    <div className={`progress ${green || pct >= 100 ? 'green' : ''} ${thin ? 'thin' : ''}`}>
      <div style={{ width: `${pct}%` }} />
    </div>
  )
}

// ---------- Badges de estado ----------
const slug = (s) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '-')

export function SaleStatus({ status }) {
  return <span className={`status s-${slug(status)}`}>{status}</span>
}

export function OrderStatus({ status }) {
  return <span className={`status o-${slug(status)}`}>{status}</span>
}

export function ContentStatus({ status }) {
  const color = CONTENT_STATUSES.find((s) => s.value === status)?.color || 'var(--muted)'
  return (
    <span className="status" style={{ background: `${color}22`, color }}>
      {status}
    </span>
  )
}

// ---------- Leyenda de colores del calendario de contenido ----------
export function ContentStatusLegend() {
  return (
    <div className="content-legend">
      <span className="item">
        <span className="sw" style={{ background: CONTENT_STATUS_FAMILIES.red.color }} />
        🔴 {CONTENT_STATUS_FAMILIES.red.label}
      </span>
      <span className="item">
        <span className="sw" style={{ background: CONTENT_STATUS_FAMILIES.yellow.color }} />
        🟡 {CONTENT_STATUS_FAMILIES.yellow.label}
      </span>
      <span className="item">
        <span className="sw" style={{ background: CONTENT_STATUS_FAMILIES.green.color }} />
        🟢 {CONTENT_STATUS_FAMILIES.green.label}
      </span>
    </div>
  )
}

// ---------- Miniatura de portada de una publicación (thumbnail o placeholder por formato) ----------
const CONTENT_FORMAT_ICONS = { Reel: IconReel, Historia: IconStory, Carrusel: IconCarousel, Foto: IconCamera }
const IMAGE_EXT_RE = /\.(jpe?g|png|gif|webp|avif|bmp|svg)(\?|#|$)/i

// La portada explícita (thumbnailUrl) manda; si no hay, y el archivo principal
// (assetUrl) es claramente una imagen (típico de las Fotos: el archivo YA es la
// portada), lo usamos directo en vez de pedirle al usuario que cargue lo mismo dos veces.
export function contentCoverUrl(post) {
  if (!post) return ''
  if (post.thumbnailUrl) return post.thumbnailUrl
  if (post.assetUrl && IMAGE_EXT_RE.test(post.assetUrl)) return post.assetUrl
  if (post.assetUrls?.[0]) return post.assetUrls[0]
  return ''
}

export function ContentThumb({ post, size = 28, radius }) {
  const Icon = CONTENT_FORMAT_ICONS[post?.format] || IconCamera
  const url = contentCoverUrl(post)
  const [broken, setBroken] = useState(false)
  useEffect(() => setBroken(false), [url])
  const dim = { width: size, height: size, borderRadius: radius ?? Math.max(6, Math.round(size * 0.22)) }
  return (
    <span className="thumb-sq" style={dim}>
      {url && !broken ? (
        <img src={url} alt="" onError={() => setBroken(true)} />
      ) : (
        <Icon style={{ width: Math.round(size * 0.5), height: Math.round(size * 0.5) }} />
      )}
    </span>
  )
}

// ---------- Portada grande (modal de detalle) — misma lógica, con degradado a placeholder ----------
export function ContentCover({ post, height = 220 }) {
  const url = contentCoverUrl(post)
  const [broken, setBroken] = useState(false)
  useEffect(() => setBroken(false), [url])
  if (url && !broken) {
    return <img src={url} alt="" className="detail-cover" onError={() => setBroken(true)} />
  }
  return (
    <div className="detail-cover row" style={{ height, justifyContent: 'center' }}>
      <ContentThumb post={post} size={48} />
    </div>
  )
}

// ---------- Tooltip para Recharts ----------
export function ChartTooltip({ active, payload, label, formatter, labelFormatter }) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="tooltip">
      {label !== undefined && <div className="t-label">{labelFormatter ? labelFormatter(label) : label}</div>}
      {payload.map((p, i) => (
        <div className="t-row" key={i}>
          <span style={{ color: p.color || p.payload?.fill || 'inherit' }}>{p.name}</span>
          <strong>{formatter ? formatter(p.value, p.name, p) : p.value}</strong>
        </div>
      ))}
    </div>
  )
}

// ---------- Toast ----------
export function Toast({ toast }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    setVisible(!!toast)
  }, [toast])
  if (!toast || !visible) return null
  return (
    <div className={`toast ${toast.kind === 'error' ? 'error' : ''}`} key={toast.id}>
      {toast.kind === 'error' ? <IconAlert /> : <IconPaw />}
      {toast.message}
    </div>
  )
}

// ---------- Fila de huellitas decorativa ----------
export function PawRow({ n = 3 }) {
  return (
    <div className="paw-row" aria-hidden>
      {Array.from({ length: n }).map((_, i) => (
        <IconPaw key={i} style={{ transform: `rotate(${i % 2 ? 12 : -12}deg)`, opacity: 1 - i * 0.22 }} />
      ))}
    </div>
  )
}
