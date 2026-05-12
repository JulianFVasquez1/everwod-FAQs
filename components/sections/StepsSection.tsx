'use client';

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { motion, Variants } from 'framer-motion';

// ─── Animation Variants ──────────────────────────────────
const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
  hover: {
    y: -10,
    borderColor: 'rgba(255, 184, 0, 0.4)',
    boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
    transition: { duration: 0.3, ease: 'easeOut' },
  },
};

function SpinningIcosahedron() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.8;
      ref.current.rotation.x += delta * 0.2;
    }
  });
  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[0.8, 0]} />
      <meshStandardMaterial color="#FFB800" emissive="#FFB800" emissiveIntensity={0.3} wireframe />
    </mesh>
  );
}

function PulsingOctahedron() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.6;
      const s = 1 + Math.sin(clock.elapsedTime * 2) * 0.1;
      ref.current.scale.setScalar(s);
    }
  });
  return (
    <mesh ref={ref}>
      <octahedronGeometry args={[0.8, 0]} />
      <meshStandardMaterial color="#00D9A0" emissive="#00D9A0" emissiveIntensity={0.3} wireframe />
    </mesh>
  );
}

function OrbitingSpheres() {
  const groupRef = useRef<THREE.Group>(null);
  const sphereRefs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame(({ clock }, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.4;
    }
    sphereRefs.current.forEach((sphere, i) => {
      if (sphere) {
        const angle = clock.elapsedTime * 0.8 + (i / 5) * Math.PI * 2;
        sphere.position.x = Math.cos(angle) * 0.6;
        sphere.position.z = Math.sin(angle) * 0.6;
        sphere.position.y = Math.sin(angle * 2) * 0.15;
      }
    });
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <torusGeometry args={[0.6, 0.05, 8, 32]} />
        <meshStandardMaterial color="#FF6B6B" emissive="#FF6B6B" emissiveIntensity={0.3} />
      </mesh>
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={i} ref={(el) => { sphereRefs.current[i] = el; }}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial color="#FF6B6B" emissive="#FF6B6B" emissiveIntensity={0.5} />
        </mesh>
      ))}
    </group>
  );
}

function MiniCanvas({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-20 h-20 mx-auto mb-4">
      <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 2.5], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[2, 2, 2]} intensity={0.8} />
        {children}
      </Canvas>
    </div>
  );
}

// ─── Steps Data ───────────────────────────────────────────
const steps = [
  {
    number: 1,
    title: 'Sube tu archivo',
    description: 'CSV, JSON o TXT · máximo 10MB. Arrastra o selecciona desde tu dispositivo.',
    Icon: SpinningIcosahedron,
  },
  {
    number: 2,
    title: 'Validación automática',
    description: 'Formato, tamaño, metadatos y clasificación de contenido inteligente.',
    Icon: PulsingOctahedron,
  },
  {
    number: 3,
    title: 'FAQs generadas',
    description: 'Preguntas y respuestas listas para revisión, edición y aprobación.',
    Icon: OrbitingSpheres,
  },
];

// ─── Component ───────────────────────────────────────────
export default function StepsSection() {
  return (
    <motion.section
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      className="w-full"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {steps.map((step) => (
          <motion.div
            key={step.number}
            variants={cardVariants}
            whileHover="hover"
            className="glass p-8 text-center group transition-all duration-300"
          >
            {/* Step number */}
            <div className="w-10 h-10 rounded-full bg-[#FACC15] text-[#0a0a0a] font-bold text-lg flex items-center justify-center mx-auto mb-4">
              {step.number}
            </div>

            {/* Mini 3D Canvas */}
            <MiniCanvas>
              <step.Icon />
            </MiniCanvas>

            {/* Text */}
            <h3 className="text-lg font-bold text-primary mb-2">{step.title}</h3>
            <p className="text-sm text-secondary leading-relaxed">{step.description}</p>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
