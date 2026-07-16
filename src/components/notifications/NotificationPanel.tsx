'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Bell, BellRing, CheckCheck, X, Filter,
  FileText, Package, PackageCheck, AlertTriangle,
  Wrench, RotateCcw, Clock, XCircle, ChevronDown
} from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  referenceId?: string;
  referenceType?: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
}

const NOTIFICATION_TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; bgColor: string; label: string }> = {
  WO_CREATED: {
    icon: <FileText size={16} />,
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.15)',
    label: 'WO Baru',
  },
  WO_ASSIGNED: {
    icon: <Clock size={16} />,
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.15)',
    label: 'WO Di-assign',
  },
  WO_STATUS_CHANGED: {
    icon: <RotateCcw size={16} />,
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.15)',
    label: 'WO Update',
  },
  WO_COMPLETED: {
    icon: <CheckCheck size={16} />,
    color: '#22c55e',
    bgColor: 'rgba(34, 197, 94, 0.15)',
    label: 'WO Selesai',
  },
  INBOUND: {
    icon: <Package size={16} />,
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.15)',
    label: 'Barang Masuk',
  },
  OUTBOUND: {
    icon: <PackageCheck size={16} />,
    color: '#f97316',
    bgColor: 'rgba(249, 115, 22, 0.15)',
    label: 'Barang Keluar',
  },
  STOCK_LOW: {
    icon: <AlertTriangle size={16} />,
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.15)',
    label: 'Stok Menipis',
  },
  TOOL_BORROWED: {
    icon: <Wrench size={16} />,
    color: '#8b5cf6',
    bgColor: 'rgba(139, 92, 246, 0.15)',
    label: 'Tool Dipinjam',
  },
  TOOL_RETURNED: {
    icon: <Wrench size={16} />,
    color: '#06b6d4',
    bgColor: 'rgba(6, 182, 212, 0.15)',
    label: 'Tool Dikembalikan',
  },
  PM_DUE: {
    icon: <Clock size={16} />,
    color: '#eab308',
    bgColor: 'rgba(234, 179, 8, 0.15)',
    label: 'PM Jatuh Tempo',
  },
};

function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Baru saja';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}j lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}h lalu`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w lalu`;
  return `${Math.floor(days / 30)}bln lalu`;
}

export default function NotificationPanel({ isOpen, onClose, anchorRef }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async (pageNum: number, filterType: string, append = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pageNum),
        limit: '20',
      });
      if (filterType !== 'all') params.set('filter', filterType);

      const res = await fetch(`/api/notifications?${params}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(prev => append ? [...prev, ...data.notifications] : data.notifications);
        setUnreadCount(data.unreadCount);
        setHasMore(pageNum < data.totalPages);
      }
    } catch (error) {
      console.error('Gagal fetch notifikasi:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setPage(1);
      fetchNotifications(1, filter, false);
    }
  }, [isOpen, filter, fetchNotifications]);

  // Polling setiap 30 detik
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      fetchNotifications(1, filter, false);
      setPage(1);
    }, 30000);
    return () => clearInterval(interval);
  }, [isOpen, filter, fetchNotifications]);

  // Close panel saat klik di luar
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, anchorRef]);

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: 'PUT' });
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Gagal mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'PUT' });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Gagal mark all as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (!notifications.find(n => n.id === id)?.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Gagal hapus notifikasi:', error);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchNotifications(nextPage, filter, true);
    }
  };

  const getNavigationPath = (notif: Notification): string | null => {
    if (!notif.referenceId) return null;
    switch (notif.referenceType) {
      case 'WORK_ORDER': return `/work-orders?highlight=${notif.referenceId}`;
      case 'PART': return `/inventory`;
      case 'TOOL': return `/tools`;
      case 'PM_SCHEDULE': return `/pm`;
      default: return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 sm:right-0 top-full mt-2 z-50 w-[calc(100vw-2rem)] sm:w-[420px] max-h-[calc(100vh-100px)] rounded-2xl overflow-hidden flex flex-col"
      style={{
        backgroundColor: 'var(--bg-base)',
        border: '1px solid var(--border)',
        boxShadow: '0 25px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03)',
        transformOrigin: 'top right',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2.5">
          <BellRing size={18} style={{ color: 'var(--accent)' }} />
          <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            Notifikasi
          </span>
          {unreadCount > 0 && (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: 'var(--accent)',
                color: '#fff',
              }}
            >
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all hover:scale-105"
              style={{ color: 'var(--accent)', backgroundColor: 'transparent' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <CheckCheck size={14} />
              Baca semua
            </button>
          )}
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg transition-all"
            style={{ color: 'var(--text-muted)', backgroundColor: 'transparent' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div
        className="flex items-center gap-1 px-4 py-2.5"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <Filter size={13} style={{ color: 'var(--text-muted)' }} />
        {(['all', 'unread', 'read'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-all"
            style={{
              backgroundColor: filter === f ? 'var(--accent)' : 'transparent',
              color: filter === f ? '#fff' : 'var(--text-muted)',
            }}
          >
            {f === 'all' ? 'Semua' : f === 'unread' ? 'Belum Dibaca' : 'Sudah Dibaca'}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
        {notifications.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div
              className="h-16 w-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ backgroundColor: 'var(--surface)' }}
            >
              <Bell size={28} style={{ color: 'var(--text-muted)' }} />
            </div>
            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
              Tidak ada notifikasi
            </p>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              {filter === 'unread' ? 'Semua notifikasi sudah dibaca' : 'Belum ada aktivitas terbaru'}
            </p>
          </div>
        ) : (
          <>
            {notifications.map((notif) => {
              const config = NOTIFICATION_TYPE_CONFIG[notif.type] || {
                icon: <Bell size={16} />,
                color: 'var(--text-muted)',
                bgColor: 'rgba(128,128,128,0.15)',
                label: notif.type,
              };
              const navPath = getNavigationPath(notif);

              return (
                <div
                  key={notif.id}
                  className="group relative flex items-start gap-3 px-5 py-3.5 transition-all cursor-pointer"
                  style={{
                    backgroundColor: notif.isRead ? 'transparent' : 'rgba(255,255,255,0.02)',
                    borderBottom: '1px solid var(--border)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = notif.isRead ? 'transparent' : 'rgba(255,255,255,0.02)';
                  }}
                  onClick={() => {
                    if (!notif.isRead) markAsRead(notif.id);
                    if (navPath) window.location.href = navPath;
                  }}
                >
                  {/* Unread indicator */}
                  {!notif.isRead && (
                    <div
                      className="absolute left-1.5 top-5 h-2 w-2 rounded-full"
                      style={{ backgroundColor: 'var(--accent)' }}
                    />
                  )}

                  {/* Type Icon */}
                  <div
                    className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                    style={{ backgroundColor: config.bgColor, color: config.color }}
                  >
                    {config.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: config.bgColor, color: config.color }}
                      >
                        {config.label}
                      </span>
                      <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
                        {timeAgo(notif.createdAt)}
                      </span>
                    </div>
                    <p
                      className="text-[13px] font-semibold leading-snug mb-0.5 truncate"
                      style={{ color: notif.isRead ? 'var(--text-secondary)' : 'var(--text-primary)' }}
                    >
                      {notif.title}
                    </p>
                    <p
                      className="text-[11px] leading-relaxed line-clamp-2"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {notif.message}
                    </p>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notif.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 h-6 w-6 rounded-lg flex items-center justify-center shrink-0 transition-all"
                    style={{ color: 'var(--text-muted)', backgroundColor: 'transparent' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#ef4444'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                  >
                    <XCircle size={14} />
                  </button>
                </div>
              );
            })}

            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center py-3">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="flex items-center gap-1 px-4 py-2 rounded-lg text-[11px] font-bold transition-all"
                  style={{
                    color: 'var(--accent)',
                    backgroundColor: 'transparent',
                    opacity: loading ? 0.5 : 1,
                  }}
                >
                  {loading ? 'Memuat...' : 'Muat Lebih Banyak'}
                  {!loading && <ChevronDown size={14} />}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}