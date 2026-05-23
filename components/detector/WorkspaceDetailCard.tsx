'use client'

import React from 'react'
import { useWorkspaceDetail } from '@/hooks/useWorkspaceDetail'

interface Props {
  workspaceId: number | null
}

export const WorkspaceDetailCard: React.FC<Props> = ({ workspaceId }) => {
  const { detail, loading, error } = useWorkspaceDetail(workspaceId)

  if (!workspaceId) {
    return (
      <div className="glass p-6 border-card-border">
        <p className="text-sm text-secondary opacity-60">
          Selecciona un workspace para ver detalles.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="glass p-6 border-card-border">
        <div className="h-4 w-32 bg-white/5 animate-pulse rounded mb-4" />
        <div className="h-3 w-full bg-white/5 animate-pulse rounded mb-2" />
        <div className="h-3 w-3/4 bg-white/5 animate-pulse rounded" />
      </div>
    )
  }

  if (error || !detail) {
    return (
      <div className="glass p-6 border-card-border">
        <p className="text-sm text-red-400">{error ?? 'Sin datos'}</p>
      </div>
    )
  }

  const status = detail.suggestions_by_status

  return (
    <div className="glass p-6 border-card-border space-y-5">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-1">
          Workspace
        </p>
        <p className="text-lg font-bold text-primary">
          {detail.workspace_name ?? `Workspace ${detail.workspace_id}`}
        </p>
        <p className="text-xs text-secondary">
          {detail.suggestions_total} sugerencias totales
        </p>
      </div>

      <div className="grid grid-cols-4 gap-2 text-center">
        <div>
          <p className="text-[10px] font-bold uppercase text-secondary">Pend</p>
          <p className="text-lg font-bold text-gold">{status.pending}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase text-secondary">Apr</p>
          <p className="text-lg font-bold text-neon-green">{status.approved}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase text-secondary">Edit</p>
          <p className="text-lg font-bold text-blue-400">{status.edited}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase text-secondary">Rech</p>
          <p className="text-lg font-bold text-red-400">{status.rejected}</p>
        </div>
      </div>

      {detail.top_categories.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-2">
            Top categorías
          </p>
          <div className="flex flex-wrap gap-2">
            {detail.top_categories.slice(0, 8).map((c) => (
              <span
                key={c.category}
                className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/5 border border-card-border text-primary"
              >
                {c.category} <span className="text-gold">·{c.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {detail.last_pipeline_run && (
        <div className="pt-3 border-t border-white/5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-1">
            Última corrida
          </p>
          <p className="text-xs text-primary">
            #{detail.last_pipeline_run.id} ·{' '}
            <span
              className={
                detail.last_pipeline_run.status === 'success'
                  ? 'text-green-400'
                  : detail.last_pipeline_run.status === 'failed'
                    ? 'text-red-400'
                    : 'text-gold'
              }
            >
              {detail.last_pipeline_run.status}
            </span>{' '}
            ·{' '}
            {new Date(detail.last_pipeline_run.started_at).toLocaleString()}
          </p>
          <p className="text-xs text-secondary mt-1">
            {detail.last_pipeline_run.suggestions_generated} sugerencias generadas
            {detail.last_pipeline_run.duration_seconds !== null && detail.last_pipeline_run.duration_seconds !== undefined && (
              <> · {detail.last_pipeline_run.duration_seconds.toFixed(1)}s</>
            )}
          </p>
        </div>
      )}
    </div>
  )
}
