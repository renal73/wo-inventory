'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthContext';
import { useTheme } from '@/components/theme/ThemeContext';
import { KeyRound, User as UserIcon, AlertCircle, Sun, Moon, Zap, Shield, Activity, X } from 'lucide-react';

/* ENGSYS Logo inside modal */
function ModalLogo({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: 'drop-shadow(0 2px 12px rgba(34, 211, 238, 0.4))' }}
    >
      <circle cx="50" cy="50" r="48" fill="url(#modal-logo-bg)" opacity="0.15" />
      <path
        d="M30 25 C30 25, 45 35, 55 30 C65 25, 72 20, 75 25 C78 30, 70 40, 60 42 C50 44, 38 48, 30 40 Z"
        fill="url(#modal-anvita-grad)"
        opacity="0.95"
      />
      <path
        d="M55 30 C60 35, 65 50, 60 60 C55 70, 45 75, 40 68 C35 61, 38 50, 45 42 C52 34, 55 30, 55 30 Z"
        fill="url(#modal-anvita-grad)"
        opacity="0.85"
      />
      <path
        d="M30 40 C25 50, 22 62, 28 70 C34 78, 42 78, 40 68 C38 58, 32 48, 30 40 Z"
        fill="url(#modal-anvita-grad)"
        opacity="0.75"
      />
      <circle cx="30" cy="25" r="8" fill="url(#modal-anvita-grad)" />
      <circle cx="75" cy="25" r="7" fill="url(#modal-anvita-grad)" opacity="0.9" />
      <circle cx="60" cy="60" r="9" fill="url(#modal-anvita-grad)" />
      <circle cx="28" cy="70" r="6" fill="url(#modal-anvita-grad)" opacity="0.8" />
      <circle cx="55" cy="30" r="5" fill="#fff" opacity="0.6" />
      <circle cx="30" cy="24" r="3" fill="#fff" opacity="0.4" />
      <circle cx="60" cy="59" r="3.5" fill="#fff" opacity="0.4" />
      <defs>
        <linearGradient id="modal-anvita-grad" x1="20%" y1="20%" x2="80%" y2="80%">
          <stop offset="0%" stopColor="#22D3EE" />
          <stop offset="50%" stopColor="#0891B2" />
          <stop offset="100%" stopColor="#0077B6" />
        </linearGradient>
        <radialGradient id="modal-logo-bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#0891B2" stopOpacity="0.05" />
        </radialGradient>
      </defs>
    </svg>
  );
}

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
      // Modal akan otomatis tutup karena redirect dari auth context
    } catch (err: any) {
      setError(err.message || 'Username atau password salah');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setUsername('');
    setPassword('');
    setError('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={handleClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal Card */}
          <motion.div
            className="relative w-full max-w-[420px] rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(10, 16, 32, 0.95)',
              border: '1px solid rgba(34, 211, 238, 0.2)',
              boxShadow: '0 0 60px rgba(34, 211, 238, 0.1), 0 25px 50px rgba(0,0,0,0.5)',
              perspective: '1000px',
            }}
            initial={{ opacity: 0, scale: 0.8, rotateX: -15 }}
            animate={{ opacity: 1, scale: 1, rotateX: 0 }}
            exit={{ opacity: 0, scale: 0.8, rotateX: 15 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            {/* Top border gradient */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px]"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.6), transparent)' }}
            />

            {/* Corner glows */}
            <div className="absolute -top-16 -right-16 w-32 h-32 rounded-full blur-2xl pointer-events-none" style={{ background: 'rgba(34,211,238,0.1)' }} />
            <div className="absolute -bottom-16 -left-16 w-32 h-32 rounded-full blur-2xl pointer-events-none" style={{ background: 'rgba(8,145,178,0.07)' }} />

            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors z-10"
              style={{ border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <X size={14} className="text-white/50" />
            </button>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="absolute top-4 right-14 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors z-10"
              style={{ border: '1px solid rgba(255,255,255,0.1)' }}
            >
              {theme === 'light' ? <Moon size={14} className="text-white/50" /> : <Sun size={14} className="text-white/50" />}
            </button>

            <div className="p-6 sm:p-8">
              {/* Logo */}
              <div className="flex justify-center mb-5">
                <div className="relative">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #22D3EE, #0891B2, #0077B6)' }}
                  >
                    <div className="absolute inset-[2px] rounded-[14px] flex items-center justify-center" style={{ background: '#060B18' }}>
                      <ModalLogo size={36} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Header */}
              <div className="text-center mb-6">
                <h3 className="text-lg font-bold text-white mb-1">Selamat Datang Kembali</h3>
                <p className="text-xs text-white/40">Masuk untuk melanjutkan ke sistem ENGSYS</p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Error */}
                {error && (
                  <motion.div
                    className="flex items-center gap-2.5 p-3 rounded-xl"
                    style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <AlertCircle size={14} className="text-red-400 shrink-0" />
                    <span className="text-[11px] font-semibold text-red-300">{error}</span>
                  </motion.div>
                )}

                {/* Username */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-white/50 uppercase tracking-[0.15em] flex items-center gap-1.5">
                    <UserIcon size={10} />
                    Username
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Masukkan username..."
                      disabled={loading}
                      className="w-full h-11 pl-10 pr-4 text-sm bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder:text-white/25 focus:outline-none disabled:opacity-50 transition-all"
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
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30">
                      <UserIcon size={14} />
                    </div>
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-white/50 uppercase tracking-[0.15em] flex items-center gap-1.5">
                    <KeyRound size={10} />
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan password..."
                      disabled={loading}
                      className="w-full h-11 pl-10 pr-4 text-sm bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder:text-white/25 focus:outline-none disabled:opacity-50 transition-all"
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
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30">
                      <KeyRound size={14} />
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <motion.button
                  type="submit"
                  disabled={loading}
                  className="relative w-full h-12 rounded-xl font-bold text-sm text-white overflow-hidden group disabled:opacity-70"
                  style={{
                    background: 'linear-gradient(135deg, #22D3EE 0%, #0891B2 50%, #0077B6 100%)',
                    boxShadow: '0 4px 15px rgba(34, 211, 238, 0.3)',
                  }}
                  whileHover={{ scale: 1.02, boxShadow: '0 6px 25px rgba(34, 211, 238, 0.4)' }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  <span className="relative flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      <>
                        <Zap size={14} />
                        Masuk ke Sistem
                      </>
                    )}
                  </span>
                </motion.button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-[9px] text-white/25 font-semibold uppercase tracking-wider">Aman & Terenkripsi</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* Feature pills */}
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  { icon: Shield, label: 'Enkripsi SSL', color: '#4ADE80' },
                  { icon: Activity, label: 'Real-time', color: '#22D3EE' },
                  { icon: Zap, label: 'Fast Access', color: '#22D3EE' },
                ].map((pill) => {
                  const Icon = pill.icon;
                  return (
                    <div
                      key={pill.label}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-semibold"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      <Icon size={9} style={{ color: pill.color }} />
                      <span className="text-white/50">{pill.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}