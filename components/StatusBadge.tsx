import React from 'react';

export default function StatusBadge({ status }: { status: string }) {
  let colorClass = 'bg-primary/10 text-primary border border-primary/20';
  if (status === 'uploaded') colorClass = 'bg-[#FACC15]/10 text-[#FFB800] border border-[#FACC15]/20';
  if (status === 'processed') colorClass = 'bg-[#34D399]/10 text-[#34D399] border border-[#34D399]/20';
  if (status === 'error') colorClass = 'bg-[#F87171]/10 text-[#F87171] border border-[#F87171]/20';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${colorClass}`}>
      {status}
    </span>
  );
}
