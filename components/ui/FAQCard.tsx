'use client';

import React, { useRef, useState, useCallback } from 'react';
import { categoryColors } from '../../lib/theme';

interface FAQCardProps {
  question: string;
  answer: string;
  category?: string;
  status?: string;
  children?: React.ReactNode; // for action buttons
}

export default function FAQCard({ question, answer, category, status, children }: FAQCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('');
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;

    setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`);
    setGlowPos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTransform('');
  }, []);

  const catColor = category
    ? categoryColors[category.toLowerCase()] || '#FFB800'
    : undefined;

  const statusBadge = () => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-md text-xs font-bold uppercase tracking-wider">Pendiente</span>;
      case 'approved':
        return <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-md text-xs font-bold uppercase tracking-wider">Aprobada</span>;
      case 'edited':
        return <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-md text-xs font-bold uppercase tracking-wider">Editada</span>;
      case 'rejected':
        return <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-md text-xs font-bold uppercase tracking-wider">Rechazada</span>;
      default:
        return null;
    }
  };

  return (
    <div
      ref={cardRef}
      className="glass p-6 transition-transform duration-200 ease-out relative overflow-hidden"
      style={{ transform }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Radial glow following mouse */}
      <div
        className="absolute inset-0 pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(300px circle at ${glowPos.x}% ${glowPos.y}%, rgba(255,184,0,0.06), transparent)`,
        }}
      />

      <div className="relative z-10">
        {/* Top bar: category + status */}
        <div className="flex items-center justify-between mb-4">
          {category && catColor && (
            <span
              className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
              style={{
                backgroundColor: `${catColor}15`,
                color: catColor,
                border: `1px solid ${catColor}30`,
              }}
            >
              {category}
            </span>
          )}
          {statusBadge()}
        </div>

        {/* Question */}
        <h4 className="text-lg font-bold text-white mb-3 leading-snug">{question}</h4>

        {/* Answer */}
        <p className="text-sm text-[#A0A0A0] leading-relaxed mb-4">{answer}</p>

        {/* Action buttons slot */}
        {children && <div className="flex gap-3 pt-2 border-t border-white/5">{children}</div>}
      </div>
    </div>
  );
}
