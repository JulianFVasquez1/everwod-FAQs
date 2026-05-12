'use client';

import React, { useEffect, useRef, useState } from 'react';

interface CircularProgressProps {
  value: number;
  max?: number;
  color: string;
  label: string;
  loading?: boolean;
}

export default function CircularProgress({ value, max = 100, color, label, loading }: CircularProgressProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [dashOffset, setDashOffset] = useState(226.2); // full circumference
  const animRef = useRef<number>(0);

  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const percentage = max > 0 ? Math.min(value / max, 1) : 0;
  const targetOffset = circumference * (1 - percentage);

  useEffect(() => {
    if (loading) return;

    // Animate counter
    const duration = 1500;
    const start = performance.now();
    const startVal = 0;

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease out quad
      const eased = 1 - (1 - progress) * (1 - progress);

      setDisplayValue(Math.round(startVal + (value - startVal) * eased));
      setDashOffset(circumference - (circumference - targetOffset) * eased);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    };

    animRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animRef.current);
  }, [value, loading, circumference, targetOffset]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <div className="w-20 h-20 rounded-full skeleton" />
        <div className="w-16 h-3 mt-3 skeleton" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 group">
      <div className="relative w-20 h-20">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
          {/* Track */}
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            stroke="var(--card-border)"
            strokeWidth="4"
          />
          {/* Progress */}
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{
              filter: `drop-shadow(0 0 6px ${color}40)`,
              transition: 'stroke-dashoffset 0.1s linear',
            }}
          />
        </svg>
        {/* Center number */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="text-[28px] font-bold tabular-nums"
            style={{ color }}
          >
            {displayValue}
          </span>
        </div>
      </div>
      {/* Label */}
      <span className="mt-2 text-[11px] font-bold uppercase tracking-[1px] text-secondary text-center">
        {label}
      </span>
    </div>
  );
}
