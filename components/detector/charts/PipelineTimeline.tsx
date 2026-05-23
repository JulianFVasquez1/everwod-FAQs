'use client'

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import type { PipelineRun } from '@/lib/detector'

interface Props {
  runs: PipelineRun[]
  days?: number
}

interface Bucket {
  dateKey: string
  date: Date
  success: number
  failed: number
  running: number
  suggestions: number
}

export const PipelineTimeline: React.FC<Props> = ({ runs, days = 14 }) => {
  const buckets = useMemo<Bucket[]>(() => {
    const result: Bucket[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      result.push({
        dateKey: d.toISOString().slice(0, 10),
        date: d,
        success: 0,
        failed: 0,
        running: 0,
        suggestions: 0,
      })
    }

    runs.forEach((run) => {
      const key = new Date(run.started_at).toISOString().slice(0, 10)
      const bucket = result.find((b) => b.dateKey === key)
      if (!bucket) return
      if (run.status === 'success') bucket.success += 1
      else if (run.status === 'failed') bucket.failed += 1
      else bucket.running += 1
      bucket.suggestions += run.suggestions_generated || 0
    })

    return result
  }, [runs, days])

  const maxSuggestions = Math.max(...buckets.map((b) => b.suggestions), 1)
  const totalSuggestions = buckets.reduce((acc, b) => acc + b.suggestions, 0)
  const totalRuns = buckets.reduce(
    (acc, b) => acc + b.success + b.failed + b.running,
    0
  )

  return (
    <div className="glass p-6 border-card-border">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
        <div>
          <h3 className="text-sm font-bold text-secondary uppercase tracking-widest">
            Actividad del pipeline · últimos {days} días
          </h3>
          <p className="text-xs text-secondary opacity-60 mt-1">
            Altura = sugerencias generadas · color = estado de la corrida
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="text-right">
            <p className="text-secondary uppercase tracking-widest text-[10px]">Corridas</p>
            <p className="text-xl font-black text-primary">{totalRuns}</p>
          </div>
          <div className="text-right">
            <p className="text-secondary uppercase tracking-widest text-[10px]">Sugerencias</p>
            <p className="text-xl font-black text-gold">{totalSuggestions}</p>
          </div>
        </div>
      </div>

      <div className="flex items-end justify-between gap-1.5 h-40">
        {buckets.map((bucket, i) => {
          const heightPct =
            bucket.suggestions > 0
              ? Math.max(8, (bucket.suggestions / maxSuggestions) * 100)
              : 3
          const color =
            bucket.failed > 0
              ? '#FF4D4D'
              : bucket.running > 0
                ? '#FACC15'
                : bucket.success > 0
                  ? '#00D9A0'
                  : 'rgba(255,255,255,0.08)'

          return (
            <div
              key={bucket.dateKey}
              className="flex-1 flex flex-col items-center group relative"
            >
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-primary text-[10px] px-2 py-1 rounded whitespace-nowrap z-10">
                {bucket.dateKey} · {bucket.suggestions} sugs · {bucket.success + bucket.failed + bucket.running} runs
              </div>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${heightPct}%` }}
                transition={{ duration: 0.5, delay: i * 0.03 }}
                className="w-full rounded-t-md transition-colors"
                style={{ backgroundColor: color, minHeight: 4 }}
              />
              <span className="text-[9px] text-secondary mt-1.5">
                {bucket.date.getDate()}
              </span>
            </div>
          )
        })}
      </div>

      <div className="flex gap-4 text-[10px] text-secondary mt-4 pt-3 border-t border-white/5 flex-wrap">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-neon-green" /> Éxito
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-gold" /> Corriendo
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-red-500" /> Falló
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-white/10" /> Sin actividad
        </span>
      </div>
    </div>
  )
}
