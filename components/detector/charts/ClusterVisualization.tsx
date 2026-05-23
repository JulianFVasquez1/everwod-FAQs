'use client'

import React, { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type {
  ClusterVisualization,
  ClusterVizCluster,
  ClusterVizPoint,
} from '@/lib/detector'

// Paleta cíclica para colorear clusters. El ruido (-1) usa un gris apagado.
const CLUSTER_PALETTE = [
  '#FACC15', '#00D9A0', '#60A5FA', '#FF7A59',
  '#A78BFA', '#FF4D9D', '#34D399', '#F472B6',
  '#22D3EE', '#FBBF24', '#C084FC', '#F87171',
]
const NOISE_COLOR = 'rgba(160,160,160,0.45)'

function colorForCluster(id: number): string {
  if (id < 0) return NOISE_COLOR
  return CLUSTER_PALETTE[id % CLUSTER_PALETTE.length]
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-componente: Scatter 2D (PCA)
// ─────────────────────────────────────────────────────────────────────────────

interface ScatterProps {
  points: ClusterVizPoint[]
  width?: number
  height?: number
}

const ScatterPlot: React.FC<ScatterProps> = ({
  points,
  width = 720,
  height = 420,
}) => {
  const [hover, setHover] = useState<{ p: ClusterVizPoint; x: number; y: number } | null>(null)

  const { xs, ys, xMin, xMax, yMin, yMax } = useMemo(() => {
    if (points.length === 0) {
      return { xs: [], ys: [], xMin: -1, xMax: 1, yMin: -1, yMax: 1 }
    }
    const xs = points.map((p) => p.x)
    const ys = points.map((p) => p.y)
    return {
      xs,
      ys,
      xMin: Math.min(...xs),
      xMax: Math.max(...xs),
      yMin: Math.min(...ys),
      yMax: Math.max(...ys),
    }
  }, [points])

  const padding = 28
  const innerW = width - padding * 2
  const innerH = height - padding * 2
  const rangeX = xMax - xMin || 1
  const rangeY = yMax - yMin || 1

  const project = (x: number, y: number) => ({
    px: padding + ((x - xMin) / rangeX) * innerW,
    py: padding + (1 - (y - yMin) / rangeY) * innerH,
  })

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
        onMouseLeave={() => setHover(null)}
      >
        {/* Fondo y grid mínimo */}
        <rect width={width} height={height} fill="rgba(255,255,255,0.02)" rx={12} />
        <line
          x1={padding}
          x2={width - padding}
          y1={height / 2}
          y2={height / 2}
          stroke="rgba(255,255,255,0.05)"
          strokeDasharray="4 4"
        />
        <line
          x1={width / 2}
          x2={width / 2}
          y1={padding}
          y2={height - padding}
          stroke="rgba(255,255,255,0.05)"
          strokeDasharray="4 4"
        />

        {/* Puntos */}
        {points.map((p, i) => {
          const { px, py } = project(p.x, p.y)
          const color = colorForCluster(p.cluster_id)
          const isNoise = p.cluster_id < 0
          return (
            <motion.circle
              key={i}
              cx={px}
              cy={py}
              r={isNoise ? 2.5 : 4}
              fill={color}
              fillOpacity={isNoise ? 0.5 : 0.85}
              stroke={isNoise ? 'transparent' : 'rgba(0,0,0,0.25)'}
              strokeWidth={0.6}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: Math.min(i * 0.002, 0.6), duration: 0.25 }}
              onMouseEnter={() => setHover({ p, x: px, y: py })}
              style={{ cursor: 'pointer' }}
            />
          )
        })}

        {/* Tooltip */}
        {hover && (
          <g pointerEvents="none">
            <rect
              x={Math.min(hover.x + 8, width - 240)}
              y={Math.max(hover.y - 38, 4)}
              width={232}
              height={34}
              rx={6}
              fill="rgba(10,10,10,0.92)"
              stroke="rgba(255,255,255,0.12)"
            />
            <text
              x={Math.min(hover.x + 16, width - 232)}
              y={Math.max(hover.y - 22, 18)}
              fontSize={10}
              fontWeight={700}
              fill="#FACC15"
            >
              cluster {hover.p.cluster_id < 0 ? 'ruido' : hover.p.cluster_id}
            </text>
            <text
              x={Math.min(hover.x + 16, width - 232)}
              y={Math.max(hover.y - 9, 30)}
              fontSize={10}
              fill="rgba(220,220,220,0.95)"
            >
              {hover.p.preview.length > 38
                ? hover.p.preview.slice(0, 37) + '…'
                : hover.p.preview}
            </text>
          </g>
        )}
      </svg>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-componente: Bar chart de tamaño + cohesión por cluster
// ─────────────────────────────────────────────────────────────────────────────

interface SizeBarsProps {
  clusters: ClusterVizCluster[]
  maxBars?: number
}

const SizeBars: React.FC<SizeBarsProps> = ({ clusters, maxBars = 15 }) => {
  const sorted = useMemo(
    () => [...clusters].sort((a, b) => b.size - a.size).slice(0, maxBars),
    [clusters, maxBars]
  )
  const maxSize = sorted[0]?.size ?? 1

  if (sorted.length === 0) {
    return (
      <p className="text-xs text-secondary opacity-60 italic">
        Sin clusters para mostrar.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {sorted.map((c, i) => {
        const widthPct = (c.size / maxSize) * 100
        const color = colorForCluster(c.cluster_id)
        return (
          <div key={c.cluster_id} className="flex items-center gap-3 text-xs">
            <div className="w-16 flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-sm"
                style={{ backgroundColor: color }}
              />
              <span className="font-mono text-secondary">#{c.cluster_id}</span>
            </div>
            <div className="flex-1 relative h-5 bg-white/5 rounded overflow-hidden">
              <motion.div
                className="absolute left-0 top-0 h-full rounded"
                style={{ backgroundColor: color, opacity: 0.7 }}
                initial={{ width: 0 }}
                animate={{ width: `${widthPct}%` }}
                transition={{ duration: 0.6, delay: i * 0.04 }}
              />
              <div className="absolute inset-0 flex items-center justify-between px-2 text-[10px] font-bold">
                <span className="text-primary">{c.size} msgs</span>
                <span className="text-secondary">
                  coh {(c.cohesion * 100).toFixed(0)}%
                </span>
              </div>
            </div>
            {c.is_new ? (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gold/20 text-gold">
                NUEVO
              </span>
            ) : (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/5 text-secondary">
                CUBIERTO
              </span>
            )}
          </div>
        )
      })}
      {clusters.length > maxBars && (
        <p className="text-[10px] text-secondary opacity-60 italic pt-1">
          Mostrando top {maxBars} de {clusters.length} clusters.
        </p>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-componente: Donut clusterizado vs ruido
// ─────────────────────────────────────────────────────────────────────────────

interface NoiseDonutProps {
  clustered: number
  noise: number
  size?: number
}

const NoiseDonut: React.FC<NoiseDonutProps> = ({ clustered, noise, size = 160 }) => {
  const total = clustered + noise
  const pct = total > 0 ? clustered / total : 0
  const radius = size / 2 - 14
  const c = size / 2
  const circumference = 2 * Math.PI * radius
  const dash = pct * circumference

  return (
    <div className="flex items-center gap-5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={c}
            cy={c}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={14}
          />
          <motion.circle
            cx={c}
            cy={c}
            r={radius}
            fill="none"
            stroke="#00D9A0"
            strokeWidth={14}
            strokeLinecap="butt"
            initial={{ strokeDasharray: `0 ${circumference}` }}
            animate={{ strokeDasharray: `${dash} ${circumference - dash}` }}
            transition={{ duration: 0.8 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-primary">
            {(pct * 100).toFixed(0)}%
          </span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-secondary">
            agrupado
          </span>
        </div>
      </div>
      <div className="space-y-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#00D9A0]" />
          <span className="text-secondary">Clusterizados</span>
          <span className="text-primary font-semibold ml-auto">{clustered}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-sm bg-white/15" />
          <span className="text-secondary">Ruido</span>
          <span className="text-primary font-semibold ml-auto">{noise}</span>
        </div>
        <div className="pt-1 border-t border-white/5">
          <span className="text-secondary">Total: </span>
          <span className="text-primary font-semibold">{total}</span>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-componente: Cards de top-3 mensajes por cluster
// ─────────────────────────────────────────────────────────────────────────────

interface ClusterCardsProps {
  clusters: ClusterVizCluster[]
}

const ClusterCards: React.FC<ClusterCardsProps> = ({ clusters }) => {
  if (clusters.length === 0) {
    return (
      <p className="text-xs text-secondary opacity-60 italic">
        No hay clusters con mensajes para mostrar.
      </p>
    )
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {clusters.map((c) => {
        const color = colorForCluster(c.cluster_id)
        return (
          <div
            key={c.cluster_id}
            className="glass p-4 border-card-border"
            style={{ borderLeft: `3px solid ${color}` }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{ backgroundColor: color }}
                />
                <span className="font-mono text-xs text-secondary">
                  cluster #{c.cluster_id}
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/5 text-secondary">
                  {c.size} msgs
                </span>
              </div>
              {c.is_new ? (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gold/20 text-gold">
                  NUEVO
                </span>
              ) : (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/5 text-secondary">
                  CUBIERTO
                </span>
              )}
            </div>

            <ul className="space-y-1.5 text-xs text-primary">
              {c.top_messages.map((m) => (
                <li key={m.message_id} className="flex gap-2">
                  <span className="text-secondary font-mono text-[10px] mt-0.5 shrink-0">
                    {(m.similarity * 100).toFixed(0)}%
                  </span>
                  <span className="leading-snug">{m.text}</span>
                </li>
              ))}
              {c.top_messages.length === 0 && (
                <li className="text-secondary italic opacity-60">
                  (sin mensajes representativos)
                </li>
              )}
            </ul>

            {c.nearest_faq && (
              <p className="mt-3 pt-2 border-t border-white/5 text-[10px] text-secondary">
                FAQ más cercana: <span className="font-mono">{c.nearest_faq.faq_id.slice(0, 8)}…</span>{' '}
                ({(c.nearest_faq.similarity * 100).toFixed(0)}%)
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  data: ClusterVisualization
}

export const ClusterVisualizationPanel: React.FC<Props> = ({ data }) => {
  return (
    <div className="space-y-6">
      {/* Header con métricas globales */}
      <div className="glass p-5 border-card-border">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-1">
              Algoritmo
            </p>
            <p className="font-bold text-primary">{data.algorithm}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-1">
              Clusters
            </p>
            <p className="font-bold text-gold">{data.n_clusters}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-1">
              Mensajes
            </p>
            <p className="font-bold text-primary">{data.messages_total}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-1">
              Ruido
            </p>
            <p className="font-bold text-primary">
              {(data.noise_ratio * 100).toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-1">
              Tamaño promedio
            </p>
            <p className="font-bold text-primary">
              {data.size_distribution.mean.toFixed(1)}
            </p>
          </div>
        </div>
      </div>

      {/* Scatter + Donut lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass p-5 border-card-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-secondary uppercase tracking-widest">
              Mapa 2D de mensajes (PCA)
            </h3>
            {data.sampled && (
              <span className="text-[10px] text-secondary opacity-60">
                muestra de {data.sample_size} / {data.messages_total}
              </span>
            )}
          </div>
          <ScatterPlot points={data.points} />
          <p className="mt-3 text-[10px] text-secondary opacity-60 italic">
            Cada punto es un mensaje proyectado de 384-dim a 2D. Mensajes
            similares quedan cerca y comparten color.
          </p>
        </div>

        <div className="glass p-5 border-card-border">
          <h3 className="text-sm font-bold text-secondary uppercase tracking-widest mb-4">
            Distribución
          </h3>
          <NoiseDonut
            clustered={data.messages_clustered}
            noise={data.messages_noise}
          />
        </div>
      </div>

      {/* Bars de tamaños */}
      <div className="glass p-5 border-card-border">
        <h3 className="text-sm font-bold text-secondary uppercase tracking-widest mb-4">
          Top clusters por tamaño y cohesión
        </h3>
        <SizeBars clusters={data.clusters} />
      </div>

      {/* Cards top-3 */}
      <div>
        <h3 className="text-sm font-bold text-secondary uppercase tracking-widest mb-3">
          Mensajes representativos por cluster
        </h3>
        <ClusterCards clusters={data.clusters} />
      </div>
    </div>
  )
}

export default ClusterVisualizationPanel
