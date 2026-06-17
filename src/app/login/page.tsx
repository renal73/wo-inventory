'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthContext';
import { useTheme } from '@/components/theme/ThemeContext';
import { KeyRound, User as UserIcon, AlertCircle, Sun, Moon } from 'lucide-react';

export default function LoginPage() {
  const { user, login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Client-side redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

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

  return (
    <div className="w-full max-w-md px-4 py-8 relative">
      {/* Floating Theme Toggle in Corner */}
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleTheme}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-500 dark:text-slate-400 cursor-pointer transition-colors shadow-xs"
          title={theme === 'light' ? 'Aktifkan Mode Gelap' : 'Aktifkan Mode Terang'}
        >
          {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
        </button>
      </div>
      {/* Brand Header */}
      <div className="flex flex-col items-center mb-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-xl shadow-blue-500/20 text-white font-black text-xl mb-4">
          EN
        </div>
        <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Engineering Anvita System
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
          Sistem Manajemen Inventaris Suku Cadang Engineering
        </p>
      </div>

      {/* Login Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        {/* Glow hiasan di pojok */}
        <div className="absolute -top-12 -right-12 w-24 h-24 bg-blue-600/10 rounded-full blur-xl pointer-events-none" />
        
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800/80 pb-3">
            Silakan Masuk ke Akun Anda
          </h2>

          {error && (
            <div className="flex items-center gap-2 text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-950/20 dark:text-red-400 p-3 rounded-lg border border-red-200 dark:border-red-900/50">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Input Username */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Username
            </label>
            <div className="relative">
              <UserIcon size={14} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username..."
                disabled={loading}
                className="w-full h-10 pl-10 pr-4 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-500 disabled:opacity-50"
                required
              />
            </div>
          </div>

          {/* Input Password */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <KeyRound size={14} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password..."
                disabled={loading}
                className="w-full h-10 pl-10 pr-4 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-500 disabled:opacity-50"
                required
              />
            </div>
          </div>

          {/* Tombol Masuk */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 text-xs font-bold bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-all shadow-md shadow-blue-600/10 shrink-0 mt-4 cursor-pointer"
          >
            {loading ? 'Memproses Masuk...' : 'Masuk ke Sistem'}
          </button>
        </form>
      </div>

      {/* Info Kredensial Uji Coba */}
      <div className="mt-6 text-center bg-slate-100/60 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/60 rounded-xl p-4 text-[10px] text-slate-500">
        <p className="font-bold uppercase tracking-wider mb-2 text-slate-600">Info Akun Tester:</p>
        <div className="flex justify-center gap-4 text-slate-500">
          <div>
            <span className="font-bold">Admin:</span> <code className="font-mono">admin</code> / <code className="font-mono">admin123</code>
          </div>
          <div className="border-l border-slate-300 dark:border-slate-700 h-3 self-center" />
          <div>
            <span className="font-bold">User (Teknisi):</span> <code className="font-mono">user</code> / <code className="font-mono">user123</code>
          </div>
        </div>
      </div>

      <p className="mt-8 text-center text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
        PT Anvita Pharma Indonesia &copy; 2026
      </p>
    </div>
  );
}
