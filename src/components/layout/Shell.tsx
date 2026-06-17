'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AuthGuard } from '../auth/AuthGuard';

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Deteksi perangkat seluler (layar < 768px)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Tutup sidebar seluler otomatis ketika berpindah halaman/rute
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const isLoginPage = pathname === '/login';

  // Jika di halaman login, tampilkan halaman penuh tanpa Shell Sidebar/Header
  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex items-center justify-center">
        {children}
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
        {/* Backdrop Overlay untuk perangkat seluler ketika laci sidebar terbuka */}
        {isMobile && isMobileOpen && (
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-35 md:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
        )}

        {/* Sidebar Navigasi */}
        <Sidebar
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
        />

        {/* Area Utama (Header + Konten Halaman) */}
        <div
          className="flex flex-col min-h-screen transition-all duration-300"
          style={{
            paddingLeft: isMobile ? '0px' : (isCollapsed ? '76px' : '260px'),
          }}
        >
          {/* Header Top Bar */}
          <Header onToggleMenu={() => setIsMobileOpen(!isMobileOpen)} />

          {/* Konten Halaman */}
          <main className="flex-1 p-4 md:p-8 max-w-(screen-2xl) mx-auto w-full">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
export default Shell;

