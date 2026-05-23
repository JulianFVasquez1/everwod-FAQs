import { useState, useEffect, useCallback } from 'react'
import { detectorClient } from '@/lib/detector'
import type {
  Suggestion,
  SuggestionDetail,
  GetSuggestionsParams,
  ApprovePayload,
  RejectPayload,
  DetectorMetrics,
} from '@/lib/detector'
import { getSession } from '@/lib/auth'

// Hook principal para listar sugerencias con filtros y paginación
export function useSuggestions(initialParams: GetSuggestionsParams = {}) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [params, setParams] = useState<GetSuggestionsParams>({
    page: 1,
    limit: 20,
    sort: 'confidence_desc',
    status: 'pending',
    ...initialParams,
  })

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await detectorClient.getSuggestions(params)
      setSuggestions(res.data ?? [])
      setTotal(res.pagination?.total ?? 0)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [params])

  useEffect(() => { fetch() }, [fetch])

  return {
    suggestions,
    loading,
    error,
    total,
    params,
    setParams,
    refetch: fetch,
  }
}

// Hook para el detalle de una sugerencia
export function useSuggestionDetail(id: number | null) {
  const [detail, setDetail] = useState<SuggestionDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(null)
    detectorClient.getSuggestion(id)
      .then(res => setDetail(res.data))
      .catch(e => setError(e instanceof Error ? e.message : 'Error'))
      .finally(() => setLoading(false))
  }, [id])

  return { detail, loading, error }
}

// Hook para aprobar/rechazar con optimistic UI
export function useSuggestionActions(onSuccess?: () => void) {
  const [processing, setProcessing] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const approve = useCallback(async (id: number, payload: ApprovePayload, suggestion: Suggestion) => {
    setProcessing(id)
    setError(null)
    try {
      // 1. Avisar al detector externo
      await detectorClient.approve(id, payload)

      // 2. Guardar en nuestra base de datos local para que aparezca en Evaluación y FAQs
      // Usamos una ruta de API propia para no exponer la service role key en el cliente
      const session = await getSession()
      const res = await fetch('/api/faqs', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          question: payload.edited_question || suggestion.suggested_question,
          answer: payload.edited_answer || suggestion.suggested_answer,
          status: 'approved',
          source: 'ai_detector',
          metadata: { suggestion_id: id, reviewer: payload.reviewer }
        })
      })

      if (!res.ok) throw new Error('Error al sincronizar con la base de datos local')

      onSuccess?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al aprobar')
    } finally {
      setProcessing(null)
    }
  }, [onSuccess])

  const reject = useCallback(async (id: number, payload: RejectPayload) => {
    setProcessing(id)
    setError(null)
    try {
      await detectorClient.reject(id, payload)
      onSuccess?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al rechazar')
    } finally {
      setProcessing(null)
    }
  }, [onSuccess])

  return { approve, reject, processing, error }
}

// Hook para métricas del dashboard
export function useDetectorMetrics() {
  const [metrics, setMetrics] = useState<DetectorMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const res = await detectorClient.getMetrics()
      setMetrics(res.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { metrics, loading, error, refetch: fetch }
}
