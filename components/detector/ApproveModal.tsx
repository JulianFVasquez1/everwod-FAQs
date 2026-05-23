'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Suggestion, ApprovePayload } from '@/lib/detector'

interface Props {
  suggestion: Suggestion | null
  onConfirm: (payload: ApprovePayload) => void
  onClose: () => void
  isProcessing: boolean
  userEmail?: string | null
}

export const ApproveModal: React.FC<Props> = ({
  suggestion,
  onConfirm,
  onClose,
  isProcessing,
  userEmail
}) => {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (suggestion) {
      setQuestion(suggestion.suggested_question)
      setAnswer(suggestion.suggested_answer)
      setNotes('')
    }
  }, [suggestion])

  if (!suggestion) return null

  const handleConfirm = () => {
    onConfirm({
      reviewer: userEmail || 'agente-everwod',
      notes,
      edited_question: question !== suggestion.suggested_question ? question : undefined,
      edited_answer: answer !== suggestion.suggested_answer ? answer : undefined
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
          className="relative glass w-full max-w-2xl overflow-hidden border-card-border"
        >
          <div className="p-6 border-b border-card-border">
            <h2 className="text-xl font-bold text-gold">Aprobar FAQ</h2>
            <p className="text-sm text-secondary">Edita la sugerencia antes de publicarla</p>
          </div>

          <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-secondary mb-2">Pregunta</label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full bg-white/5 border border-card-border rounded-xl p-4 text-sm focus:border-gold/50 outline-none transition-colors min-h-[80px]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-secondary mb-2">Respuesta Sugerida</label>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="w-full bg-white/5 border border-card-border rounded-xl p-4 text-sm focus:border-gold/50 outline-none transition-colors min-h-[150px]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-secondary mb-2">Notas (opcional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: Corregí el tono o añadí un enlace"
                className="w-full bg-white/5 border border-card-border rounded-xl p-4 text-sm focus:border-gold/50 outline-none transition-colors"
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
              className="premium-gradient px-8 py-2 rounded-xl font-bold text-black disabled:opacity-50 transition-all hover:scale-105"
            >
              {isProcessing ? 'Procesando...' : 'Confirmar aprobación'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
