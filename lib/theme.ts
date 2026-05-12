/**
 * Centralized theme constants for Everwod FAQ Cloud.
 * Colors, breakpoints, category→color mappings, and animation timings.
 */

// ─── Palette ───────────────────────────────────────────────
export const colors = {
  // Backgrounds
  bgDark: '#0a0a0a',
  bgDarkEnd: '#1a1a2e',
  bgForest: '#0d1f0d',
  bgCard: 'rgba(255,255,255,0.03)',
  bgCardBorder: 'rgba(255,255,255,0.08)',

  // Primary
  gold: '#FFB800',
  goldGlow: 'rgba(255,184,0,0.3)',
  goldSubtle: 'rgba(255,184,0,0.1)',

  // Success / Accents
  neonGreen: '#00D9A0',
  purple: '#9F7AEA',
  red: '#FF6B6B',
  blue: '#60A5FA',
  orange: '#F97316',
  amber: '#F59E0B',
  emerald: '#10B981',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0A0',

  // Tree
  trunk: '#4a3728',
  canopy: '#1a472a',
} as const;

// ─── Category Colors (for Polyhedron3D accents) ────────────
export const categoryColors: Record<string, string> = {
  precios: colors.gold,
  soporte: colors.neonGreen,
  horarios: colors.purple,
  cancelaciones: colors.red,
  configuración: colors.blue,
  'atención humana': colors.orange,
  general: colors.amber,
};

// ─── Stats metric colors ───────────────────────────────────
export const statColors = {
  totalFiles: colors.gold,
  pending: colors.amber,
  processed: colors.neonGreen,
  errors: colors.red,
  faqsGenerated: colors.purple,
  faqsApproved: colors.emerald,
} as const;

// ─── Animation timings ────────────────────────────────────
export const timing = {
  stagger: 0.1,
  entryDuration: 0.8,
  entryEase: 'power3.out',
  scrollFade: 0.6,
  cursorLerp: 0.1,
  particleCount: 30,
  leafCount: 50,
} as const;

// ─── Breakpoints ──────────────────────────────────────────
export const breakpoints = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280,
} as const;
