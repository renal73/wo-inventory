'use client';

import React, { useState } from 'react';

interface MagicCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}

export function MagicCard({ children, className = '', glowColor = 'rgba(37, 99, 235, 0.08)' }: MagicCardProps) {
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative overflow-hidden border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-xs transition-all duration-300 hover:shadow-md ${className}`}
    >
      {/* Efek Radial Gradient Mengikuti Kursor */}
      <div
        className="pointer-events-none absolute -inset-px rounded-2xl transition-opacity duration-500"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(300px circle at ${coords.x}px ${coords.y}px, ${glowColor}, transparent 80%)`,
        }}
      />
      
      {/* Konten Utama */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
