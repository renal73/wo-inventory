'use client';

import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthContext';
import Particles3D from '@/components/landing/Particles3D';
import FloatingElements from '@/components/landing/FloatingElements';
import HeroSection from '@/components/landing/HeroSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import StatsSection from '@/components/landing/StatsSection';
import LoginModal from '@/components/landing/LoginModal';

function NavBar({ onLoginClick }: { onLoginClick: () => void }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-40 px-4 sm:px-6"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className="max-w-6xl mx-auto mt-3 sm:mt-4 px-4 sm:px-6 py-3 rounded-2xl flex items-center justify-between transition-all duration-300"
        style={{
          background: scrolled ? 'rgba(6, 11, 24, 0.9)' : 'rgba(6, 11, 24, 0.5)',
          border: `1px solid ${scrolled ? 'rgba(34, 211, 238, 0.15)' : 'rgba(255, 255, 255, 0.06)'}`,
          backdropFilter: 'blur(20px)',
          boxShadow: scrolled ? '0 8px 32px rgba(0,0,0,0.3)' : 'none',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #22D3EE, #0891B2)' }}
          >
            <div className="absolute inset-[1.5px] rounded-[10px] flex items-center justify-center" style={{ background: '#060B18' }}>
              <svg width="18" height="18" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M30 25 C30 25, 45 35, 55 30 C65 25, 72 20, 75 25 C78 30, 70 40, 60 42 C50 44, 38 48, 30 40 Z" fill="#22D3EE" opacity="0.95"/>
                <path d="M55 30 C60 35, 65 50, 60 60 C55 70, 45 75, 40 68 C35 61, 38 50, 45 42 C52 34, 55 30, 55 30 Z" fill="#22D3EE" opacity="0.85"/>
                <path d="M30 40 C25 50, 22 62, 28 70 C34 78, 42 78, 40 68 C38 58, 32 48, 30 40 Z" fill="#22D3EE" opacity="0.75"/>
                <circle cx="30" cy="25" r="8" fill="#22D3EE"/>
                <circle cx="75" cy="25" r="7" fill="#22D3EE" opacity="0.9"/>
                <circle cx="60" cy="60" r="9" fill="#22D3EE"/>
                <circle cx="28" cy="70" r="6" fill="#22D3EE" opacity="0.8"/>
              </svg>
            </div>
          </div>
          <div>
            <span className="text-sm sm:text-base font-black text-white tracking-tight" style={{ fontFamily: 'var(--font-sans)' }}>
              ENG<span style={{ color: '#22D3EE' }}>SYS</span>
            </span>
            <p className="text-[8px] sm:text-[9px] text-white/30 font-semibold uppercase tracking-[0.15em] -mt-0.5 hidden sm:block">
              Engineering System
            </p>
          </div>
        </div>

        {/* Nav links - hidden on mobile */}
        <div className="hidden md:flex items-center gap-1">
          {['Fitur', 'Statistik', 'Tentang'].map((item) => (
            <a
              key={item}
              href={item === 'Fitur' ? '#features' : '#'}
              className="px-3 py-1.5 text-xs font-semibold text-white/50 hover:text-white/80 transition-colors rounded-lg hover:bg-white/5"
            >
              {item}
            </a>
          ))}
        </div>

        {/* CTA */}
        <motion.button
          onClick={onLoginClick}
          className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white relative overflow-hidden group"
          style={{
            background: 'linear-gradient(135deg, #22D3EE, #0891B2, #0077B6)',
            boxShadow: '0 2px 12px rgba(34, 211, 238, 0.3)',
          }}
          whileHover={{ scale: 1.05, boxShadow: '0 4px 20px rgba(34, 211, 238, 0.4)' }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          <span className="relative">Masuk</span>
        </motion.button>
      </div>
    </motion.nav>
  );
}

function Footer() {
  return (
    <footer className="relative py-12 md:py-16 px-4">
      {/* Top divider */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.15), transparent)' }} />

      <div className="max-w-4xl mx-auto text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-4">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #22D3EE, #0891B2)' }}
          >
            <div className="absolute inset-[1.5px] rounded-[10px] flex items-center justify-center" style={{ background: '#060B18' }}>
              <svg width="16" height="16" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M30 25 C30 25, 45 35, 55 30 C65 25, 72 20, 75 25 C78 30, 70 40, 60 42 C50 44, 38 48, 30 40 Z" fill="#22D3EE" opacity="0.95"/>
                <path d="M55 30 C60 35, 65 50, 60 60 C55 70, 45 75, 40 68 C35 61, 38 50, 45 42 C52 34, 55 30, 55 30 Z" fill="#22D3EE" opacity="0.85"/>
                <path d="M30 40 C25 50, 22 62, 28 70 C34 78, 42 78, 40 68 C38 58, 32 48, 30 40 Z" fill="#22D3EE" opacity="0.75"/>
                <circle cx="30" cy="25" r="8" fill="#22D3EE"/>
                <circle cx="75" cy="25" r="7" fill="#22D3EE" opacity="0.9"/>
                <circle cx="60" cy="60" r="9" fill="#22D3EE"/>
                <circle cx="28" cy="70" r="6" fill="#22D3EE" opacity="0.8"/>
              </svg>
            </div>
          </div>
          <div>
            <span className="text-sm font-black text-white tracking-tight" style={{ fontFamily: 'var(--font-sans)' }}>
              ENG<span style={{ color: '#22D3EE' }}>SYS</span>
            </span>
          </div>
        </div>

        <p className="text-xs text-white/25 mb-1">
          Engineering Department &mdash; PT Anvita Pharma Indonesia
        </p>
        <p className="text-[10px] text-white/15">
          &copy; 2026 ENGSYS. Dari Laporan, Menuju Solusi.
        </p>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [showLogin, setShowLogin] = useState(false);
  const { scrollYProgress } = useScroll();

  // Parallax for background
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: '#060B18' }}>
      {/* Global 3D particle background */}
      <Particles3D />

      {/* Floating decorative elements */}
      <FloatingElements />

      {/* Radial gradient overlays */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px]"
          style={{ background: 'rgba(34, 211, 238, 0.04)' }}
        />
        <div
          className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[100px]"
          style={{ background: 'rgba(8, 145, 178, 0.03)' }}
        />
      </div>

      {/* Navigation */}
      <NavBar onLoginClick={() => setShowLogin(true)} />

      {/* Main content */}
      <main className="relative z-10">
        {/* Hero */}
        <HeroSection onLoginClick={() => setShowLogin(true)} />

        {/* Features */}
        <FeaturesSection />

        {/* Stats */}
        <StatsSection />
      </main>

      {/* Footer */}
      <div className="relative z-10">
        <Footer />
      </div>

      {/* Login Modal */}
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </div>
  );
}