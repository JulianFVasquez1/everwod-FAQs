import React from 'react'

export const SkeletonCard = () => {
  return (
    <div className="glass h-[200px] border-card-border p-5 flex flex-col gap-4 animate-pulse opacity-50">
      <div className="flex justify-between items-start">
        <div className="h-6 w-3/4 rounded bg-white/10" />
        <div className="h-6 w-10 rounded bg-white/10" />
      </div>
      <div className="h-3 w-1/2 rounded bg-white/10" />
      <div className="mt-2 flex-1">
        <div className="h-3 w-full rounded bg-white/10 mb-2" />
        <div className="h-3 w-full rounded bg-white/10" />
      </div>
      <div className="flex gap-2 justify-end mt-4">
        <div className="h-8 w-20 rounded-lg bg-white/10" />
        <div className="h-8 w-20 rounded-lg bg-white/10" />
        <div className="h-8 w-24 rounded-lg bg-white/10" />
      </div>
    </div>
  )
}
