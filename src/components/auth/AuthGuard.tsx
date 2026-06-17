'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from './AuthContext';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user && pathname !== '/login') {
      router.push('/login');
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          {/* Spinner Premium */}
          <div className="relative flex h-16 w-16 items-center justify-center">
            <div className="absolute h-12 w-12 animate-ping rounded-full bg-blue-500 opacity-20" />
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
          </div>
          <p className="animate-pulse text-sm font-semibold text-slate-600 dark:text-slate-400">
            Menghubungkan ke Anvita System...
          </p>
        </div>
      </div>
    );
  }

  // Jika belum login dan di rute yang butuh auth, sembunyikan tampilan sejenak sebelum redirect
  if (!user && pathname !== '/login') {
    return null;
  }

  return <>{children}</>;
}
export default AuthGuard;
