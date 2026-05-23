import type { NextApiRequest, NextApiResponse } from 'next'

const DETECTOR_URL = process.env.DETECTOR_URL

export const config = {
  api: {
    bodyParser: true,
  },
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!DETECTOR_URL) {
    return res.status(500).json({
      ok: false,
      error: { code: 'CONFIG_ERROR', message: 'DETECTOR_URL no configurada' },
    })
  }

  // Construir path desde el parámetro catch-all
  const pathSegments = (req.query.path as string[]) ?? []
  const apiPath = pathSegments.join('/')

  // Construir query string (sin el parámetro 'path' de Next.js)
  const queryParams = { ...req.query }
  delete queryParams.path
  const qs = new URLSearchParams(
    Object.entries(queryParams)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)])
  ).toString()

  // Para /health no añadimos prefijo /api/v1
  const isHealth = apiPath === 'health'
  const upstreamPath = isHealth ? '/health' : `/api/v1/${apiPath}`
  const targetUrl = `${DETECTOR_URL}${upstreamPath}${qs ? '?' + qs : ''}`

  try {
    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        // Cuando Juan active auth, agregar aquí:
        // 'X-API-Key': process.env.DETECTOR_API_KEY ?? '',
      },
      body:
        req.method !== 'GET' && req.method !== 'HEAD'
          ? JSON.stringify(req.body)
          : undefined,
    })

    const contentType = upstream.headers.get('content-type')
    const isJson = contentType && contentType.includes('application/json')

    if (!isJson) {
      const text = await upstream.text()
      console.error(
        '[detector-proxy] Upstream returned non-JSON response:',
        text.slice(0, 500)
      )
      return res.status(502).json({
        ok: false,
        error: {
          code: 'UPSTREAM_NOT_JSON',
          message: 'El servidor remoto no devolvió JSON.',
        },
      })
    }

    const data = await upstream.json()
    console.log('[detector-proxy] Response data:', JSON.stringify(data, null, 2))
    return res.status(upstream.status).json(data)
  } catch (err) {
    console.error('[detector-proxy] Runtime Error:', err)
    return res.status(502).json({
      ok: false,
      error: {
        code: 'UPSTREAM_ERROR',
        message: 'El detector no está disponible o respondió con un error.',
      },
    })
  }
}
