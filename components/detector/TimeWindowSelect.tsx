'use client'

import React from 'react'

export type TimeWindow = 30 | 90 | 180 | 365 | null

interface Props {
  value: TimeWindow
  onChange: (value: TimeWindow) => void
  className?: string
  label?: string
}

const OPTIONS: { value: TimeWindow; label: string }[] = [
  { value: 30, label: 'Últimos 30 días' },
  { value: 90, label: 'Últimos 90 días' },
  { value: 180, label: 'Últimos 180 días' },
  { value: 365, label: 'Último año' },
  { value: null, label: 'Todo el historial' },
]

export const TimeWindowSelect: React.FC<Props> = ({
  value,
  onChange,
  className = '',
  label,
}) => {
  const serialized = value === null ? 'all' : String(value)

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="text-[10px] font-bold uppercase tracking-widest text-secondary">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          value={serialized}
          onChange={(e) => {
            const raw = e.target.value
            onChange(raw === 'all' ? null : (Number(raw) as TimeWindow))
          }}
          className="appearance-none bg-white/5 border border-card-border rounded-xl pl-4 pr-10 py-2.5 text-sm font-semibold text-primary focus:border-gold/50 outline-none transition-colors min-w-[180px]"
        >
          {OPTIONS.map((opt) => (
            <option
              key={opt.value === null ? 'all' : opt.value}
              value={opt.value === null ? 'all' : opt.value}
              className="bg-[#0a0a0a]"
            >
              {opt.label}
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
