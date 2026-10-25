import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { PageHeader, Field } from '../components/ui/Primitives.jsx'
import { ExchangeRateFields } from '../components/ui/ExchangeRate.jsx'
import { IconEye, IconEyeOff, IconCheck, IconAlert, IconRefresh, IconTrash, IconInfo, IconCoins } from '../components/ui/Icons.jsx'
import { NETWORKS } from '../data/defaults.js'
import { llamarCorreo, PROVINCIAS } from '../lib/correo.js'
import { getBufferKey, setBufferKey, getStoredChannels, setStoredChannels, testBufferConnection } from '../lib/buffer.js'

export default function Ajustes() {
  const { notify } = useApp()
  const [key, setKey] = useState(() => getBufferKey())
  const [showKey, setShowKey] = useState(false)
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState(null) // null | { ok:true, organization, channels } | { ok:false, message }
  const [savedChannels, setSavedChannels] = useState(() => getStoredChannels())

  const onKeyChange = (v) => {
    setKey(v)
    setBufferKey(v)
    setResult(null)
  }

  const test = async () => {
    setTesting(true)
    setResult(null)
    try {
      const r = await testBufferConnection()
      setSavedChannels(r.channels)
      setResult({ ok: true, organization: r.organization, channels: r.channels })
      notify('Conectado con Buffer')
    } catch (e) {
      setResult({ ok: false, message: e.friendly || e.message })
    } finally {
      setTesting(false)
    }
  }

  const disconnect = () => {
    setBufferKey('')
    setStoredChannels([])
    setKey('')
    setSavedChannels([])
    setResult(null)
    notify('Clave de Buffer borrada de este navegador')
  }

  return (
    <div>
      <PageHeader eyebrow="Ajustes" title="Ajustes" subtitle="Conexiones externas de Sanzo Hub." />

      <div className="card mb-16">
        <div className="card-head">
          <div>
            <div className="card-title">
              <IconCoins style={{ width: 17, height: 17, verticalAlign: '-3px', marginRight: 6, color: 'var(--caramel)' }} /> Tipo de cambio
            </div>
            <div className="card-sub">De dónde sale el USD→ARS que usa toda la app (Gastos, Productos, Pedidos, Dashboard, Gráficos).</div>
          </div>
        </div>
        <ExchangeRateFields />
      </div>

      <CorreoAjustes />

      <div className="card">
        <div className="card-head">
          <div>
            <div className="card-title">Conexión con Buffer</div>
            <div className="card-sub">Para programar publicaciones del Calendario directo en Buffer, sin copiar y pegar.</div>
          </div>
        </div>

        <div className="stack" style={{ gap: 14 }}>
          <Field label="Clave de API de Buffer" hint="La conseguís en Buffer → Settings → API.">
            <div className="row" style={{ flexWrap: 'nowrap' }}>
              <input
                className="input"
                type={showKey ? 'text' : 'password'}
                value={key}
                onChange={(e) => onKeyChange(e.target.value)}
                placeholder="Pegá acá tu clave de API"
                style={{ flex: 1 }}
                autoComplete="off"
                spellCheck={false}
              />
              <button type="button" className="btn btn-icon" onClick={() => setShowKey((v) => !v)} aria-label={showKey ? 'Ocultar clave' : 'Mostrar clave'} title={showKey ? 'Ocultar' : 'Mostrar'}>
                {showKey ? <IconEyeOff /> : <IconEye />}
              </button>
            </div>
          </Field>

          <div className="help">
            <IconInfo style={{ width: 13, height: 13, verticalAlign: '-2px' }} /> Esta clave se guarda solo en este navegador (no en la base compartida), así que <strong>no se incluye en el backup exportado</strong>. Cada socio la carga por su cuenta acá.
          </div>

          <div className="row" style={{ gap: 10 }}>
            <button className="btn btn-primary" onClick={test} disabled={!key || testing}>
              <IconRefresh className={testing ? 'spin' : ''} /> {testing ? 'Probando…' : 'Probar conexión'}
            </button>
            {key && (
              <button className="btn btn-ghost btn-sm" onClick={disconnect}>
                <IconTrash /> Quitar clave
              </button>
            )}
          </div>

          {result && !result.ok && (
            <div className="banner warn">
              <IconAlert />
              <span>{result.message}</span>
            </div>
          )}

          {result && result.ok && (
            <div className="card beige" style={{ padding: 14 }}>
              <div className="row" style={{ gap: 6, marginBottom: 10 }}>
                <IconCheck style={{ width: 15, height: 15, color: 'var(--green)' }} />
                <span className="strong small">Conectado a {result.organization.name || 'tu organización de Buffer'}</span>
              </div>
              {result.channels.length === 0 ? (
                <p className="muted small">No hay canales conectados en Buffer todavía. Conectá Instagram, X, Facebook o TikTok desde Buffer y probá de nuevo.</p>
              ) : (
                <div className="stack" style={{ gap: 8 }}>
                  {result.channels.map((c) => {
                    const net = NETWORKS.find((n) => n.key === String(c.service || '').toLowerCase())
                    return (
                      <div className="row" key={c.id} style={{ gap: 8 }}>
                        <span style={{ width: 9, height: 9, borderRadius: '50%', background: net?.color || 'var(--muted)', flexShrink: 0 }} />
                        <span className="small">
                          {c.displayName} <span className="muted">· {net?.label || c.service}</span>
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {!result && savedChannels.length > 0 && (
            <p className="muted small">
              Última conexión probada: {savedChannels.length} {savedChannels.length === 1 ? 'canal encontrado' : 'canales encontrados'}. Volvé a probar si conectaste o desconectaste algo en Buffer.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

const REMITENTE_VACIO = { nombre: 'sanzo', calle: '', altura: '', piso: '', depto: '', localidad: '', provincia: 'Ciudad Autónoma de Buenos Aires', cp: '', celular: '', email: '' }
const PAQUETE_VACIO = { alto: '', ancho: '', largo: '', peso: '' }

/**
 * Correo Argentino (API PAQ.AR): estado de la conexión, remitente y paquete por defecto.
 * Las credenciales NO van acá: son variables de entorno en Vercel (ver api/correo.js).
 */
function CorreoAjustes() {
  const { state, updateSettings, notify } = useApp()
  const guardado = state.settings.correo || {}
  const [remitente, setRemitente] = useState(() => ({ ...REMITENTE_VACIO, ...(guardado.remitente || {}) }))
  const [paquete, setPaquete] = useState(() => ({ ...PAQUETE_VACIO, ...(guardado.paquete || {}) }))
  const [estado, setEstado] = useState(null) // null | { configurado, conectado, test, error }
  const [probando, setProbando] = useState(false)

  const probar = async () => {
    setProbando(true)
    try {
      setEstado(await llamarCorreo('estado'))
    } catch (e) {
      setEstado({ error: e.message })
    } finally {
      setProbando(false)
    }
  }

  useEffect(() => {
    probar()
  }, [])

  const guardar = () => {
    updateSettings({ correo: { remitente, paquete } })
    notify('Datos del Correo guardados')
  }

  const r = (k) => ({ value: remitente[k], onChange: (e) => setRemitente({ ...remitente, [k]: e.target.value }) })
  const p = (k) => ({ value: paquete[k], onChange: (e) => setPaquete({ ...paquete, [k]: e.target.value }), type: 'number', inputMode: 'numeric', min: 0 })

  return (
    <div className="card mb-16">
      <div className="card-head">
        <div>
          <div className="card-title">Correo Argentino</div>
          <div className="card-sub">Para generar el envío y la etiqueta de cada pedido web desde Pedidos web.</div>
        </div>
      </div>

      <div className="stack" style={{ gap: 14 }}>
        {probando ? (
          <p className="muted small">Revisando la conexión…</p>
        ) : estado?.conectado ? (
          <div className="row" style={{ gap: 6 }}>
            <IconCheck style={{ width: 15, height: 15, color: 'var(--green)' }} />
            <span className="strong small">Conectado{estado.test ? ' (ambiente de prueba)' : ''}</span>
          </div>
        ) : (
          <div className="banner warn">
            <IconAlert />
            <span>
              {estado?.configurado === false
                ? 'Faltan las credenciales: el número de acuerdo y la API-Key que da el área Comercial de Correo Argentino. Se cargan en Vercel (proyecto sanzo-hub) como CORREO_AGREEMENT y CORREO_API_KEY.'
                : estado?.error || 'No se pudo revisar la conexión.'}
            </span>
          </div>
        )}

        <div className="card-sub strong">Remitente (desde donde despachan)</div>
        <div className="form-grid">
          <Field label="Nombre">
            <input className="input" {...r('nombre')} />
          </Field>
          <Field label="Celular">
            <input className="input" inputMode="tel" {...r('celular')} />
          </Field>
          <Field label="Calle">
            <input className="input" {...r('calle')} />
          </Field>
          <Field label="Altura">
            <input className="input" inputMode="numeric" {...r('altura')} />
          </Field>
          <Field label="Piso (opcional)">
            <input className="input" {...r('piso')} />
          </Field>
          <Field label="Depto (opcional)">
            <input className="input" {...r('depto')} />
          </Field>
          <Field label="Localidad">
            <input className="input" {...r('localidad')} />
          </Field>
          <Field label="Código postal">
            <input className="input" {...r('cp')} />
          </Field>
          <Field label="Provincia">
            <select className="select" {...r('provincia')}>
              {PROVINCIAS.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </Field>
          <Field label="Email">
            <input className="input" type="email" {...r('email')} />
          </Field>
        </div>

        <div className="card-sub strong">Paquete por defecto</div>
        <div className="form-grid">
          <Field label="Alto (cm)">
            <input className="input" {...p('alto')} />
          </Field>
          <Field label="Ancho (cm)">
            <input className="input" {...p('ancho')} />
          </Field>
          <Field label="Largo (cm)">
            <input className="input" {...p('largo')} />
          </Field>
          <Field label="Peso (gramos)" hint="Con la caja y el relleno.">
            <input className="input" {...p('peso')} />
          </Field>
        </div>
        <p className="muted small">Se usa para cada envío; si un pedido es más grande, lo cambiás al generarlo.</p>

        <div className="row" style={{ gap: 10 }}>
          <button className="btn btn-primary" onClick={guardar}>
            <IconCheck /> Guardar
          </button>
          <button className="btn btn-ghost btn-sm" onClick={probar} disabled={probando}>
            <IconRefresh className={probando ? 'spin' : ''} /> Probar conexión
          </button>
        </div>
      </div>
    </div>
  )
}
