'use client'

import React from 'react'
import { motion } from 'framer-motion'
import type { Suggestion } from '@/lib/detector'

interface Props {
  suggestion: Suggestion
  onApprove: () => void
  onReject: () => void
  onDetail: () => void
  isProcessing: boolean
}

export const SuggestionCard: React.FC<Props> = ({
  suggestion,
  onApprove,
  onReject,
  onDetail,
  isProcessing
}) => {
  const confidence = Math.round(suggestion.confidence_score * 100)
  
  // Color según confianza
  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'var(--color-neon-green)'
    if (score >= 0.5) return 'var(--color-gold)'
    return '#FF4D4D'
  }

  const statusColor = getConfidenceColor(suggestion.confidence_score)

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="glass overflow-hidden border-card-border hover:border-gold/30 transition-colors flex flex-col"
      style={{ borderLeft: `4px solid ${statusColor}` }}
    >
      <div className="p-5 flex-1">
        <div className="flex justify-between items-start mb-2 gap-2">
          <h3 className="font-bold text-lg text-primary leading-tight">
            {suggestion.suggested_question}
          </h3>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span
              className="text-xs font-bold px-2 py-1 rounded bg-white/5"
              style={{ color: statusColor }}
              title="Confianza del clustering (cercanía al centroide)"
            >
              conf {confidence}%
            </span>
            {typeof suggestion.quality_score === 'number' && (
              <span
                className="text-xs font-bold px-2 py-1 rounded bg-white/5"
                style={{ color: getConfidenceColor(suggestion.quality_score) }}
                title={
                  suggestion.quality_breakdown?.reasoning ??
                  'Score del LLM-juez (promedio de 4 dimensiones)'
                }
              >
                ★ {Math.round(suggestion.quality_score * 100)}%
              </span>
            )}
          </div>
        </div>

        <p className="text-xs text-secondary mb-4">
          {suggestion.message_count} mensajes similares · {suggestion.synthesis_method}
          {suggestion.quality_breakdown && (
            <> · juez: {suggestion.quality_breakdown.judge_model.split('/').pop()}</>
          )}
          {' · '}
          {new Date(suggestion.created_at).toLocaleDateString()}
        </p>

        <p className="text-sm text-secondary/80 line-clamp-2 italic">
          &quot;{suggestion.suggested_answer}&quot;
        </p>
      </div>

      <div className="px-5 py-4 bg-white/5 border-t border-card-border flex gap-2">
        <button
          onClick={onDetail}
          className="text-xs font-semibold px-3 py-2 rounded-lg hover:bg-white/5 transition-colors border border-white/10"
        >
          Ver detalle
        </button>
        <div className="flex-1" />
        <button
          onClick={onReject}
          disabled={isProcessing}
          className="text-xs font-semibold px-3 py-2 rounded-lg hover:bg-red-500/10 text-red-400 border border-red-500/20 transition-colors disabled:opacity-50"
        >
          ✗ Rechazar
        </button>
        <button
          onClick={onApprove}
          disabled={isProcessing}
          className="text-xs font-semibold px-3 py-2 rounded-lg premium-gradient text-black transition-colors disabled:opacity-50"
        >
          ✓ Aprobar
        </button>
      </div>
    </motion.div>
  )
}
