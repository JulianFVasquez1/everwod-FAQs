// Cliente HTTP para la API del everwod-faq-detector
// Todas las llamadas van al proxy Next.js (/api/detector/...) para evitar CORS

import type {
  GetSuggestionsParams,
  Suggestion,
  SuggestionDetail,
  ApprovePayload,
  RejectPayload,
  RunPipelinePayload,
  RunPipelineResponse,
  PipelineRun,
  DetectorMetrics,
  Workspace,
  WorkspaceDetail,
  HealthStatus,
  BulkReviewPayload,
  BulkReviewResponse,
  DetectorResponse,
} from './types'

// En el cliente (browser) llamamos al proxy Next.js
// En el servidor (SSR/API routes) podemos llamar directo, pero por uniformidad usamos siempre el proxy
const BASE = '/api/detector'

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<DetectorResponse<T>> {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      ...(options?.headers ?? {}),
    },
    ...options,
  })

  let json: DetectorResponse<T>
  try {
    json = await res.json()
  } catch {
    throw new Error(`Error inesperado: ${res.statusText}`)
  }

  if (!res.ok) {
    throw new Error(
      json?.error?.message ?? json?.message ?? `Error ${res.status} en ${path}`
    )
  }

  return json
}

export const detectorClient = {
  // ── HEALTH ──────────────────────────────────────────────────────────
  async health(): Promise<HealthStatus> {
    const res = await fetch(`${BASE}/health`)
    const json: DetectorResponse<HealthStatus> = await res.json()
    if (!res.ok || !json.ok) {
      throw new Error(json?.error?.message ?? `Health check failed (${res.status})`)
    }
    return json.data
  },

  // ── SUGGESTIONS ─────────────────────────────────────────────────────
  async getSuggestions(params: GetSuggestionsParams = {}) {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) qs.set(k, String(v))
    })
    return request<Suggestion[]>(`/suggestions?${qs}`)
  },

  async getSuggestion(id: number) {
    return request<SuggestionDetail>(`/suggestions/${id}`)
  },

  async approve(id: number, payload: ApprovePayload) {
    return request<Suggestion>(`/suggestions/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  async reject(id: number, payload: RejectPayload) {
    return request<Suggestion>(`/suggestions/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  async bulkReview(payload: BulkReviewPayload) {
    return request<BulkReviewResponse>(`/suggestions/bulk`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  // ── PIPELINE ────────────────────────────────────────────────────────
  async runPipeline(payload: RunPipelinePayload = {}, opts: { idempotencyKey?: string } = {}) {
    const headers: Record<string, string> = {}
    if (opts.idempotencyKey) headers['Idempotency-Key'] = opts.idempotencyKey
    return request<RunPipelineResponse>(`/pipeline/run`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    })
  },

  async getPipelineRuns(page = 1, limit = 20) {
    return request<PipelineRun[]>(`/pipeline/runs?page=${page}&limit=${limit}`)
  },

  async getPipelineRun(id: number) {
    return request<PipelineRun>(`/pipeline/runs/${id}`)
  },

  // Server-Sent Events stream — el caller debe escuchar 'message' y cerrar.
  streamPipelineRun(id: number): EventSource {
    return new EventSource(`${BASE}/pipeline/runs/${id}/stream`)
  },

  // ── METRICS ─────────────────────────────────────────────────────────
  async getMetrics() {
    return request<DetectorMetrics>('/metrics')
  },

  // ── WORKSPACES ──────────────────────────────────────────────────────
  async getWorkspaces() {
    return request<Workspace[]>('/workspaces')
  },

  async getWorkspaceDetail(workspaceId: number) {
    return request<WorkspaceDetail>(`/workspaces/${workspaceId}`)
  },
}
