'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { BarChart, StatCard, HorizontalBar, LineChartComponent, HorizontalBarChart } from '@/components/ui/ChartComponents';
import { 
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  TrendingUp,
  TrendingDown,
  BarChart3,
  AlertTriangle,
  AlertCircle,
  Boxes,
  Wrench,
  Clock
} from 'lucide-react';
import VodafoneHero, { ShimmerText } from '@/components/machines/VodafoneHero';

export default function InventoryDashboardPage() {
  const { user } = useAuth();
  const [chartData, setChartData] = useState<any>(null);
  const [chartPeriod, setChartPeriod] = useState('30d');
  const [chartLoading, setChartLoading] = useState(true);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  // Load chart data
  const loadChartData = async () => {
    try {
      setChartLoading(true);
      const res = await fetch(`/api/inventory/chart?period=${chartPeriod}`);
      if (res.ok) {
        const data = await res.json();
        setChartData(data);
      }
    } catch (err) {
      console.error('Gagal memuat data chart:', err);
    } finally {
      setChartLoading(false);
    }
  };

  // Load summary data
  const loadSummaryData = async () => {
    try {
      setSummaryLoading(true);
      const res = await fetch('/api/inventory/chart?period=30d');
      if (res.ok) {
        const data = await res.json();
        setSummaryData(data);
      }
    } catch (err) {
      console.error('Gagal memuat summary:', err);
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    loadChartData();
    loadSummaryData();
  }, []);

  useEffect(() => {
    loadChartData();
  }, [chartPeriod]);

  return (
    <div className="space-y-6">
      {/* Vodafone Hero — Red Gradient */}
      <VodafoneHero
        eyebrow="DASHBOARD CENTER"
        title={
          <>
            <ShimmerText>Smart Inventory & Maintenance</ShimmerText>
          </>
        }
        subtitle={`Monitoring real-time inventori & maintenance. Anda login sebagai ${user?.role || 'USER'}.`}
        stats={[
          { value: summaryData ? (summaryData.totalParts ?? 0) : 0, label: 'TOTAL SKU', color: 'text-white' },
          { value: summaryData ? (summaryData.totalTransactions ?? 0) : 0, label: 'OUTBOUND', color: 'text-white' },
        ]}
        action={
          summaryData && summaryData.lowStockParts > 0 ? (
            <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-4 py-2.5 rounded-xl border border-red-500/20 shrink-0 w-fit">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500 text-white animate-pulse">
                <AlertTriangle size={15} />
              </div>
              <div className="text-xs">
                <div className="font-bold text-white">{summaryData.lowStockParts} Item Kritis</div>
                <div className="text-[10px] text-red-200 font-semibold mt-0.5">Butuh restock segera!</div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-4 py-2.5 rounded-xl border border-emerald-500/20 shrink-0 w-fit">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white">
                <Package size={15} />
              </div>
              <div className="text-xs">
                <div className="font-bold text-white">Semua Stok Aman</div>
                <div className="text-[10px] text-emerald-200 font-semibold mt-0.5">Tidak ada item kritis.</div>
              </div>
            </div>
          )
        }
      />

      {/* Summary Cards Row */}
      {summaryData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total SKU</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/30">
                <Boxes size={14} />
              </div>
            </div>
            <p className="text-lg font-black text-slate-900 dark:text-slate-100 mt-2">{summaryData.totalParts || 0}</p>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">SKU terdaftar</p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nilai Aset</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30">
                <TrendingUp size={14} />
              </div>
            </div>
            <p className="text-lg font-black text-slate-900 dark:text-slate-100 mt-2">
              Rp {(summaryData.totalValue || 0).toLocaleString('id-ID')}
            </p>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">Valuasi inventaris</p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Outbound</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/30">
                <ArrowUpFromLine size={14} />
              </div>
            </div>
            <p className="text-lg font-black text-slate-900 dark:text-slate-100 mt-2">{summaryData.totalTransactions || 0}</p>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">Unit bulan ini</p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/30 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Alert Kritis</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-950/30">
                <AlertCircle size={14} />
              </div>
            </div>
            <p className="text-lg font-black text-red-600 dark:text-red-400 mt-2">{summaryData.lowStockParts || 0}</p>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">Item di bawah minimum</p>
          </div>
        </div>
      )}

      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <BarChart3 size={16} className="text-blue-500" />
          Alur Inventaris
        </h2>
        <div className="flex items-center gap-1">
          {['7d', '30d', '90d', '1y'].map((period) => (
            <button
              key={period}
              onClick={() => setChartPeriod(period)}
              className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                chartPeriod === period
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {period === '7d' ? '7 Hari' : period === '30d' ? '30 Hari' : period === '90d' ? '90 Hari' : '1 Tahun'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      {chartData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            title="Total Masuk"
            value={chartData.summary.totalInbound}
            subtitle="unit"
            icon={<ArrowDownToLine size={14} />}
            color="blue"
          />
          <StatCard
            title="Total Keluar"
            value={chartData.summary.totalOutbound}
            subtitle="unit"
            icon={<ArrowUpFromLine size={14} />}
            color="orange"
          />
          <StatCard
            title="Net Flow"
            value={chartData.summary.netFlow}
            subtitle="stok tersimpan"
            icon={<TrendingUp size={14} />}
            color={chartData.summary.netFlow >= 0 ? 'green' : 'red'}
          />
          <StatCard
            title="Nilai Masuk"
            value={new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(chartData.summary.totalValue)}
            subtitle="total investasi"
            icon={<TrendingDown size={14} />}
            color="violet"
          />
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Bar Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300">Grafik Harian</h3>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-blue-500 rounded-sm"></span>
                Barang Masuk
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-orange-500 rounded-sm"></span>
                Barang Keluar
              </span>
            </div>
          </div>
          {chartLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
            </div>
          ) : chartData ? (
            <LineChartComponent
              data={chartData.dailyData.map((d: any) => ({
                date: d.date,
                inbound: d.inbound,
                outbound: d.outbound
              }))}
              height={280}
            />
          ) : (
            <div className="flex items-center justify-center h-48 text-xs text-slate-400">Tidak ada data</div>
          )}
        </div>

        {/* Top Outbound Parts */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-4">Part Terbanyak Keluar</h3>
          {chartLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
            </div>
          ) : chartData && chartData.topOutboundParts.length > 0 ? (
            <HorizontalBarChart
              data={chartData.topOutboundParts.map((p: any) => ({
                label: p.partName.length > 18 ? p.partName.substring(0, 18) + '…' : p.partName,
                value: p.quantity
              }))}
            />
          ) : (
            <div className="flex items-center justify-center h-40 text-xs text-slate-400">Tidak ada data</div>
          )}
        </div>
      </div>

      {/* Monthly Comparison */}
      {chartData && chartData.monthlyData.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-4">Perbandingan Bulanan (6 Bulan Terakhir)</h3>
          <BarChart
            data={chartData.monthlyData.map((d: any) => ({
              label: d.month,
              value: d.inbound,
              value2: d.outbound
            }))}
            height={150}
          />
        </div>
      )}

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20">
              <Boxes size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Part</p>
              <p className="text-lg font-black text-slate-900 dark:text-slate-100">{chartData?.summary.totalParts || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20">
              <AlertTriangle size={20} className="text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Low Stock Alert</p>
              <p className="text-lg font-black text-slate-900 dark:text-slate-100">{chartData?.summary.lowStockParts || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-950/20">
              <Wrench size={20} className="text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Transaksi</p>
              <p className="text-lg font-black text-slate-900 dark:text-slate-100">{chartData?.summary.totalTransactions || 0}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}