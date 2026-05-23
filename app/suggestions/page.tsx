'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSuggestions, useSuggestionActions, useBulkSuggestionActions } from '@/hooks/useDetector'
import { detectorClient, type Suggestion, type SuggestionStatus } from '@/lib/detector'
import { SuggestionCard } from '@/components/detector/SuggestionCard'
import { SkeletonCard } from '@/components/detector/SkeletonCard'
import { ApproveModal } from '@/components/detector/ApproveModal'
import { RejectModal } from '@/components/detector/RejectModal'
import { WorkspaceSelect } from '@/components/detector/WorkspaceSelect'
import { getUser, getSession } from '@/lib/auth'
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
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  const { suggestions, loading, error, total, params, setParams, refetch } = useSuggestions({
    status: activeStatus === 'all' ? undefined : activeStatus,
    workspace_id: workspaceId ?? undefined,
  })

  const { approve, reject, processing: actionProcessing } = useSuggestionActions(() => {
    setModalType(null)
    setSelectedSuggestion(null)
    refetch()
  })

  const { run: bulkRun, processing: bulkProcessing } = useBulkSuggestionActions((res) => {
    alert(`Lote procesado: ${res.successful} OK, ${res.failed} fallidas.`)
    setSelectedIds(new Set())
    setSelectMode(false)
    refetch()
  })

  const visibleIds = useMemo(() => suggestions.map((s) => s.id), [suggestions])
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id))

  const toggleId = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const toggleAllVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allVisibleSelected) visibleIds.forEach((id) => next.delete(id))
      else visibleIds.forEach((id) => next.add(id))
      return next
    })
  }
  const exitSelectMode = () => {
    setSelectMode(false)
    setSelectedIds(new Set())
  }

  const runBulk = async (action: 'approve' | 'reject') => {
    if (selectedIds.size === 0) return
    const verb = action === 'approve' ? 'aprobar' : 'rechazar'
    if (!confirm(`¿${verb[0].toUpperCase() + verb.slice(1)} ${selectedIds.size} sugerencias?`)) return
    try {
      const ids = Array.from(selectedIds)
      const result = await bulkRun({
        suggestion_ids: ids,
        action,
        reviewer: userEmail || 'agente-everwod',
        ...(action === 'reject' ? { rejection_reason: 'low_quality' as const } : {}),
      })

      // Si fue approve, sincronizar las exitosas con la tabla `faqs` local de Supabase
      // (mismo paso B que hace el approve individual en useSuggestionActions)
      if (action === 'approve' && result) {
        const successIds = new Set(
          result.results.filter((r) => r.success).map((r) => r.suggestion_id)
        )
        const session = await getSession()
        const approvedSuggs = suggestions.filter((s) => successIds.has(s.id))

        await Promise.allSettled(
          approvedSuggs.map((sug) =>
            fetch('/api/faqs', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session?.access_token ?? ''}`,
              },
              body: JSON.stringify({
                question: sug.suggested_question,
                answer: sug.suggested_answer,
                status: 'approved',
                source: 'ai_detector',
                metadata: {
                  suggestion_id: sug.id,
                  reviewer: userEmail || 'agente-everwod',
                  bulk: true,
                },
              }),
            })
          )
        )
      }
    } catch {
      // bulkRun ya setea error; el alert lo maneja el onSuccess del hook
    }
  }

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
      const idempotencyKey = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`
      await detectorClient.runPipeline(
        { since: '2025-01-01', workspace_id: workspaceId },
        { idempotencyKey }
      )
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

        <button
          onClick={() => (selectMode ? exitSelectMode() : setSelectMode(true))}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest border transition-colors ${
            selectMode
              ? 'bg-gold/20 text-gold border-gold/40'
              : 'bg-white/5 text-secondary border-card-border hover:text-primary'
          }`}
        >
          {selectMode ? 'Cancelar selección' : 'Modo selección'}
        </button>

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
                  className="relative"
                >
                  {selectMode && (
                    <button
                      onClick={() => toggleId(sug.id)}
                      className={`absolute top-3 right-3 z-10 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
                        selectedIds.has(sug.id)
                          ? 'bg-gold border-gold text-black'
                          : 'bg-black/60 border-white/30 text-transparent hover:border-gold'
                      }`}
                      aria-label={selectedIds.has(sug.id) ? 'Deseleccionar' : 'Seleccionar'}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  )}
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

      {/* Barra de acciones en lote (sticky) */}
      <AnimatePresence>
        {selectMode && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 glass border-card-border shadow-2xl px-6 py-4 flex items-center gap-4"
          >
            <button
              onClick={toggleAllVisible}
              className="text-xs font-bold uppercase tracking-widest text-secondary hover:text-primary"
            >
              {allVisibleSelected ? 'Deseleccionar visibles' : 'Seleccionar visibles'}
            </button>
            <span className="text-sm font-bold text-primary">
              {selectedIds.size} seleccionadas
            </span>
            <div className="h-6 w-px bg-white/10" />
            <button
              onClick={() => runBulk('reject')}
              disabled={selectedIds.size === 0 || bulkProcessing}
              className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 font-bold text-sm hover:bg-red-500/20 disabled:opacity-40"
            >
              ✗ Rechazar {selectedIds.size > 0 ? selectedIds.size : ''}
            </button>
            <button
              onClick={() => runBulk('approve')}
              disabled={selectedIds.size === 0 || bulkProcessing}
              className="px-4 py-2 rounded-lg premium-gradient text-black font-bold text-sm disabled:opacity-40"
            >
              {bulkProcessing ? 'Procesando…' : `✓ Aprobar ${selectedIds.size > 0 ? selectedIds.size : ''}`}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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
