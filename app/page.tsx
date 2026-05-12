'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion, Variants } from 'framer-motion';
import { formatBytes } from '../lib/utils';
import { FileRecord } from '../lib/types';
import StatusBadge from '../components/StatusBadge';
import AuthGuard from '../components/AuthGuard';
import { getSession } from '../lib/auth';
import StatsDashboard from '../components/sections/StatsDashboard';
import StepsSection from '../components/sections/StepsSection';

// Load Polyhedron3D with dynamic import (no SSR) to avoid Three.js hydration issues
const Polyhedron3D = dynamic(() => import('../components/three/Polyhedron3D'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[500px] flex items-center justify-center">
      <div className="w-16 h-16 rounded-full border-2 border-[#FACC15]/30 border-t-[#FFB800] animate-spin" />
    </div>
  ),
});

// ─── Animation Variants ──────────────────────────────────
const heroTextVariants: Variants = {
  hidden: { opacity: 0, x: -50 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.8,
      ease: "easeOut",
    },
  }),
};

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const fileItemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4 },
  }),
  hover: {
    y: -4,
    borderColor: 'rgba(255, 184, 0, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    transition: { duration: 0.2 },
  },
};

export default function DashboardPage() {
  const [metrics, setMetrics] = useState({
    totalFiles: 0,
    pending: 0,
    processed: 0,
    errors: 0,
    faqsGenerated: 0,
    faqsApproved: 0,
  });
  const [recentFiles, setRecentFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const session = await getSession();
        if (!session) return;
        const token = session.access_token;

        // Fetch stats
        const statsRes = await fetch('/api/stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (statsRes.ok) {
          const stats = await statsRes.json();
          setMetrics(stats);
        }

        // Fetch recent files with limit=5
        const filesRes = await fetch('/api/files?limit=5');
        if (filesRes.ok) {
          const filesData = await filesRes.json();
          setRecentFiles(filesData.data || []);
          // Use count for totalFiles if stats failed or just as backup
          if (!statsRes.ok) {
            setMetrics(m => ({ ...m, totalFiles: filesData.count || 0 }));
          }
        }
      } catch (e) {
        console.error('Error fetching dashboard data', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <AuthGuard>
      <div className="min-h-screen text-primary font-sans">
        <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">

          {/* ═══ HERO SECTION ═══ */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20 min-h-[70vh]">
            {/* Left column: Text + CTAs */}
            <div className="flex flex-col items-start text-left">
              <motion.div
                custom={0}
                initial="hidden"
                animate="visible"
                variants={heroTextVariants}
                className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#FACC15]/10 text-[#FFB800] font-semibold text-sm mb-8 border border-[#FACC15]/20"
              >
                <span className="flex h-2 w-2 relative mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FACC15] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FACC15]"></span>
                </span>
                Sistema activo
              </motion.div>

              <motion.h1
                custom={1}
                initial="hidden"
                animate="visible"
                variants={heroTextVariants}
                className="text-5xl sm:text-6xl lg:text-[64px] font-extrabold tracking-tight text-primary leading-[1.1] mb-6"
              >
                Everwod <br />
                <span className="text-[#FFB800]">FAQs</span>
              </motion.h1>

              <motion.p
                custom={2}
                initial="hidden"
                animate="visible"
                variants={heroTextVariants}
                className="text-lg text-secondary leading-relaxed mb-8 max-w-[480px]"
              >
                Plataforma centralizada para gestión de conocimiento. Sube tus documentos base y conviértelos en FAQs automatizadas.
              </motion.p>

              <motion.div
                custom={3}
                initial="hidden"
                animate="visible"
                variants={heroTextVariants}
                className="flex gap-4 flex-wrap"
              >
                <Link
                  href="/upload"
                  className="bg-[#FACC15] hover:bg-[#eab308] text-[#0a0a0a] px-7 py-3.5 rounded-2xl font-bold text-sm transition-all duration-300 glow-gold glow-gold-hover"
                  data-cursor="pointer"
                >
                  <motion.span whileHover={{ scale: 1.05 }} className="block">Subir archivo</motion.span>
                </Link>
                <Link
                  href="/files"
                  className="bg-transparent hover:bg-primary/5 text-primary border border-primary/20 px-7 py-3.5 rounded-2xl font-semibold text-sm transition-all duration-300 hover:border-primary/40"
                  data-cursor="pointer"
                >
                  <motion.span whileHover={{ scale: 1.05 }} className="block">Ver archivos</motion.span>
                </Link>
              </motion.div>
            </div>

            {/* Right column: 3D Tree */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
              className="w-full h-full min-h-[500px] hidden lg:block"
            >
              <Polyhedron3D stats={metrics} />
            </motion.div>

            {/* Mobile: small tree background */}
            <div className="lg:hidden fixed inset-0 opacity-20 pointer-events-none z-0">
              <Polyhedron3D stats={metrics} compact />
            </div>
          </section>

          {/* ═══ STEPS SECTION ═══ */}
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeInUp}
            className="mb-20"
          >
            <h2 className="text-2xl font-bold text-primary mb-8 text-center">
              ¿Cómo <span className="text-[#FFB800]">funciona</span>?
            </h2>
            <StepsSection />
          </motion.section>

          {/* ═══ STATS DASHBOARD ═══ */}
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeInUp}
            className="mb-20"
          >
            <h2 className="text-2xl font-bold text-primary mb-8">
              Panel de <span className="text-[#FFB800]">Métricas</span>
            </h2>
            <StatsDashboard metrics={metrics} loading={loading} />
          </motion.section>

          {/* ═══ RECENT FILES SECTION ═══ */}
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeInUp}
            className="mb-20"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
              <h2 className="text-2xl font-bold text-primary">
                Archivos <span className="text-[#FFB800]">Recientes</span>
              </h2>
              <div className="flex flex-wrap gap-2">
                <span className="px-4 py-1.5 rounded-full text-sm font-semibold bg-[#FACC15] text-black">Todos</span>
                <span className="px-4 py-1.5 rounded-full text-sm font-semibold bg-primary/5 text-secondary border border-primary/10">Subidos</span>
                <span className="px-4 py-1.5 rounded-full text-sm font-semibold bg-primary/5 text-secondary border border-primary/10">Procesados</span>
                <span className="px-4 py-1.5 rounded-full text-sm font-semibold bg-primary/5 text-secondary border border-primary/10">Errores</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {recentFiles.length === 0 ? (
                <div className="text-center py-16 text-secondary opacity-40 glass">
                  <svg className="w-12 h-12 mx-auto mb-4 text-primary/10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <p className="text-lg mb-2 text-secondary">No hay archivos subidos todavía</p>
                  <Link href="/upload" className="text-[#FFB800] font-bold hover:underline">
                    Sube tu primer archivo aquí
                  </Link>
                </div>
              ) : (
                recentFiles.map((file, i) => {
                  const ext = file.type?.toLowerCase() || '';
                  let iconColor = 'text-primary';
                  let iconBg = 'bg-primary/10';
                  if (ext.includes('csv')) { iconColor = 'text-[#FFB800]'; iconBg = 'bg-[#FACC15]/10'; }
                  if (ext.includes('json')) { iconColor = 'text-[#00D9A0]'; iconBg = 'bg-[#00D9A0]/10'; }
                  if (ext.includes('txt')) { iconColor = 'text-[#FF6B6B]'; iconBg = 'bg-[#FF6B6B]/10'; }
                  if (ext.includes('sql')) { iconColor = 'text-[#9F7AEA]'; iconBg = 'bg-[#9F7AEA]/10'; }

                  return (
                    <motion.div
                      key={file.id}
                      custom={i}
                      initial="hidden"
                      animate="visible"
                      whileHover="hover"
                      variants={fileItemVariants}
                    >
                      <Link
                        href={`/files/${file.id}`}
                        className="group flex items-center justify-between p-4 glass transition-all duration-300"
                        data-cursor="pointer"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm ${iconBg} ${iconColor}`}>
                            {ext || '?'}
                          </div>
                          <div>
                            <div className="font-bold text-primary mb-1 truncate max-w-[200px] md:max-w-md">{file.original_name}</div>
                            <div className="text-xs text-secondary flex items-center gap-2">
                              <span className="font-medium text-primary opacity-60">{file.owner}</span>
                              <span>&bull;</span>
                              <span>{formatBytes(file.size_bytes)}</span>
                              <span>&bull;</span>
                              <span>{new Date(file.uploaded_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="hidden md:block">
                            <StatusBadge status={file.status} />
                          </div>
                          <svg className="w-5 h-5 text-primary/20 group-hover:text-[#FFB800] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.section>

          {/* ═══ FINAL CTA ═══ */}
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <div className="bg-gradient-to-br from-[#FFB800] to-[#e6a600] rounded-3xl p-10 md:p-14 flex flex-col md:flex-row items-center justify-between gap-8">
              <div>
                <h2 className="text-3xl md:text-4xl font-extrabold text-black mb-4">¿Listo para subir tu primer archivo?</h2>
                <p className="text-black/70 font-medium text-lg max-w-xl">
                  Comienza a generar FAQs automáticas y mejora la experiencia de tus usuarios en minutos.
                </p>
              </div>
              <Link
                href="/upload"
                className="shrink-0 bg-black text-[#FFB800] px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-900 transition-colors hover:scale-105 duration-300"
                data-cursor="pointer"
              >
                Subir archivo ahora
              </Link>
            </div>
          </motion.section>

        </main>
      </div>
    </AuthGuard>
  );
}
