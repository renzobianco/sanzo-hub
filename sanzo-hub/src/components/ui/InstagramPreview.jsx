import { useEffect, useRef, useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { fmtDate } from '../../utils/format.js'
import {
  IconX,
  IconHeart,
  IconCommentBubble,
  IconSend,
  IconBookmarkOutline,
  IconMore,
  IconChevronLeft,
  IconChevronRight,
  IconMusicNote,
  BrandMark,
} from './Icons.jsx'

const VIDEO_EXT_RE = /\.(mp4|mov|webm|m4v|avi|mkv)(\?|#|$)/i
const isVideoUrl = (url) => VIDEO_EXT_RE.test(url || '')
const HANDLE = 'sanzo_pets'

// La leyenda real que se manda a Buffer es título + hashtags (ver copyForBuffer/doSchedule
// en Calendario.jsx). La mostramos igual acá para que la vista previa sea fiel a lo que se publica.
function captionOf(post) {
  return [post.title, post.hashtags].filter(Boolean).join('\n\n')
}

function CaptionText({ text }) {
  if (!text) return null
  const parts = text.split(/(#[\p{L}0-9_]+)/gu)
  return parts.map((part, i) => (part.startsWith('#') ? <span key={i} className="ig-hashtag">{part}</span> : <span key={i}>{part}</span>))
}

function Avatar({ src, size = 28 }) {
  return (
    <span className="ig-avatar" style={{ width: size, height: size }}>
      {src ? <img src={src} alt="" /> : <BrandMark size={size} />}
    </span>
  )
}

// ---------- Media de un slide: foto o video, sin romper el layout si todavía no hay archivo ----------
function SlideMedia({ url, active, muted = true, loop = true }) {
  const ref = useRef(null)
  useEffect(() => {
    if (!ref.current) return
    if (active) ref.current.play?.().catch(() => {})
    else ref.current.pause?.()
  }, [active])
  if (!url) {
    return (
      <div className="ig-media-empty">
        <BrandMark size={40} />
        <span>Todavía no cargaste el archivo</span>
      </div>
    )
  }
  if (isVideoUrl(url)) {
    return <video ref={ref} src={url} muted={muted} loop={loop} playsInline autoPlay className="ig-media-el" />
  }
  return <img src={url} alt="" className="ig-media-el" />
}

// ---------- Post de feed: Foto y Carrusel (con navegación arrastrable de verdad) ----------
function FeedPost({ post, avatar }) {
  const slides = post.format === 'Carrusel' ? (post.assetUrls?.length ? post.assetUrls : ['']) : [post.assetUrl || '']
  const multi = slides.length > 1
  const [index, setIndex] = useState(0)
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  const [burst, setBurst] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const trackRef = useRef(null)
  const drag = useRef(null)

  const clamp = (i) => Math.max(0, Math.min(slides.length - 1, i))
  const goTo = (i) => setIndex(clamp(i))

  const onPointerDown = (e) => {
    if (!multi) return
    drag.current = { startX: e.clientX, dx: 0 }
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  const onPointerMove = (e) => {
    if (!drag.current || !trackRef.current) return
    drag.current.dx = e.clientX - drag.current.startX
    const pct = (-index * 100) / slides.length + (drag.current.dx / (trackRef.current.parentElement.offsetWidth || 1)) * (100 / slides.length)
    trackRef.current.style.transition = 'none'
    trackRef.current.style.transform = `translateX(${pct}%)`
  }
  const endDrag = () => {
    if (!drag.current || !trackRef.current) return
    const dx = drag.current.dx
    trackRef.current.style.transition = ''
    if (dx < -50) goTo(index + 1)
    else if (dx > 50) goTo(index - 1)
    else goTo(index)
    drag.current = null
  }

  const lastTap = useRef(0)
  const onMediaClick = () => {
    const now = Date.now()
    if (now - lastTap.current < 300) {
      setLiked(true)
      setBurst(true)
      setTimeout(() => setBurst(false), 700)
    }
    lastTap.current = now
  }

  const caption = captionOf(post)
  const showFull = expanded || caption.length <= 130
  const captionShown = showFull ? caption : `${caption.slice(0, 130)}…`

  return (
    <div className="ig-post">
      <div className="ig-post-head">
        <Avatar src={avatar} />
        <div className="ig-post-head-txt">
          <span className="handle">{HANDLE}</span>
          {post.location && <span className="loc">{post.location}</span>}
        </div>
        <IconMore style={{ width: 18, height: 18 }} />
      </div>

      <div className="ig-media" onClick={onMediaClick}>
        {multi && (
          <div className="ig-progress">
            {slides.map((_, i) => (
              <span key={i} className={i <= index ? 'on' : ''} />
            ))}
          </div>
        )}
        {multi && <span className="ig-counter">{index + 1}/{slides.length}</span>}

        <div
          ref={trackRef}
          className="ig-track"
          style={{ width: `${slides.length * 100}%`, transform: `translateX(${(-index * 100) / slides.length}%)` }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
        >
          {slides.map((url, i) => (
            <div className="ig-slide" key={i} style={{ width: `${100 / slides.length}%` }}>
              <SlideMedia url={url} active={i === index} />
            </div>
          ))}
        </div>

        {burst && <IconHeart className="ig-heart-burst" />}

        {multi && index > 0 && (
          <button type="button" className="ig-arrow left" onClick={(e) => { e.stopPropagation(); goTo(index - 1) }} aria-label="Anterior">
            <IconChevronLeft />
          </button>
        )}
        {multi && index < slides.length - 1 && (
          <button type="button" className="ig-arrow right" onClick={(e) => { e.stopPropagation(); goTo(index + 1) }} aria-label="Siguiente">
            <IconChevronRight />
          </button>
        )}
      </div>

      {multi && (
        <div className="ig-dots">
          {slides.map((_, i) => (
            <button key={i} type="button" className={i === index ? 'on' : ''} onClick={() => goTo(i)} aria-label={`Imagen ${i + 1}`} />
          ))}
        </div>
      )}

      <div className="ig-actions">
        <div className="row" style={{ gap: 14 }}>
          <button type="button" className={`ig-icon-btn ${liked ? 'liked' : ''}`} onClick={() => setLiked((v) => !v)} aria-label="Me gusta">
            <IconHeart fill={liked ? 'currentColor' : 'none'} />
          </button>
          <button type="button" className="ig-icon-btn" aria-label="Comentar">
            <IconCommentBubble />
          </button>
          <button type="button" className="ig-icon-btn" aria-label="Compartir">
            <IconSend />
          </button>
        </div>
        <button type="button" className={`ig-icon-btn ${saved ? 'saved' : ''}`} onClick={() => setSaved((v) => !v)} aria-label="Guardar">
          <IconBookmarkOutline fill={saved ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="ig-likes">{liked ? 'A ti te gusta esto' : 'Sé el primero en decir que te gusta'}</div>

      {caption && (
        <div className="ig-caption">
          <span className="handle">{HANDLE}</span>{' '}
          <CaptionText text={captionShown} />
          {!showFull && (
            <button type="button" className="ig-more" onClick={() => setExpanded(true)}>
              más
            </button>
          )}
        </div>
      )}

      <div className="ig-timestamp">
        {post.date ? `Programado para el ${fmtDate(post.date)}${post.time ? ` a las ${post.time}` : ''}` : 'Todavía sin fecha'}
      </div>

      <div className="ig-comment-row">
        <span className="face">🙂</span>
        <span className="ph">Agregar un comentario…</span>
        <span className="post-cta">Publicar</span>
      </div>
    </div>
  )
}

// ---------- Historia: pantalla completa, con barra de progreso y respuesta rápida ----------
function StoryView({ post, avatar, onClose }) {
  const url = post.assetUrl || ''
  return (
    <div className="ig-story">
      <SlideMedia url={url} active muted={false} />
      <div className="ig-story-scrim" />
      <div className="ig-story-progress">
        <span className="on" style={{ flex: 1 }} />
      </div>
      <div className="ig-story-head">
        <Avatar src={avatar} size={26} />
        <span className="handle">{HANDLE}</span>
        <span className="time">{post.time || ''}</span>
        <span className="spacer" />
        <button type="button" className="ig-icon-btn light" onClick={onClose} aria-label="Cerrar">
          <IconX />
        </button>
      </div>
      <div className="ig-story-foot">
        <div className="reply-pill">Enviar mensaje</div>
        <IconHeart className="light" />
        <IconSend className="light" />
      </div>
    </div>
  )
}

// ---------- Reel: pantalla completa estilo TikTok/Reels, con columna de acciones ----------
function ReelView({ post, avatar }) {
  const url = post.assetUrl || post.thumbnailUrl || ''
  const caption = captionOf(post)
  return (
    <div className="ig-story ig-reel">
      <SlideMedia url={url} active muted loop />
      <div className="ig-story-scrim reel" />
      <div className="ig-reel-label">Reels</div>

      <div className="ig-reel-actions">
        <span className="ig-reel-avatar">
          <Avatar src={avatar} size={30} />
        </span>
        <IconHeart className="light" style={{ marginTop: 14 }} />
        <span className="lbl light">Me gusta</span>
        <IconCommentBubble className="light" style={{ marginTop: 10 }} />
        <span className="lbl light">Comentar</span>
        <IconSend className="light" style={{ marginTop: 10 }} />
        <span className="lbl light">Compartir</span>
        <span className="ig-reel-disc">
          <BrandMark size={22} />
        </span>
      </div>

      <div className="ig-reel-bottom">
        <div className="handle light">{HANDLE}</div>
        {caption && (
          <div className="cap light">
            <CaptionText text={caption.length > 90 ? `${caption.slice(0, 90)}…` : caption} />
          </div>
        )}
        <div className="audio light">
          <IconMusicNote style={{ width: 13, height: 13 }} /> Audio original · {HANDLE}
        </div>
      </div>
    </div>
  )
}

// ---------- Marco de teléfono ----------
function PhoneFrame({ children, storyMode }) {
  return (
    <div className="ig-phone">
      <div className={`ig-phone-screen ${storyMode ? 'full' : ''}`}>
        <div className="ig-phone-island" />
        <div className="ig-status-bar">
          <span>9:41</span>
          <span className="ig-status-icons">
            <svg viewBox="0 0 18 12" width="18" height="12" fill="currentColor"><rect x="0" y="7" width="3" height="5" rx="0.5" /><rect x="4.5" y="4.5" width="3" height="7.5" rx="0.5" /><rect x="9" y="2" width="3" height="10" rx="0.5" /><rect x="13.5" y="0" width="3" height="12" rx="0.5" opacity=".35" /></svg>
            <svg viewBox="0 0 24 12" width="22" height="12" fill="none" stroke="currentColor" strokeWidth="1"><rect x="0.5" y="1" width="19" height="10" rx="2.5" /><rect x="2" y="2.5" width="14" height="7" rx="1.3" fill="currentColor" stroke="none" /><rect x="20.5" y="4" width="2" height="4" rx="1" fill="currentColor" /></svg>
          </span>
        </div>
        <div className="ig-phone-body">{children}</div>
        <div className="ig-home-indicator" />
      </div>
    </div>
  )
}

export default function InstagramPreviewPanel({ post, onClose }) {
  const { state } = useApp()
  const avatar = state.settings.logoImage
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      cancelAnimationFrame(id)
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  if (!post) return null
  const storyMode = post.format === 'Historia' || post.format === 'Reel'

  return (
    <div className={`ig-preview-backdrop ${mounted ? 'in' : ''}`} onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={`ig-preview-panel ${mounted ? 'in' : ''}`} role="dialog" aria-modal="true">
        <div className="ig-preview-head">
          <div>
            <h2>Vista previa de Instagram</h2>
            <p>{post.format === 'Carrusel' ? 'Así se ve tu carrusel — arrastrá las fotos para probarlo' : `Así se ve tu ${post.format?.toLowerCase()}`}</p>
          </div>
          <button className="btn btn-icon" onClick={onClose} aria-label="Cerrar">
            <IconX />
          </button>
        </div>

        <div className="ig-preview-stage">
          <PhoneFrame storyMode={storyMode}>
            {post.format === 'Historia' ? (
              <StoryView post={post} avatar={avatar} onClose={onClose} />
            ) : post.format === 'Reel' ? (
              <ReelView post={post} avatar={avatar} />
            ) : (
              <FeedPost post={post} avatar={avatar} />
            )}
          </PhoneFrame>
        </div>
      </div>
    </div>
  )
}
