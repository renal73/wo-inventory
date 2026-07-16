'use client';

import React, { useState, useCallback } from 'react';
import {
  LineChart as ReLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  BarChart as ReBarChart,
  Bar,
  Cell,
  Legend,
} from 'recharts';

// ──────────────────────────────────────────────
// Interactive Line Chart (Grafik Harian)
// ──────────────────────────────────────────────
interface LineChartComponentProps {
  data: { date: string; inbound: number; outbound: number }[];
  height?: number;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-slate-300 font-medium">{entry.name}:</span>
          <span className="text-white font-bold">{entry.value.toLocaleString('id-ID')}</span>
        </div>
      ))}
    </div>
  );
}

export function LineChartComponent({ data, height = 280 }: LineChartComponentProps) {
  const [activeLine, setActiveLine] = useState<string | null>(null);

  const formatted = data.map((d) => {
    const date = new Date(d.date);
    return {
      ...d,
      label: date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
    };
  });

  const handleMouseEnter = useCallback((line: string) => setActiveLine(line), []);
  const handleMouseLeave = useCallback(() => setActiveLine(null), []);

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formatted} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="gradInbound" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradOutbound" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f97316" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#1e293b"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 9, fill: '#64748b', fontWeight: 600 }}
            tickLine={false}
            axisLine={{ stroke: '#1e293b' }}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 9, fill: '#64748b', fontWeight: 600 }}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="inbound"
            name="Barang Masuk"
            stroke="#3b82f6"
            strokeWidth={2.5}
            fill="url(#gradInbound)"
            dot={false}
            activeDot={{
              r: 5,
              strokeWidth: 2,
              stroke: '#3b82f6',
              fill: '#1e293b',
            }}
            onMouseEnter={() => handleMouseEnter('inbound')}
            onMouseLeave={handleMouseLeave}
            animationDuration={1200}
            animationEasing="ease-out"
          />
          <Area
            type="monotone"
            dataKey="outbound"
            name="Barang Keluar"
            stroke="#f97316"
            strokeWidth={2.5}
            fill="url(#gradOutbound)"
            dot={false}
            activeDot={{
              r: 5,
              strokeWidth: 2,
              stroke: '#f97316',
              fill: '#1e293b',
            }}
            onMouseEnter={() => handleMouseEnter('outbound')}
            onMouseLeave={handleMouseLeave}
            animationDuration={1200}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ──────────────────────────────────────────────
// Interactive Horizontal Bar Chart (Part Terbanyak)
// ──────────────────────────────────────────────
interface HorizontalBarChartProps {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
}

const GRADIENT_COLORS = [
  ['#3b82f6', '#2563eb'],
  ['#06b6d4', '#0891b2'],
  ['#8b5cf6', '#7c3aed'],
  ['#ec4899', '#db2777'],
  ['#f59e0b', '#d97706'],
];

function BarTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-xs text-slate-300 font-medium">{payload[0]?.payload?.label}</p>
      <p className="text-sm text-white font-bold mt-1">{payload[0]?.value?.toLocaleString('id-ID')} unit</p>
    </div>
  );
}

export function HorizontalBarChart({ data, color, height }: HorizontalBarChartProps) {
  const reversed = [...data].reverse();
  const maxVal = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="space-y-3">
      {reversed.map((item, i) => {
        const pct = (item.value / maxVal) * 100;
        const ci = data.length - 1 - i;
        const [c1, c2] = GRADIENT_COLORS[ci % GRADIENT_COLORS.length];
        return (
          <div key={i} className="group flex items-center gap-3">
            <div className="w-28 text-[10px] font-semibold text-slate-600 dark:text-slate-400 truncate text-right shrink-0">
              {item.label}
            </div>
            <div className="flex-1 h-7 bg-slate-100 dark:bg-slate-800/60 rounded-lg overflow-hidden relative">
              <div
                className="h-full rounded-lg transition-all duration-700 ease-out relative overflow-hidden group-hover:shadow-lg group-hover:shadow-blue-500/10"
                style={{
                  width: `${Math.max(pct, 2)}%`,
                  background: `linear-gradient(90deg, ${c1}, ${c2})`,
                }}
              >
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/15 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </div>
            <div className="w-12 text-right text-[11px] font-black text-slate-700 dark:text-slate-200 shrink-0 tabular-nums">
              {item.value.toLocaleString('id-ID')}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────
// StatCard (unchanged)
// ──────────────────────────────────────────────
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'blue' | 'green' | 'red' | 'orange' | 'violet';
}

export function StatCard({ title, value, subtitle, icon, trend, trendValue, color = 'blue' }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400',
    green: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400',
    red: 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400',
    orange: 'bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400',
    violet: 'bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400',
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{title}</span>
        {icon && (
          <div className={`p-1.5 rounded-lg ${colorClasses[color]}`}>
            {icon}
          </div>
        )}
      </div>
      <div className="flex items-end gap-2">
        <span className="text-xl font-black text-slate-900 dark:text-slate-100">{value}</span>
        {trend && trendValue && (
          <div className={`flex items-center gap-0.5 text-[10px] font-bold mb-1 ${
            trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-600' : 'text-slate-500'
          }`}>
            {trend === 'up' && <span>↑</span>}
            {trend === 'down' && <span>↓</span>}
            {trendValue}
          </div>
        )}
      </div>
      {subtitle && (
        <p className="text-[10px] text-slate-400 font-medium">{subtitle}</p>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Legacy exports (kept for backward compat)
// ──────────────────────────────────────────────
interface BarChartProps {
  data: { label: string; value: number; value2?: number }[];
  labels?: string[];
  height?: number;
  showValues?: boolean;
}

export function BarChart({ data, labels, height = 200, showValues = false }: BarChartProps) {
  const maxValue = Math.max(...data.map(d => Math.max(d.value, d.value2 || 0)));
  const normalizedMax = maxValue || 1;
  
  return (
    <div className="w-full" style={{ height }}>
      <div className="flex items-end justify-around gap-1 h-full pb-6 relative">
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
          <div
            key={ratio}
            className="absolute left-0 right-0 border-t border-slate-100 dark:border-slate-800"
            style={{ bottom: `${ratio * 100}%` }}
          />
        ))}
        {data.map((item, index) => (
          <div key={index} className="flex-1 flex flex-col items-center gap-0.5 relative z-10">
            <div className="w-full flex items-end justify-center gap-0.5" style={{ height: '100%' }}>
              <div
                className="w-4 bg-blue-500 rounded-t-sm transition-all hover:bg-blue-600 relative group"
                style={{ 
                  height: `${(item.value / normalizedMax) * 100}%`,
                  minHeight: item.value > 0 ? '4px' : '0'
                }}
              >
                {showValues && item.value > 0 && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    {item.value}
                  </div>
                )}
              </div>
              {item.value2 !== undefined && (
                <div
                  className="w-4 bg-orange-500 rounded-t-sm transition-all hover:bg-orange-600 relative group"
                  style={{ 
                    height: `${(item.value2 / normalizedMax) * 100}%`,
                    minHeight: item.value2 > 0 ? '4px' : '0'
                  }}
                >
                  {showValues && item.value2 > 0 && (
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {item.value2}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="text-[9px] text-slate-400 font-medium text-center mt-1">
              {labels?.[index] || item.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface HorizontalBarProps {
  data: { label: string; value: number }[];
  maxValue?: number;
  color?: string;
}

export function HorizontalBar({ data, maxValue, color = 'bg-blue-500' }: HorizontalBarProps) {
  const max = maxValue || Math.max(...data.map(d => d.value)) || 1;
  
  return (
    <div className="space-y-2">
      {data.map((item, index) => (
        <div key={index} className="flex items-center gap-3">
          <div className="w-24 text-[10px] font-medium text-slate-600 dark:text-slate-400 truncate">
            {item.label}
          </div>
          <div className="flex-1 h-5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full ${color} rounded-full transition-all`}
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
          <div className="w-12 text-right text-[10px] font-bold text-slate-700 dark:text-slate-300">
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}