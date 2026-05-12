'use client';

import React from 'react';
import CircularProgress from '../ui/CircularProgress';
import { statColors } from '../../lib/theme';

interface StatsDashboardProps {
  metrics: {
    totalFiles: number;
    pending: number;
    processed: number;
    errors: number;
    faqsGenerated: number;
    faqsApproved: number;
  };
  loading?: boolean;
}

const statConfig = [
  { key: 'totalFiles', label: 'Total Archivos', color: statColors.totalFiles },
  { key: 'pending', label: 'En Cola', color: statColors.pending },
  { key: 'processed', label: 'Procesados', color: statColors.processed },
  { key: 'errors', label: 'Errores', color: statColors.errors },
  { key: 'faqsGenerated', label: 'FAQs Sugeridas', color: statColors.faqsGenerated },
  { key: 'faqsApproved', label: 'FAQs Aprobadas', color: statColors.faqsApproved },
] as const;

export default function StatsDashboard({ metrics, loading }: StatsDashboardProps) {
  // Calculate max for percentage normalization
  const maxVal = Math.max(
    metrics.totalFiles,
    metrics.pending,
    metrics.processed,
    metrics.errors,
    metrics.faqsGenerated,
    metrics.faqsApproved,
    1 // avoid division by zero
  );

  return (
    <section className="w-full">
      <div className="glass p-4 sm:p-6 shadow-xl relative overflow-hidden">
        {/* Subtle background glow for premium feel */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#FACC15]/5 blur-[60px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#FACC15]/5 blur-[60px] rounded-full pointer-events-none" />
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 relative z-10">
          {statConfig.map((stat) => (
            <CircularProgress
              key={stat.key}
              value={metrics[stat.key]}
              max={maxVal}
              color={stat.color}
              label={stat.label}
              loading={loading}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
