'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Suggestion, RejectPayload, RejectionReason } from '@/lib/detector'

interface Props {
  suggestion: Suggestion | null
  onConfirm: (payload: RejectPayload) => void
  onClose: () => void
  isProcessing: boolean
  userEmail?: string | null
}

const REASON_LABELS: Record<RejectionReason, string> = {
  low_quality: 'Baja calidad',
  duplicate: 'Duplicada',
  irrelevant: 'Irrelevante',
  other: 'Otro'
}

export const RejectModal: React.FC<Props> = ({
  suggestion,
  onConfirm,
  onClose,
  isProcessing,
  userEmail
}) => {
  const [reason, setReason] = useState<RejectionReason>('low_quality')
  const [notes, setNotes] = useState('')

  if (!suggestion) return null

  const handleConfirm = () => {
    onConfirm({
      reviewer: userEmail || 'agente-everwod',
      rejection_reason: reason,
      notes
    })
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative glass w-full max-w-md overflow-hidden border-card-border"
        >
          <div className="p-6 border-b border-card-border">
            <h2 className="text-xl font-bold text-red-500">Rechazar Sugerencia</h2>
            <p className="text-sm text-secondary">Indica el motivo del rechazo</p>
          </div>

          <div className="p-6 space-y-6">
            <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl">
              <p className="text-xs font-bold text-red-400 uppercase mb-1">Pregunta original:</p>
              <p className="text-sm italic">{suggestion.suggested_question}</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-secondary mb-2">Motivo</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as RejectionReason)}
                className="w-full bg-white/5 border border-card-border rounded-xl p-4 text-sm focus:border-red-500/50 outline-none transition-colors appearance-none"
              >
                {Object.entries(REASON_LABELS).map(([value, label]) => (
                  <option key={value} value={value} className="bg-[#0a0a0a]">{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-secondary mb-2">Notas (opcional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Explica por qué se rechaza..."
                className="w-full bg-white/5 border border-card-border rounded-xl p-4 text-sm focus:border-red-500/50 outline-none transition-colors min-h-[100px]"
              />
            </div>
          </div>

          <div className="p-6 bg-white/5 border-t border-card-border flex gap-4 justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-xl font-semibold text-secondary hover:text-primary transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={isProcessing}
              className="bg-red-500 hover:bg-red-600 text-white px-8 py-2 rounded-xl font-bold disabled:opacity-50 transition-all hover:scale-105"
            >
              {isProcessing ? 'Procesando...' : 'Confirmar rechazo'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
