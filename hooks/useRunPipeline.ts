import { useCallback, useState } from 'react'
import { detectorClient } from '@/lib/detector'
import type { RunPipelineResponse, RunPipelinePayload } from '@/lib/detector'

interface Options {
  // Ventana por defecto (en días) cuando el caller no pasa `sinceDays`.
  defaultSinceDays?: number
  // Notifica al caller con el run_id cuando el pipeline arrancó (null en dry-run).
  onStarted?: (runId: number | null, data: RunPipelineResponse) => void
}

interface StartArgs {
  workspaceId: number | null
  // Ventana de análisis en días. `null` = procesar todo el historial (sin filtro).
  // `undefined` = usar `defaultSinceDays`. Tiene precedencia sobre `since`.
  sinceDays?: number | null
  // ISO datetime crudo. Se ignora si `sinceDays` viene definido.
  since?: string
  dryRun?: boolean
}

function computeSinceIso(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

export function useRunPipeline({ defaultSinceDays = 30, onStarted }: Options = {}) {
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const start = useCallback(
    async ({ workspaceId, sinceDays, since, dryRun }: StartArgs) => {
      if (!workspaceId) {
        const msg = 'Selecciona un workspace antes de ejecutar el análisis.'
        setError(msg)
        return null
      }

      let sinceIso: string | undefined
      if (sinceDays === null) {
        // explícitamente "todo el historial" — no enviar since
        sinceIso = undefined
      } else if (typeof sinceDays === 'number') {
        sinceIso = computeSinceIso(sinceDays)
      } else if (since) {
        sinceIso = since
      } else {
        sinceIso = computeSinceIso(defaultSinceDays)
      }

      const idempotencyKey =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`

      setRunning(true)
      setError(null)
      try {
        const payload: RunPipelinePayload = {
          workspace_id: workspaceId,
          dry_run: dryRun,
        }
        if (sinceIso) payload.since = sinceIso
        const res = await detectorClient.runPipeline(payload, { idempotencyKey })
        onStarted?.(res.data.run_id, res.data)
        return res.data
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al iniciar el pipeline')
        return null
      } finally {
        setRunning(false)
      }
    },
    [defaultSinceDays, onStarted]
  )

  const clearError = useCallback(() => setError(null), [])

  return { start, running, error, clearError }
}
