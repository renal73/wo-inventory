'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Search, ChevronRight, Bell, Menu, Calendar } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import NotificationPanel from '../notifications/NotificationPanel';

interface HeaderProps {
  onToggleMenu: () => void;
}

export function Header({ onToggleMenu }: HeaderProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const bellButtonRef = useRef<HTMLButtonElement>(null);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/notifications?filter=unread&limit=1');
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // Silent fail
    }
  }, [user]);

  useEffect(() => {
    fetchUnreadCount();
    // Polling setiap 30 detik untuk badge count
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Terjemahkan path ke label Bahasa Indonesia
  const getBreadcrumbLabel = (segment: string) => {
    const labels: Record<string, string> = {
      '': 'Dashboard',
      'inventory': 'INVENTORY',
      'transactions': 'TRANSAKSI',
      'machines': 'MESIN',
      'maintenance': 'MAINTENANCE',
      'work-orders': 'WORK ORDERS',
      'pm': 'PREVENTIVE MAINTENANCE',
      'technician-load': 'BEBAN TEKNISI',
      'team': 'TIM TEKNISI',
      'tools': 'TOOLS',
      'analytics': 'ANALITIK',
      'admin': 'ADMIN',
      'login': 'LOGIN',
    };
    
    return labels[segment.toLowerCase()] || decodeURIComponent(segment).replace(/___/g, '/').toUpperCase();
  };

  // Buat list breadcrumb dari pathname
  const pathSegments = pathname.split('/').filter(Boolean);
  const breadcrumbs = pathSegments.length === 0 
    ? [{ label: 'Dashboard', path: '/' }]
    : pathSegments.map((segment, index) => {
        const path = '/' + pathSegments.slice(0, index + 1).join('/');
        return {
          label: getBreadcrumbLabel(segment),
          path,
        };
      });

  // Format tanggal saat ini
  const formatDate = () => {
    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
    const now = new Date();
    return `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
  };

  return (
    <header 
      className="sticky top-0 z-30 flex h-16 w-full items-center justify-between px-4 md:px-6 backdrop-blur-md transition-colors duration-200"
      style={{
        backgroundColor: 'var(--bg-base-translucent)',
        borderBottom: '1px solid var(--border)'
      }}
    >
      {/* BAGIAN KIRI: Tombol Menu Mobile + Breadcrumb */}
      <div className="flex items-center gap-3 overflow-hidden flex-1 mr-4">
        {/* Hamburger Menu - Mobile Only */}
        <button
          onClick={onToggleMenu}
          className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg hover:bg-opacity-10 shrink-0 transition-all"
          style={{
            color: 'var(--text-secondary)',
            backgroundColor: 'transparent'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          title="Buka Navigasi"
        >
          <Menu size={20} />
        </button>

        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-2 text-[11px] font-semibold tracking-wide overflow-x-auto whitespace-nowrap scrollbar-none py-1">
          <Link
            href="/"
            className="transition-colors hover:opacity-100"
            style={{ color: breadcrumbs.length === 1 && breadcrumbs[0].path === '/' ? 'var(--text-primary)' : 'var(--text-muted)' }}
          >
            Dashboard
          </Link>
          
          {pathSegments.length > 0 && (
            <>
              {breadcrumbs.map((bc, index) => {
                const isLast = index === breadcrumbs.length - 1;
                
                return (
                  <React.Fragment key={bc.path}>
                    <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} className="shrink-0" />
                    {isLast ? (
                      <span 
                        className="font-bold truncate max-w-[150px] sm:max-w-[250px]"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {bc.label}
                      </span>
                    ) : (
                      <Link
                        href={bc.path}
                        className="transition-colors hover:opacity-100 truncate max-w-[120px] sm:max-w-[180px]"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {bc.label}
                      </Link>
                    )}
                  </React.Fragment>
                );
              })}
            </>
          )}
        </nav>
      </div>

      {/* BAGIAN TENGAH: Search Global (Desktop) */}
      <div className="hidden lg:flex items-center relative w-80 xl:w-96">
        <Search size={16} className="absolute left-3.5 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
        <input
          type="text"
          placeholder="Cari cepat suku cadang / mesin..."
          disabled
          className="w-full h-9 pl-10 pr-16 rounded-lg text-[13px] font-medium transition-all duration-200 cursor-not-allowed"
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)'
          }}
        />
        <div 
          className="absolute right-3 top-2 flex h-5 items-center justify-center rounded px-1.5 font-mono text-[10px] font-bold select-none pointer-events-none"
          style={{
            border: '1px solid var(--border)',
            backgroundColor: 'var(--surface-raised)',
            color: 'var(--text-muted)'
          }}
        >
          ⌘K
        </div>
      </div>

      {/* BAGIAN KANAN: Tanggal + Notifikasi + User Info */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Tanggal (Hidden on mobile) */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ color: 'var(--text-secondary)' }}>
          <Calendar size={16} />
          <span className="text-[11px] font-bold tracking-wide uppercase">{formatDate()}</span>
        </div>

        {/* Notifikasi dengan Badge */}
        <div className="relative flex items-center">
          <button
            ref={bellButtonRef}
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg transition-all"
            style={{
              color: isNotifOpen ? 'var(--text-primary)' : 'var(--text-secondary)',
              backgroundColor: isNotifOpen ? 'rgba(255, 255, 255, 0.08)' : 'transparent'
            }}
            onMouseEnter={(e) => {
              if (!isNotifOpen) {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
              }
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              if (!isNotifOpen) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
              if (!isNotifOpen) {
                e.currentTarget.style.color = 'var(--text-secondary)';
              }
            }}
            title="Notifikasi"
          >
            <Bell size={20} />
            {/* Notification Badge - Dynamic Count */}
            {unreadCount > 0 && (
              <span 
                className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-h-[18px] min-w-[18px] rounded-full px-1 text-[9px] font-bold text-white"
                style={{ backgroundColor: '#ef4444' }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Panel */}
          {isNotifOpen && (
            <NotificationPanel
              isOpen={isNotifOpen}
              onClose={() => setIsNotifOpen(false)}
              anchorRef={bellButtonRef}
            />
          )}
        </div>

        {/* User Info (Hidden on small mobile) */}
        {user && (
          <div className="hidden sm:flex items-center gap-3 px-3 py-1.5" style={{ borderLeft: '1px solid var(--border)' }}>
            <div className="flex flex-col text-right">
              <span className="text-xs font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
                {user.name}
              </span>
              <span 
                className="text-[10px] font-bold tracking-wider uppercase mt-0.5"
                style={{ color: 'var(--accent)' }}
              >
                {user.role === 'ADMIN' ? 'Admin' : user.role === 'WAREHOUSE' ? 'Gudang' : 'Teknisi'}
              </span>
            </div>
            <div 
              className="h-9 w-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;