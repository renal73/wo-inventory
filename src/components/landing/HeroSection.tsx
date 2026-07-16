'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ArrowRight } from 'lucide-react';

/* ENGSYS Molecular Logo SVG */
function ENGSYSLogo({ size = 80 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: 'drop-shadow(0 2px 20px rgba(34, 211, 238, 0.5))' }}
    >
      <circle cx="50" cy="50" r="48" fill="url(#hero-logo-bg)" opacity="0.12" />
      {/* Molecular connections */}
      <path
        d="M30 25 C30 25, 45 35, 55 30 C65 25, 72 20, 75 25 C78 30, 70 40, 60 42 C50 44, 38 48, 30 40 Z"
        fill="url(#hero-anvita-grad)"
        opacity="0.95"
      />
      <path
        d="M55 30 C60 35, 65 50, 60 60 C55 70, 45 75, 40 68 C35 61, 38 50, 45 42 C52 34, 55 30, 55 30 Z"
        fill="url(#hero-anvita-grad)"
        opacity="0.85"
      />
      <path
        d="M30 40 C25 50, 22 62, 28 70 C34 78, 42 78, 40 68 C38 58, 32 48, 30 40 Z"
        fill="url(#hero-anvita-grad)"
        opacity="0.75"
      />
      {/* Node circles */}
      <circle cx="30" cy="25" r="8" fill="url(#hero-anvita-grad)" />
      <circle cx="75" cy="25" r="7" fill="url(#hero-anvita-grad)" opacity="0.9" />
      <circle cx="60" cy="60" r="9" fill="url(#hero-anvita-grad)" />
      <circle cx="28" cy="70" r="6" fill="url(#hero-anvita-grad)" opacity="0.8" />
      <circle cx="55" cy="30" r="5" fill="#fff" opacity="0.6" />
      {/* Inner highlights */}
      <circle cx="30" cy="24" r="3" fill="#fff" opacity="0.4" />
      <circle cx="60" cy="59" r="3.5" fill="#fff" opacity="0.4" />
      <circle cx="75" cy="24" r="2.5" fill="#fff" opacity="0.3" />
      <defs>
        <linearGradient id="hero-anvita-grad" x1="20%" y1="20%" x2="80%" y2="80%">
          <stop offset="0%" stopColor="#22D3EE" />
          <stop offset="50%" stopColor="#0891B2" />
          <stop offset="100%" stopColor="#0077B6" />
        </linearGradient>
        <radialGradient id="hero-logo-bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#0891B2" stopOpacity="0.05" />
        </radialGradient>
      </defs>
    </svg>
  );
}

interface HeroSectionProps {
  onLoginClick: () => void;
}

export default function HeroSection({ onLoginClick }: HeroSectionProps) {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 py-20">
      {/* ─── 3D Logo Container ─── */}
      <motion.div
        className="relative mb-8 md:mb-10"
        style={{ perspective: '1000px' }}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        {/* Outer glow ring */}
        <motion.div
          className="absolute inset-0 rounded-3xl"
          style={{
            background: 'linear-gradient(135deg, rgba(34,211,238,0.3), rgba(8,145,178,0.15), rgba(0,119,182,0.3))',
            filter: 'blur(20px)',
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Logo wrapper with 3D rotation */}
        <motion.div
          className="relative w-24 h-24 md:w-32 md:h-32 rounded-3xl"
          style={{
            transformStyle: 'preserve-3d',
            background: 'linear-gradient(135deg, #22D3EE, #0891B2, #0077B6)',
          }}
          animate={{
            rotateY: [0, 5, -5, 0],
            rotateX: [0, 3, -3, 0],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div
            className="absolute inset-[2px] rounded-[22px] flex items-center justify-center"
            style={{ background: '#060B18' }}
          >
            <ENGSYSLogo size={64} />
          </div>
        </motion.div>
      </motion.div>

      {/* ─── Title ─── */}
      <motion.div
        className="text-center mb-8 md:mb-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3 }}
      >
        <motion.h1
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight mb-3"
          style={{
            background: 'linear-gradient(135deg, #22D3EE 0%, #0891B2 40%, #0077B6 70%, #22D3EE 100%)',
            backgroundSize: '200% 200%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animation: 'gradient-shift 4s ease infinite',
          }}
        >
          ENGSYS
        </motion.h1>

        <motion.p
          className="text-lg sm:text-xl md:text-2xl font-bold text-white/80 tracking-tight mb-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          Engineering System
        </motion.p>

        <motion.p
          className="text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] text-white/30 mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          Powering Your Maintenance Excellence
        </motion.p>

        <motion.p
          className="text-[11px] sm:text-xs text-white/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          Dari Laporan, Menuju Solusi
        </motion.p>
      </motion.div>

      {/* ─── CTA Buttons ─── */}
      <motion.div
        className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mb-16 md:mb-20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.9 }}
      >
        <motion.button
          onClick={onLoginClick}
          className="group relative px-8 py-3.5 rounded-xl font-bold text-sm text-white overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #22D3EE 0%, #0891B2 50%, #0077B6 100%)',
            boxShadow: '0 4px 20px rgba(34, 211, 238, 0.35)',
          }}
          whileHover={{ scale: 1.05, boxShadow: '0 6px 30px rgba(34, 211, 238, 0.5)' }}
          whileTap={{ scale: 0.97 }}
        >
          {/* Shimmer */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          <span className="relative flex items-center gap-2">
            Masuk ke Sistem
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </span>
        </motion.button>

        <motion.button
          onClick={() => {
            document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="group px-8 py-3.5 rounded-xl font-bold text-sm text-white/70 hover:text-white transition-colors"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
          whileHover={{ scale: 1.05, borderColor: 'rgba(34,211,238,0.3)' }}
          whileTap={{ scale: 0.97 }}
        >
          <span className="flex items-center gap-2">
            Pelajari Lebih Lanjut
            <ChevronDown size={16} className="group-hover:translate-y-0.5 transition-transform" />
          </span>
        </motion.button>
      </motion.div>

      {/* ─── Scroll Indicator ─── */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 8, 0] }}
        transition={{
          opacity: { duration: 0.6, delay: 1.5 },
          y: { duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 1.5 },
        }}
      >
        <div className="flex flex-col items-center gap-2">
          <span className="text-[9px] text-white/20 uppercase tracking-widest font-semibold">Scroll</span>
          <div className="w-5 h-8 rounded-full border border-white/20 flex items-start justify-center p-1">
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-cyan-400/60"
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        </div>
      </motion.div>
    </section>
  );
}