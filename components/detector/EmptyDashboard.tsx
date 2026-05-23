'use client'

import React from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'

interface Props {
  hasWorkspaces: boolean
  workspaceSelected: boolean
  launching: boolean
  onRunPipeline: () => void
}

const steps = [
  {
    n: '1',
    title: 'Selecciona un workspace',
    body: 'Elige el bot de WhatsApp que quieres analizar desde el selector superior.',
  },
  {
    n: '2',
    title: 'Ejecuta tu primer análisis',
    body: 'El pipeline NLP procesa los mensajes reales del bot y agrupa los que se repiten.',
  },
  {
    n: '3',
    title: 'Revisa las sugerencias',
    body: 'Aprueba, edita o rechaza las FAQs que el sintetizador propone para el bot.',
  },
]

export const EmptyDashboard: React.FC<Props> = ({
  hasWorkspaces,
  workspaceSelected,
  launching,
  onRunPipeline,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass p-10 md:p-14 border-card-border relative overflow-hidden"
    >
      <div className="absolute -top-32 -right-32 w-64 h-64 rounded-full bg-gold/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-64 h-64 rounded-full bg-neon-green/5 blur-3xl pointer-events-none" />

      <div className="relative flex flex-col lg:flex-row gap-10 lg:gap-16 items-center">
        <div className="flex-shrink-0">
          <motion.div
            initial={{ rotate: -8, scale: 0.9 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 120, damping: 14 }}
            className="w-32 h-32 rounded-3xl premium-gradient flex items-center justify-center shadow-2xl shadow-gold/20"
          >
            <svg className="w-16 h-16 text-black" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </motion.div>
        </div>

        <div className="flex-1 text-center lg:text-left">
          <p className="text-[10px] font-bold text-gold uppercase tracking-widest mb-3">
            Tu dashboard está esperando
          </p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-primary mb-4 leading-tight">
            Aún no hay datos del detector
          </h2>
          <p className="text-secondary text-base max-w-2xl mb-8">
            Las gráficas y métricas aparecen cuando el pipeline analiza los mensajes de un
            workspace. {hasWorkspaces
              ? 'Ya tienes workspaces detectados — solo ejecuta tu primer análisis.'
              : 'Aún no detectamos workspaces; verifica que el backend tenga acceso a la BD de Everwod.'}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 text-left">
            {steps.map((step) => (
              <div
                key={step.n}
                className="p-4 rounded-2xl bg-white/5 border border-card-border"
              >
                <div className="w-7 h-7 rounded-full bg-gold/20 text-gold flex items-center justify-center text-xs font-black mb-2">
                  {step.n}
                </div>
                <p className="font-bold text-sm text-primary mb-1">{step.title}</p>
                <p className="text-xs text-secondary leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onRunPipeline}
              disabled={!workspaceSelected || launching || !hasWorkspaces}
              className="premium-gradient px-7 py-3 rounded-2xl font-bold text-black text-sm flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {launching ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black animate-spin rounded-full" />
                  Encolando…
                </>
              ) : (
                <>
                  Ejecutar primer análisis
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>

            <Link
              href="/upload"
              className="px-5 py-3 rounded-2xl font-bold text-secondary text-sm border border-card-border hover:border-gold/30 hover:text-primary transition-colors"
            >
              O subir un archivo manualmente
            </Link>
          </div>

          {!hasWorkspaces && (
            <p className="text-xs text-red-400/80 mt-4">
              ⚠ Sin workspaces — el backend no devuelve datos. Verifica `DETECTOR_URL`,
              `DETECTOR_API_KEY` y que el detector tenga conexión a la BD de Everwod.
            </p>
          )}
          {hasWorkspaces && !workspaceSelected && (
            <p className="text-xs text-secondary mt-4 opacity-70">
              Tip: selecciona un workspace en el menú superior para habilitar el botón.
            </p>
          )}
        </div>
      </div>
    </motion.div>
  )
}
