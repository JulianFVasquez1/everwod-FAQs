import { useEffect, useState } from 'react'
import { detectorClient } from '@/lib/detector'
import type { HealthStatus } from '@/lib/detector'

interface UseDetectorHealthOptions {
  intervalMs?: number
}

export function useDetectorHealth({ intervalMs = 60_000 }: UseDetectorHealthOptions = {}) {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [online, setOnline] = useState<boolean | null>(null)
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null)

  useEffect(() => {
    let cancelled = false

    const check = async () => {
      try {
        const data = await detectorClient.health()
        if (cancelled) return
        setHealth(data)
        setOnline(data.db === 'ok')
      } catch {
        if (cancelled) return
        setHealth(null)
        setOnline(false)
      } finally {
        if (!cancelled) setLastCheckedAt(new Date())
      }
    }

    check()
    const timer = setInterval(check, intervalMs)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [intervalMs])

  return { health, online, lastCheckedAt }
}
