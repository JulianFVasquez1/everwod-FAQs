'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useDetectorMetrics } from '@/hooks/useDetector'
import { useRunPipeline } from '@/hooks/useRunPipeline'
import { useWorkspaces } from '@/hooks/useWorkspaces'
import { detectorClient, type PipelineRun } from '@/lib/detector'
import { WorkspaceSelect } from '@/components/detector/WorkspaceSelect'
import { WorkspaceDetailCard } from '@/components/detector/WorkspaceDetailCard'
import { EmptyDashboard } from '@/components/detector/EmptyDashboard'
import { StatusDonut } from '@/components/detector/charts/StatusDonut'
import { CategoryBars } from '@/components/detector/charts/CategoryBars'
import { WorkspaceBars } from '@/components/detector/charts/WorkspaceBars'
import { PipelineTimeline } from '@/components/detector/charts/PipelineTimeline'

const MiniStat = ({
  label,
  value,
  sublabel,
  color = 'var(--color-primary)',
}: {
  label: string
  value: string | number
  sublabel?: string
  color?: string
}) => (
  <div className="glass p-5 border-card-border">
    <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-2">{label}</p>
    <p className="text-3xl font-black mb-1" style={{ color }}>{value}</p>
    {sublabel && <p className="text-[10px] text-secondary opacity-60">{sublabel}</p>}
  </div>
)

export default function DetectorDashboard() {
  const { metrics, loading, error, refetch } = useDetectorMetrics()
  const { workspaces, loading: workspacesLoading } = useWorkspaces()
  const [runs, setRuns] = useState<PipelineRun[]>([])
  const [runsLoading, setRunsLoading] = useState(true)
  const [pollingId, setPollingId] = useState<number | null>(null)
  const [workspaceId, setWorkspaceId] = useState<number | null>(null)
  const [showRunsTable, setShowRunsTable] = useState(false)

  useEffect(() => {
    detectorClient.getPipelineRuns(1, 100)
      .then(res => setRuns(res.data || []))
      .catch(console.error)
      .finally(() => setRunsLoading(false))
  }, [])

  // SSE para una corrida activa (reemplaza polling cada 5s)
  useEffect(() => {
    if (pollingId === null) return

    const source = detectorClient.streamPipelineRun(pollingId)
    let closed = false

    const finish = async () => {
      if (closed) return
      closed = true
      source.close()
      setPollingId(null)
      refetch()
      try {
        const h = await detectorClient.getPipelineRuns(1, 100)
        setRuns(h.data || [])
      } catch {
        // ignore
      }
    }

    source.onmessage = (ev) => {
      try {
        const run = JSON.parse(ev.data) as PipelineRun
        setRuns((prev) => {
          const idx = prev.findIndex((r) => r.id === run.id)
          if (idx === -1) return [run, ...prev]
          const next = [...prev]
          next[idx] = run
          return next
        })
        if (run.status === 'success' || run.status === 'failed') finish()
      } catch {
        // ignora frames no-JSON
      }
    }
    source.onerror = () => { finish() }

    return () => {
      closed = true
      source.close()
    }
  }, [pollingId, refetch])

  const { start: runPipeline, running: launching, error: launchError, clearError } = useRunPipeline({
    defaultSinceDays: 30,
    onStarted: (runId) => {
      if (runId !== null) setPollingId(runId)
    },
  })

  const handleRunPipeline = () => runPipeline({ workspaceId })

  const overview = metrics?.overview
  const pipeline = metrics?.pipeline
  const trends = metrics?.trends
  const totalPending = overview?.pending ?? 0

  // El dashboard está vacío cuando: no estamos cargando, no hay error,
  // y ni el detector ni el histórico tienen datos para mostrar.
  const stillLoading = loading || runsLoading || workspacesLoading
  const totalSuggestions = overview?.total_suggestions ?? 0
  const isEmpty =
    !stillLoading && !error && totalSuggestions === 0 && runs.length === 0

  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-extrabold text-primary mb-2">
              Dashboard de <span className="text-gold">FAQs</span>
            </h1>
            <p className="text-secondary">Monitoreo global del sistema de detección</p>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <WorkspaceSelect value={workspaceId} onChange={setWorkspaceId} label="Workspace" />
            <button
              onClick={handleRunPipeline}
              disabled={pollingId !== null || launching || !workspaceId}
              className="premium-gradient px-8 py-3 rounded-2xl font-bold text-black flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-50"
            >
              {pollingId !== null || launching ? (
                <>
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black animate-spin rounded-full" />
                  {launching ? 'Encolando…' : 'Analizando…'}
                </>
              ) : (
                'Ejecutar nuevo análisis'
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400">
            Error al cargar métricas: {error}
          </div>
        )}

        {launchError && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-between gap-4">
            <p className="text-red-400 text-sm">{launchError}</p>
            <button
              onClick={clearError}
              className="text-xs font-bold text-red-400 hover:text-red-300 underline"
            >
              Descartar
            </button>
          </div>
        )}

        {/* Empty state global: aparece cuando no hay ningún dato del detector */}
        {isEmpty && (
          <EmptyDashboard
            hasWorkspaces={workspaces.length > 0}
            workspaceSelected={workspaceId !== null}
            launching={launching}
            onRunPipeline={handleRunPipeline}
          />
        )}

        {/* CTA pendientes */}
        {!isEmpty && totalPending > 0 && (
          <Link
            href="/suggestions"
            className="block mb-8 glass p-5 border-card-border hover:border-gold/40 transition-colors group"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gold/20 flex items-center justify-center text-2xl">
                  ⚡
                </div>
                <div>
                  <p className="font-bold text-primary">
                    Tienes <span className="text-gold">{totalPending} sugerencias</span> esperando revisión
                  </p>
                  <p className="text-xs text-secondary">
                    El admin puede aprobar, editar o rechazar las FAQs detectadas por el pipeline.
                  </p>
                </div>
              </div>
              <span className="text-gold font-bold text-sm group-hover:translate-x-1 transition-transform">
                Revisar →
              </span>
            </div>
          </Link>
        )}

        {!isEmpty && (
          <>
        {/* Fila 1: Status donut + KPIs laterales */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 glass p-6 border-card-border">
            <h3 className="text-sm font-bold text-secondary uppercase tracking-widest mb-6">
              Distribución de sugerencias
            </h3>
            {loading ? (
              <div className="h-56 flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
              </div>
            ) : (
              <StatusDonut
                pending={overview?.pending ?? 0}
                approved={overview?.approved ?? 0}
                rejected={overview?.rejected ?? 0}
                edited={overview?.edited ?? 0}
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <MiniStat
              label="Tasa aprobación"
              value={`${Math.round((overview?.approval_rate ?? 0) * 100)}%`}
              sublabel="apr+edit / revisadas"
              color="var(--color-neon-green)"
            />
            <MiniStat
              label="Confianza promedio"
              value={`${Math.round((overview?.avg_confidence_score ?? 0) * 100)}%`}
              sublabel="del sintetizador"
              color="var(--color-gold)"
            />
            <MiniStat
              label="Total corridas"
              value={pipeline?.total_runs ?? 0}
              sublabel="del pipeline"
            />
            <MiniStat
              label="Silhouette"
              value={pipeline?.avg_silhouette_score?.toFixed(2) ?? '—'}
              sublabel="calidad clustering"
            />
          </div>
        </div>

        {/* Fila 2: Tendencias */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <MiniStat
            label="Últimos 7 días"
            value={trends?.suggestions_last_7_days ?? 0}
            sublabel="sugerencias nuevas"
            color="var(--color-gold)"
          />
          <MiniStat
            label="Últimos 30 días"
            value={trends?.suggestions_last_30_days ?? 0}
            sublabel="sugerencias nuevas"
            color="var(--color-gold)"
          />
          <MiniStat
            label="Promedio msgs/cluster"
            value={trends?.avg_message_count_per_cluster?.toFixed(1) ?? '0.0'}
            sublabel="densidad de los clusters"
          />
        </div>

        {/* Fila 3: Timeline del pipeline */}
        <div className="mb-8">
          {runsLoading ? (
            <div className="glass p-6 border-card-border h-60 flex items-center justify-center">
              <div className="w-10 h-10 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
            </div>
          ) : (
            <PipelineTimeline runs={runs} days={14} />
          )}
        </div>

        {/* Fila 4: Categorías + Workspaces */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="glass p-6 border-card-border">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-secondary uppercase tracking-widest">
                Top categorías
              </h3>
              <span className="text-[10px] text-secondary opacity-60">
                color = tasa de aprobación
              </span>
            </div>
            {loading ? (
              <div className="h-40 animate-pulse bg-white/5 rounded" />
            ) : (
              <CategoryBars data={metrics?.by_category ?? []} />
            )}
          </div>

          <div className="glass p-6 border-card-border">
            <h3 className="text-sm font-bold text-secondary uppercase tracking-widest mb-6">
              Comparativa por workspace
            </h3>
            {loading ? (
              <div className="h-40 animate-pulse bg-white/5 rounded" />
            ) : (
              <WorkspaceBars data={metrics?.by_workspace ?? []} />
            )}
          </div>
        </div>

        {/* Fila 5: Detalle workspace + Sistema */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div>
            <h3 className="text-sm font-bold text-secondary uppercase tracking-widest mb-4">
              Detalle del workspace seleccionado
            </h3>
            <WorkspaceDetailCard workspaceId={workspaceId} />
          </div>

          <div>
            <h3 className="text-sm font-bold text-secondary uppercase tracking-widest mb-4">
              Sistema
            </h3>
            <div className="glass p-6 border-card-border space-y-5">
              <div>
                <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-1">
                  Última corrida exitosa
                </p>
                <p className="text-sm text-primary">
                  {pipeline?.last_run_at
                    ? new Date(pipeline.last_run_at).toLocaleString()
                    : 'Nunca'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-1">
                  Mensajes procesados (última)
                </p>
                <p className="text-xl font-bold text-gold">
                  {pipeline?.last_run_messages_processed?.toLocaleString() ?? 0}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-1">
                  Clusters encontrados (última)
                </p>
                <p className="text-xl font-bold text-primary">
                  {pipeline?.last_run_clusters_found ?? 0}
                </p>
              </div>
              <p className="text-[10px] text-secondary italic pt-3 border-t border-white/5">
                El detector agrupa mensajes de WhatsApp por similitud semántica
                (HDBSCAN + embeddings) y sintetiza la FAQ con Qwen2.5-72B.
              </p>
            </div>
          </div>
        </div>

        {/* Fila 6: Historial tabular colapsable */}
        <div>
          <button
            onClick={() => setShowRunsTable((v) => !v)}
            className="w-full glass p-4 border-card-border flex items-center justify-between hover:border-gold/30 transition-colors"
          >
            <span className="text-sm font-bold text-secondary uppercase tracking-widest">
              Historial detallado del pipeline · {runs.length} corridas
            </span>
            <motion.span
              animate={{ rotate: showRunsTable ? 180 : 0 }}
              className="text-secondary"
            >
              ▾
            </motion.span>
          </button>
          {showRunsTable && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="glass overflow-hidden border-card-border border-t-0 rounded-t-none"
            >
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white/5 border-b border-card-border">
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-secondary">ID</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-secondary">Estado</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-secondary">WS</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-secondary">Inicio</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-secondary">Mensajes</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-secondary">Clusters</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-secondary">Sugs</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-secondary">Duración</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {runs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-secondary opacity-50">
                        No hay corridas previas
                      </td>
                    </tr>
                  ) : (
                    runs.map((run) => (
                      <tr key={run.id} className="hover:bg-white/[0.02] transition-colors text-sm">
                        <td className="px-4 py-3 font-mono">#{run.id}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${
                            run.status === 'success' ? 'bg-green-500/20 text-green-400' :
                            run.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                            'bg-gold/20 text-gold animate-pulse'
                          }`}>
                            {run.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-secondary">{run.workspace_id ?? '—'}</td>
                        <td className="px-4 py-3 text-secondary">
                          {new Date(run.started_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-primary">{run.messages_processed.toLocaleString()}</td>
                        <td className="px-4 py-3 text-primary">{run.clusters_found}</td>
                        <td className="px-4 py-3 font-bold text-gold">{run.suggestions_generated}</td>
                        <td className="px-4 py-3 text-secondary">
                          {run.duration_seconds ? `${run.duration_seconds.toFixed(1)}s` : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </motion.div>
          )}
        </div>
          </>
        )}
      </div>
    </main>
  )
}
