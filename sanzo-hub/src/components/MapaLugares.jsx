import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useApp } from '../context/AppContext.jsx'
import { Segmented } from './ui/Primitives.jsx'
import { IconSearch, IconCheck, IconPin, IconPhone, IconX } from './ui/Icons.jsx'
import { fmtDate, fmtNum, todayISO } from '../utils/format.js'
import LUGARES from '../data/lugaresCaba.json'

// Veterinarias y pet shops de CABA sacados de OpenStreetMap (snapshot, ver
// src/data/lugaresCaba.json). Las visitas se guardan en settings.visitedPlaces
// ({ [idLugar]: { by, at } }) para que las vean los dos socios.

const TYPE_LABEL = { vet: 'Veterinaria', pet: 'Pet shop', groom: 'Peluquería canina' }
const TYPE_COLOR = { vet: '#956037', pet: '#c99a3b', groom: '#c99a3b' }
const VISITED_COLOR = '#6b8f5e'
const CABA_CENTER = [-34.6118, -58.4373]
const NO_VISITS = {}

const placeName = (p) => p.name || `${TYPE_LABEL[p.type]} sin nombre`

// Links directos de cada local. Google Maps abre la ficha (web, horarios, reseñas,
// cómo llegar); si OpenStreetMap no trae el Instagram, lo buscamos en Google.
function placeLinks(p) {
  const where = [p.name, p.addr, 'CABA'].filter(Boolean).join(' ')
  const mapsQuery = p.name ? where : `${p.lat},${p.lon}`
  const links = [{ label: 'Google Maps', found: true, href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}` }]
  if (p.ig) links.push({ label: `@${p.ig}`, found: true, href: `https://www.instagram.com/${encodeURIComponent(p.ig)}/` })
  else if (p.name) links.push({ label: 'Instagram', found: false, href: `https://www.google.com/search?q=${encodeURIComponent(`${where} instagram`)}` })
  if (p.web) links.push({ label: 'Web', found: true, href: /^https?:\/\//.test(p.web) ? p.web : `https://${p.web}` })
  if (p.fb) links.push({ label: 'Facebook', found: true, href: /^https?:\/\//.test(p.fb) ? p.fb : `https://www.facebook.com/${p.fb}` })
  return links
}

export default function MapaLugares() {
  const { state, updateSettings, currentUser, notify } = useApp()
  const visited = state.settings.visitedPlaces || NO_VISITS
  const [type, setType] = useState('all')
  const [hideVisited, setHideVisited] = useState(false)
  const [q, setQ] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const mapEl = useRef(null)
  const mapRef = useRef(null)
  const layerRef = useRef(null)

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase()
    return LUGARES.filter((p) => {
      if (type === 'vet' && p.type !== 'vet') return false
      if (type === 'pet' && p.type === 'vet') return false
      if (hideVisited && visited[p.id]) return false
      if (s && !`${p.name || ''} ${p.addr || ''}`.toLowerCase().includes(s)) return false
      return true
    })
  }, [type, hideVisited, q, visited])

  const visitedCount = LUGARES.filter((p) => visited[p.id]).length
  const selected = LUGARES.find((p) => p.id === selectedId) || null

  useEffect(() => {
    const map = L.map(mapEl.current, { center: CABA_CENTER, zoom: 12, zoomControl: true, scrollWheelZoom: false })
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)
    // La rueda del mouse solo hace zoom después de tocar el mapa, para no trabar el scroll de la página.
    map.on('click', () => map.scrollWheelZoom.enable())
    map.on('mouseout', () => map.scrollWheelZoom.disable())
    layerRef.current = L.layerGroup().addTo(map)
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const layer = layerRef.current
    if (!layer) return
    layer.clearLayers()
    for (const p of shown) {
      const isVisited = !!visited[p.id]
      const isSelected = p.id === selectedId
      const color = isVisited ? VISITED_COLOR : TYPE_COLOR[p.type]
      L.circleMarker([p.lat, p.lon], {
        radius: isSelected ? 9 : 6,
        color: '#fff',
        weight: 1.5,
        fillColor: color,
        fillOpacity: isVisited ? 0.55 : 0.9,
        className: `map-dot${isSelected ? ' selected' : ''}`,
      })
        .bindTooltip(placeName(p), { direction: 'top', offset: [0, -6] })
        .on('click', () => setSelectedId(p.id))
        .addTo(layer)
    }
  }, [shown, visited, selectedId])

  const toggleVisited = (p) => {
    const next = { ...visited }
    if (next[p.id]) {
      delete next[p.id]
      notify(`${placeName(p)}: desmarcada`)
    } else {
      next[p.id] = { by: currentUser || null, at: todayISO() }
      notify(`${placeName(p)}: visitada`)
    }
    updateSettings({ visitedPlaces: next })
  }

  const pct = (visitedCount / LUGARES.length) * 100
  const visit = selected && visited[selected.id]

  return (
    <div className="card mb-16 places-map">
      <div className="card-head" style={{ marginBottom: 12 }}>
        <div>
          <div className="card-title">Veterinarias y pet shops de CABA</div>
          <div className="card-sub">Tocá un punto y marcalo cuando lo visiten. Lo que marca uno lo ve el otro.</div>
        </div>
        <div className="places-progress">
          <div className="small">
            <strong>{fmtNum(visitedCount)}</strong> de {fmtNum(LUGARES.length)} visitadas
          </div>
          <div className="places-bar">
            <span style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      <div className="toolbar">
        <div className="search">
          <IconSearch />
          <input className="input" placeholder="Buscar por nombre o calle…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Segmented
          value={type}
          onChange={setType}
          options={[
            { value: 'all', label: 'Todos' },
            { value: 'vet', label: 'Veterinarias' },
            { value: 'pet', label: 'Pet shops' },
          ]}
        />
        <button className={`chip chip-btn ${hideVisited ? 'active' : ''}`} onClick={() => setHideVisited((v) => !v)}>
          Ocultar visitadas
        </button>
      </div>

      <div className="places-legend small muted">
        <span><i style={{ background: TYPE_COLOR.vet }} /> Veterinaria</span>
        <span><i style={{ background: TYPE_COLOR.pet }} /> Pet shop</span>
        <span><i style={{ background: VISITED_COLOR }} /> Visitada</span>
        <span className="places-count">{fmtNum(shown.length)} en el mapa</span>
      </div>

      <div ref={mapEl} className="places-map-canvas" />

      {selected && (
        <div className={`places-detail ${visit ? 'is-visited' : ''}`} key={selected.id}>
          <div style={{ minWidth: 0 }}>
            <div className="row" style={{ gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span className="cell-title">{placeName(selected)}</span>
              <span className={`chip ${selected.type === 'vet' ? 'ink' : 'outline'}`}>{TYPE_LABEL[selected.type]}</span>
            </div>
            <div className="cell-sub" style={{ marginTop: 4 }}>
              {selected.addr && (
                <span>
                  <IconPin style={{ width: 12, height: 12, verticalAlign: '-1px' }} /> {selected.addr}
                </span>
              )}
              {selected.phone && (
                <span style={{ marginLeft: selected.addr ? 12 : 0 }}>
                  <IconPhone style={{ width: 12, height: 12, verticalAlign: '-1px' }} /> {selected.phone}
                </span>
              )}
              {visit && (
                <div style={{ marginTop: 4, color: 'var(--green)' }}>
                  Visitada{visit.by ? ` por ${state.partners[visit.by]?.name || visit.by}` : ''} el {fmtDate(visit.at)}
                </div>
              )}
            </div>
            <div className="places-links">
              {placeLinks(selected).map((l) => (
                <a key={l.label} className="chip outline chip-btn" href={l.href} target="_blank" rel="noreferrer" title={l.found ? undefined : 'Busca la cuenta en Google'}>
                  {l.label}
                  {!l.found && <span className="muted"> · buscar</span>}
                </a>
              ))}
            </div>
          </div>
          <div className="row" style={{ gap: 8, flexShrink: 0 }}>
            <button className={`btn btn-sm ${visit ? 'btn-ghost' : 'btn-primary'}`} onClick={() => toggleVisited(selected)}>
              {visit ? 'Desmarcar' : <><IconCheck /> Marcar visitada</>}
            </button>
            <button className="btn btn-icon" onClick={() => setSelectedId(null)} aria-label="Cerrar">
              <IconX />
            </button>
          </div>
        </div>
      )}

      <div className="small muted" style={{ marginTop: 10 }}>
        Fuente: OpenStreetMap. Puede faltar algún local o haber alguno que ya cerró.
      </div>
    </div>
  )
}
