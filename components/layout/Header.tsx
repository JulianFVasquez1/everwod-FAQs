'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import LogoutButton from '../LogoutButton';
import { useTheme } from '../providers/ThemeProvider';
import { useDetectorHealth } from '../../hooks/useDetectorHealth';

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { online, health, lastCheckedAt } = useDetectorHealth();

  const statusLabel =
    online === null ? 'Verificando…' : online ? 'Detector activo' : 'Detector caído';
  const statusColor =
    online === null ? '#FACC15' : online ? '#00D9A0' : '#FF4D4D';
  const statusTitle = lastCheckedAt
    ? `Último check: ${lastCheckedAt.toLocaleTimeString()}${health?.version ? ` · v${health.version}` : ''}`
    : 'Verificando estado del detector';

  const navLinks = [
    { href: '/upload', label: 'Subir' },
    { href: '/files', label: 'Archivos' },
    { href: '/suggestions', label: 'Sugerencias' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/', label: 'Métricas' },
  ];

  return (
    <>
      <nav
        className="fixed top-0 inset-x-0 z-50 glass border-b border-card-border"
        style={{ borderRadius: 0 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-1.5" data-cursor="pointer">
              <span className="font-extrabold text-xl tracking-tight text-primary">
                everwod
              </span>
              <span className="font-bold text-xl text-gold">FAQ Cloud</span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center space-x-6">
              <div className="flex items-center space-x-6 mr-4 border-r border-card-border pr-6 h-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.href + link.label}
                    href={link.href}
                    className="nav-link text-sm font-semibold transition-all hover:text-primary"
                    data-cursor="pointer"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              {/* Active system badge */}
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 border border-card-border"
                title={statusTitle}
              >
                <span className="relative flex h-2 w-2">
                  {online && (
                    <span
                      className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                      style={{ backgroundColor: statusColor }}
                    ></span>
                  )}
                  <span
                    className="relative inline-flex rounded-full h-2 w-2"
                    style={{ backgroundColor: statusColor }}
                  ></span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                  {statusLabel}
                </span>
              </div>

              {/* Theme Toggle Premium Switch */}
              <button
                onClick={toggleTheme}
                className="relative flex items-center justify-between w-14 h-7 rounded-full p-1 bg-white/5 border border-card-border hover:border-gold/50 transition-all duration-300 overflow-hidden group"
                data-cursor="pointer"
                title={`Cambiar a modo ${theme === 'dark' ? 'claro' : 'oscuro'}`}
              >
                <motion.div
                  className="absolute inset-y-1 left-1 w-5 h-5 rounded-full premium-gradient shadow-lg"
                  animate={{ 
                    x: theme === 'dark' ? 0 : 28,
                  }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
                <div className="z-10 flex w-full justify-around items-center">
                  <svg className={`w-3 h-3 ${theme === 'dark' ? 'text-black' : 'text-secondary opacity-50'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  <svg className={`w-3 h-3 ${theme === 'light' ? 'text-black' : 'text-secondary opacity-50'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </button>

              {/* Upload button */}
              <Link
                href="/upload"
                className="premium-gradient px-5 py-2 rounded-full text-xs font-bold transition-all duration-300 hover:scale-105"
                data-cursor="pointer"
              >
                + Subir archivo
              </Link>

              <LogoutButton />
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden text-secondary hover:text-primary transition-colors p-2"
              onClick={() => setMobileOpen(!mobileOpen)}
              data-cursor="pointer"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-0 z-40 md:hidden"
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            {/* Menu */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="absolute right-0 top-16 bottom-0 w-72 glass border-l border-card-border"
              style={{ borderRadius: 0 }}
            >
              <div className="flex flex-col p-6 space-y-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href + link.label}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="text-lg font-semibold text-secondary hover:text-primary transition-colors py-2 border-b border-card-border"
                  >
                    {link.label}
                  </Link>
                ))}

                <Link
                  href="/upload"
                  onClick={() => setMobileOpen(false)}
                  className="bg-[#FACC15] text-[#0a0a0a] px-5 py-3 rounded-full text-sm font-bold text-center mt-4 glow-gold"
                >
                  + Subir archivo
                </Link>

                <button
                  onClick={() => { toggleTheme(); setMobileOpen(false); }}
                  className="flex items-center gap-3 py-2 text-secondary hover:text-primary transition-colors"
                >
                  {theme === 'dark' ? '☀️' : '🌙'} Modo {theme === 'dark' ? 'Claro' : 'Oscuro'}
                </button>

                <div className="pt-4 border-t border-card-border">
                  <LogoutButton />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
