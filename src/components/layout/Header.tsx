'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Search, ChevronRight, User as UserIcon, Menu, Sun, Moon } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { RoleBadge } from '../ui/RoleBadge';

interface HeaderProps {
  onToggleMenu: () => void;
}

export function Header({ onToggleMenu }: HeaderProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Terjemahkan path ke label Bahasa Indonesia
  const getBreadcrumbLabel = (segment: string) => {
    switch (segment.toLowerCase()) {
      case '':
        return 'Dashboard';
      case 'inventory':
        return 'Data Barang';
      case 'transactions':
        return 'Transaksi In/Out';
      case 'machines':
        return 'Mesin Produksi';
      case 'admin':
        return 'Panel Admin';
      case 'login':
        return 'Masuk';
      default:
        // Jika segment berupa ID mesin/part, kembalikan apa adanya (e.g., MCH-001)
        return segment.toUpperCase();
    }
  };

  // Buat list breadcrumb dari pathname
  const pathSegments = pathname.split('/').filter(Boolean);
  const breadcrumbs = [
    { label: 'Dashboard', path: '/' },
    ...pathSegments.map((segment, index) => {
      const path = '/' + pathSegments.slice(0, index + 1).join('/');
      return {
        label: getBreadcrumbLabel(segment),
        path,
      };
    }),
  ];

  // Hapus duplikasi jika segmen pertama adalah dashboard (/)
  const uniqueBreadcrumbs = breadcrumbs.filter(
    (bc, index, self) => self.findIndex(t => t.path === bc.path) === index
  );

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/80 dark:bg-slate-900/80 px-4 md:px-6 backdrop-blur-md dark:border-slate-800">
      {/* Bagian Kiri: Tombol Hamburger + Breadcrumb Dinamis */}
      <div className="flex items-center gap-2 overflow-hidden mr-2">
        <button
          onClick={onToggleMenu}
          className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer shrink-0 transition-colors"
          title="Buka Navigasi"
        >
          <Menu size={18} />
        </button>

        <nav className="flex items-center space-x-1.5 text-xs font-semibold text-slate-500 overflow-x-auto whitespace-nowrap scrollbar-none py-1">
          {uniqueBreadcrumbs.map((bc, index) => {
            const isLast = index === uniqueBreadcrumbs.length - 1;
            
            return (
              <React.Fragment key={bc.path}>
                {index > 0 && <ChevronRight size={12} className="text-slate-400 shrink-0" />}
                {isLast ? (
                  <span className="text-slate-900 dark:text-slate-100 font-bold truncate max-w-[120px] sm:max-w-[200px] md:max-w-xs">
                    {bc.label}
                  </span>
                ) : (
                  <Link
                    href={bc.path}
                    className="hover:text-blue-600 transition-colors truncate max-w-[100px] sm:max-w-[150px]"
                  >
                    {bc.label}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      {/* Bagian Tengah: Pencarian Global (Visual/Mock) */}
      <div className="hidden md:flex items-center relative w-72 lg:w-96 max-w-md">
        <Search size={15} className="absolute left-3.5 text-slate-400" />
        <input
          type="text"
          placeholder="Cari cepat suku cadang / mesin... (Ctrl + K)"
          disabled
          className="w-full h-9 pl-9 pr-14 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 cursor-not-allowed"
        />
        <div className="absolute right-3 top-2 flex h-5 items-center justify-center rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-1.5 font-mono text-[9px] font-bold text-slate-400 select-none pointer-events-none">
          ⌘K
        </div>
      </div>

      {/* Bagian Kanan: Info Profil Pengguna & Toggle Tema */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleTheme}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer transition-colors shrink-0"
          title={theme === 'light' ? 'Aktifkan Mode Gelap' : 'Aktifkan Mode Terang'}
        >
          {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
        </button>

        {user && (
          <div className="flex items-center gap-3 border-l border-slate-200 dark:border-slate-800 pl-3">
            <div className="flex flex-col text-right">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                {user.name}
              </span>
              <span className="text-[9px] text-slate-400 font-semibold tracking-wider uppercase mt-0.5">
                {user.role === 'ADMIN' ? 'Administrator' : 'Teknisi Lapangan'}
              </span>
            </div>
            <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <UserIcon size={16} />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
export default Header;
