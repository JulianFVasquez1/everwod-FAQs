'use client'

import React from 'react'
import { motion } from 'framer-motion'
import type { MetricsByWorkspace } from '@/lib/detector'

interface Props {
  data: MetricsByWorkspace[]
}

export const WorkspaceBars: React.FC<Props> = ({ data }) => {
  if (!data.length) {
    return (
      <div className="text-sm text-secondary opacity-50 py-8 text-center">
        No hay datos por workspace todavía.
      </div>
    )
  }

  const sorted = [...data].sort((a, b) => b.total_suggestions - a.total_suggestions)
  const maxTotal = Math.max(...sorted.map((w) => w.total_suggestions), 1)

  return (
    <div className="space-y-4">
      {sorted.map((ws, i) => {
        const approvedPct = (ws.approved / maxTotal) * 100
        const pendingPct = (ws.pending / maxTotal) * 100
        const rejectedPct = (ws.rejected / maxTotal) * 100

        return (
          <div key={ws.workspace_id} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-primary">
                {ws.workspace_name ?? `Workspace ${ws.workspace_id}`}
              </span>
              <span className="text-secondary">{ws.total_suggestions} total</span>
            </div>
            <div className="relative h-2.5 bg-white/5 rounded-full overflow-hidden flex">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${approvedPct}%` }}
                transition={{ duration: 0.6, delay: i * 0.05 }}
                style={{ backgroundColor: '#00D9A0' }}
              />
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pendingPct}%` }}
                transition={{ duration: 0.6, delay: i * 0.05 + 0.1 }}
                style={{ backgroundColor: '#FACC15' }}
              />
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${rejectedPct}%` }}
                transition={{ duration: 0.6, delay: i * 0.05 + 0.2 }}
                style={{ backgroundColor: '#FF4D4D' }}
              />
            </div>
            <div className="flex gap-3 text-[10px] text-secondary">
              <span><span className="text-neon-green font-bold">{ws.approved}</span> apr.</span>
              <span><span className="text-gold font-bold">{ws.pending}</span> pend.</span>
              <span><span className="text-red-400 font-bold">{ws.rejected}</span> rech.</span>
              {ws.top_categories.length > 0 && (
                <span className="opacity-60">· {ws.top_categories.slice(0, 3).join(', ')}</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
