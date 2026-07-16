'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { MagicCard } from '@/components/ui/MagicCard';
import { NumberTicker } from '@/components/ui/NumberTicker';
import VodafoneHero, { ShimmerText } from '@/components/machines/VodafoneHero';
import {
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle2,
  TrendingUp,
  Wrench,
  ChevronRight,
  Zap,
  WrenchIcon,
  Building2,
  MoreHorizontal
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import Link from 'next/link';

export default function MaintenanceDashboard() {
  const { user } = useAuth();
  
  const [mounted, setMounted] = useState(false);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [closedWorkOrders, setClosedWorkOrders] = useState<any[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [partUsageLogs, setPartUsageLogs] = useState<any[]>([]);
  const [partUsageLoading, setPartUsageLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // Filter state for Part Usage Log
  const [filterTechnician, setFilterTechnician] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterWO, setFilterWO] = useState('');

  useEffect(() => {
    setMounted(true);
    fetch('/api/work-orders')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          // 5 work orders terbaru yang belum closed untuk widget kiri
          setWorkOrders(data.filter((wo: any) => wo.status !== 'CLOSED').slice(0, 5));
          // Semua WO yang closed untuk laporan admin
          setClosedWorkOrders(data.filter((wo: any) => wo.status === 'CLOSED'));
        }
      })
      .catch(console.error);

    // Fetch real-time dashboard summary
    fetch('/api/mtc/dashboard/summary')
      .then(res => res.json())
      .then(data => {
        setDashboardStats(data);
        setStatsLoading(false);
      })
      .catch(err => {
        console.error('Gagal fetch dashboard summary:', err);
        setStatsLoading(false);
      });

    // Fetch part usage logs
    fetch('/api/mtc/dashboard/part-usage')
      .then(res => res.json())
      .then(data => {
        if (data.logs) setPartUsageLogs(data.logs);
        setPartUsageLoading(false);
      })
      .catch(err => {
        console.error('Gagal fetch part usage:', err);
        setPartUsageLoading(false);
      });
  }, []);

  // Filter part usage logs
  const filteredPartUsageLogs = partUsageLogs.filter(log => {
    if (filterTechnician && log.technicianName !== filterTechnician) return false;
    if (filterWO && log.workOrderId !== filterWO) return false;
    if (filterDateFrom && new Date(log.takenAt) < new Date(filterDateFrom)) return false;
    if (filterDateTo && new Date(log.takenAt) > new Date(filterDateTo + 'T23:59:59')) return false;
    return true;
  });

  // Get unique technicians for filter dropdown
  const uniqueTechnicians = [...new Set(partUsageLogs.map(log => log.technicianName))];
  const uniqueWorkOrders = [...new Set(partUsageLogs.map(log => log.workOrderId))];

  if (!mounted) return null;

  // Use real data from API or fallback
  const stats = dashboardStats ? {
    totalWO: dashboardStats.totalWO || 0,
    totalActiveWO: dashboardStats.activeWO || 0,
    overdueWO: dashboardStats.overdueWO || 0,
    avgMTTR: dashboardStats.avgMTTR || '0',
    completionRate: dashboardStats.completionRate || 0,
    byPriority: dashboardStats.byPriority || {},
    byWorkType: dashboardStats.byWorkType || {}
  } : {
    totalWO: 0,
    totalActiveWO: 0,
    overdueWO: 0,
    avgMTTR: '0',
    completionRate: 0,
    byPriority: {},
    byWorkType: {}
  };

  return (
    <div className="space-y-6">
        {/* Vodafone Hero */}
        {user && (
          <VodafoneHero
            eyebrow="Maintenance Center"
            title={
              <>
                <ShimmerText>Maintenance Control Center</ShimmerText>
              </>
            }
            subtitle={`Memantau seluruh permintaan perbaikan dan jadwal preventif. Anda login sebagai ${user.role}.`}
            stats={[
              { value: stats.totalWO, label: 'Total WO', color: 'text-white' },
              { value: stats.totalActiveWO, label: 'WO Aktif', color: 'text-white' },
              { value: stats.completionRate, label: 'Completion %', color: 'text-emerald-400' },
            ]}
            action={
              stats.overdueWO > 0 ? (
                <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-4 py-2.5 rounded-xl border border-red-500/20 shrink-0 w-fit">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500 text-white animate-pulse">
                    <AlertTriangle size={15} />
                  </div>
                  <div className="text-xs">
                    <div className="font-bold text-white">{stats.overdueWO} Tiket Overdue</div>
                    <div className="text-[10px] text-red-200 font-semibold mt-0.5">Melewati target waktu SLA!</div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-4 py-2.5 rounded-xl border border-emerald-500/20 shrink-0 w-fit">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white">
                    <CheckCircle2 size={15} />
                  </div>
                  <div className="text-xs">
                    <div className="font-bold text-white">Semua Sesuai Target</div>
                    <div className="text-[10px] text-emerald-200 font-semibold mt-0.5">Tidak ada antrian overdue.</div>
                  </div>
                </div>
              )
            }
          />
        )}

        {/* Baris Kartu Metrik KPI Maintenance */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          
          {/* Total WO Aktif */}
          <MagicCard glowColor="rgba(59, 130, 246, 0.15)" className="p-4 flex flex-col justify-between min-h-[8rem]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">WO Aktif</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/30">
                <FileText size={14} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-xl xl:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight block break-words">
                <NumberTicker value={stats.totalActiveWO} />
              </span>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">Tiket sedang diproses</p>
            </div>
          </MagicCard>

          {/* Overdue */}
          <MagicCard glowColor="rgba(239, 68, 68, 0.15)" className="p-4 flex flex-col justify-between min-h-[8rem]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Overdue</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-950/30">
                <AlertTriangle size={14} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-xl xl:text-2xl font-black text-red-600 dark:text-red-500 tracking-tight block break-words">
                <NumberTicker value={stats.overdueWO} />
              </span>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">Melewati SLA</p>
            </div>
          </MagicCard>

          {/* MTTR */}
          <MagicCard glowColor="rgba(245, 158, 11, 0.15)" className="p-4 flex flex-col justify-between min-h-[8rem]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Rata-rata MTTR</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/30">
                <Clock size={14} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-xl xl:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-end gap-1">
                {stats.avgMTTR} <span className="text-sm font-semibold text-slate-500 pb-1">Jam</span>
              </span>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">Waktu penyelesaian</p>
            </div>
          </MagicCard>

          {/* Completion Rate */}
          <MagicCard glowColor="rgba(16, 185, 129, 0.15)" className="p-4 flex flex-col justify-between min-h-[8rem]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Penyelesaian PM</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30">
                <CheckCircle2 size={14} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-xl xl:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-end gap-1">
                <NumberTicker value={stats.completionRate} /> <span className="text-sm font-semibold text-slate-500 pb-1">%</span>
              </span>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">Rasio penyelesaian bulan ini</p>
            </div>
          </MagicCard>

        </div>

        {/* Section Bawah */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Work Orders Terbaru (Kiri) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col min-h-[300px]">
            <div className="border-b border-slate-100 dark:border-slate-800/80 pb-4 mb-4 flex justify-between items-center">
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  Work Orders Terbaru
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Daftar WO yang baru masuk</p>
              </div>
              <Link href="/maintenance/work-orders" className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-0.5">
                Lihat Semua <ChevronRight size={12} />
              </Link>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {workOrders.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-400 text-xs text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-4">
                  Tidak ada Work Order aktif
                </div>
              ) : (
                workOrders.map((wo: any) => (
                  <Link href="/maintenance/work-orders" key={wo.id} className="block group">
                    <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900/50 bg-slate-50/50 dark:bg-slate-800/20 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400">
                          {wo.woNumber}
                        </span>
                        <span className="text-[9px] text-slate-400 font-medium">
                          {new Date(wo.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-700 transition-colors line-clamp-1 mb-1">
                        {wo.title}
                      </h4>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50 text-[10px]">
                        <span className="text-slate-500">Pemohon: <span className="font-semibold text-slate-700 dark:text-slate-300">{wo.requestedBy?.name || '-'}</span></span>
                        <span className={`px-1.5 py-0.5 rounded font-bold ${
                          wo.status === 'OPEN' ? 'bg-blue-100 text-blue-700' :
                          wo.status === 'ASSIGNED' ? 'bg-purple-100 text-purple-700' :
                          wo.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {wo.status}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Distribusi Klasifikasi (Kanan) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col min-h-[300px]">
            <div className="border-b border-slate-100 dark:border-slate-800/80 pb-4 mb-4 flex justify-between items-center">
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  Distribusi Klasifikasi Masalah
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Electric vs Mechanic vs Sipil vs Lain-lain</p>
              </div>
            </div>
            
            {/* Donut Chart Implementation */}
            {statsLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
              </div>
            ) : dashboardStats?.classificationBreakdown && dashboardStats.classificationBreakdown.length > 0 ? (
              <div className="flex-1 flex flex-col">
                <div className="flex-1 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={dashboardStats.classificationBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="count"
                        nameKey="label"
                      >
                        {dashboardStats.classificationBreakdown.map((entry: any, index: number) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={['#F97316', '#3B82F6', '#10B981', '#8B5CF6'][index % 4]} 
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'var(--background)', 
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                        formatter={(value: any, name: any) => [`${value} WO`, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Legend */}
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {dashboardStats.classificationBreakdown.map((item: any, index: number) => {
                    const icons = [
                      <Zap key="electric" size={12} className="text-orange-500" />,
                      <WrenchIcon key="mechanic" size={12} className="text-blue-500" />,
                      <Building2 key="sipil" size={12} className="text-emerald-500" />,
                      <MoreHorizontal key="other" size={12} className="text-violet-500" />
                    ];
                    const colors = ['bg-orange-50 dark:bg-orange-950/20', 'bg-blue-50 dark:bg-blue-950/20', 'bg-emerald-50 dark:bg-emerald-950/20', 'bg-violet-50 dark:bg-violet-950/20'];
                    const textColors = ['text-orange-600 dark:text-orange-400', 'text-blue-600 dark:text-blue-400', 'text-emerald-600 dark:text-emerald-400', 'text-violet-600 dark:text-violet-400'];
                    
                    return (
                      <div 
                        key={item.classification}
                        className={`flex items-center gap-2 p-2 rounded-lg ${colors[index % 4]}`}
                      >
                        {icons[index % 4]}
                        <div className="flex-1 min-w-0">
                          <p className={`text-[10px] font-bold ${textColors[index % 4]}`}>{item.label}</p>
                          <p className="text-xs font-black text-slate-700 dark:text-slate-300">{item.count}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <div className="text-center">
                  <MoreHorizontal size={24} className="mx-auto mb-2 opacity-50" />
                  <p>Belum ada data klasifikasi</p>
                </div>
              </div>
            )}
          </div>
          
        </div>

        {/* Laporan Work Order Selesai (Khusus Admin) */}
        {user?.role === 'ADMIN' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col mt-6">
            <div className="border-b border-slate-100 dark:border-slate-800/80 pb-4 mb-4 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-emerald-500" />
                  Laporan Work Order Selesai
                </h3>
                <p className="text-[11px] text-slate-400 font-semibold mt-1">Daftar historis semua perbaikan yang telah berstatus CLOSED.</p>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800">
                    <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">No WO</th>
                    <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Judul</th>
                    <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Kategori</th>
                    <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Mulai</th>
                    <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Selesai</th>
                    <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Durasi Aktual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {closedWorkOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">Belum ada Work Order yang selesai.</td>
                    </tr>
                  ) : (
                    closedWorkOrders.map((wo: any) => (
                      <tr key={wo.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 px-4 text-xs font-mono font-bold text-blue-600 dark:text-blue-400">{wo.woNumber}</td>
                        <td className="py-3 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300">{wo.title}</td>
                        <td className="py-3 px-4 text-[11px] text-slate-500">
                          {wo.category} {wo.classification ? `- ${wo.classification}` : ''}
                        </td>
                        <td className="py-3 px-4 text-[11px] text-slate-500">
                          {wo.startedAt ? new Date(wo.startedAt).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                        </td>
                        <td className="py-3 px-4 text-[11px] text-slate-500">
                          {wo.completedAt ? new Date(wo.completedAt).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                        </td>
                        <td className="py-3 px-4 text-xs font-bold text-emerald-600 dark:text-emerald-400 text-right">
                          {wo.actualDuration ? `${wo.actualDuration} Menit` : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Part Usage Log Section - Recent Part Pickup Activity */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col mt-6">
          <div className="border-b border-slate-100 dark:border-slate-800/80 pb-4 mb-4 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <Wrench size={18} className="text-amber-500" />
                Recent Part Usage
              </h3>
              <p className="text-[11px] text-slate-400 font-semibold mt-1">Log aktivitas pengambilan part oleh teknisi untuk Work Order.</p>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Teknisi</label>
              <select
                value={filterTechnician}
                onChange={(e) => setFilterTechnician(e.target.value)}
                className="w-full h-8 px-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-500"
              >
                <option value="">Semua Teknisi</option>
                {uniqueTechnicians.map(tech => (
                  <option key={tech} value={tech}>{tech}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Work Order</label>
              <select
                value={filterWO}
                onChange={(e) => setFilterWO(e.target.value)}
                className="w-full h-8 px-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-500"
              >
                <option value="">Semua WO</option>
                {uniqueWorkOrders.map(wo => (
                  <option key={wo} value={wo}>{wo}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Dari Tanggal</label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="w-full h-8 px-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Sampai Tanggal</label>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="w-full h-8 px-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-500"
              />
            </div>
          </div>

          {/* Part Usage Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3 px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Nama Part</th>
                  <th className="py-3 px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-center">Qty</th>
                  <th className="py-3 px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Teknisi</th>
                  <th className="py-3 px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">WO Terkait</th>
                  <th className="py-3 px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Catatan (Lokasi)</th>
                  <th className="py-3 px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Waktu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {partUsageLoading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center">
                      <div className="flex justify-center">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
                      </div>
                    </td>
                  </tr>
                ) : filteredPartUsageLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">Tidak ada data pengambilan part.</td>
                  </tr>
                ) : (
                  filteredPartUsageLogs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">{log.partName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{log.partId}</div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold rounded">
                          {log.qtyTaken}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-xs text-slate-600 dark:text-slate-400">{log.technicianName}</td>
                      <td className="py-2.5 px-3 text-xs font-mono font-bold text-blue-600 dark:text-blue-400">{log.workOrderId}</td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-500 max-w-xs truncate" title={log.notes}>{log.notes || '-'}</td>
                      <td className="py-2.5 px-3 text-[10px] text-slate-400">
                        {new Date(log.takenAt).toLocaleString('id-ID', { 
                          day: '2-digit', 
                          month: 'short', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

    </div>
  );
}
