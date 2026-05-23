'use client'

import React from 'react'
import { useWorkspaces } from '@/hooks/useWorkspaces'

interface Props {
  value: number | null
  onChange: (workspaceId: number | null) => void
  className?: string
  allowAll?: boolean
  label?: string
}

export const WorkspaceSelect: React.FC<Props> = ({
  value,
  onChange,
  className = '',
  allowAll = false,
  label,
}) => {
  const { workspaces, loading, error } = useWorkspaces()

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="text-[10px] font-bold uppercase tracking-widest text-secondary">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          value={value ?? ''}
          onChange={(e) => {
            const v = e.target.value
            onChange(v === '' ? null : Number(v))
          }}
          disabled={loading || !!error}
          className="appearance-none bg-white/5 border border-card-border rounded-xl pl-4 pr-10 py-2.5 text-sm font-semibold text-primary focus:border-gold/50 outline-none transition-colors min-w-[220px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading && <option value="">Cargando workspaces...</option>}
          {error && <option value="">Error: {error}</option>}
          {!loading && !error && allowAll && (
            <option value="" className="bg-[#0a0a0a]">Todos los workspaces</option>
          )}
          {!loading && !error && workspaces.length === 0 && (
            <option value="" className="bg-[#0a0a0a]">Sin workspaces disponibles</option>
          )}
          {!loading && !error && workspaces.map((ws) => (
            <option
              key={ws.workspace_id}
              value={ws.workspace_id}
              className="bg-[#0a0a0a]"
            >
              {ws.workspace_name ?? `Workspace ${ws.workspace_id}`}
              {' · '}
              {ws.suggestions_total} sugerencias
              {ws.suggestions_pending > 0 && ` (${ws.suggestions_pending} pendientes)`}
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  )
}
