'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { MagicCard } from '@/components/ui/MagicCard';
import { NumberTicker } from '@/components/ui/NumberTicker';
import { AnimatedList } from '@/components/ui/AnimatedList';
import { api } from '@/lib/api';
import {
  Package,
  TrendingDown,
  AlertTriangle,
  Cog,
  DollarSign,
  ArrowRight,
  TrendingUp,
  Clock,
  Zap,
  Wrench,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function DashboardPage() {
  const { user } = useAuth();
  
  // State data dari API
  const [stats, setStats] = useState<any>({
    totalSKU: 0,
    totalAssetValue: 0,
    monthlyOutboundQty: 0,
    lowStockAlertCount: 0,
    totalMachines: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [topOutbound, setTopOutbound] = useState<any[]>([]);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [machineAlerts, setMachineAlerts] = useState<any[]>([]);
  
  const [chartRange, setChartRange] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Mencegah error hidrasi Recharts di App Router
  useEffect(() => {
    setMounted(true);
    loadDashboardData();
  }, [chartRange]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [
        statsRes,
        chartRes,
        topOutboundRes,
        lowStockRes,
        activitiesRes,
        machineAlertsRes
      ] = await Promise.all([
        api.dashboard.getStats(),
        api.dashboard.getChart(chartRange),
        api.dashboard.getTopOutbound(),
        api.dashboard.getLowStock(),
        api.dashboard.getRecentActivity(),
        api.dashboard.getMachineAlerts()
      ]);

      if (statsRes.success) setStats(statsRes.stats);
      setChartData(chartRes);
      setTopOutbound(topOutboundRes);
      setLowStock(lowStockRes);
      setActivities(activitiesRes);
      setMachineAlerts(machineAlertsRes);
    } catch (err) {
      console.error('Gagal memuat data dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  // Warna-warna Donut Chart
  const COLORS = ['#2563eb', '#60a5fa', '#f97316', '#ef4444'];

  return (
    <div className="space-y-6">
        
        {/* Banner Selamat Datang */}
        {user && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-900 px-6 py-6 md:py-8 text-white shadow-lg shadow-blue-600/10">
            {/* Dekorasi Glow latar belakang */}
            <div className="absolute right-0 top-0 -mr-16 -mt-16 w-64 h-64 bg-white/5 rounded-full blur-2xl" />
            <div className="absolute left-1/3 bottom-0 -mb-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-lg md:text-xl font-black tracking-tight leading-tight">
                  Selamat Datang kembali, {user.name}!
                </h1>
                <p className="text-xs text-blue-200 font-medium mt-1 md:mt-1.5 max-w-xl">
                  Sistem pemantauan stok suku cadang engineering sedang berjalan normal. Anda login sebagai <span className="font-bold underline uppercase">{user.role === 'ADMIN' ? 'Administrator' : 'Teknisi'}</span>.
                </p>
              </div>

              {stats.lowStockAlertCount > 0 ? (
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10 shrink-0 w-fit">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-white animate-bounce">
                    <AlertTriangle size={15} />
                  </div>
                  <div className="text-xs">
                    <div className="font-bold">{stats.lowStockAlertCount} Item Suku Cadang</div>
                    <div className="text-[10px] text-amber-200 font-semibold mt-0.5">Berada di bawah stok minimum!</div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10 shrink-0 w-fit">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white">
                    <Package size={15} />
                  </div>
                  <div className="text-xs">
                    <div className="font-bold">Semua Stok Aman</div>
                    <div className="text-[10px] text-emerald-200 font-semibold mt-0.5">Tidak ada item kritis.</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Baris Kartu Metrik (5 KPI) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          
          {/* Total SKU */}
          <MagicCard glowColor="rgba(37, 99, 235, 0.08)" className="p-4 flex flex-col justify-between h-32">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total SKU</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/30">
                <Package size={14} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                <NumberTicker value={stats.totalSKU} />
              </span>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">Item suku cadang terdaftar</p>
            </div>
          </MagicCard>

          {/* Nilai Aset */}
          <MagicCard glowColor="rgba(34, 197, 94, 0.08)" className="p-4 flex flex-col justify-between h-32 col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nilai Aset</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30">
                <DollarSign size={14} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight block truncate">
                <NumberTicker value={stats.totalAssetValue} isCurrency={true} />
              </span>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">Valuasi inventaris gudang</p>
            </div>
          </MagicCard>

          {/* Barang Keluar Bulan Ini */}
          <MagicCard glowColor="rgba(249, 115, 22, 0.08)" className="p-4 flex flex-col justify-between h-32">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Outbound Bulan Ini</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-950/30">
                <TrendingDown size={14} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                <NumberTicker value={stats.monthlyOutboundQty} />
              </span>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">Unit terpakai / keluar</p>
            </div>
          </MagicCard>

          {/* Alert Stok Minimum */}
          <MagicCard glowColor="rgba(239, 68, 68, 0.08)" className="p-4 flex flex-col justify-between h-32">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Kritis / Menipis</span>
              <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                stats.lowStockAlertCount > 0
                  ? 'bg-red-50 text-red-600 dark:bg-red-950/30 animate-pulse'
                  : 'bg-slate-50 text-slate-400 dark:bg-slate-800'
              }`}>
                <AlertTriangle size={14} />
              </div>
            </div>
            <div className="mt-3">
              <span className={`text-2xl font-black tracking-tight ${
                stats.lowStockAlertCount > 0 ? 'text-red-600 dark:text-red-500' : 'text-slate-900 dark:text-slate-100'
              }`}>
                <NumberTicker value={stats.lowStockAlertCount} />
              </span>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">Item di bawah batas minimum</p>
            </div>
          </MagicCard>

          {/* Total Mesin Aktif */}
          <MagicCard glowColor="rgba(139, 92, 246, 0.08)" className="p-4 flex flex-col justify-between h-32">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mesin Terdaftar</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-950/30">
                <Cog size={14} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                <NumberTicker value={stats.totalMachines} />
              </span>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">Total mesin produksi aktif</p>
            </div>
          </MagicCard>

        </div>

        {/* Baris Grafik Analisis */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Grafik Batang Tren Masuk vs Keluar */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4 mb-4">
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  Tren Aliran Suku Cadang
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Perbandingan kuantitas barang masuk vs keluar</p>
              </div>

              {/* Filter Waktu */}
              <select
                value={chartRange}
                onChange={(e) => setChartRange(e.target.value)}
                className="h-8 px-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden text-slate-600 dark:text-slate-300"
              >
                <option value="7d">7 Hari Terakhir</option>
                <option value="30d">30 Hari Terakhir</option>
                <option value="3m">3 Bulan Terakhir</option>
                <option value="6m">6 Bulan Terakhir</option>
                <option value="1y">1 Tahun Terakhir</option>
              </select>
            </div>

            <div className="h-64 md:h-72 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      borderColor: '#e2e8f0',
                      borderRadius: '8px',
                      fontSize: '11px',
                    }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} />
                  <Bar name="Barang Masuk" dataKey="masuk" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                  <Bar name="Barang Keluar" dataKey="keluar" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Donut Chart - Top 4 Outbound */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col">
            <div className="border-b border-slate-100 dark:border-slate-800/80 pb-4 mb-4">
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Top 4 Pemakaian Terbanyak
              </h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Suku cadang yang paling sering diambil dari gudang</p>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="h-44 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={topOutbound}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {topOutbound.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Text di tengah donut */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Total Unit</span>
                  <span className="text-lg font-black text-slate-800 dark:text-slate-100">
                    {topOutbound.reduce((sum, item) => sum + item.value, 0)}
                  </span>
                </div>
              </div>

              {/* Legenda detail di bawah Donut */}
              <div className="w-full mt-4 grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                {topOutbound.map((item, index) => (
                  <div key={item.name} className="flex items-center gap-1.5 truncate">
                    <span 
                      className="w-2 h-2 rounded-full shrink-0" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }} 
                    />
                    <span className="truncate max-w-[85px]">{item.name}</span>
                    <span className="text-slate-400 ml-auto">{item.value} unit</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Baris Detail Kritis & Aktivitas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Daftar Stok Minimum Kritis */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4 mb-4">
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  Suku Cadang Kritis / Menipis
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Segera lakukan inbound restock untuk item di bawah ini</p>
              </div>
              <Link href="/inventory?lowStock=true" className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-0.5">
                Lihat Semua <ChevronRight size={12} />
              </Link>
            </div>

            {lowStock.length === 0 ? (
              <div className="flex-1 flex items-center justify-center p-8 text-slate-400 text-xs">
                Tidak ada item suku cadang yang kritis. Semua stok aman!
              </div>
            ) : (
              <div className="flex-1 space-y-3 overflow-y-auto max-h-60">
                {lowStock.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/50 transition-colors">
                    <div className="flex flex-col">
                      <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                        {p.id}
                      </span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                        {p.name}
                      </span>
                      <span className="text-[9px] text-slate-400 font-medium mt-0.5">
                        Rak: {p.rackLocation} | Kategori: {p.categoryName}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 border border-red-200 dark:border-red-900">
                        Stok: {p.stock} / {p.minStockAlert}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Log Aktivitas Terbaru */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4 mb-4">
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  Log Aktivitas Terbaru
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Log transaksi masuk & keluar gudang real-time</p>
              </div>
              <Clock size={15} className="text-slate-400" />
            </div>

            {activities.length === 0 ? (
              <div className="flex-1 flex items-center justify-center p-8 text-slate-400 text-xs">
                Belum ada log aktivitas transaksi yang tercatat.
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto max-h-60 pr-1">
                <AnimatedList staggerDelay={0.08} className="space-y-4">
                  {activities.map((act) => {
                    const isInbound = act.type === 'INBOUND';
                    return (
                      <div key={act.id} className="relative flex gap-3 text-xs pl-2">
                        {/* Garis Vertikal */}
                        <div className="absolute left-[7px] top-4 bottom-[-16px] w-0.5 bg-slate-100 dark:bg-slate-800 group-last:hidden" />
                        
                        {/* Titik Indikator */}
                        <span className={`w-3.5 h-3.5 rounded-full shrink-0 flex items-center justify-center border-2 border-white dark:border-slate-900 z-10 ${
                          isInbound 
                            ? 'bg-blue-500 shadow-sm shadow-blue-500/20' 
                            : 'bg-orange-500 shadow-sm shadow-orange-500/20'
                        }`} />

                        <div className="flex-1 bg-slate-50/50 dark:bg-slate-800/20 rounded-xl p-2.5 border border-slate-100/50 dark:border-slate-800/50">
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span className="font-bold text-slate-600 dark:text-slate-300">{act.userName}</span>
                            <span>{new Date(act.date).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-slate-700 dark:text-slate-300 font-medium mt-1 leading-snug">
                            {act.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </AnimatedList>
              </div>
            )}
          </div>

        </div>

        {/* BARU: Widget Alert Status Mesin */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4 mb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Status Kerawanan Mesin Produksi
              </h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Daftar mesin yang memiliki suku cadang kritis (di bawah rekomendasi minimum)</p>
            </div>
            <Link href="/machines" className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-0.5">
              Lihat Semua Mesin <ChevronRight size={12} />
            </Link>
          </div>

          {machineAlerts.length === 0 ? (
            <div className="flex items-center justify-center p-6 text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              Seluruh mesin produksi beroperasi dalam kondisi optimal. Tidak ada part kritis!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {machineAlerts.map((m) => (
                <Link href={`/machines/${m.id}`} key={m.id} className="block group">
                  <div className="p-4 rounded-xl border border-red-200 dark:border-red-950 bg-red-50/20 hover:bg-red-50/40 dark:hover:bg-red-950/30 transition-all duration-300 flex flex-col h-full">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-red-600 dark:text-red-400 tracking-wider">
                        {m.id}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400">
                        {m.criticalCount} Part Kritis
                      </span>
                    </div>

                    <h4 className="mt-2 text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 transition-colors">
                      {m.name}
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-1">Area: {m.area}</p>

                    <div className="mt-3 space-y-1.5 flex-1 justify-end flex flex-col">
                      {m.criticalParts.slice(0, 2).map((part: any) => (
                        <div key={part.partId} className="flex justify-between text-[10px] text-slate-600 dark:text-slate-400">
                          <span className="truncate max-w-[130px] font-medium">{part.name}</span>
                          <span className="font-bold text-red-600">Stok: {part.stock} (min {part.recommendedMinQty})</span>
                        </div>
                      ))}
                      {m.criticalCount > 2 && (
                        <div className="text-[9px] text-slate-400 italic text-right mt-1">
                          + {m.criticalCount - 2} part kritis lainnya...
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
  );
}
