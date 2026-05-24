'use client'

import React from 'react'
import { motion } from 'framer-motion'
import type { QualityBreakdown } from '@/lib/detector'

interface Props {
  overall: number
  breakdown: QualityBreakdown
}

const DIMENSIONS: { key: keyof QualityBreakdown; label: string; help: string }[] = [
  { key: 'claridad', label: 'Claridad', help: '¿La pregunta es clara sin contexto extra?' },
  { key: 'accionabilidad', label: 'Accionabilidad', help: '¿El negocio puede responderla con info concreta?' },
  { key: 'no_redundancia', label: 'No redundancia', help: '¿No es una duplicada de FAQs existentes?' },
  { key: 'naturalidad', label: 'Naturalidad', help: '¿Suena como algo que un cliente real preguntaría?' },
]

function colorForScore(score: number): string {
  if (score >= 0.8) return 'var(--color-neon-green)'
  if (score >= 0.5) return 'var(--color-gold)'
  return '#FF4D4D'
}

export const QualityBreakdownPanel: React.FC<Props> = ({ overall, breakdown }) => {
  const overallPct = Math.round(overall * 100)
  const overallColor = colorForScore(overall)

  return (
    <div className="glass p-6 border-card-border">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-xs font-bold text-secondary uppercase tracking-widest mb-1">
            Evaluación automática (LLM-juez)
          </h3>
          <p className="text-[10px] text-secondary opacity-60">
            modelo: <span className="font-mono">{breakdown.judge_model}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-secondary uppercase tracking-widest mb-0.5">
            Score overall
          </p>
          <p className="text-3xl font-black" style={{ color: overallColor }}>
            {overallPct}%
          </p>
        </div>
      </div>

      <div className="space-y-3 mb-5">
        {DIMENSIONS.map((dim, i) => {
          const value = Number(breakdown[dim.key] ?? 0)
          const pct = Math.round(value * 100)
          const color = colorForScore(value)
          return (
            <div key={dim.key} className="text-xs">
              <div className="flex items-center justify-between mb-1">
                <span
                  className="text-secondary font-semibold"
                  title={dim.help}
                >
                  {dim.label}
                </span>
                <span className="font-bold" style={{ color }}>
                  {pct}%
                </span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: color, opacity: 0.85 }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, delay: i * 0.08 }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {breakdown.reasoning && (
        <div className="pt-4 border-t border-white/5">
          <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5">
            Razonamiento del juez
          </p>
          <p className="text-sm text-primary/90 italic leading-snug">
            &ldquo;{breakdown.reasoning}&rdquo;
          </p>
        </div>
      )}
    </div>
  )
}

export default QualityBreakdownPanel
