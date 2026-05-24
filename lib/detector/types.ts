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

export interface QualityBreakdown {
  claridad: number
  accionabilidad: number
  no_redundancia: number
  naturalidad: number
  reasoning: string
  judge_model: string
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
  /** Score overall del LLM-juez (0-1). null = no evaluada. */
  quality_score?: number | null
  quality_breakdown?: QualityBreakdown | null
}

export interface SuggestionDetail extends Suggestion {
  messages: SuggestionMessage[]
  reviews: SuggestionReview[]
}

// ── Cluster visualization (snapshot persistido por el pipeline) ─────────
export interface ClusterVizPoint {
  x: number
  y: number
  /** -1 = ruido (no asignado a ningún cluster). */
  cluster_id: number
  preview: string
}

export interface ClusterVizTopMessage {
  message_id: string
  text: string
  similarity: number
}

export interface ClusterVizNearestFaq {
  faq_id: string
  similarity: number
}

export interface ClusterVizCluster {
  cluster_id: number
  size: number
  cohesion: number
  confidence_score: number
  /** true = no está cubierto por FAQ existente (candidato a sugerencia). */
  is_new: boolean
  nearest_faq: ClusterVizNearestFaq | null
  top_messages: ClusterVizTopMessage[]
}

export interface ClusterVizSizeDistribution {
  min: number
  median: number
  mean: number
  p90: number
  max: number
}

export interface ClusterVisualization {
  algorithm: string
  n_clusters: number
  messages_total: number
  messages_clustered: number
  messages_noise: number
  noise_ratio: number
  size_distribution: ClusterVizSizeDistribution
  points: ClusterVizPoint[]
  clusters: ClusterVizCluster[]
  /** true = `points` es una muestra estratificada (no incluye todos los mensajes). */
  sampled: boolean
  sample_size: number
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

export interface MetricsQuality {
  evaluated_count: number
  coverage: number
  avg_overall: number
  avg_claridad: number
  avg_accionabilidad: number
  avg_no_redundancia: number
  avg_naturalidad: number
}

export interface DetectorMetrics {
  overview: MetricsOverview
  pipeline: MetricsPipeline
  by_workspace: MetricsByWorkspace[]
  by_category: MetricsByCategory[]
  trends: MetricsTrends
  quality?: MetricsQuality
}

// ── Workspaces ─────────────────────────────────────────────────────────
export interface Workspace {
  workspace_id: number
  workspace_name: string | null
  suggestions_total: number
  suggestions_pending: number
  last_suggestion_at: string | null
  last_pipeline_run?: PipelineRun | null
}

export interface WorkspaceCategoryStat {
  category: string
  count: number
}

export interface WorkspaceStatusStat {
  pending: number
  approved: number
  rejected: number
  edited: number
}

export interface WorkspaceDetail {
  workspace_id: number
  workspace_name: string | null
  suggestions_total: number
  suggestions_by_status: WorkspaceStatusStat
  top_categories: WorkspaceCategoryStat[]
  last_pipeline_run: PipelineRun | null
}

// ── Health ─────────────────────────────────────────────────────────────
export interface HealthStatus {
  status: 'ok'
  db: 'ok' | 'down'
  environment: string
  version: string
  last_successful_run_at: string | null
  scheduler_next_run_at: string | null
  hf_inference_reachable: boolean | null
}

// ── Bulk review ────────────────────────────────────────────────────────
export interface BulkReviewPayload {
  suggestion_ids: number[]
  action: 'approve' | 'reject'
  reviewer: string
  notes?: string
  rejection_reason?: RejectionReason
}

export interface BulkReviewItemResult {
  suggestion_id: number
  success: boolean
  status?: string | null
  error?: string | null
}

export interface BulkReviewResponse {
  processed: number
  successful: number
  failed: number
  results: BulkReviewItemResult[]
}

// ── Parámetros de listado ──────────────────────────────────────────────
export interface GetSuggestionsParams {
  page?: number
  limit?: number
  cursor?: string
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
export interface OffsetPagination {
  page: number
  limit: number
  total: number
  pages: number
}

export interface CursorPagination {
  next_cursor: string | null
  limit: number
}

export type Pagination = OffsetPagination | CursorPagination

export function isCursorPagination(p: Pagination | undefined | null): p is CursorPagination {
  return !!p && 'next_cursor' in p
}

export interface DetectorResponse<T> {
  ok: boolean
  data: T
  message?: string
  error?: {
    code: string
    message: string
    details?: unknown[]
  }
  pagination?: Pagination
}
