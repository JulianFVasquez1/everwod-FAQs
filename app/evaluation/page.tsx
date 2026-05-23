'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import AuthGuard from '../../components/AuthGuard';
import { motion } from 'framer-motion';

interface EvaluationMetrics {
  precision: number;
  resolutionRate: number;
  ambiguityScore: number;
  total: number;
  approved: number;
  rejected: number;
  pending: number;
  chartData: Array<{ date: string; count: number }>;
}

export default function EvaluationPage() {
  const [metrics, setMetrics] = useState<EvaluationMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stats/evaluation')
      .then(res => res.json())
      .then(data => {
        setMetrics(data);
        setLoading(false);
      });
  }, []);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background text-primary py-12 px-6 transition-colors duration-300">
        <div className="max-w-6xl mx-auto">
          <header className="mb-12 flex justify-between items-end">
            <div>
              <motion.h1 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl font-extrabold mb-2"
              >
                Evaluación <span className="text-[#FACC15]">Experimental</span>
              </motion.h1>
              <p className="text-white/40">Desempeño del sistema de detección de patrones conversacionales.</p>
            </div>
            <Link href="/" className="text-sm font-bold text-white/60 hover:text-[#FACC15] transition-colors">
              Volver al inicio
            </Link>
          </header>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-12 h-12 border-4 border-gold/20 border-t-gold rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Card: Precision */}
              <motion.div 
                whileHover={{ y: -5 }}
                className="col-span-1 glass p-8 border-card-border overflow-hidden relative"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 blur-3xl rounded-full" />
                <h3 className="text-sm font-bold text-secondary uppercase tracking-widest mb-4">Precisión Algorítmica</h3>
                <div className="text-6xl font-black text-gold mb-2">{metrics?.precision}%</div>
                <p className="text-sm text-secondary">Basado en validación humana (Aprobadas vs Rechazadas).</p>
              </motion.div>

              {/* Card: Resolution Rate (Simulated) */}
              <motion.div 
                whileHover={{ y: -5 }}
                className="col-span-1 glass p-8 border-card-border"
              >
                <h3 className="text-sm font-bold text-secondary uppercase tracking-widest mb-4">Tasa de Resolución (Proyectada)</h3>
                <div className="text-6xl font-black text-neon-green mb-2">+{metrics?.resolutionRate}%</div>
                <p className="text-sm text-secondary">Estimación de mejora en la eficiencia de respuesta.</p>
              </motion.div>

              {/* Card: Ambiguity Reduction */}
              <motion.div 
                whileHover={{ y: -5 }}
                className="col-span-1 glass p-8 border-card-border"
              >
                <h3 className="text-sm font-bold text-secondary uppercase tracking-widest mb-4">Reducción de Ambigüedad</h3>
                <div className="text-6xl font-black text-blue-400 mb-2">{metrics?.ambiguityScore}/10</div>
                <p className="text-sm text-secondary">Índice de precisión semántica en los clusters detectados.</p>
              </motion.div>

              <div className="col-span-1 md:col-span-3 glass p-10 border-card-border relative">
                <div className="flex justify-between items-center mb-10">
                  <h3 className="text-sm font-bold text-secondary uppercase tracking-widest">Volumen de Detección (7 días)</h3>
                  <div className="flex items-center gap-4 text-[10px] font-bold text-secondary uppercase tracking-widest">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-neon-green" /> Patrones Detectados
                    </div>
                  </div>
                </div>
                
                <div className="flex items-end justify-between h-64 gap-3 md:gap-6">
                  {metrics?.chartData?.map((day) => (
                    <div key={day.date} className="flex-1 h-full flex flex-col justify-end items-center group">
                      {/* Valor sobre la barra */}
                      <motion.span 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs font-black text-neon-green mb-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {day.count}
                      </motion.span>
                      
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(day.count > 0 ? 8 : 2, Math.min(day.count * 10, 100))}%` }}
                        className="w-full max-w-[45px] bg-neon-green rounded-t-xl shadow-[0_0_20px_rgba(0,217,160,0.4)] group-hover:shadow-[0_0_30px_rgba(0,217,160,0.6)] transition-all relative overflow-hidden" 
                      >
                        {/* Brillo interno de la barra */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-white/20 opacity-50" />
                      </motion.div>
                      
                      <span className="text-[10px] text-secondary font-bold mt-4 group-hover:text-primary transition-colors">
                        {new Date(day.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Breakdown */}
              <div className="col-span-1 md:col-span-3 grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-6 bg-white/5 rounded-2xl border border-card-border">
                  <div className="text-xs text-secondary font-bold mb-1">TOTAL ANALIZADAS</div>
                  <div className="text-2xl font-bold">{metrics?.total}</div>
                </div>
                <div className="p-6 bg-white/5 rounded-2xl border border-card-border">
                  <div className="text-xs text-secondary font-bold mb-1">APROBADAS</div>
                  <div className="text-2xl font-bold text-neon-green">{metrics?.approved}</div>
                </div>
                <div className="p-6 bg-white/5 rounded-2xl border border-card-border">
                  <div className="text-xs text-secondary font-bold mb-1">RECHAZADAS</div>
                  <div className="text-2xl font-bold text-red-400">{metrics?.rejected}</div>
                </div>
                <div className="p-6 bg-white/5 rounded-2xl border border-card-border">
                  <div className="text-xs text-secondary font-bold mb-1">PENDIENTES</div>
                  <div className="text-2xl font-bold text-gold">{metrics?.pending}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}

