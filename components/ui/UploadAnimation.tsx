'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface UploadAnimationProps {
  active: boolean;
  phase: 'uploading' | 'success' | 'idle';
}

export default function UploadAnimation({ active, phase }: UploadAnimationProps) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[60] pointer-events-none flex items-center justify-center"
        >
          {phase === 'uploading' && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="relative"
            >
              {/* Seed / uploading indicator */}
              <motion.div
                animate={{
                  rotate: 360,
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  rotate: { duration: 2, repeat: Infinity, ease: 'linear' },
                  scale: { duration: 1, repeat: Infinity, ease: 'easeInOut' },
                }}
                className="w-16 h-16 relative"
              >
                <div className="absolute inset-0 rounded-full border-2 border-[#FACC15]/30" />
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#FFB800] animate-spin" />
                <div className="absolute inset-2 rounded-full bg-[#FACC15]/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#FFB800]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
              </motion.div>

              {/* Orbiting particles */}
              {[0, 1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full bg-[#FACC15]"
                  style={{
                    top: '50%',
                    left: '50%',
                  }}
                  animate={{
                    x: [0, Math.cos((i / 4) * Math.PI * 2) * 40, 0],
                    y: [0, Math.sin((i / 4) * Math.PI * 2) * 40, 0],
                    opacity: [0, 0.8, 0],
                    scale: [0, 1, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.3,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </motion.div>
          )}

          {phase === 'success' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="relative"
            >
              {/* Flash */}
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: [0, 0.8, 0], scale: [0.5, 3, 4] }}
                transition={{ duration: 0.6 }}
                className="absolute inset-0 rounded-full bg-white/20 blur-xl"
                style={{ width: 120, height: 120, marginLeft: -60, marginTop: -60 }}
              />

              {/* Success icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
                className="w-20 h-20 rounded-full bg-[#00D9A0]/20 border-2 border-[#00D9A0] flex items-center justify-center"
              >
                <svg className="w-10 h-10 text-[#00D9A0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <motion.path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                  />
                </svg>
              </motion.div>

              {/* Exploding particles */}
              {Array.from({ length: 10 }).map((_, i) => {
                const angle = (i / 10) * Math.PI * 2;
                return (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: i % 2 === 0 ? '#FFB800' : '#00D9A0',
                      top: '50%',
                      left: '50%',
                    }}
                    initial={{ x: 0, y: 0, opacity: 1 }}
                    animate={{
                      x: Math.cos(angle) * 80,
                      y: Math.sin(angle) * 80,
                      opacity: 0,
                      scale: [1, 0],
                    }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                  />
                );
              })}
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
