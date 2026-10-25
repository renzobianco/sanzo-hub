// Correo Argentino desde el Hub: todo pasa por la función serverless api/correo.js, que es la
// que tiene las credenciales (variables de entorno en Vercel). En `npm run dev` no existe esa
// función: hace falta `vercel dev` para probarlo en local.

export async function llamarCorreo(accion, datos = {}) {
  let res
  try {
    res = await fetch('/api/correo', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ accion, ...datos }),
    })
  } catch {
    throw new Error('No se pudo conectar con el servidor del Hub.')
  }
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.error || `Error ${res.status} del servidor del Hub.`)
  return data
}

/** Baja la etiqueta (PDF en base64) como archivo. */
export function bajarPdf(base64, nombre) {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
  const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }))
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// Mismos nombres que usa el checkout de la web (sanzo-web/data/envios.ts).
export const PROVINCIAS = [
  'Ciudad Autónoma de Buenos Aires',
  'Buenos Aires',
  'Catamarca',
  'Chaco',
  'Chubut',
  'Córdoba',
  'Corrientes',
  'Entre Ríos',
  'Formosa',
  'Jujuy',
  'La Pampa',
  'La Rioja',
  'Mendoza',
  'Misiones',
  'Neuquén',
  'Río Negro',
  'Salta',
  'San Juan',
  'San Luis',
  'Santa Cruz',
  'Santa Fe',
  'Santiago del Estero',
  'Tierra del Fuego',
  'Tucumán',
]
