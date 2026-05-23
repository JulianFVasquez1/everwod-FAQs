import { useCallback, useEffect, useState } from 'react'
import { detectorClient } from '@/lib/detector'
import type { Workspace } from '@/lib/detector'

export function useWorkspaces() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchWorkspaces = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await detectorClient.getWorkspaces()
      setWorkspaces(res.data ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando workspaces')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchWorkspaces() }, [fetchWorkspaces])

  return { workspaces, loading, error, refetch: fetchWorkspaces }
}
