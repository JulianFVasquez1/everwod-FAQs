'use client'

import React from 'react'
import { motion } from 'framer-motion'
import type { MetricsByCategory } from '@/lib/detector'

interface Props {
  data: MetricsByCategory[]
  limit?: number
}

export const CategoryBars: React.FC<Props> = ({ data, limit = 8 }) => {
  if (!data.length) {
    return (
      <div className="text-sm text-secondary opacity-50 py-8 text-center">
        Sin datos de categorías todavía. Ejecuta el pipeline para generar sugerencias.
      </div>
    )
  }

  const top = [...data].sort((a, b) => b.count - a.count).slice(0, limit)
  const maxCount = Math.max(...top.map((c) => c.count), 1)

  return (
    <div className="space-y-3">
      {top.map((cat, i) => {
        const widthPct = (cat.count / maxCount) * 100
        const approvalPct = Math.round(cat.approval_rate * 100)
        const barColor =
          approvalPct >= 70 ? '#00D9A0' : approvalPct >= 40 ? '#FACC15' : '#FF4D4D'

        return (
          <div key={cat.category} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-primary capitalize">{cat.category}</span>
              <div className="flex items-center gap-3 text-secondary">
                <span>{approvalPct}% aprobación</span>
                <span className="font-bold text-primary">{cat.count}</span>
              </div>
            </div>
            <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${widthPct}%` }}
                transition={{ duration: 0.6, delay: i * 0.05, ease: 'easeOut' }}
                style={{ backgroundColor: barColor }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
