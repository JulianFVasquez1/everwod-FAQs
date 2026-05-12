'use client';

import React from 'react';
import LenisProvider from '../providers/LenisProvider';
import ThemeProvider from '../providers/ThemeProvider';
import ParticleField from '../ui/ParticleField';
import CustomCursor from '../ui/CustomCursor';
import Header from './Header';

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LenisProvider>
        {/* Background particles */}
        <ParticleField />

        {/* Custom cursor */}
        <CustomCursor />

        {/* Navigation Header */}
        <Header />

        {/* Main content - offset for fixed nav */}
        <main className="relative z-10 pt-16">
          {children}
        </main>
      </LenisProvider>
    </ThemeProvider>
  );
}
