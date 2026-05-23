'use client'

import { useCallback, useEffect, useState } from 'react'
import { detectorClient, type ClusterVisualization } from '@/lib/detector'

interface State {
  data: ClusterVisualization | null
  loading: boolean
  /** Cuando el run no tiene snapshot (404), `notFound = true` y `error = null`. */
  notFound: boolean
  error: string | null
}

/** Fetch del snapshot de visualización de un pipeline_run.
 *
 * - `runId = null` → estado inicial vacío, sin disparar fetch.
 * - 404 → `notFound = true`, sin tratarlo como error fatal.
 * - Otros errores → `error` con mensaje legible.
 */
export function useClusterVisualization(runId: number | null) {
  const [state, setState] = useState<State>({
    data: null,
    loading: false,
    notFound: false,
    error: null,
  })

  const fetchViz = useCallback(async (id: number) => {
    setState({ data: null, loading: true, notFound: false, error: null })
    try {
      const res = await detectorClient.getPipelineRunVisualization(id)
      setState({ data: res.data, loading: false, notFound: false, error: null })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error desconocido'
      // Heurística: el backend devuelve 404 con mensaje sobre "snapshot"
      const isNotFound =
        /not found|no encontrado|snapshot|404/i.test(msg)
      setState({
        data: null,
        loading: false,
        notFound: isNotFound,
        error: isNotFound ? null : msg,
      })
    }
  }, [])

  useEffect(() => {
    if (runId === null) {
      setState({ data: null, loading: false, notFound: false, error: null })
      return
    }
    fetchViz(runId)
  }, [runId, fetchViz])

  return { ...state, refetch: () => (runId !== null ? fetchViz(runId) : undefined) }
}
