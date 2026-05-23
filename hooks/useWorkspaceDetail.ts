import { useCallback, useEffect, useState } from 'react'
import { detectorClient } from '@/lib/detector'
import type { WorkspaceDetail } from '@/lib/detector'

export function useWorkspaceDetail(workspaceId: number | null) {
  const [detail, setDetail] = useState<WorkspaceDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDetail = useCallback(async () => {
    if (!workspaceId) {
      setDetail(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await detectorClient.getWorkspaceDetail(workspaceId)
      setDetail(res.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando detalle')
      setDetail(null)
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => { fetchDetail() }, [fetchDetail])

  return { detail, loading, error, refetch: fetchDetail }
}
