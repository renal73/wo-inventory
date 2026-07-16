'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthContext';
import { useTheme } from '@/components/theme/ThemeContext';
import { KeyRound, User as UserIcon, AlertCircle, Sun, Moon, Zap, Shield, Activity } from 'lucide-react';

/* ========================================
   ANVITA LOGO — Molecular Shape SVG
   ======================================== */
function AnvitaLogoMark({ size = 80 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: 'drop-shadow(0 2px 12px rgba(0, 180, 216, 0.4))' }}
    >
      {/* Background circle */}
      <circle cx="50" cy="50" r="48" fill="url(#login-logo-bg)" opacity="0.15" />
      
      {/* Molecular connections */}
      <path
        d="M30 25 C30 25, 45 35, 55 30 C65 25, 72 20, 75 25 C78 30, 70 40, 60 42 C50 44, 38 48, 30 40 Z"
        fill="url(#login-anvita-grad)"
        opacity="0.95"
      />
      <path
        d="M55 30 C60 35, 65 50, 60 60 C55 70, 45 75, 40 68 C35 61, 38 50, 45 42 C52 34, 55 30, 55 30 Z"
        fill="url(#login-anvita-grad)"
        opacity="0.85"
      />
      <path
        d="M30 40 C25 50, 22 62, 28 70 C34 78, 42 78, 40 68 C38 58, 32 48, 30 40 Z"
        fill="url(#login-anvita-grad)"
        opacity="0.75"
      />
      
      {/* Node circles — molecular structure */}
      <circle cx="30" cy="25" r="8" fill="url(#login-anvita-grad)" />
      <circle cx="75" cy="25" r="7" fill="url(#login-anvita-grad)" opacity="0.9" />
      <circle cx="60" cy="60" r="9" fill="url(#login-anvita-grad)" />
      <circle cx="28" cy="70" r="6" fill="url(#login-anvita-grad)" opacity="0.8" />
      <circle cx="55" cy="30" r="5" fill="#fff" opacity="0.6" />
      
      {/* Inner highlights */}
      <circle cx="30" cy="24" r="3" fill="#fff" opacity="0.4" />
      <circle cx="60" cy="59" r="3.5" fill="#fff" opacity="0.4" />
      <circle cx="75" cy="24" r="2.5" fill="#fff" opacity="0.3" />
      
      <defs>
        <linearGradient id="login-anvita-grad" x1="20%" y1="20%" x2="80%" y2="80%">
          <stop offset="0%" stopColor="#22D3EE" />
          <stop offset="50%" stopColor="#0891B2" />
          <stop offset="100%" stopColor="#0077B6" />
        </linearGradient>
        <radialGradient id="login-logo-bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#0891B2" stopOpacity="0.05" />
        </radialGradient>
      </defs>
    </svg>
  );
}

export default function LoginPage() {
  const { user, login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Mouse position for spotlight effect (desktop only)
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Mouse tracking (desktop only)
  useEffect(() => {
    if (isMobile) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isMobile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Username dan password wajib diisi');
      return;
    }

    try {
      setError('');
      setLoading(true);
      await login(username, password);
    } catch (err: any) {
      setError(err.message || 'Username atau password salah');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div 
      ref={containerRef}
      className="relative min-h-screen w-full flex items-center justify-center overflow-hidden"
      style={{ 
        background: 'linear-gradient(180deg, #060B18 0%, #0A1020 50%, #060B18 100%)',
      }}
    >
      {/* ─── AURORA LAYERS — CYAN-BLUE (Anvita) ─── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Desktop Aurora — Cyan */}
        <div 
          className="absolute w-[400px] md:w-[600px] h-[400px] md:h-[600px] rounded-full opacity-15 md:opacity-20"
          style={{
            background: 'radial-gradient(circle at center, #22D3EE 0%, transparent 70%)',
            filter: 'blur(80px)',
            top: isMobile ? '-10%' : '-20%',
            left: isMobile ? '-20%' : '-10%',
            animation: 'aurora-drift-1 15s ease-in-out infinite',
          }}
        />
        <div 
          className="absolute w-[300px] md:w-[500px] h-[300px] md:h-[500px] rounded-full opacity-10 md:opacity-15"
          style={{
            background: 'radial-gradient(circle at center, #0891B2 0%, transparent 70%)',
            filter: 'blur(60px)',
            bottom: isMobile ? '-5%' : '-15%',
            right: isMobile ? '-10%' : '-5%',
            animation: 'aurora-drift-2 18s ease-in-out infinite',
          }}
        />
        {/* Desktop accent — Blue */}
        {!isMobile && (
          <div 
            className="absolute w-[400px] h-[400px] rounded-full opacity-10"
            style={{
              background: 'radial-gradient(circle at center, #0077B6 0%, transparent 70%)',
              filter: 'blur(90px)',
              top: '40%',
              right: '20%',
              animation: 'aurora-drift-3 12s ease-in-out infinite',
            }}
          />
        )}
      </div>

      {/* ─── GRID PATTERN (desktop only) ─── */}
      {!isMobile && (
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
      )}

      {/* ─── SPOTLIGHT (desktop only) ─── */}
      {!isMobile && (
        <div 
          className="absolute w-[500px] h-[500px] rounded-full pointer-events-none transition-all duration-300"
          style={{
            background: 'radial-gradient(circle at center, rgba(34,211,238,0.10) 0%, rgba(8,145,178,0.04) 30%, transparent 60%)',
            left: mousePos.x - 250,
            top: mousePos.y - 250,
          }}
        />
      )}

      {/* ─── PARTICLES (reduced on mobile) ─── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(isMobile ? 15 : 30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-0.5 h-0.5 md:w-1 md:h-1 rounded-full"
            style={{
              background: i % 3 === 0 ? 'rgba(34,211,238,0.5)' : 'rgba(255,255,255,0.25)',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `particle-float ${6 + Math.random() * 8}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
              opacity: isMobile ? 0.5 : 1,
            }}
          />
        ))}
      </div>

      {/* ─── MAIN CONTENT ─── */}
      <div className="relative z-10 w-full max-w-[380px] sm:max-w-[420px] mx-3 sm:mx-4 px-3 sm:px-4">
        
        {/* ─── HEADER BRAND ─── */}
        <Link href="/" className="block text-center mb-5 sm:mb-6 group/logo">
          {/* Logo — Anvita Molecular Mark */}
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 mb-4 sm:mb-5 relative">
            <div 
              className="absolute inset-0 rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, #22D3EE, #0891B2, #0077B6)',
                animation: 'pulse-slow 2s ease-in-out infinite',
              }}
            />
            <div className="absolute inset-[2px] rounded-xl flex items-center justify-center" style={{ background: '#060B18' }}>
              <AnvitaLogoMark size={48} />
            </div>
            {!isMobile && (
              <div 
                className="absolute -inset-1 rounded-2xl blur-md opacity-60"
                style={{
                  background: 'linear-gradient(135deg, rgba(34,211,238,0.5), rgba(8,145,178,0.3), rgba(0,119,182,0.5))',
                  animation: 'glow-pulse 3s ease-in-out infinite',
                }}
              />
            )}
          </div>

          {/* Title */}
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight leading-tight mb-1 sm:mb-2">
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #22D3EE, #0891B2)' }}>ENGSYS</span>
          </h1>
          <h2 className="text-sm sm:text-base md:text-lg font-bold text-white/80 tracking-tight mb-2 sm:mb-3">
            Engineering System
          </h2>
          
          {/* Tagline */}
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-white/40 mb-1">
            Powering Your Maintenance Excellence
          </p>
          <p className="text-[10px] sm:text-[11px] text-white/30 font-medium">
            Dari Laporan, Menuju Solusi
          </p>
        </Link>

        {/* ─── LOGIN CARD ─── */}
        <div 
          className="relative rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 backdrop-blur-xl"
          style={{
            background: 'rgba(10, 16, 32, 0.85)',
            border: '1px solid rgba(34, 211, 238, 0.2)',
            boxShadow: '0 0 40px rgba(34, 211, 238, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          }}
        >
          {/* Top border accent — gradient */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 sm:w-3/4 h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.5), transparent)' }} />

          {/* Corner glow (desktop only) */}
          {!isMobile && (
            <>
              <div className="absolute -top-16 -right-16 w-32 h-32 rounded-full blur-2xl pointer-events-none" style={{ background: 'rgba(34,211,238,0.12)' }} />
              <div className="absolute -bottom-16 -left-16 w-32 h-32 rounded-full blur-2xl pointer-events-none" style={{ background: 'rgba(8,145,178,0.08)' }} />
            </>
          )}
          
          {/* Form Header */}
          <div className="mb-4 sm:mb-5">
            <h3 className="text-base sm:text-lg font-bold text-white mb-0.5">Selamat Datang Kembali</h3>
            <p className="text-[11px] sm:text-xs text-white/50">Masuk untuk melanjutkan sistem</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {/* Error Alert */}
            {error && (
              <div 
                className="flex items-center gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-xl border"
                style={{ 
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                }}
              >
                <AlertCircle size={14} className="text-red-400 shrink-0" />
                <span className="text-[11px] sm:text-xs font-semibold text-red-300">{error}</span>
              </div>
            )}

            {/* Username Input */}
            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-[10px] font-bold text-white/60 uppercase tracking-[0.12em] sm:tracking-[0.15em] flex items-center gap-1.5">
                <UserIcon size={10} />
                Username
              </label>
              <div className="relative group">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username..."
                  disabled={loading}
                  className="w-full h-11 sm:h-12 pl-10 sm:pl-11 pr-4 text-[13px] sm:text-sm bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder:text-white/25 focus:outline-none disabled:opacity-50 transition-all duration-200"
                  style={{ 
                    // @ts-ignore
                    '--tw-ring-color': 'rgba(34,211,238,0.3)',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(34,211,238,0.5)';
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)';
                  }}
                  required
                />
                <div className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-white/30 transition-colors" style={{ color: undefined }}>
                  <UserIcon size={14} className="sm:w-4 sm:h-4" />
                </div>
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-[10px] font-bold text-white/60 uppercase tracking-[0.12em] sm:tracking-[0.15em] flex items-center gap-1.5">
                <KeyRound size={10} />
                Password
              </label>
              <div className="relative group">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password..."
                  disabled={loading}
                  className="w-full h-11 sm:h-12 pl-10 sm:pl-11 pr-4 text-[13px] sm:text-sm bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder:text-white/25 focus:outline-none disabled:opacity-50 transition-all duration-200"
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(34,211,238,0.5)';
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)';
                  }}
                  required
                />
                <div className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-white/30 transition-colors">
                  <KeyRound size={14} className="sm:w-4 sm:h-4" />
                </div>
              </div>
            </div>

            {/* Submit Button — Cyan gradient */}
            <button
              type="submit"
              disabled={loading}
              className="relative w-full h-11 sm:h-12 mt-1 sm:mt-2 rounded-xl font-bold text-[13px] sm:text-sm text-white overflow-hidden group disabled:opacity-70"
              style={{
                background: 'linear-gradient(135deg, #22D3EE 0%, #0891B2 50%, #0077B6 100%)',
                boxShadow: '0 4px 15px rgba(34, 211, 238, 0.3)',
              }}
            >
              {/* Button shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              
              <span className="relative flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span className="hidden xs:inline">Memproses...</span>
                    <span className="xs:hidden">...</span>
                  </>
                ) : (
                    <>
                      <Zap size={14} className="sm:w-4 sm:h-4" />
                      Masuk ke Sistem
                    </>
                )}
              </span>
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 sm:gap-4 my-4 sm:my-5">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[9px] sm:text-[10px] text-white/30 font-semibold uppercase tracking-wider">Aman & Terenkripsi</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Feature Pills — Responsive */}
          <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
            <div className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] font-semibold" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Shield size={9} className="text-emerald-400" />
              <span className="text-white/60">Enkripsi SSL</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] font-semibold" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Activity size={9} className="text-cyan-400" />
              <span className="text-white/60">Real-time</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] font-semibold" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Zap size={9} className="text-cyan-300" />
              <span className="text-white/60">Fast Access</span>
            </div>
          </div>
        </div>

        {/* ─── FOOTER ─── */}
        <div className="mt-5 sm:mt-6 text-center">
          <p className="text-[9px] sm:text-[10px] md:text-[11px] text-white/25 font-semibold uppercase tracking-wider mb-1.5 sm:mb-2">
            PT Anvita Pharma Indonesia
          </p>
          <p className="text-[9px] sm:text-[10px] text-white/15 font-medium">
            &copy; 2026 Engineering Department
          </p>
        </div>

        {/* ─── THEME TOGGLE ─── */}
        <button
          onClick={toggleTheme}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 md:top-5 md:right-5 flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl backdrop-blur-md transition-all duration-200 hover:scale-110 active:scale-95"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
          title={theme === 'light' ? 'Aktifkan Mode Gelap' : 'Aktifkan Mode Terang'}
        >
          {theme === 'light' ? (
            <Moon size={14} className="sm:w-4 sm:h-4 text-white/60" />
          ) : (
            <Sun size={14} className="sm:w-4 sm:h-4 text-white/60" />
          )}
        </button>
      </div>

      {/* ─── KEYFRAME ANIMATIONS ─── */}
      <style jsx>{`
        @keyframes aurora-drift-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, 20px) scale(1.05); }
        }
        @keyframes aurora-drift-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-25px, -15px) scale(0.98); }
        }
        @keyframes aurora-drift-3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(20px, -30px) scale(1.03); }
        }
        @keyframes particle-float {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
          25% { transform: translateY(-15px) translateX(8px); opacity: 0.5; }
          50% { transform: translateY(-8px) translateX(-4px); opacity: 0.4; }
          75% { transform: translateY(-20px) translateX(10px); opacity: 0.45; }
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.03); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}