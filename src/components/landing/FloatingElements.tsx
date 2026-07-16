'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

/* 3D Floating geometric shapes for the background */
export default function FloatingElements() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ perspective: '1000px' }}>
      {/* ─── 3D Rotating Cube (top-left) ─── */}
      <motion.div
        className="absolute"
        style={{ top: '12%', left: '8%', transformStyle: 'preserve-3d' }}
        animate={{
          rotateX: [0, 360],
          rotateY: [0, 360],
          rotateZ: [0, 180],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
      >
        <div className="relative w-16 h-16 md:w-20 md:h-20" style={{ transformStyle: 'preserve-3d' }}>
          {/* Front face */}
          <div
            className="absolute inset-0 rounded-lg border border-cyan-400/20"
            style={{
              background: 'linear-gradient(135deg, rgba(34,211,238,0.08), rgba(8,145,178,0.04))',
              transform: 'translateZ(40px)',
            }}
          />
          {/* Back face */}
          <div
            className="absolute inset-0 rounded-lg border border-cyan-400/10"
            style={{
              background: 'rgba(34,211,238,0.03)',
              transform: 'translateZ(-40px) rotateY(180deg)',
            }}
          />
          {/* Left face */}
          <div
            className="absolute inset-0 rounded-lg border border-cyan-400/15"
            style={{
              background: 'rgba(8,145,178,0.05)',
              transform: 'rotateY(-90deg) translateZ(40px)',
            }}
          />
          {/* Right face */}
          <div
            className="absolute inset-0 rounded-lg border border-cyan-400/15"
            style={{
              background: 'rgba(0,119,182,0.05)',
              transform: 'rotateY(90deg) translateZ(40px)',
            }}
          />
          {/* Top face */}
          <div
            className="absolute inset-0 rounded-lg border border-cyan-400/20"
            style={{
              background: 'rgba(34,211,238,0.06)',
              transform: 'rotateX(90deg) translateZ(40px)',
            }}
          />
        </div>
      </motion.div>

      {/* ─── 3D Ring/Torus (top-right) ─── */}
      <motion.div
        className="absolute hidden md:block"
        style={{ top: '8%', right: '10%' }}
        animate={{
          rotateX: [0, 360],
          rotateY: [0, -180],
          rotateZ: [0, 90],
        }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
      >
        <div
          className="w-24 h-24 md:w-32 md:h-32 rounded-full border-2 border-cyan-400/15"
          style={{
            background: 'linear-gradient(135deg, rgba(34,211,238,0.05), transparent, rgba(8,145,178,0.05))',
            boxShadow: '0 0 40px rgba(34,211,238,0.05), inset 0 0 30px rgba(34,211,238,0.03)',
          }}
        >
          <div
            className="absolute inset-3 rounded-full border border-cyan-400/10"
            style={{
              background: 'linear-gradient(45deg, transparent, rgba(34,211,238,0.04), transparent)',
            }}
          />
        </div>
      </motion.div>

      {/* ─── Floating Pyramid (bottom-left) ─── */}
      <motion.div
        className="absolute hidden md:block"
        style={{ bottom: '15%', left: '12%', transformStyle: 'preserve-3d' }}
        animate={{
          rotateX: [0, 180, 360],
          rotateY: [0, -90, -180],
          y: [0, -20, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="w-14 h-14 md:w-16 md:h-16" style={{ transformStyle: 'preserve-3d' }}>
          <div
            className="absolute inset-0 border border-cyan-400/20"
            style={{
              background: 'linear-gradient(135deg, rgba(34,211,238,0.06), transparent)',
              clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
              transform: 'translateZ(20px)',
            }}
          />
          <div
            className="absolute inset-0 border border-cyan-400/10"
            style={{
              background: 'rgba(8,145,178,0.04)',
              clipPath: 'polygon(50% 100%, 100% 0%, 0% 0%)',
              transform: 'rotateX(180deg) translateZ(20px)',
            }}
          />
        </div>
      </motion.div>

      {/* ─── Floating Diamond (bottom-right) ─── */}
      <motion.div
        className="absolute"
        style={{ bottom: '20%', right: '5%', transformStyle: 'preserve-3d' }}
        animate={{
          rotateX: [0, 360],
          rotateY: [0, 360],
          y: [0, -15, 0],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="w-10 h-10 md:w-14 md:h-14 rotate-45">
          <div
            className="w-full h-full rounded-sm border border-cyan-400/20"
            style={{
              background: 'linear-gradient(135deg, rgba(34,211,238,0.08), rgba(0,119,182,0.04))',
              boxShadow: '0 0 20px rgba(34,211,238,0.05)',
            }}
          />
        </div>
      </motion.div>

      {/* ─── Floating Small Spheres ─── */}
      {[
        { top: '25%', left: '20%', size: 6, delay: 0, duration: 8 },
        { top: '60%', left: '5%', size: 8, delay: 2, duration: 10 },
        { top: '15%', right: '25%', size: 5, delay: 1, duration: 7 },
        { top: '70%', right: '15%', size: 7, delay: 3, duration: 9 },
        { top: '45%', left: '85%', size: 4, delay: 0.5, duration: 6 },
        { top: '80%', left: '40%', size: 6, delay: 1.5, duration: 8 },
      ].map((sphere, i) => (
        <motion.div
          key={`sphere-${i}`}
          className="absolute rounded-full hidden md:block"
          style={{
            width: sphere.size,
            height: sphere.size,
            top: sphere.top,
            left: sphere.left,
            right: sphere.right,
            background: 'radial-gradient(circle, rgba(34,211,238,0.5), rgba(34,211,238,0.1))',
            boxShadow: `0 0 ${sphere.size * 2}px rgba(34,211,238,0.3)`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, 10, -10, 0],
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{
            duration: sphere.duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: sphere.delay,
          }}
        />
      ))}

      {/* ─── 3D Perspective Grid (subtle) ─── */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[40%] opacity-[0.03] pointer-events-none hidden md:block"
        style={{
          background:
            'repeating-linear-gradient(90deg, rgba(34,211,238,0.5) 0px, transparent 1px, transparent 60px), repeating-linear-gradient(0deg, rgba(34,211,238,0.5) 0px, transparent 1px, transparent 60px)',
          transform: 'perspective(500px) rotateX(60deg)',
          transformOrigin: 'bottom center',
          maskImage: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 100%)',
        }}
      />
    </div>
  );
}