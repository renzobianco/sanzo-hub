import { useEffect, useState } from 'react'
import { getInstagramCached, matchCalendarPost } from '../../lib/meta.js'
import { fmtNum, fmtDecimal, todayISO } from '../../utils/format.js'

// "Cómo le fue": métricas de Instagram de una publicación del Calendario ya
// publicada. La busca por día y formato (ver matchCalendarPost). Si Meta no
// está conectado o no la encuentra, lo dice en una línea y no molesta.
export default function PostPerformance({ post }) {
  const eligible = (post.networks || []).includes('instagram') && post.format !== 'Historia' && post.date <= todayISO() && ['Publicado', 'Cargado en Buffer'].includes(post.status)
  const [st, setSt] = useState({ loading: eligible, match: null, error: null })

  useEffect(() => {
    if (!eligible) return
    let alive = true
    getInstagramCached()
      .then((d) => alive && setSt({ loading: false, match: matchCalendarPost(post, d.media || []), error: null }))
      .catch((error) => alive && setSt({ loading: false, match: null, error }))
    return () => {
      alive = false
    }
  }, [eligible, post])

  if (!eligible) return null
  const head = (
    <div className="small muted strong" style={{ marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 11 }}>
      Cómo le fue en Instagram
    </div>
  )
  if (st.loading) return <div>{head}<div className="muted small">Buscando en Instagram…</div></div>
  if (st.error) return <div>{head}<div className="muted small">{st.error.code === 'sin_token' || st.error.code === 'sin_api' ? 'Falta conectar Meta para ver las estadísticas.' : `No se pudo leer Instagram: ${st.error.message}`}</div></div>
  const m = st.match
  if (!m) return <div>{head}<div className="muted small">No encontré en Instagram un {post.format.toLowerCase()} publicado ese día.</div></div>
  const cells = [
    ['Vistas', m.views ? fmtNum(m.views) : '—'],
    ['Alcance', fmtNum(m.reach)],
    ...(m.kind === 'Reel' ? [['Visto prom.', `${fmtDecimal(m.avgWatch, 1)} s`]] : []),
    ['Me gusta', fmtNum(m.likes)],
    ['Coment.', fmtNum(m.comments)],
    ['Compart.', fmtNum(m.shares)],
    ['Guard.', fmtNum(m.saved)],
  ]
  return (
    <div>
      {head}
      <div className="row" style={{ gap: 18, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        {cells.map(([k, v]) => (
          <div key={k}>
            <div className="muted small">{k}</div>
            <div className="strong" style={{ fontSize: 17 }}>{v}</div>
          </div>
        ))}
        <a className="btn btn-ghost btn-sm" href={m.permalink} target="_blank" rel="noreferrer">
          Abrir en Instagram
        </a>
      </div>
    </div>
  )
}
