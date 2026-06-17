'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  Package, 
  Cog, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { RoleBadge } from '../ui/RoleBadge';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export function Sidebar({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isMobile, setIsMobile] = useState(false);

  // Deteksi lebar layar untuk adaptabilitas seluler
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Item Menu Navigasi
  const menuItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['ADMIN', 'USER'] },
    { label: 'Transaksi In/Out', path: '/transactions', icon: ArrowLeftRight, roles: ['ADMIN', 'USER'] },
    { label: 'Data Barang', path: '/inventory', icon: Package, roles: ['ADMIN', 'USER'] },
    { label: 'Mesin Produksi', path: '/machines', icon: Cog, roles: ['ADMIN', 'USER'] },
    { label: 'Panel Admin', path: '/admin', icon: Settings, roles: ['ADMIN'] },
  ];

  // Saring menu berdasarkan peran (role) pengguna
  const allowedMenuItems = menuItems.filter(
    item => user && item.roles.includes(user.role)
  );

  return (
    <motion.aside
      animate={isMobile ? {
        x: isMobileOpen ? 0 : -260,
        width: 260
      } : {
        x: 0,
        width: isCollapsed ? 76 : 260
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className="fixed bottom-0 top-0 left-0 z-40 flex flex-col bg-slate-900 text-slate-100 border-r border-slate-800"
    >
      {/* Bagian Atas / Brand Logo */}
      <div className="relative flex h-16 items-center justify-between px-4 py-6 border-b border-slate-800">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 shadow-md shadow-blue-500/20 text-white font-bold">
            AN
          </div>
          {(!isCollapsed || isMobile) && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col"
            >
              <span className="font-bold text-sm leading-none tracking-tight">Anvita System</span>
              <span className="text-[10px] text-slate-400 font-semibold mt-0.5">Engineering Dept</span>
            </motion.div>
          )}
        </div>

        {/* Tombol Toggle Sidebar (Hanya Desktop) */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-5 hidden md:flex h-6 w-6 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-slate-300 hover:text-white shadow-md transition-colors"
        >
          {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </div>

      {/* List Menu Utama */}
      <nav className="flex-1 space-y-1.5 px-3 py-6 overflow-y-auto">
        {allowedMenuItems.map((item) => {
          const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
          const Icon = item.icon;

          return (
            <Link key={item.path} href={item.path} className="relative block">
              <div
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-colors duration-200 cursor-pointer ${
                  isActive 
                    ? 'text-white' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {/* Highlight Animasi Active State */}
                {isActive && (
                  <motion.div
                    layoutId="activeNavBg"
                    className="absolute inset-0 bg-blue-600 rounded-xl -z-10 shadow-lg shadow-blue-600/10"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                
                <Icon size={18} className="shrink-0" />
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {item.label}
                  </motion.span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bagian Bawah / Profil & Logout */}
      {user && (
        <div className="p-3 border-t border-slate-800 bg-slate-950/20">
          <div className={`flex items-center gap-3 rounded-xl p-2 ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              <UserIcon size={16} />
            </div>

            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 min-w-0"
              >
                <p className="text-xs font-bold truncate text-slate-100">{user.name}</p>
                <div className="mt-1 flex items-center">
                  <RoleBadge role={user.role} />
                </div>
              </motion.div>
            )}

            {!isCollapsed && (
              <button
                onClick={logout}
                title="Keluar dari Sistem"
                className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-800/80 transition-colors"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
          
          {isCollapsed && (
            <div className="flex justify-center mt-2 pt-1 border-t border-slate-800/60">
              <button
                onClick={logout}
                title="Keluar dari Sistem"
                className="text-slate-400 hover:text-red-400 p-2 rounded-lg hover:bg-slate-800/80 transition-colors"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      )}
    </motion.aside>
  );
}
export default Sidebar;
