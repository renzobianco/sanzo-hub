// Correo Argentino (API PAQ.AR v1) para los pedidos de la web: crear el envío, bajar la etiqueta,
// anularlo y listar sucursales. Manual: "Correo Argentino – Plataforma de Integración – Api 2.0".
//
// Las credenciales (acuerdo comercial + API-Key) las da el área Comercial del Correo y viven solo
// acá, en variables de entorno de Vercel (nunca en el navegador ni en Supabase):
//   CORREO_AGREEMENT, CORREO_API_KEY, CORREO_SERVICIO (tipo de servicio, default "CP"),
//   CORREO_TEST=1 para usar el ambiente de prueba.
// Los datos del envío se leen del pedido guardado en Supabase (no de lo que manda el navegador),
// y el remitente y el paquete por defecto de Ajustes (settings.correo).

const PROVINCIAS = {
  Salta: 'A',
  'Buenos Aires': 'B',
  'Ciudad Autónoma de Buenos Aires': 'C',
  'San Luis': 'D',
  'Entre Ríos': 'E',
  'La Rioja': 'F',
  'Santiago del Estero': 'G',
  Chaco: 'H',
  'San Juan': 'J',
  Catamarca: 'K',
  'La Pampa': 'L',
  Mendoza: 'M',
  Misiones: 'N',
  Formosa: 'P',
  Neuquén: 'Q',
  'Río Negro': 'R',
  'Santa Fe': 'S',
  Tucumán: 'T',
  Chubut: 'U',
  'Tierra del Fuego': 'V',
  Corrientes: 'W',
  Córdoba: 'X',
  Jujuy: 'Y',
  'Santa Cruz': 'Z',
}

const configurado = () => !!(process.env.CORREO_AGREEMENT && process.env.CORREO_API_KEY)
const esTest = () => process.env.CORREO_TEST === '1'
const baseCorreo = () => (esTest() ? 'https://apitest.correoargentino.com.ar/paqar/v1' : 'https://api.correoargentino.com.ar/paqar/v1')

class ErrorUsuario extends Error {}

async function correo(path, { method = 'GET', body } = {}) {
  const res = await fetch(baseCorreo() + path, {
    method,
    headers: {
      authorization: `Apikey ${process.env.CORREO_API_KEY}`,
      agreement: process.env.CORREO_AGREEMENT,
      'content-type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const texto = await res.text()
  let data = null
  try {
    data = texto ? JSON.parse(texto) : null
  } catch {
    data = texto
  }
  if (!res.ok) {
    const msg = (data && (data.message || data.error)) || texto || `HTTP ${res.status}`
    throw new ErrorUsuario(`Correo Argentino respondió ${res.status}: ${msg}`)
  }
  return { status: res.status, data }
}

// ---------- Supabase (misma base y llave pública que usa el Hub) ----------
const sbBase = () => String(process.env.VITE_SUPABASE_URL || '').trim().replace(/\/+$/, '').replace(/\/rest\/v1$/, '')

async function supabase(path, { method = 'GET', body } = {}) {
  const key = String(process.env.VITE_SUPABASE_ANON_KEY || '').trim()
  const res = await fetch(`${sbBase()}/rest/v1/${path}`, {
    method,
    headers: { apikey: key, authorization: `Bearer ${key}`, 'content-type': 'application/json', prefer: 'return=minimal' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`)
  const texto = await res.text()
  return texto ? JSON.parse(texto) : null
}

async function leerPedido(id) {
  const filas = await supabase(`sanzo_web_orders?id=eq.${encodeURIComponent(id)}&select=payload`)
  if (!filas?.length) throw new ErrorUsuario('No existe ese pedido.')
  return filas[0].payload
}

async function guardarEnvio(id, envio) {
  const pedido = await leerPedido(id)
  const payload = { ...pedido, envioCorreo: envio }
  await supabase(`sanzo_web_orders?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: { payload, updated_at: new Date().toISOString() },
  })
}

async function leerConfig() {
  const filas = await supabase('sanzo_state?id=eq.settings&select=payload')
  return filas?.[0]?.payload?.correo || {}
}

// ---------- Armado de la orden ----------
const soloDigitos = (s) => String(s || '').replace(/\D/g, '')
const texto = (s) => String(s || '').trim()

/** "2026-10-24T15:03:00-03:00" (hora de Argentina), como pide saleDate. */
function fechaArgentina(iso) {
  const d = new Date(new Date(iso || Date.now()).getTime() - 3 * 3600 * 1000)
  return d.toISOString().slice(0, 19) + '-03:00'
}

function validarPaquete(p) {
  const n = (v) => Math.round(Number(v))
  const paquete = { alto: n(p?.alto), ancho: n(p?.ancho), largo: n(p?.largo), peso: n(p?.peso) }
  for (const [k, v] of Object.entries(paquete)) {
    if (!(v > 0)) throw new ErrorUsuario(`Falta el ${k} del paquete.`)
  }
  if (paquete.alto > 999 || paquete.ancho > 999 || paquete.largo > 999) throw new ErrorUsuario('Las medidas van en centímetros (hasta 999).')
  if (paquete.peso > 25000) throw new ErrorUsuario('El peso va en gramos (hasta 25.000).')
  return paquete
}

function armarOrden(pedido, remitente, paquete, agencyId) {
  const c = pedido.cliente || {}
  const sucursal = c.entrega === 'sucursal'
  if (sucursal && !agencyId) throw new ErrorUsuario('Elegí la sucursal donde retira.')
  const provDestino = PROVINCIAS[c.provincia]
  if (!provDestino) throw new ErrorUsuario(`No reconozco la provincia del cliente (${c.provincia || 'vacía'}).`)
  const provRemitente = PROVINCIAS[remitente.provincia]
  const faltan = ['nombre', 'calle', 'altura', 'localidad', 'cp'].filter((k) => !texto(remitente[k]))
  if (faltan.length || !provRemitente) throw new ErrorUsuario('Completá los datos del remitente en Ajustes → Correo Argentino.')

  return {
    sellerId: '',
    trackingNumber: '',
    order: {
      senderData: {
        id: '',
        businessName: texto(remitente.nombre),
        areaCodePhone: '',
        phoneNumber: '',
        areaCodeCellphone: '',
        cellphoneNumber: soloDigitos(remitente.celular),
        email: texto(remitente.email),
        observation: '',
        address: {
          streetName: texto(remitente.calle),
          streetNumber: texto(remitente.altura),
          cityName: texto(remitente.localidad),
          floor: texto(remitente.piso),
          department: texto(remitente.depto),
          state: provRemitente,
          zipCode: texto(remitente.cp).toUpperCase(),
        },
      },
      shippingData: {
        name: texto(c.nombre),
        areaCodePhone: '',
        phoneNumber: '',
        areaCodeCellphone: '',
        cellphoneNumber: soloDigitos(c.celular),
        email: texto(c.email),
        observation: texto(c.referencia).slice(0, 200),
        address: {
          streetName: texto(c.calle),
          streetNumber: texto(c.altura),
          cityName: texto(c.localidad),
          floor: '',
          department: texto(c.pisoDepto),
          state: provDestino,
          zipCode: texto(c.codigoPostal).toUpperCase(),
        },
      },
      parcels: [
        {
          dimensions: { height: String(paquete.alto), width: String(paquete.ancho), depth: String(paquete.largo) },
          productWeight: String(paquete.peso),
          productCategory: 'Accesorios para mascotas',
          declaredValue: String(Math.round(Number(pedido.total) || 0)),
        },
      ],
      deliveryType: sucursal ? 'agency' : 'homeDelivery',
      agencyId: sucursal ? String(agencyId) : '',
      saleDate: fechaArgentina(pedido.createdAt),
      shipmentClientId: String(pedido.numero || ''),
      serviceType: process.env.CORREO_SERVICIO || 'CP',
    },
  }
}

// ---------- Acciones ----------
const acciones = {
  // ¿Hay credenciales y andan?
  async estado() {
    if (!configurado()) return { configurado: false, test: esTest() }
    try {
      await correo('/auth')
      return { configurado: true, test: esTest(), conectado: true }
    } catch (e) {
      return { configurado: true, test: esTest(), conectado: false, error: e.message }
    }
  },

  // Sucursales donde el cliente puede retirar, de una provincia.
  async sucursales({ provincia }) {
    const codigo = PROVINCIAS[provincia]
    if (!codigo) throw new ErrorUsuario('Provincia desconocida.')
    const { data } = await correo(`/agencies?stateId=${codigo}&pickup_availability=true`)
    return {
      sucursales: (Array.isArray(data) ? data : []).map((s) => ({
        id: s.agency_id,
        nombre: s.agency_name,
        localidad: s.location?.city_name || '',
        direccion: [s.location?.street_name, s.location?.street_number].filter(Boolean).join(' '),
        cp: s.location?.zip_code || '',
        horario: s.schedule || '',
      })),
    }
  },

  // Da de alta el envío del pedido y guarda el número de seguimiento en el pedido.
  async crear({ pedidoId, paquete, agencyId }) {
    const pedido = await leerPedido(pedidoId)
    if (pedido.envioCorreo?.tracking && !pedido.envioCorreo.anulado) throw new ErrorUsuario(`Este pedido ya tiene envío: ${pedido.envioCorreo.tracking}.`)
    const config = await leerConfig()
    const p = validarPaquete(paquete)
    const orden = armarOrden(pedido, config.remitente || {}, p, agencyId)
    const { data } = await correo('/orders', { method: 'POST', body: orden })
    const tracking = data?.trackingNumber
    if (!tracking) throw new ErrorUsuario('Correo Argentino no devolvió número de seguimiento.')
    const envio = {
      tracking,
      creadoAt: new Date().toISOString(),
      tipo: orden.order.deliveryType,
      agencyId: orden.order.agencyId || null,
      paquete: p,
      test: esTest(),
    }
    await guardarEnvio(pedidoId, envio)
    return { envio }
  },

  // Etiqueta 10x15 en PDF (base64) para imprimir y pegar en el paquete.
  async etiqueta({ pedidoId }) {
    const pedido = await leerPedido(pedidoId)
    const tracking = pedido.envioCorreo?.tracking
    if (!tracking) throw new ErrorUsuario('Este pedido todavía no tiene envío.')
    const { data } = await correo('/labels?labelFormat=10x15', { method: 'POST', body: [{ sellerId: '', trackingNumber: tracking }] })
    const r = Array.isArray(data) ? data[0] : null
    if (!r?.fileBase64 || String(r.result || '').startsWith('ERROR')) throw new ErrorUsuario(`No se pudo bajar la etiqueta: ${r?.result || 'sin respuesta'}`)
    return { archivo: r.fileBase64, nombre: r.fileName || r.filename || `etiqueta-${tracking}.pdf` }
  },

  // Anula el envío (solo si todavía no se despachó) para poder generarlo de nuevo.
  async anular({ pedidoId }) {
    const pedido = await leerPedido(pedidoId)
    const envio = pedido.envioCorreo
    if (!envio?.tracking || envio.anulado) throw new ErrorUsuario('No hay envío para anular.')
    await correo(`/orders/${encodeURIComponent(envio.tracking)}/cancel`, { method: 'PATCH' })
    await guardarEnvio(pedidoId, { ...envio, anulado: true, anuladoAt: new Date().toISOString() })
    return { ok: true }
  },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' })
  const { accion, ...datos } = req.body || {}
  const fn = acciones[accion]
  if (!fn) return res.status(400).json({ error: 'Acción desconocida' })
  if (accion !== 'estado' && !configurado()) {
    return res.status(400).json({ error: 'Faltan las credenciales del Correo (CORREO_AGREEMENT y CORREO_API_KEY en Vercel).' })
  }
  try {
    res.status(200).json(await fn(datos))
  } catch (e) {
    if (!(e instanceof ErrorUsuario)) console.error('[correo]', accion, e)
    res.status(e instanceof ErrorUsuario ? 400 : 502).json({ error: e.message })
  }
}
