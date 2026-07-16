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
  const isLandingPage = pathname === '/';

  // Jika di halaman login atau landing page, tampilkan tanpa Shell Sidebar/Header
  if (isLoginPage || isLandingPage) {
    return (
      <div className="min-h-screen transition-colors duration-200" style={{ backgroundColor: isLandingPage ? '#060B18' : 'var(--bg-base)', color: 'var(--text-primary)' }}>
        {children}
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen transition-colors duration-200" style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}>
        {/* Backdrop Overlay untuk perangkat seluler ketika laci sidebar terbuka */}
        {isMobile && isMobileOpen && (
          <div
            className="fixed inset-0 z-35 md:hidden backdrop-blur-sm"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
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
            paddingLeft: isMobile ? '0px' : (isCollapsed ? '76px' : '280px'),
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

