import { useCallback, useState } from 'react'
import { detectorClient } from '@/lib/detector'
import type { RunPipelineResponse } from '@/lib/detector'

interface Options {
  // Por defecto, ventana de análisis = últimos 30 días si el caller no especifica `since`.
  defaultSinceDays?: number
  // Notifica al caller con el run_id cuando el pipeline arrancó (null en dry-run).
  onStarted?: (runId: number | null, data: RunPipelineResponse) => void
}

interface StartArgs {
  workspaceId: number | null
  since?: string // ISO date; si no viene, se calcula desde defaultSinceDays
  dryRun?: boolean
}

export function useRunPipeline({ defaultSinceDays = 30, onStarted }: Options = {}) {
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const start = useCallback(
    async ({ workspaceId, since, dryRun }: StartArgs) => {
      if (!workspaceId) {
        const msg = 'Selecciona un workspace antes de ejecutar el análisis.'
        setError(msg)
        return null
      }

      const sinceIso =
        since ??
        (() => {
          const d = new Date()
          d.setDate(d.getDate() - defaultSinceDays)
          return d.toISOString().slice(0, 10)
        })()

      const idempotencyKey =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`

      setRunning(true)
      setError(null)
      try {
        const res = await detectorClient.runPipeline(
          { since: sinceIso, workspace_id: workspaceId, dry_run: dryRun },
          { idempotencyKey }
        )
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
