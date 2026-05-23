'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useSuggestionDetail, useSuggestionActions } from '@/hooks/useDetector'
import { ApproveModal } from '@/components/detector/ApproveModal'
import { RejectModal } from '@/components/detector/RejectModal'
import { getUser } from '@/lib/auth'

export default function SuggestionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id
  const suggestionId = typeof id === 'string' ? parseInt(id) : 0

  const { detail, loading, error } = useSuggestionDetail(suggestionId)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [modalType, setModalType] = useState<'approve' | 'reject' | null>(null)

  const { approve, reject, processing: actionProcessing } = useSuggestionActions(() => {
    setModalType(null)
    router.refresh()
  })

  useEffect(() => {
    getUser().then(user => setUserEmail(user?.email || null))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-gold/30 border-t-gold animate-spin rounded-full" />
      </div>
    )
  }

  if (error || !detail) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold mb-2">Sugerencia no encontrada</h1>
        <p className="text-secondary mb-8">{error || 'El ID solicitado no existe o no se pudo cargar.'}</p>
        <button 
          onClick={() => router.push('/suggestions')}
          className="text-gold font-bold hover:underline"
        >
          Volver a la lista
        </button>
      </div>
    )
  }

  const confidence = Math.round(detail.confidence_score * 100)
  const isPending = detail.status === 'pending'

  return (
    <main className="min-h-screen bg-background text-primary px-6 py-10 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.push('/suggestions')}
          className="flex items-center gap-2 text-secondary hover:text-gold transition-colors mb-8 font-semibold"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver a sugerencias
        </button>

        <div className="glass p-8 border-card-border mb-8">
          <div className="flex justify-between items-start mb-6">
            <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${
              detail.status === 'approved' ? 'bg-green-500/20 text-green-400' :
              detail.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
              'bg-gold/20 text-gold'
            }`}>
              {detail.status}
            </div>
            
            <div className="text-right">
              <span className="text-xs text-secondary block mb-1">Confianza del Cluster</span>
              <span className="text-2xl font-black text-primary">{confidence}%</span>
            </div>
          </div>

          <div className="space-y-8">
            <section>
              <h2 className="text-xs font-bold text-secondary uppercase tracking-widest mb-4">Pregunta sugerida</h2>
              <p className="text-2xl font-bold text-primary leading-tight">{detail.suggested_question}</p>
            </section>

            <div className="h-px bg-white/5" />

            <section>
              <h2 className="text-xs font-bold text-secondary uppercase tracking-widest mb-4">Respuesta sugerida</h2>
              <div className="glass p-6 border-card-border italic text-primary/80 leading-relaxed">
                &quot;{detail.suggested_answer}&quot;
              </div>
            </section>
          </div>
        </div>

        {/* Mensajes del Cluster */}
        <section className="mb-12">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-3">
            Mensajes del cluster
            <span className="bg-white/10 px-3 py-1 rounded-full text-xs text-secondary">{detail.messages.length} similares</span>
          </h3>
          
          <div className="space-y-3">
            {detail.messages.map((msg) => (
              <div key={msg.id} className="glass p-4 border-white/5 flex items-center justify-between gap-4">
                <p className="text-sm text-secondary">&quot;{msg.message_text}&quot;</p>
                <div className="shrink-0 flex items-center gap-2">
                  <span className="text-[10px] text-secondary">similitud</span>
                  <span className="text-xs font-bold text-gold">{Math.round(msg.similarity_score * 100)}%</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Acciones si está pendiente */}
        {isPending && (
          <div className="sticky bottom-10 glass p-6 border-gold/20 shadow-2xl shadow-gold/10 flex gap-4">
            <button
              onClick={() => setModalType('reject')}
              disabled={!!actionProcessing}
              className="flex-1 py-4 rounded-2xl bg-red-500/10 text-red-400 font-bold border border-red-500/20 hover:bg-red-500/20 transition-all disabled:opacity-50"
            >
              ✗ Rechazar sugerencia
            </button>
            <button
              onClick={() => setModalType('approve')}
              disabled={!!actionProcessing}
              className="flex-[2] py-4 rounded-2xl premium-gradient text-black font-bold hover:scale-105 transition-all disabled:opacity-50"
            >
              ✓ Aprobar esta FAQ
            </button>
          </div>
        )}

        {/* Historial de Revisiones */}
        {detail.reviews.length > 0 && (
          <section className="mt-12 pt-12 border-t border-white/5">
            <h3 className="text-lg font-bold mb-6">Historial de revisiones</h3>
            <div className="space-y-4">
              {detail.reviews.map((rev) => (
                <div key={rev.id} className="flex gap-4">
                  <div className="w-px bg-white/10 relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-gold" />
                  </div>
                  <div className="pb-6">
                    <p   className="text-sm font-bold text-primary">
                      {rev.action === 'approved' ? 'Aprobada' : rev.action === 'rejected' ? 'Rechazada' : 'Editada'} por {rev.reviewer}
                    </p>
                    {rev.notes && <p className="text-sm text-secondary mt-1 italic">&quot;{rev.notes}&quot;</p>}
                    <p className="text-xs text-secondary/50 mt-2">{new Date(rev.created_at).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Modales */}
      {modalType === 'approve' && (
        <ApproveModal
          suggestion={detail}
          onConfirm={async (payload) => {
            await approve(detail.id, payload, detail)
            setModalType(null)
          }}
          onClose={() => setModalType(null)}
          isProcessing={!!actionProcessing}
          userEmail={userEmail}
        />
      )}

      {modalType === 'reject' && (
        <RejectModal
          suggestion={detail}
          onConfirm={(payload) => reject(detail.id, payload)}
          onClose={() => setModalType(null)}
          isProcessing={!!actionProcessing}
          userEmail={userEmail}
        />
      )}
    </main>
  )
}
