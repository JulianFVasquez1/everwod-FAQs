// Tipos derivados del contrato real de la API del everwod-faq-detector
// Ref: api-contracts/openapi.json + backend/models/schemas.py del repo backend
// Backend: https://dulceychon-everwod-faq-detector.hf.space

export type SuggestionStatus = 'pending' | 'approved' | 'rejected' | 'edited'
export type SortOption = 'confidence_desc' | 'message_count_desc' | 'created_at_desc'
export type SynthesisMethod = 'llm' | 'centroid'
export type PipelineStatus = 'running' | 'success' | 'failed'
export type TriggerSource = 'scheduler' | 'manual' | 'api'
export type ReviewAction = 'approved' | 'rejected' | 'edited'
export type RejectionReason =
  | 'irrelevant'
  | 'already_covered'
  | 'too_specific'
  | 'low_quality'
  | 'other'

export interface SuggestionMessage {
  id: number
  chat_message_id: string
  message_text: string
  similarity_score: number | null
}

export interface SuggestionReview {
  id: number
  action: ReviewAction
  reviewer: string
  notes?: string | null
  edited_question?: string | null
  edited_answer?: string | null
  created_at: string
}

export interface SimilarExistingFaq {
  faq_id: string
  question: string
  similarity: number
}

export interface Suggestion {
  id: number
  workspace_id: number
  agent_id?: string | null
  pipeline_run_id?: number | null
  cluster_id: number
  suggested_question: string
  suggested_answer: string
  message_count: number
  confidence_score: number
  category?: string | null
  synthesis_method: SynthesisMethod
  status: SuggestionStatus
  created_at: string
  reviewed_at?: string | null
  reviewed_by?: string | null
  sample_messages?: SuggestionMessage[] | null
  similar_existing_faq?: SimilarExistingFaq | null
}

export interface SuggestionDetail extends Suggestion {
  messages: SuggestionMessage[]
  reviews: SuggestionReview[]
}

export interface PipelineRun {
  id: number
  started_at: string
  finished_at?: string | null
  status: PipelineStatus
  triggered_by: TriggerSource
  workspace_id?: number | null
  messages_processed: number
  messages_clustered: number
  messages_noise: number
  clusters_found: number
  suggestions_generated: number
  suggestions_skipped: number
  silhouette_score?: number | null
  duration_seconds?: number | null
  parameters?: Record<string, unknown> | null
  error?: string | null
}

// ── Métricas (alineado con GlobalMetricsOut del backend) ────────────────
export interface MetricsOverview {
  total_suggestions: number
  pending: number
  approved: number
  rejected: number
  edited: number
  approval_rate: number
  avg_confidence_score: number
}

export interface MetricsPipeline {
  last_run_at: string | null
  last_run_duration_seconds: number | null
  last_run_messages_processed: number
  last_run_clusters_found: number
  total_runs: number
  avg_silhouette_score: number | null
}

export interface MetricsByWorkspace {
  workspace_id: number
  workspace_name: string | null
  total_suggestions: number
  pending: number
  approved: number
  rejected: number
  top_categories: string[]
}

export interface MetricsByCategory {
  category: string
  count: number
  approval_rate: number
}

export interface MetricsTrends {
  suggestions_last_7_days: number
  suggestions_last_30_days: number
  avg_message_count_per_cluster: number
}

export interface DetectorMetrics {
  overview: MetricsOverview
  pipeline: MetricsPipeline
  by_workspace: MetricsByWorkspace[]
  by_category: MetricsByCategory[]
  trends: MetricsTrends
}

// ── Workspaces ─────────────────────────────────────────────────────────
export interface Workspace {
  workspace_id: number
  workspace_name: string | null
  suggestions_total: number
  suggestions_pending: number
  last_suggestion_at: string | null
}

// ── Health ─────────────────────────────────────────────────────────────
export interface HealthStatus {
  status: 'ok'
  db: 'ok' | 'down'
  environment: string
  version: string
}

// ── Parámetros de listado ──────────────────────────────────────────────
export interface GetSuggestionsParams {
  page?: number
  limit?: number
  sort?: SortOption
  status?: SuggestionStatus
  workspace_id?: number
  category?: string
  agent_id?: string
  synthesis_method?: SynthesisMethod
  min_message_count?: number
  date_from?: string
  date_to?: string
}

// ── Cuerpos de request ─────────────────────────────────────────────────
export interface ApprovePayload {
  reviewer: string
  notes?: string
  edited_question?: string
  edited_answer?: string
}

export interface RejectPayload {
  reviewer: string
  notes?: string
  rejection_reason?: RejectionReason
}

export interface RunPipelinePayload {
  workspace_id?: number
  since?: string
  limit?: number
  synthesis?: SynthesisMethod
  dry_run?: boolean
}

export interface RunPipelineResponse {
  run_id: number | null
  status: 'queued' | 'queued_dry_run'
  started_at: string
  poll_url: string | null
}

// ── Respuesta estándar de la API (envelope) ────────────────────────────
export interface DetectorResponse<T> {
  ok: boolean
  data: T
  message?: string
  error?: {
    code: string
    message: string
    details?: unknown[]
  }
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
}
