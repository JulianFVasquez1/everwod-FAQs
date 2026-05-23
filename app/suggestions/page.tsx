'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSuggestions, useSuggestionActions } from '@/hooks/useDetector'
import { detectorClient, type Suggestion, type SuggestionStatus } from '@/lib/detector'
import { SuggestionCard } from '@/components/detector/SuggestionCard'
import { SkeletonCard } from '@/components/detector/SkeletonCard'
import { ApproveModal } from '@/components/detector/ApproveModal'
import { RejectModal } from '@/components/detector/RejectModal'
import { WorkspaceSelect } from '@/components/detector/WorkspaceSelect'
import { getUser } from '@/lib/auth'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const STATUS_TABS: { label: string; value: SuggestionStatus | 'all' }[] = [
  { label: 'Todas', value: 'all' },
  { label: 'Pendientes', value: 'pending' },
  { label: 'Aprobadas', value: 'approved' },
  { label: 'Rechazadas', value: 'rejected' },
]

export default function SuggestionsPage() {
  const router = useRouter()
  const [activeStatus, setActiveStatus] = useState<SuggestionStatus | 'all'>('pending')
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null)
  const [modalType, setModalType] = useState<'approve' | 'reject' | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [workspaceId, setWorkspaceId] = useState<number | null>(null)

  const { suggestions, loading, error, total, params, setParams, refetch } = useSuggestions({
    status: activeStatus === 'all' ? undefined : activeStatus,
    workspace_id: workspaceId ?? undefined,
  })

  const { approve, reject, processing: actionProcessing } = useSuggestionActions(() => {
    setModalType(null)
    setSelectedSuggestion(null)
    refetch()
  })

  useEffect(() => {
    getUser().then(user => setUserEmail(user?.email || null))
  }, [])

  const handleTabChange = (status: SuggestionStatus | 'all') => {
    setActiveStatus(status)
    setParams(p => ({ ...p, status: status === 'all' ? undefined : status, page: 1 }))
  }

  const handleWorkspaceChange = (id: number | null) => {
    setWorkspaceId(id)
    setParams(p => ({ ...p, workspace_id: id ?? undefined, page: 1 }))
  }

  const handleRunAnalysis = async () => {
    if (!workspaceId) {
      alert('Selecciona un workspace antes de ejecutar el análisis.')
      return
    }
    setAnalysisLoading(true)
    try {
      await detectorClient.runPipeline({
        since: '2025-01-01',
        workspace_id: workspaceId,
      })
      alert('Análisis iniciado correctamente. Los resultados aparecerán en unos minutos.')
    } catch (e) {
      alert('Error al iniciar análisis: ' + (e instanceof Error ? e.message : 'Desconocido'))
    } finally {
      setAnalysisLoading(false)
    }
  }

  const openModal = (suggestion: Suggestion, type: 'approve' | 'reject') => {
    setSelectedSuggestion(suggestion)
    setModalType(type)
  }

  return (
    <main className="min-h-screen bg-background px-6 py-10">
      {/* Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-primary mb-2">
            FAQs <span className="text-gold">Sugeridas</span>
          </h1>
          <p className="text-secondary">Revisiones automáticas encontradas por el detector</p>
        </div>
        
        <div className="flex items-center gap-4 flex-wrap">
        <WorkspaceSelect
          value={workspaceId}
          onChange={handleWorkspaceChange}
          label="Workspace"
          allowAll
        />
        <button
          onClick={handleRunAnalysis}
          disabled={analysisLoading || !workspaceId}
          className="premium-gradient px-8 py-3 rounded-2xl font-bold text-black flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-50"
        >
          {analysisLoading ? (
            <div className="w-5 h-5 border-2 border-black/30 border-t-black animate-spin rounded-full" />
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          )}
          Ejecutar análisis
        </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col sm:flex-row items-center gap-4 border-b border-card-border pb-4">
        <div className="flex p-1 bg-white/5 rounded-xl border border-card-border">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleTabChange(tab.value)}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                activeStatus === tab.value
                  ? 'bg-gold text-black shadow-lg shadow-gold/20'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        <div className="flex-1" />
        
        <div className="text-sm text-secondary">
          {total} sugerencias encontradas
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="max-w-7xl mx-auto mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-4 text-red-400">
          <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="font-bold">Error de conexión</p>
            <p className="text-xs opacity-80">{error}</p>
          </div>
        </div>
      )}

      {/* Grid de Cards */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <motion.div
                  key={`skeleton-${i}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <SkeletonCard />
                </motion.div>
              ))
            ) : suggestions.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="col-span-full py-20 glass text-center border-dashed border-2 border-white/5"
              >
                <p className="text-secondary text-lg">No se encontraron sugerencias {activeStatus !== 'all' ? 'pendientes' : ''}</p>
                <button 
                  onClick={handleRunAnalysis}
                  className="mt-4 text-gold font-bold hover:underline"
                >
                  Iniciar un nuevo análisis ahora
                </button>
              </motion.div>
            ) : (
              suggestions.map((sug) => (
                <motion.div
                  key={sug.id}
                  layout
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <SuggestionCard
                    suggestion={sug}
                    onApprove={() => openModal(sug, 'approve')}
                    onReject={() => openModal(sug, 'reject')}
                    onDetail={() => router.push(`/suggestions/${sug.id}`)}
                    isProcessing={actionProcessing === sug.id}
                  />
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Paginación */}
        {total > (params.limit || 20) && (
          <div className="mt-12 flex justify-center gap-2">
            {Array.from({ length: Math.ceil(total / (params.limit || 20)) }).map((_, i) => (
              <button
                key={i}
                onClick={() => setParams(p => ({ ...p, page: i + 1 }))}
                className={`w-10 h-10 rounded-lg font-bold transition-all ${
                  (params.page || 1) === i + 1
                    ? 'bg-gold text-black'
                    : 'bg-white/5 text-secondary hover:bg-white/10'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modales */}
      {modalType === 'approve' && (
        <ApproveModal
          suggestion={selectedSuggestion}
          onConfirm={async (payload) => {
            await approve(selectedSuggestion!.id, payload, selectedSuggestion!)
            setModalType(null)
          }}
          onClose={() => setModalType(null)}
          isProcessing={!!actionProcessing}
          userEmail={userEmail}
        />
      )}

      {modalType === 'reject' && (
        <RejectModal
          suggestion={selectedSuggestion}
          onConfirm={(payload) => reject(selectedSuggestion!.id, payload)}
          onClose={() => setModalType(null)}
          isProcessing={!!actionProcessing}
          userEmail={userEmail}
        />
      )}
    </main>
  )
}
