'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface Segment {
  label: string
  value: number
  color: string
}

interface Props {
  pending: number
  approved: number
  rejected: number
  edited: number
  size?: number
}

export const StatusDonut: React.FC<Props> = ({
  pending,
  approved,
  rejected,
  edited,
  size = 220,
}) => {
  const segments: Segment[] = [
    { label: 'Pendientes', value: pending, color: '#FACC15' },
    { label: 'Aprobadas', value: approved, color: '#00D9A0' },
    { label: 'Editadas', value: edited, color: '#60A5FA' },
    { label: 'Rechazadas', value: rejected, color: '#FF4D4D' },
  ]
  const total = segments.reduce((acc, s) => acc + s.value, 0)
  const radius = size / 2 - 24
  const cx = size / 2
  const cy = size / 2
  const circumference = 2 * Math.PI * radius

  let cumulativePct = 0
  const arcs = segments.map((seg) => {
    const pct = total > 0 ? seg.value / total : 0
    const dash = pct * circumference
    const gap = circumference - dash
    const offset = -cumulativePct * circumference
    cumulativePct += pct
    return { ...seg, dash, gap, offset, pct }
  })

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="20"
          />
          {arcs.map((arc, i) =>
            arc.value === 0 ? null : (
              <motion.circle
                key={arc.label}
                cx={cx}
                cy={cy}
                r={radius}
                fill="none"
                stroke={arc.color}
                strokeWidth="20"
                strokeLinecap="butt"
                initial={{ strokeDasharray: `0 ${circumference}` }}
                animate={{ strokeDasharray: `${arc.dash} ${arc.gap}` }}
                transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
                style={{ strokeDashoffset: arc.offset }}
              />
            )
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-black text-primary">{total}</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">
            sugerencias
          </span>
        </div>
      </div>

      <div className="space-y-2 min-w-[180px]">
        {arcs.map((arc) => (
          <div key={arc.label} className="flex items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: arc.color }} />
              <span className="text-secondary">{arc.label}</span>
            </div>
            <div className="flex items-center gap-2 font-semibold">
              <span className="text-primary">{arc.value}</span>
              <span className="text-xs text-secondary opacity-60 w-10 text-right">
                {(arc.pct * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
