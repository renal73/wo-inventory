'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { 
  TrendingUp, TrendingDown, BarChart3, PieChart, Activity, 
  Clock, CheckCircle2, AlertTriangle, Wrench, Loader2, 
  Calendar, DollarSign, Package, Target
} from 'lucide-react';

interface AnalyticsData {
  totalWorkOrders: number;
  completedThisMonth: number;
  avgCompletionTime: number;
  slaCompliance: number;
  monthlyTrend: { month: string; value: number }[];
  categoryDistribution: { name: string; value: number; color: string }[];
  priorityBreakdown: { priority: string; count: number }[];
  technicianPerformance: { name: string; completed: number; avgTime: number }[];
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [selectedPeriod]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?period=${selectedPeriod}`);
      if (res.ok) {
        const apiData = await res.json();
        const analyticsData: AnalyticsData = {
          totalWorkOrders: apiData.totalWorkOrders || 0,
          completedThisMonth: apiData.completedThisMonth || 0,
          avgCompletionTime: apiData.avgCompletionTime || 0,
          slaCompliance: apiData.slaCompliance || 0,
          monthlyTrend: apiData.monthlyTrend || [],
          categoryDistribution: (apiData.categoryDistribution || []).map((cat: any) => ({
            name: cat.name || cat.category || '',
            value: cat.rawValue || 0,
            color: cat.color || '#6B7280'
          })),
          priorityBreakdown: apiData.priorityBreakdown || [],
          technicianPerformance: apiData.technicianPerformance || [],
        };
        setData(analyticsData);
      } else {
        console.error('Failed to fetch analytics:', res.status);
        // Fallback to empty data
        setData({
          totalWorkOrders: 0,
          completedThisMonth: 0,
          avgCompletionTime: 0,
          slaCompliance: 0,
          monthlyTrend: [],
          categoryDistribution: [],
          priorityBreakdown: [],
          technicianPerformance: [],
        });
      }
    } catch (e) {
      console.error('Error fetching analytics:', e);
    } finally {
      setLoading(false);
    }
  };

  const maxTrendValue = Math.max(...(data?.monthlyTrend.map(t => t.value) || [1]));

  return (
    <div className="flex flex-col h-full min-h-screen bg-[var(--bg-base)]">
      {/* Header */}
      <div 
        className="bg-white dark:bg-[var(--surface)] border-b border-[var(--border)] px-4 sm:px-6 py-4"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 max-w-[1600px] mx-auto">
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-[var(--text-primary)] flex items-center gap-2">
              <BarChart3 className="text-[var(--accent)] shrink-0" size={22} />
              Analitik & Laporan
            </h1>
            <p className="text-[11px] sm:text-xs font-medium text-[var(--text-secondary)] mt-0.5 uppercase tracking-wide">
              Visualisasi data & insight performa maintenance
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select 
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 text-[13px] font-medium bg-[var(--surface)] border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            >
              <option value="7d">7 Hari Terakhir</option>
              <option value="30d">30 Hari Terakhir</option>
              <option value="90d">90 Hari Terakhir</option>
              <option value="1y">1 Tahun</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 size={32} className="animate-spin text-[var(--accent)]" />
          </div>
        ) : data ? (
          <div className="max-w-[1600px] mx-auto space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-[var(--surface)] rounded-2xl p-5 border border-[var(--border)]">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--accent-glow)' }}>
                    <Wrench size={20} style={{ color: 'var(--accent)' }} />
                  </div>
                  <div className="flex items-center gap-1 text-emerald-600">
                    <TrendingUp size={14} />
                    <span className="text-[11px] font-bold">+12%</span>
                  </div>
                </div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-secondary)]">Total Work Orders</p>
                <p className="text-3xl font-extrabold text-[var(--text-primary)] mt-1">{data.totalWorkOrders}</p>
              </div>
              
              <div className="bg-white dark:bg-[var(--surface)] rounded-2xl p-5 border border-[var(--border)]">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-100">
                    <CheckCircle2 size={20} className="text-emerald-600" />
                  </div>
                  <div className="flex items-center gap-1 text-emerald-600">
                    <TrendingUp size={14} />
                    <span className="text-[11px] font-bold">+8%</span>
                  </div>
                </div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-secondary)]">Selesai Bulan Ini</p>
                <p className="text-3xl font-extrabold text-[var(--text-primary)] mt-1">{data.completedThisMonth}</p>
              </div>
              
              <div className="bg-white dark:bg-[var(--surface)] rounded-2xl p-5 border border-[var(--border)]">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-100">
                    <Clock size={20} className="text-blue-600" />
                  </div>
                  <div className="flex items-center gap-1 text-emerald-600">
                    <TrendingDown size={14} />
                    <span className="text-[11px] font-bold">-0.5j</span>
                  </div>
                </div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-secondary)]">Rata-rata Penyelesaian</p>
                <p className="text-3xl font-extrabold text-[var(--text-primary)] mt-1">{data.avgCompletionTime}<span className="text-lg font-medium">j</span></p>
              </div>
              
              <div className="bg-white dark:bg-[var(--surface)] rounded-2xl p-5 border border-[var(--border)]">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-100">
                    <Target size={20} className="text-amber-600" />
                  </div>
                  <div className="flex items-center gap-1 text-amber-600">
                    <span className="text-[11px] font-bold">Target: 95%</span>
                  </div>
                </div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-secondary)]">Kepatuhan SLA</p>
                <p className="text-3xl font-extrabold text-[var(--text-primary)] mt-1">{data.slaCompliance}<span className="text-lg font-medium">%</span></p>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Trend Chart */}
              <div className="bg-white dark:bg-[var(--surface)] rounded-2xl p-5 border border-[var(--border)]">
                <h3 className="text-sm font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                  <Activity size={16} style={{ color: 'var(--accent)' }} />
                  Tren Work Orders Bulanan
                </h3>
                <div className="flex items-end justify-between gap-2 h-40">
                  {data.monthlyTrend.map((item, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex flex-col items-center">
                        <span className="text-[10px] font-bold text-[var(--text-secondary)]">{item.value}</span>
                        <div 
                          className="w-full rounded-t-lg transition-all hover:opacity-80"
                          style={{ 
                            height: `${(item.value / maxTrendValue) * 100}%`,
                            backgroundColor: idx === data.monthlyTrend.length - 1 ? 'var(--accent)' : 'var(--accent-glow)'
                          }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-[var(--text-muted)]">{item.month}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category Distribution */}
              <div className="bg-white dark:bg-[var(--surface)] rounded-2xl p-5 border border-[var(--border)]">
                <h3 className="text-sm font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                  <PieChart size={16} style={{ color: 'var(--accent)' }} />
                  Distribusi Kategori
                </h3>
                <div className="flex items-center gap-6">
                  {/* Simple Pie Visualization */}
                  {(() => {
                    const total = data.categoryDistribution.reduce((acc, cat) => acc + cat.value, 0);
                    return (
                      <>
                        <div className="relative w-32 h-32 shrink-0">
                          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                            {total > 0 ? data.categoryDistribution.reduce((acc, cat, idx) => {
                              const prevPercent = acc.percent;
                              const percent = (cat.value / total) * 360;
                              acc.elements.push(
                                <circle
                                  key={idx}
                                  cx="50"
                                  cy="50"
                                  r="40"
                                  fill="none"
                                  stroke={cat.color}
                                  strokeWidth="20"
                                  strokeDasharray={`${percent} ${360 - percent}`}
                                  strokeDashoffset={`-${prevPercent}`}
                                />
                              );
                              acc.percent += percent;
                              return acc;
                            }, { elements: [] as React.ReactNode[], percent: 0 }).elements : (
                              <circle cx="50" cy="50" r="40" fill="none" stroke="var(--border)" strokeWidth="20" />
                            )}
                          </svg>
                        </div>
                        {/* Legend */}
                        <div className="flex-1 space-y-2">
                          {data.categoryDistribution.map((cat, idx) => {
                            const percent = total > 0 ? Math.round((cat.value / total) * 100) : 0;
                            return (
                              <div key={idx} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                                  <span className="text-[12px] font-medium text-[var(--text-secondary)]">{cat.name}</span>
                                </div>
                                <span className="text-[12px] font-bold text-[var(--text-primary)]">{percent}%</span>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Priority Breakdown */}
              <div className="bg-white dark:bg-[var(--surface)] rounded-2xl p-5 border border-[var(--border)]">
                <h3 className="text-sm font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                  <AlertTriangle size={16} style={{ color: 'var(--accent)' }} />
                  Breakdown Prioritas
                </h3>
                <div className="space-y-3">
                  {data.priorityBreakdown.map((item, idx) => {
                    const total = data.priorityBreakdown.reduce((a, b) => a + b.count, 0);
                    const percent = (item.count / total) * 100;
                    const colors = ['bg-red-500', 'bg-amber-500', 'bg-emerald-500'];
                    return (
                      <div key={idx}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[12px] font-medium text-[var(--text-secondary)]">{item.priority}</span>
                          <span className="text-[12px] font-bold text-[var(--text-primary)]">{item.count}</span>
                        </div>
                        <div className="h-2 bg-[var(--bg-base)] rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${colors[idx]}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Technician Performance */}
              <div className="bg-white dark:bg-[var(--surface)] rounded-2xl p-5 border border-[var(--border)]">
                <h3 className="text-sm font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                  <Activity size={16} style={{ color: 'var(--accent)' }} />
                  Performa Teknisi
                </h3>
                <div className="space-y-3">
                  {data.technicianPerformance.map((tech, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-3 bg-[var(--bg-base)] rounded-xl">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
                        style={{ backgroundColor: 'var(--accent)' }}
                      >
                        {tech.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[13px] font-bold text-[var(--text-primary)]">{tech.name}</span>
                          <span className="text-[11px] font-medium text-[var(--text-secondary)]">{tech.avgTime}j avg</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <CheckCircle2 size={12} className="text-emerald-500" />
                            <span className="text-[11px] font-bold text-emerald-600">{tech.completed} WO</span>
                          </div>
                          <div className="flex-1 h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full bg-emerald-500"
                              style={{ width: `${(tech.completed / 25) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-[var(--text-muted)]">
            <p>Tidak ada data tersedia</p>
          </div>
        )}
      </div>
    </div>
  );
}
