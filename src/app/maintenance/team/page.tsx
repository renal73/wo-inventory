'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import MinimalVodafoneHero from '@/components/machines/MinimalVodafoneHero';
import { Users, UserPlus, Phone, Mail, Shield, Wrench, Clock, CheckCircle2, Loader2, Calendar, Edit2 } from 'lucide-react';
import { motion } from 'motion/react';

interface TeamMember {
  id: string;
  name: string;
  username: string;
  role: string;
  phone?: string;
  email?: string;
  specialization: string[];
  status: 'active' | 'inactive';
  joinedAt: string;
  workOrdersCompleted: number;
  workOrdersInProgress: number;
}

export default function TeamPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState<TeamMember[]>([]);

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/technicians/team');
      if (res.ok) {
        const data = await res.json();
        const teamData: TeamMember[] = data.map((tech: any) => ({
          id: tech.id,
          name: tech.name,
          username: tech.username,
          role: tech.role,
          phone: tech.phone || '-',
          email: tech.email || '-',
          specialization: tech.specialization || [],
          status: tech.status === 'active' ? 'active' : 'inactive',
          joinedAt: tech.joinedAt || new Date().toISOString(),
          workOrdersCompleted: tech.workOrdersCompleted || 0,
          workOrdersInProgress: tech.workOrdersInProgress || 0,
        }));
        setTeam(teamData);
      } else {
        console.error('Failed to fetch team:', res.status);
      }
    } catch (e) {
      console.error('Error fetching team:', e);
    } finally {
      setLoading(false);
    }
  };

  const getRandomSpecialization = (seed: number) => {
    const specs = [
      ['Electric', 'PLC'],
      ['Mechanical', 'Hydraulic'],
      ['Welding', 'Fabrication'],
      ['HVAC', 'Refrigeration'],
      ['Civil', 'Painting'],
    ];
    return specs[seed % specs.length];
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      'TECHNICIAN': 'text-blue-600 bg-blue-100',
      'SENIOR_TECHNICIAN': 'text-purple-600 bg-purple-100',
      'SUPERVISOR': 'text-amber-600 bg-amber-100',
      'LEAD_TECHNICIAN': 'text-emerald-600 bg-emerald-100',
    };
    return colors[role] || 'text-slate-600 bg-slate-100';
  };

  return (
    <div className="flex flex-col h-full min-h-screen bg-slate-50">
      <MinimalVodafoneHero
        eyebrow="TEAM"
        title="Tim Teknisi"
        subtitle="Daftar teknisi & kapasitas tim maintenance"
        action={
          <motion.button 
            className="flex items-center gap-2 px-4 py-2 text-[13px] font-bold uppercase tracking-wide text-white rounded-xl transition-all hover:opacity-90 bg-red-600"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <UserPlus size={16} />
            Tambah Teknisi
          </motion.button>
        }
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
          >
            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Users, label: 'Total Anggota', value: team.length, accent: true },
                { icon: CheckCircle2, label: 'Aktif', value: team.filter(t => t.status === 'active').length, color: 'emerald' },
                { icon: Wrench, label: 'Sedang Kerja', value: team.reduce((acc, t) => acc + t.workOrdersInProgress, 0), color: 'blue' },
                { icon: Clock, label: 'Total WO Selesai', value: team.reduce((acc, t) => acc + t.workOrdersCompleted, 0), color: 'amber' },
              ].map((stat, i) => (
                <motion.div 
                  key={stat.label}
                  className="bg-white dark:bg-[var(--surface)] rounded-2xl p-4 border border-[var(--border)]"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  whileHover={{ y: -4, boxShadow: '0 8px 24px var(--accent-glow)' }}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={stat.accent ? { backgroundColor: 'var(--accent-glow)' } : { backgroundColor: `var(--${stat.color}-100)` }}
                    >
                      <stat.icon 
                        size={20} 
                        style={stat.accent ? { color: 'var(--accent)' } : {}} 
                        className={stat.color ? `text-${stat.color}-600` : ''}
                      />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-secondary)]">{stat.label}</p>
                      <p className="text-2xl font-extrabold text-[var(--text-primary)]">{stat.value}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Team Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {team.map((member, index) => (
                <motion.div 
                  key={member.id}
                  className="bg-white dark:bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 + 0.2 }}
                  whileHover={{ y: -4, boxShadow: '0 12px 32px var(--accent-glow)' }}
                >
                  {/* Header with Avatar */}
                  <div className="p-5 pb-4">
                    <div className="flex items-start gap-3 mb-3">
                      <motion.div 
                        className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-extrabold text-xl shrink-0"
                        style={{ backgroundColor: 'var(--accent)' }}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                      >
                        {member.name.charAt(0).toUpperCase()}
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-[var(--text-primary)] tracking-tight truncate">{member.name}</h3>
                        <p className="text-[11px] font-medium text-[var(--text-secondary)]">@{member.username}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wide ${getRoleColor(member.role)}`}>
                            {member.role}
                          </span>
                          <span className={`w-2 h-2 rounded-full ${member.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          <span className="text-[10px] font-medium text-[var(--text-muted)]">
                            {member.status === 'active' ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-1.5 mb-3">
                      <div className="flex items-center gap-2 text-[11px] text-[var(--text-secondary)]">
                        <Phone size={12} className="shrink-0" />
                        <span className="font-medium">{member.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-[var(--text-secondary)]">
                        <Mail size={12} className="shrink-0" />
                        <span className="font-medium truncate">{member.email}</span>
                      </div>
                    </div>

                    {/* Specialization */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {member.specialization.map((spec, idx) => (
                        <motion.span 
                          key={idx}
                          className="px-2 py-0.5 bg-[var(--bg-base)] text-[10px] font-bold uppercase tracking-wide text-[var(--text-secondary)] rounded-md"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 + 0.3 + idx * 0.05 }}
                        >
                          {spec}
                        </motion.span>
                      ))}
                    </div>
                  </div>

                  {/* Stats Footer */}
                  <motion.div 
                    className="px-5 py-3 bg-[var(--bg-base)] border-t border-[var(--border)]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 + 0.4 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <motion.div 
                          className="text-center"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: index * 0.05 + 0.5, type: 'spring', stiffness: 300 }}
                        >
                          <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wide">Selesai</p>
                          <p className="text-lg font-extrabold text-emerald-600">{member.workOrdersCompleted}</p>
                        </motion.div>
                        <div className="w-px h-8 bg-[var(--border)]" />
                        <motion.div 
                          className="text-center"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: index * 0.05 + 0.55, type: 'spring', stiffness: 300 }}
                        >
                          <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wide">Kerja</p>
                          <p className="text-lg font-extrabold text-blue-600">{member.workOrdersInProgress}</p>
                        </motion.div>
                      </div>
                      <motion.button 
                        className="p-2 rounded-lg hover:bg-[var(--surface)] transition-colors text-[var(--text-muted)] hover:text-[var(--accent)]"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Edit2 size={16} />
                      </motion.button>
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
