import type { NextApiRequest, NextApiResponse } from 'next'

const DETECTOR_URL = process.env.DETECTOR_URL
const DETECTOR_API_KEY = process.env.DETECTOR_API_KEY

// Headers del cliente que reenviamos al upstream (lower-case)
const FORWARDED_REQUEST_HEADERS = new Set([
  'idempotency-key',
  'x-workspace-id',
])

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

  const pathSegments = (req.query.path as string[]) ?? []
  const apiPath = pathSegments.join('/')

  const queryParams = { ...req.query }
  delete queryParams.path
  const qs = new URLSearchParams(
    Object.entries(queryParams)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)])
  ).toString()

  // /health y /docs son públicos en el backend (exentos del middleware de auth)
  const isHealth = apiPath === 'health'
  const upstreamPath = isHealth ? '/health' : `/api/v1/${apiPath}`
  const targetUrl = `${DETECTOR_URL}${upstreamPath}${qs ? '?' + qs : ''}`

  // Construir headers: Content-Type siempre, X-API-Key si está configurada,
  // más los headers permitidos que vengan del cliente (Idempotency-Key, X-Workspace-ID)
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (DETECTOR_API_KEY) headers['X-API-Key'] = DETECTOR_API_KEY
  for (const [name, value] of Object.entries(req.headers)) {
    if (!value || typeof value !== 'string') continue
    if (FORWARDED_REQUEST_HEADERS.has(name.toLowerCase())) {
      headers[name] = value
    }
  }

  try {
    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers,
      body:
        req.method !== 'GET' && req.method !== 'HEAD'
          ? JSON.stringify(req.body)
          : undefined,
    })

    const contentType = upstream.headers.get('content-type') ?? ''

    // SSE: streamear text/event-stream tal cual al cliente
    if (contentType.includes('text/event-stream')) {
      res.writeHead(upstream.status, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      })
      if (!upstream.body) {
        res.end()
        return
      }
      const reader = upstream.body.getReader()
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          if (value) res.write(Buffer.from(value))
        }
      } finally {
        res.end()
      }
      return
    }

    if (!contentType.includes('application/json')) {
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
