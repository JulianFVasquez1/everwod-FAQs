'use client';

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';
import { useTheme } from '../providers/ThemeProvider';

interface Polyhedron3DProps {
  stats?: {
    totalFiles?: number;
    faqsGenerated?: number;
    processed?: number;
  };
  compact?: boolean;
}

interface SceneProps extends Polyhedron3DProps {
  themeColor: string;
  isLight: boolean;
}

function PolyhedronScene({ stats, compact, themeColor, isLight }: SceneProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  
  const [hovered, setHovered] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(1);
  const [pulseScale, setPulseScale] = useState(1);
  
  // Track total files to trigger pulse
  const lastTotalFiles = useRef(stats?.totalFiles || 0);

  // Scroll listener
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      // Map scroll to a speed multiplier (e.g., 1 to 5)
      const newSpeed = 1 + (scrollY / 500);
      setScrollSpeed(Math.min(newSpeed, 5));
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Pulse effect on file load
  useEffect(() => {
    if (stats?.totalFiles && stats.totalFiles > lastTotalFiles.current) {
      // Trigger pulse
      setPulseScale(1.2);
      setTimeout(() => setPulseScale(1), 500);
    }
    lastTotalFiles.current = stats?.totalFiles || 0;
  }, [stats?.totalFiles]);

  // Particles data
  const particles = useMemo(() => {
    const count = 100;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const colorPalette = [
      new THREE.Color('#FFB800'),
      new THREE.Color('#00D9A0'),
      new THREE.Color('#9F7AEA'),
    ];

    for (let i = 0; i < count; i++) {
      // Random position inside a sphere of radius 0.8
      const r = Math.random() * 0.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    return { positions, colors };
  }, []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Base rotation speed
    const baseSpeed = 0.2;
    const hoverMultiplier = hovered ? 4 : 1;
    const totalMultiplier = baseSpeed * hoverMultiplier * scrollSpeed;

    meshRef.current.rotation.x += delta * totalMultiplier;
    meshRef.current.rotation.y += delta * totalMultiplier * 0.8;
    meshRef.current.rotation.z += delta * totalMultiplier * 0.5;

    if (glowRef.current) {
      glowRef.current.rotation.x = meshRef.current.rotation.x;
      glowRef.current.rotation.y = meshRef.current.rotation.y;
      glowRef.current.rotation.z = meshRef.current.rotation.z;
    }

    // Pulse animation (smoothly interpolate)
    const targetScale = pulseScale;
    meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    if (glowRef.current) {
      const glowScale = targetScale * 1.05;
      glowRef.current.scale.lerp(new THREE.Vector3(glowScale, glowScale, glowScale), 0.1);
    }

    // Organic particle movement
    if (particlesRef.current) {
      particlesRef.current.rotation.y += delta * 0.05;
      particlesRef.current.rotation.z += delta * 0.03;
      
      // Add a slight "breathing" scale to particles
      const s = 1 + Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
      particlesRef.current.scale.set(s, s, s);
    }
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[2, 2, 2]} color="#FFB800" intensity={2} />
      <pointLight position={[-2, -2, -2]} color="#00D9A0" intensity={0.5} />

      <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
        <group 
          onPointerOver={() => setHovered(true)} 
          onPointerOut={() => setHovered(false)}
        >
          {/* Main Polyhedron Wireframe */}
          <mesh ref={meshRef}>
            <icosahedronGeometry args={[1, 0]} />
            <meshStandardMaterial 
              color={themeColor} 
              wireframe 
              transparent 
              opacity={isLight ? 0.95 : 0.9} 
              emissive={isLight ? '#000000' : themeColor}
              emissiveIntensity={isLight ? 0 : 1}
            />
          </mesh>

          {/* Glow Layer (slightly larger, more transparent) */}
          <mesh ref={glowRef}>
            <icosahedronGeometry args={[1, 0]} />
            <meshStandardMaterial 
              color={themeColor} 
              wireframe 
              transparent 
              opacity={isLight ? 0.15 : 0.3} 
              emissive={isLight ? '#000000' : themeColor}
              emissiveIntensity={isLight ? 0 : 3}
            />
          </mesh>

          {/* Interior Particles */}
          <points ref={particlesRef}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={particles.positions.length / 3}
                array={particles.positions}
                itemSize={3}
              />
              <bufferAttribute
                attach="attributes-color"
                count={particles.colors.length / 3}
                array={particles.colors}
                itemSize={3}
              />
            </bufferGeometry>
            <pointsMaterial
              size={0.04}
              vertexColors
              transparent
              opacity={0.8}
              sizeAttenuation
            />
          </points>
        </group>
      </Float>
    </>
  );
}

export default function Polyhedron3D({ stats, compact }: Polyhedron3DProps) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const themeColor = isLight ? '#0a0a0a' : '#FFB800';

  return (
    <div style={{ 
      width: '100%', 
      height: compact ? 300 : '100%', 
      minHeight: compact ? 300 : 500,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, 3], fov: 45 }}
        style={{ background: 'transparent' }}
      >
        <PolyhedronScene
          stats={stats}
          compact={compact}
          themeColor={themeColor}
          isLight={isLight}
        />
      </Canvas>
    </div>
  );
}
