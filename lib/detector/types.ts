// Tipos derivados del contrato real de la API de Juan Dulcey
// Ref: api-contracts/postman_collection.json del repo everwod-faq-detector

export type SuggestionStatus = 'pending' | 'approved' | 'rejected'
export type SortOption = 'confidence_desc' | 'message_count_desc' | 'created_at_desc'
export type SynthesisMethod = 'llm' | 'extractive'
export type RejectionReason = 'low_quality' | 'duplicate' | 'irrelevant' | 'other'

export interface Suggestion {
  id: number
  workspace_id: number
  agent_id?: string
  cluster_id?: number
  suggested_question: string
  suggested_answer: string
  message_count: number
  confidence_score: number
  status: SuggestionStatus
  synthesis_method: SynthesisMethod
  category?: string
  created_at: string
  reviewed_at?: string
  reviewed_by?: string
}

export interface SuggestionMessage {
  id: number
  suggestion_id: number
  chat_message_id: string
  message_text: string
  similarity_score: number
}

export interface SuggestionDetail extends Suggestion {
  messages: SuggestionMessage[]
  reviews: SuggestionReview[]
}

export interface SuggestionReview {
  id: number
  suggestion_id: number
  action: 'approved' | 'rejected' | 'edited'
  reviewer: string
  notes?: string
  created_at: string
}

export interface PipelineRun {
  id: number
  started_at: string
  finished_at?: string
  messages_processed: number
  clusters_found: number
  suggestions_generated: number
  status: 'running' | 'completed' | 'failed' | 'SUCCESS'
  parameters?: Record<string, unknown>
}

export interface DetectorMetrics {
  overview: {
    total_suggestions: number
    pending: number
    approved: number
    rejected: number
    approval_rate: number
    avg_confidence_score: number
  }
  pipeline: {
    last_run_at: string
    last_run_messages_processed: number
    last_run_clusters_found: number
    total_runs: number
  }
  suggestions_by_workspace?: Array<{ 
    workspace_id: number; 
    workspace_name: string;
    total_suggestions: number 
  }>
}

export interface Workspace {
  id: number
  name: string
  suggestion_count: number
  pending_count: number
}

// Parámetros de listado
export interface GetSuggestionsParams {
  page?: number
  limit?: number
  sort?: SortOption
  status?: SuggestionStatus
  workspace_id?: number
  category?: string
  synthesis_method?: SynthesisMethod
  min_message_count?: number
  date_from?: string
  date_to?: string
}

// Cuerpos de request
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
}

// Respuesta estándar de la API
export interface DetectorResponse<T> {
  ok: boolean
  data: T
  message?: string
  error?: {
    code: string
    message: string
  }
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
}
