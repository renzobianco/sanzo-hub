// Proxy serverless para la API de Buffer, para producción en Vercel.
//
// Buffer pide explícitamente no llamar a su API desde el navegador (bloquea
// CORS, y además lo dice en su propia documentación), así que esta función
// reenvía la request tal cual a https://api.buffer.com, agregando nada más
// que el header Authorization que ya mandó el cliente — la clave nunca queda
// hardcodeada acá, vive en el localStorage de cada socio (ver
// src/lib/buffer.js). En desarrollo cumple el mismo rol el proxy de Vite
// (ver vite.config.js).
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ errors: [{ message: 'Método no permitido' }] })
    return
  }

  try {
    const upstream = await fetch('https://api.buffer.com', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(req.headers.authorization ? { authorization: req.headers.authorization } : {}),
      },
      body: JSON.stringify(req.body),
    })

    const text = await upstream.text()
    const retryAfter = upstream.headers.get('retry-after')
    if (retryAfter) res.setHeader('retry-after', retryAfter)
    res.status(upstream.status)
    res.setHeader('content-type', 'application/json')
    res.send(text)
  } catch (e) {
    res.status(502).json({ errors: [{ message: 'No se pudo conectar con Buffer: ' + e.message }] })
  }
}
