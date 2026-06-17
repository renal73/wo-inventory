'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api } from '@/lib/api';

interface User {
  id: string;
  username: string;
  name: string;
  role: 'ADMIN' | 'USER';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchUser = async () => {
    try {
      setLoading(true);
      const res = await api.auth.me();
      if (res.success && res.user) {
        setUser(res.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Jalankan pengecekan sesi saat mount, kecuali jika berada di halaman login
    if (pathname !== '/login') {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [pathname]);

  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      const res = await api.auth.login({ username, password });
      if (res.success && res.user) {
        setUser(res.user);
        router.push('/');
        router.refresh();
      }
    } catch (err: any) {
      setUser(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await api.auth.logout();
      setUser(null);
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Gagal logout:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider');
  }
  return context;
}
