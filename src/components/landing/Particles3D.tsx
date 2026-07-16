'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';

// Generate deterministic particles (same on server and client)
function generateParticles(count: number) {
  const particles = [];
  // Use a simple seeded random for deterministic values
  const seed = (i: number) => {
    const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
  };

  for (let i = 0; i < count; i++) {
    const angle = seed(i * 7) * Math.PI * 2;
    const radius = 200 + seed(i * 13) * 400;
    particles.push({
      id: i,
      size: 1.5 + seed(i * 3) * 3,
      x: 50 + Math.cos(angle) * (radius / 10),
      y: 50 + Math.sin(angle) * (radius / 10),
      z: -100 + seed(i * 17) * 200,
      color: i % 3 === 0 ? 'rgba(34,211,238,0.6)' : i % 3 === 1 ? 'rgba(0,119,182,0.3)' : 'rgba(20,184,166,0.4)',
      duration: 20 + seed(i * 11) * 30,
      delay: seed(i * 19) * 10,
      glowSize: 0,
    });
  }
  return particles;
}

// Generate deterministic lines
function generateLines(count: number) {
  const lines = [];
  const seed = (i: number) => {
    const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
  };

  for (let i = 0; i < count; i++) {
    lines.push({
      id: i,
      x1: 10 + seed(i * 5) * 80,
      y1: 10 + seed(i * 7) * 80,
      x2: 10 + seed(i * 11) * 80,
      y2: 10 + seed(i * 13) * 80,
      duration: 6 + seed(i * 17) * 10,
      delay: seed(i * 23) * 5,
    });
  }
  return lines;
}

export default function Particles3D({ children }: { children?: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  
  // Generate particles only on client side
  const particles = useMemo(() => mounted ? generateParticles(20) : [], [mounted]);
  const lines = useMemo(() => mounted ? generateLines(12) : [], [mounted]);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative overflow-hidden">
      {/* Background particles container */}
      {mounted && (
        <div className="absolute inset-0 pointer-events-none" style={{ perspective: '1000px' }}>
          {/* Grid lines */}
          <svg className="absolute inset-0 w-full h-full" style={{ transform: 'rotateX(60deg) translateZ(-50px)', opacity: 0.15 }}>
            {lines.map((line) => (
              <line
                key={`line-${line.id}`}
                x1={`${line.x1}%`}
                y1={`${line.y1}%`}
                x2={`${line.x2}%`}
                y2={`${line.y2}%`}
                stroke="rgba(34,211,238,0.3)"
                strokeWidth="0.5"
                style={{
                  animation: `line-pulse ${line.duration}s ease-in-out infinite`,
                  animationDelay: `${line.delay}s`,
                }}
              />
            ))}
          </svg>

          {/* Floating particles */}
          {particles.map((particle) => (
            <div
              key={`particle-${particle.id}`}
              className="absolute rounded-full"
              style={{
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                background: particle.color,
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                transform: `translateZ(${particle.z}px)`,
                animation: `particle-3d-float ${particle.duration}s ease-in-out infinite`,
                animationDelay: `${particle.delay}s`,
                boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
              }}
            />
          ))}
        </div>
      )}

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}