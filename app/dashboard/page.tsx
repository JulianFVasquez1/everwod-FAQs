'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useDetectorMetrics } from '@/hooks/useDetector'
import { detectorClient, type PipelineRun } from '@/lib/detector'
import { WorkspaceSelect } from '@/components/detector/WorkspaceSelect'

const StatCard = ({ label, value, loading, sublabel, color = 'var(--color-gold)' }: any) => (
  <div className="glass p-8 border-card-border flex flex-col items-center text-center">
    <p className="text-xs font-bold text-secondary uppercase tracking-widest mb-4">{label}</p>
    {loading ? (
      <div className="h-10 w-20 bg-white/5 animate-pulse rounded" />
    ) : (
      <motion.span 
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-5xl font-black mb-2"
        style={{ color }}
      >
        {value}
      </motion.span>
    )}
    <p className="text-xs text-secondary/60 mt-1">{sublabel}</p>
  </div>
)

export default function DetectorDashboard() {
  const { metrics, loading, error, refetch } = useDetectorMetrics()
  const [runs, setRuns] = useState<PipelineRun[]>([])
  const [runsLoading, setRunsLoading] = useState(true)
  const [pollingId, setPollingId] = useState<number | null>(null)
  const [workspaceId, setWorkspaceId] = useState<number | null>(null)

  useEffect(() => {
    detectorClient.getPipelineRuns()
      .then(res => setRuns(res.data || []))
      .catch(console.error)
      .finally(() => setRunsLoading(false))
  }, [])

  // Polling para una corrida activa
  useEffect(() => {
    if (pollingId === null) return
    
    let timerId: NodeJS.Timeout;

    const poll = async () => {
      try {
        const res = await detectorClient.getPipelineRun(pollingId)
        if (res.data.status !== 'running') {
          setPollingId(null)
          refetch()
          const h = await detectorClient.getPipelineRuns()
          setRuns(h.data || [])
        } else {
          // Si sigue corriendo, programamos la siguiente revisión
          timerId = setTimeout(poll, 5000)
        }
      } catch (e) {
        setPollingId(null)
      }
    }

    timerId = setTimeout(poll, 5000)

    return () => clearTimeout(timerId)
  }, [pollingId, refetch])

  const handleRunPipeline = async () => {
    if (!workspaceId) {
      alert('Selecciona un workspace antes de ejecutar el análisis.')
      return
    }
    try {
      const res = await detectorClient.runPipeline({
        since: '2025-01-01',
        workspace_id: workspaceId,
      })
      if (res.data.run_id !== null) setPollingId(res.data.run_id)
      alert('Pipeline iniciado. Monitoreando progreso...')
    } catch (e) {
      alert('Error: ' + (e instanceof Error ? e.message : 'Desconocido'))
    }
  }

  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-extrabold text-primary mb-2">
              Dashboard de <span className="text-gold">FAQs</span>
            </h1>
            <p className="text-secondary">Monitoreo global del sistema de detección</p>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <WorkspaceSelect
              value={workspaceId}
              onChange={setWorkspaceId}
              label="Workspace"
            />
          <button
            onClick={handleRunPipeline}
            disabled={pollingId !== null || !workspaceId}
            className="premium-gradient px-8 py-3 rounded-2xl font-bold text-black flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-50"
          >
            {pollingId !== null ? (
              <>
                <div className="w-5 h-5 border-2 border-black/30 border-t-black animate-spin rounded-full" />
                Analizando...
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

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard 
            label="Total Sugerencias" 
            value={metrics?.overview?.total_suggestions || 0} 
            loading={loading}
            sublabel="generadas por el sistema"
          />
          <StatCard 
            label="Pendientes" 
            value={metrics?.overview?.pending || 0} 
            loading={loading}
            color="var(--color-gold)"
            sublabel="esperando revisión humana"
          />
          <StatCard 
            label="Aprobadas" 
            value={metrics?.overview?.approved || 0} 
            loading={loading}
            color="var(--color-neon-green)"
            sublabel="convertidas en FAQs"
          />
          <StatCard 
            label="Tasa Aprobación" 
            value={`${Math.round((metrics?.overview?.approval_rate || 0) * 100)}%`} 
            loading={loading}
            sublabel="calidad del sintetizador"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Historial de corridas */}
          <div className="lg:col-span-2">
            <h3 className="text-xl font-bold mb-6">Historial del pipeline</h3>
            <div className="glass overflow-hidden border-card-border">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white/5 border-b border-card-border">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-secondary">ID</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-secondary">Estado</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-secondary">Fecha</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-secondary">Sugerencias</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {runsLoading ? (
                    <tr><td colSpan={4} className="px-6 py-10 text-center text-secondary opacity-50">Cargando historial...</td></tr>
                  ) : runs.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-10 text-center text-secondary opacity-50">No hay corridas previas</td></tr>
                  ) : (
                    runs.map((run) => (
                      <tr key={run.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 font-mono text-sm">#{run.id}</td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${
                            run.status === 'success' ? 'bg-green-500/20 text-green-400' :
                            run.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                            'bg-gold/20 text-gold animate-pulse'
                          }`}>
                            {run.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-secondary">
                          {new Date(run.started_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-primary">
                          {run.suggestions_generated} items
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Última actividad */}
          <div>
            <h3 className="text-xl font-bold mb-6">Información del sistema</h3>
            <div className="glass p-6 border-card-border space-y-6">
              <div>
                <p className="text-xs font-bold text-secondary uppercase mb-1">Última corrida exitosa</p>
                <p className="text-sm">
                  {metrics?.pipeline?.last_run_at ? new Date(metrics.pipeline.last_run_at).toLocaleString() : 'Nunca'}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-secondary uppercase mb-1">Mensajes procesados (última)</p>
                <p className="text-xl font-bold text-gold">
                  {metrics?.pipeline?.last_run_messages_processed?.toLocaleString() || 0}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-secondary uppercase mb-1">Confianza promedio</p>
                <p className="text-xl font-bold text-primary">
                  {metrics?.overview?.avg_confidence_score
                    ? `${Math.round(metrics.overview.avg_confidence_score * 100)}%`
                    : '—'}
                </p>
              </div>
              {metrics?.pipeline?.avg_silhouette_score !== null &&
                metrics?.pipeline?.avg_silhouette_score !== undefined && (
                  <div>
                    <p className="text-xs font-bold text-secondary uppercase mb-1">
                      Silhouette score (clustering)
                    </p>
                    <p className="text-xl font-bold text-primary">
                      {metrics.pipeline.avg_silhouette_score.toFixed(3)}
                    </p>
                  </div>
                )}
              <div className="pt-4 border-t border-white/5">
                <p className="text-xs text-secondary italic">
                  * El detector procesa mensajes de WhatsApp, Slack y Email para agrupar patrones de preguntas recurrentes.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tendencias + Categorías */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-12">
          <div>
            <h3 className="text-xl font-bold mb-6">Tendencias</h3>
            <div className="glass p-6 border-card-border grid grid-cols-3 gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-2">
                  Últimos 7 días
                </p>
                <p className="text-3xl font-black text-gold">
                  {metrics?.trends?.suggestions_last_7_days ?? 0}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-2">
                  Últimos 30 días
                </p>
                <p className="text-3xl font-black text-gold">
                  {metrics?.trends?.suggestions_last_30_days ?? 0}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-2">
                  Promedio msgs/cluster
                </p>
                <p className="text-3xl font-black text-primary">
                  {metrics?.trends?.avg_message_count_per_cluster?.toFixed(1) ?? '0.0'}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-6">Top categorías</h3>
            <div className="glass p-6 border-card-border space-y-3">
              {!metrics?.by_category?.length ? (
                <p className="text-sm text-secondary opacity-50">
                  Sin datos por categoría todavía.
                </p>
              ) : (
                metrics.by_category.slice(0, 6).map((cat) => (
                  <div key={cat.category} className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-primary">{cat.category}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-secondary">
                        {Math.round(cat.approval_rate * 100)}% aprob.
                      </span>
                      <span className="text-sm font-bold text-gold">{cat.count}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
