'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import MinimalVodafoneHero from '@/components/machines/MinimalVodafoneHero';
import { Users, Clock, CheckCircle2, TrendingUp, BarChart3, Loader2, Calendar } from 'lucide-react';
import { motion } from 'motion/react';

interface TechnicianLoad {
  id: string;
  name: string;
  role: string;
  totalAssigned: number;
  inProgress: number;
  completed: number;
  onHold: number;
  avgCompletionTime: number;
  efficiency: number;
}

export default function TechnicianLoadPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [technicians, setTechnicians] = useState<TechnicianLoad[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/technicians/workload');
      if (res.ok) {
        const data = await res.json();
        const loadData: TechnicianLoad[] = data.map((tech: any) => ({
          id: tech.id,
          name: tech.name,
          role: tech.role,
          totalAssigned: tech.totalAssigned || 0,
          inProgress: tech.inProgress || 0,
          completed: tech.completed || 0,
          onHold: tech.onHold || 0,
          avgCompletionTime: tech.avgCompletionTime || 0,
          efficiency: tech.efficiency || 0,
        }));
        setTechnicians(loadData);
      } else {
        console.error('Failed to fetch technician workload:', res.status);
      }
    } catch (e) {
      console.error('Error fetching technician workload:', e);
    } finally {
      setLoading(false);
    }
  };

  const getEfficiencyColor = (eff: number) => {
    if (eff >= 90) return 'text-emerald-600 bg-emerald-100';
    if (eff >= 75) return 'text-blue-600 bg-blue-100';
    if (eff >= 60) return 'text-amber-600 bg-amber-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="flex flex-col h-full min-h-screen bg-slate-50">
      <MinimalVodafoneHero
        eyebrow="WORKLOAD"
        title="Beban Teknisi"
        subtitle="Distribusi workload & performa teknisi"
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {loading ? (
          <motion.div 
            className="flex items-center justify-center h-64"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Loader2 size={32} className="animate-spin text-[var(--accent)]" />
          </motion.div>
        ) : (
          <motion.div 
            className="max-w-[1600px] mx-auto space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Users, label: 'Total Teknisi', value: technicians.length, color: 'var(--accent)' },
                { icon: Clock, label: 'Sedang Dikerjakan', value: technicians.reduce((acc, t) => acc + t.inProgress, 0), color: 'blue' },
                { icon: CheckCircle2, label: 'Selesai Bulan Ini', value: technicians.reduce((acc, t) => acc + t.completed, 0), color: 'emerald' },
                { icon: TrendingUp, label: 'Rata-rata Efisiensi', value: `${Math.round(technicians.reduce((acc, t) => acc + t.efficiency, 0) / technicians.length)}%`, color: 'amber' },
              ].map((stat, i) => (
                <motion.div 
                  key={stat.label}
                  className="bg-white dark:bg-[var(--surface)] rounded-2xl p-4 border border-[var(--border)]"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  whileHover={{ y: -4, boxShadow: '0 8px 24px var(--accent-glow)' }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color === 'var(--accent)' ? 'style.backgroundColor' : `bg-${stat.color}-100`}`} 
                         style={stat.color === 'var(--accent)' ? { backgroundColor: 'var(--accent-glow)' } : {}}>
                      <stat.icon size={20} style={stat.color === 'var(--accent)' ? { color: 'var(--accent)' } : {}} className={stat.color !== 'var(--accent)' ? `text-${stat.color}-600` : ''} />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-secondary)]">{stat.label}</p>
                      <p className="text-2xl font-extrabold text-[var(--text-primary)]">{stat.value}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Technician Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {technicians.map((tech, index) => (
                <motion.div 
                  key={tech.id}
                  className="bg-white dark:bg-[var(--surface)] rounded-2xl p-5 border border-[var(--border)]"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 + 0.2 }}
                  whileHover={{ y: -4, borderColor: 'var(--accent)', boxShadow: '0 12px 32px var(--accent-glow)' }}
                >
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <motion.div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-extrabold text-lg"
                      style={{ backgroundColor: 'var(--accent)' }}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      {tech.name.charAt(0).toUpperCase()}
                    </motion.div>
                    <div className="flex-1">
                      <h3 className="font-bold text-[var(--text-primary)] tracking-tight">{tech.name}</h3>
                      <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--accent)' }}>
                        {tech.role}
                      </p>
                    </div>
                    <motion.div 
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${getEfficiencyColor(tech.efficiency)}`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.05 + 0.3, type: 'spring', stiffness: 300 }}
                    >
                      {tech.efficiency}%
                    </motion.div>
                  </div>

                  {/* Workload Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {[
                      { label: 'Ditugaskan', value: tech.totalAssigned, bgColor: 'var(--bg-base)', textColor: 'var(--text-muted)' },
                      { label: 'Dikerjakan', value: tech.inProgress, bgColor: '#dbeafe', textColor: 'rgb(37 99 235)' },
                      { label: 'Selesai', value: tech.completed, bgColor: '#d1fae5', textColor: 'rgb(22 163 74)' },
                      { label: 'Ditangguhkan', value: tech.onHold, bgColor: '#fef3c7', textColor: 'rgb(217 119 6)' },
                    ].map((stat) => (
                      <motion.div 
                        key={stat.label}
                        className="rounded-xl p-3"
                        whileHover={{ scale: 1.02 }}
                        style={{ backgroundColor: stat.bgColor }}
                      >
                        <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: stat.textColor }}>{stat.label}</p>
                        <p className="text-xl font-extrabold" style={{ color: stat.textColor }}>{stat.value}</p>
                      </motion.div>
                    ))}
                  </div>

                  {/* Avg Completion Time */}
                  <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-[var(--text-muted)]" />
                      <span className="text-[11px] font-medium text-[var(--text-secondary)]">
                        Rata-rata penyelesaian
                      </span>
                    </div>
                    <span className="text-[13px] font-bold text-[var(--text-primary)]">
                      {Math.floor(tech.avgCompletionTime / 60)}j {tech.avgCompletionTime % 60}m
                    </span>
                  </div>

                  {/* Animated Progress Bar */}
                  <div className="mt-3">
                    <div className="h-2 bg-[var(--bg-base)] rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${tech.efficiency}%` }}
                        transition={{ duration: 1, delay: index * 0.1 + 0.4 }}
                        style={{ 
                          backgroundColor: tech.efficiency >= 90 ? '#16A34A' : tech.efficiency >= 75 ? '#2563EB' : tech.efficiency >= 60 ? '#D97706' : '#DC2626'
                        }}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
