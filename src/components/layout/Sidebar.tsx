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
  User as UserIcon,
  Wrench,
  FileText,
  ClipboardList,
  BarChart3,
  Users,
  Briefcase,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useTheme } from '../theme/ThemeContext';

/* ========================================
   ANVITA LOGO — Molecular Shape SVG
   ======================================== */
function AnvitaLogo({ size = 40, collapsed = false }: { size?: number; collapsed?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
      style={{ filter: 'drop-shadow(0 2px 8px rgba(0, 180, 216, 0.3))' }}
    >
      {/* Background circle */}
      <circle cx="50" cy="50" r="48" fill="url(#logo-bg)" opacity="0.12" />
      
      {/* Molecular connections */}
      <path
        d="M30 25 C30 25, 45 35, 55 30 C65 25, 72 20, 75 25 C78 30, 70 40, 60 42 C50 44, 38 48, 30 40 Z"
        fill="url(#anvita-gradient)"
        opacity="0.95"
      />
      <path
        d="M55 30 C60 35, 65 50, 60 60 C55 70, 45 75, 40 68 C35 61, 38 50, 45 42 C52 34, 55 30, 55 30 Z"
        fill="url(#anvita-gradient)"
        opacity="0.85"
      />
      <path
        d="M30 40 C25 50, 22 62, 28 70 C34 78, 42 78, 40 68 C38 58, 32 48, 30 40 Z"
        fill="url(#anvita-gradient)"
        opacity="0.75"
      />
      
      {/* Node circles — molecular structure */}
      <circle cx="30" cy="25" r="8" fill="url(#anvita-gradient)" />
      <circle cx="75" cy="25" r="7" fill="url(#anvita-gradient)" opacity="0.9" />
      <circle cx="60" cy="60" r="9" fill="url(#anvita-gradient)" />
      <circle cx="28" cy="70" r="6" fill="url(#anvita-gradient)" opacity="0.8" />
      <circle cx="55" cy="30" r="5" fill="#fff" opacity="0.6" />
      
      {/* Inner highlights */}
      <circle cx="30" cy="24" r="3" fill="#fff" opacity="0.4" />
      <circle cx="60" cy="59" r="3.5" fill="#fff" opacity="0.4" />
      <circle cx="75" cy="24" r="2.5" fill="#fff" opacity="0.3" />
      
      <defs>
        <linearGradient id="anvita-gradient" x1="20%" y1="20%" x2="80%" y2="80%">
          <stop offset="0%" stopColor="#22D3EE" />
          <stop offset="50%" stopColor="#0891B2" />
          <stop offset="100%" stopColor="#0077B6" />
        </linearGradient>
        <radialGradient id="logo-bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#0891B2" stopOpacity="0.05" />
        </radialGradient>
      </defs>
    </svg>
  );
}

/* ========================================
   TOOLTIP COMPONENT
   ======================================== */
function Tooltip({ children, text, show }: { children: React.ReactNode; text: string; show: boolean }) {
  if (!show) return <>{children}</>;
  
  return (
    <div className="relative group/tooltip">
      {children}
      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity duration-200 z-50"
        style={{
          backgroundColor: 'var(--surface)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-strong)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}
      >
        {text}
        <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-y-4 border-y-transparent border-r-4"
          style={{ borderRightColor: 'var(--border-strong)' }}
        />
      </div>
    </div>
  );
}

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export function Sidebar({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isMobile, setIsMobile] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const menuGroups = [
    {
      title: 'MAINTENANCE ENGINEER',
      items: [
        { label: 'Dashboard', path: '/maintenance', icon: LayoutDashboard, roles: ['ADMIN', 'TECHNICIAN', 'OPERATOR', 'QC_ANALYST'] },
        { label: 'Work Orders', path: '/maintenance/work-orders', icon: FileText, roles: ['ADMIN', 'TECHNICIAN', 'USER', 'OPERATOR', 'QC_ANALYST'] },
        { label: 'Preventive Maintenance', path: '/maintenance/pm', icon: ClipboardList, roles: ['ADMIN', 'TECHNICIAN'] },
        { label: 'Machines & Utilitas', path: '/machines', icon: Cog, roles: ['ADMIN', 'TECHNICIAN', 'USER', 'WAREHOUSE'] },
        { label: 'Beban Teknisi', path: '/maintenance/technician-load', icon: Briefcase, roles: ['ADMIN', 'TECHNICIAN'] },
        { label: 'Tim Teknisi', path: '/maintenance/team', icon: Users, roles: ['ADMIN', 'TECHNICIAN'] },
      ]
    },
    {
      title: 'INVENTORY SYSTEM',
      items: [
        { label: 'Dashboard Inventory', path: '/inventory/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'USER', 'WAREHOUSE', 'TECHNICIAN', 'OPERATOR', 'QC_ANALYST'] },
        { label: 'Data Barang/Part', path: '/inventory', icon: Package, roles: ['ADMIN', 'USER', 'WAREHOUSE'] },
        { label: 'Data Tools', path: '/tools', icon: Wrench, roles: ['ADMIN', 'USER', 'WAREHOUSE', 'TECHNICIAN', 'OPERATOR', 'QC_ANALYST'] },
        { label: 'Transaksi In/Out', path: '/transactions', icon: ArrowLeftRight, roles: ['ADMIN', 'USER', 'WAREHOUSE', 'TECHNICIAN'] },
      ]
    },
    {
      title: 'ANALITIK',
      items: [
        { label: 'Dashboard Analitik', path: '/analytics', icon: BarChart3, roles: ['ADMIN', 'USER'] },
        { label: 'Laporan & Export', path: '/analytics/laporan', icon: FileText, roles: ['ADMIN', 'USER'] },
      ]
    },
    {
      title: 'ADMIN PANEL',
      items: [
        { label: 'Panel Admin', path: '/admin', icon: Settings, roles: ['ADMIN'] },
      ]
    }
  ];

  const filteredGroups = menuGroups.map(group => ({
    ...group,
    items: group.items.filter(item => user && item.roles.includes(user.role))
  })).filter(group => group.items.length > 0);

  const sidebarExpanded = !isCollapsed || isMobile;

  return (
    <motion.aside
      animate={isMobile ? {
        x: isMobileOpen ? 0 : -280,
        width: 280
      } : {
        x: 0,
        width: isCollapsed ? 76 : 280
      }}
      transition={{ type: 'spring', stiffness: 320, damping: 30 }}
      className="fixed bottom-0 top-0 left-0 z-40 flex flex-col"
      style={{
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border)',
      }}
    >
      {/* Gradient overlay for sidebar depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, var(--accent-glow) 0%, transparent 30%, transparent 70%, var(--accent-glow) 100%)',
          opacity: 0.3,
        }}
      />

      {/* ========================================
          HEADER — Logo & Branding
          ======================================== */}
      <div
        className="relative flex h-16 items-center justify-between px-4 py-4"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <Link href="/" className="flex items-center gap-3 overflow-hidden group/logo">
          <div className="animate-float">
            <AnvitaLogo size={sidebarExpanded ? 38 : 34} collapsed={isCollapsed && !isMobile} />
          </div>
          
          {sidebarExpanded && (
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05, duration: 0.25 }}
              className="flex flex-col"
            >
              <span className="font-extrabold text-base leading-none tracking-tight">
                <span className="text-gradient-accent">ENG</span>
                <span style={{ color: 'var(--text-primary)' }}>SYS</span>
              </span>
              <span
                className="text-[9px] font-semibold uppercase tracking-widest mt-1"
                style={{ color: 'var(--text-muted)' }}
              >
                Engineering System
              </span>
            </motion.div>
          )}
        </Link>

        {/* Collapse toggle button */}
        {!isMobile && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-5 flex h-7 w-7 items-center justify-center rounded-full shadow-md transition-all duration-200 hover:scale-110 hover:shadow-lg"
            style={{
              backgroundColor: 'var(--surface)',
              border: '2px solid var(--accent)',
              color: 'var(--accent)',
            }}
          >
            {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
          </button>
        )}
      </div>

      {/* ========================================
          NAVIGATION MENU
          ======================================== */}
      <nav className="flex-1 space-y-5 px-3 py-5 overflow-y-auto">
        {filteredGroups.map((group, groupIndex) => (
          <motion.div
            key={groupIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: groupIndex * 0.08, duration: 0.3 }}
            className="space-y-1"
          >
            {/* Section Label */}
            {sidebarExpanded && (
              <div className="px-3 pb-2.5 flex items-center gap-2">
                <div className="h-px flex-1" style={{ background: 'var(--accent-gradient-horizontal)', opacity: 0.3 }} />
                <span
                  className="text-[9px] font-bold uppercase tracking-[0.15em] shrink-0"
                  style={{ color: 'var(--accent)' }}
                >
                  {group.title}
                </span>
                <div className="h-px flex-1" style={{ background: 'var(--accent-gradient-horizontal)', opacity: 0.3 }} />
              </div>
            )}
            
            {/* Divider for collapsed mode */}
            {isCollapsed && !isMobile && groupIndex > 0 && (
              <div className="w-full my-3 px-2">
                <div className="h-px w-full" style={{ background: 'var(--accent-gradient-horizontal)', opacity: 0.2 }} />
              </div>
            )}

            {/* Menu Items */}
            {group.items.map((item, itemIndex) => {
              const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
              const Icon = item.icon;

              return (
                <Tooltip
                  key={item.path}
                  text={item.label}
                  show={isCollapsed && !isMobile}
                >
                  <Link href={item.path} className="relative block">
                    <motion.div
                      initial={sidebarExpanded ? { opacity: 0, x: -10 } : false}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: groupIndex * 0.06 + itemIndex * 0.03, duration: 0.25 }}
                      onHoverStart={() => setHoveredItem(item.path)}
                      onHoverEnd={() => setHoveredItem(null)}
                      className={`relative flex items-center gap-3 rounded-xl text-[13px] font-semibold transition-all duration-200 ${
                        isCollapsed && !isMobile ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'
                      }`}
                      style={{
                        backgroundColor: isActive
                          ? 'var(--sidebar-active-bg)'
                          : hoveredItem === item.path
                            ? 'var(--sidebar-hover-bg)'
                            : 'transparent',
                        color: isActive
                          ? 'var(--sidebar-active-text)'
                          : 'var(--text-secondary)',
                      }}
                    >
                      {/* Active indicator pill */}
                      {isActive && (
                        <motion.div
                          layoutId="sidebar-active-indicator"
                          className="absolute left-0 top-1 bottom-1 w-[3px] rounded-r-full"
                          style={{ background: 'var(--accent-gradient)' }}
                          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                        />
                      )}

                      {/* Icon with hover animation */}
                      <motion.div
                        animate={hoveredItem === item.path && !isActive ? { scale: 1.1, rotate: 3 } : { scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                        className="shrink-0"
                      >
                        <Icon size={19} strokeWidth={isActive ? 2.2 : 1.8} />
                      </motion.div>

                      {/* Label */}
                      {sidebarExpanded && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="truncate"
                        >
                          {item.label}
                        </motion.span>
                      )}

                      {/* Hover glow effect */}
                      {hoveredItem === item.path && !isActive && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 rounded-xl pointer-events-none"
                          style={{
                            boxShadow: 'inset 0 0 20px var(--accent-glow)',
                          }}
                        />
                      )}
                    </motion.div>
                  </Link>
                </Tooltip>
              );
            })}
          </motion.div>
        ))}
      </nav>

      {/* ========================================
          FOOTER — User Profile & Actions
          ======================================== */}
      {user && (
        <div className="p-3 space-y-2" style={{ borderTop: '1px solid var(--border)' }}>
          
          {/* Theme Toggle */}
          <Tooltip text={theme === 'light' ? 'Mode Gelap' : 'Mode Terang'} show={isCollapsed && !isMobile}>
            <button
              onClick={toggleTheme}
              className={`w-full flex items-center gap-3 rounded-xl text-[13px] font-semibold transition-all duration-200 hover:scale-[1.02] ${
                isCollapsed && !isMobile ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'
              }`}
              style={{
                backgroundColor: 'transparent',
                color: 'var(--text-secondary)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--sidebar-hover-bg)';
                e.currentTarget.style.color = 'var(--accent)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              <motion.div
                whileHover={{ rotate: 20, scale: 1.15 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              >
                {theme === 'light' ? <Moon size={19} /> : <Sun size={19} />}
              </motion.div>
              {sidebarExpanded && <span>Mode {theme === 'light' ? 'Gelap' : 'Terang'}</span>}
            </button>
          </Tooltip>

          {/* Logout Button */}
          <Tooltip text="Keluar" show={isCollapsed && !isMobile}>
            <button
              onClick={logout}
              className={`w-full flex items-center gap-3 rounded-xl text-[13px] font-semibold transition-all duration-200 group/logout ${
                isCollapsed && !isMobile ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'
              }`}
              style={{
                backgroundColor: 'transparent',
                color: 'var(--text-secondary)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.08)';
                e.currentTarget.style.color = '#EF4444';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              <motion.div whileHover={{ x: 2 }}>
                <LogOut size={19} />
              </motion.div>
              {sidebarExpanded && <span>Keluar</span>}
            </button>
          </Tooltip>

          {/* User Profile Card */}
          <div
            className={`relative rounded-xl p-3 overflow-hidden ${isCollapsed && !isMobile ? 'flex justify-center px-0' : ''}`}
            style={{
              backgroundColor: 'var(--surface-raised)',
              border: '1px solid var(--border)',
            }}
          >
            {/* Subtle gradient overlay on profile card */}
            <div
              className="absolute inset-0 pointer-events-none opacity-30"
              style={{
                background: 'linear-gradient(135deg, var(--accent-glow) 0%, transparent 60%)',
              }}
            />
            
            <div className={`relative flex items-center gap-3 ${isCollapsed && !isMobile ? 'justify-center' : ''}`}>
              {/* Avatar with gradient border */}
              <div className="relative shrink-0">
                <div
                  className="absolute -inset-0.5 rounded-full opacity-60"
                  style={{ background: 'var(--accent-gradient)' }}
                />
                <div
                  className="relative flex h-9 w-9 items-center justify-center rounded-full text-white font-bold text-sm"
                  style={{ background: 'var(--accent-gradient)' }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </div>

              {sidebarExpanded && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex-1 min-w-0"
                >
                  <p className="text-[13px] font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                    {user.name}
                  </p>
                  <p
                    className="text-[10px] font-bold mt-0.5 uppercase tracking-wider"
                    style={{ color: 'var(--accent)' }}
                  >
                    {user.role === 'ADMIN' ? 'Administrator' : user.role === 'WAREHOUSE' ? 'Petugas Gudang' : user.role === 'TECHNICIAN' ? 'Teknisi' : user.role}
                  </p>
                  <p className="text-[9px] mt-0.5 font-medium" style={{ color: 'var(--text-muted)' }}>
                    Engineering Dept
                  </p>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.aside>
  );
}

export default Sidebar;